import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { after } from 'next/server'

const DEFAULT_DURATION = 60   // นัดรับรองเท้าครั้งละ 60 นาที

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m + minutes, 0, 0)
  return d.toTimeString().slice(0, 5)
}

export async function POST(req: Request) {
  const { time, date, name, phone, location, shoeCount, note } = await req.json()

  if (!time || !date || !name || !phone || !location || !shoeCount) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
  }
  if (!/^\d{10}$/.test(phone)) {
    return NextResponse.json({ error: 'เบอร์โทรต้อง 10 หลัก' }, { status: 400 })
  }

  const session = await getLineSession()
  if (!session) {
    return NextResponse.json({ error: 'กรุณา login ใหม่' }, { status: 401 })
  }

  const supabase = await createClient()

  const [
    { data: branch },
    { data: existing },
  ] = await Promise.all([
    supabase.from('branches').select('id, name, max_parallel_bookings').eq('id', session.branchId).single(),
    supabase.from('appointments')
      .select('appointment_time, end_time')
      .eq('branch_id', session.branchId)
      .eq('appointment_date', date)
      .in('status', ['รอดำเนินการ', 'ยืนยันแล้ว']),
  ])

  if (!branch) return NextResponse.json({ error: 'ไม่พบสาขา' }, { status: 404 })

  const endTime = addMinutes(time, DEFAULT_DURATION)
  const maxParallel = branch.max_parallel_bookings ?? 3

  // เช็คช่วงเวลาซ้อนทับ
  function toMinutes(t: string) { const [h,m] = t.split(':').map(Number); return h*60+m }
  const startMin = toMinutes(time)
  const endMin   = toMinutes(endTime)

  const overlap = (existing ?? []).filter((b: any) => {
    const bStart = toMinutes(String(b.appointment_time).slice(0,5))
    const bEnd   = b.end_time
      ? toMinutes(String(b.end_time).slice(0,5))
      : bStart + DEFAULT_DURATION
    return startMin < bEnd && endMin > bStart
  }).length

  if (overlap >= maxParallel) {
    return NextResponse.json({ error: 'เวลานี้เต็มแล้ว' }, { status: 409 })
  }

  // ============================================
  // Customer Logic — ตรงกับระบบหลังบ้าน
  // ============================================
  // 1. ถ้ามี line_user_id ใน DB แล้ว → UPDATE แค่ name + line_display_name
  // 2. ถ้าไม่มี → ตรวจ phone (unique per branch):
  //    - เจอ → UPDATE name + line_user_id + line_display_name
  //    - ไม่เจอ → INSERT ใหม่ + สร้าง customer_code = C{branchId}{id padded 3}
  // (address/shoe_count ไม่บันทึกใน customers — เก็บใน appointments เท่านั้น)
  // ============================================
  let customer: any = null

  // หาจาก line_user_id ก่อน
  if (session.lineUserId) {
    const { data } = await supabase
      .from('customers')
      .select('id, branch_id, phone')
      .eq('line_user_id', session.lineUserId)
      .maybeSingle()
    customer = data
  }

  if (customer) {
    // มี line_user_id ในระบบแล้ว — update ชื่อ + phone (เผื่อเปลี่ยน)
    await supabase.from('customers').update({
      name,
      phone,
      line_display_name: session.displayName,
      updated_at: new Date().toISOString(),
    }).eq('id', customer.id)
  } else {
    // หา phone ซ้ำใน branch เดียวกัน
    const { data: byPhone } = await supabase
      .from('customers')
      .select('id, line_user_id, branch_id')
      .eq('phone', phone)
      .eq('branch_id', session.branchId)
      .maybeSingle()

    if (byPhone) {
      // เบอร์เคยอยู่ในระบบ — update name + line_user_id (ถ้ายังไม่มี)
      const updates: any = {
        name,
        line_display_name: session.displayName,
        updated_at: new Date().toISOString(),
      }
      if (!byPhone.line_user_id) {
        updates.line_user_id = session.lineUserId
      }
      await supabase.from('customers').update(updates).eq('id', byPhone.id)
      customer = byPhone
    } else {
      // ใหม่ทั้งหมด — INSERT
      const { data: newC, error: cErr } = await supabase
        .from('customers')
        .insert({
          name,
          phone,
          branch_id: session.branchId,
          line_user_id: session.lineUserId,
          line_display_name: session.displayName,
          origin_source: 'line_booking',
          status: 'active',
        })
        .select('id, branch_id')
        .single()

      if (cErr || !newC) {
        return NextResponse.json({
          error: 'บันทึกลูกค้าไม่สำเร็จ: ' + cErr?.message,
        }, { status: 500 })
      }

      // สร้าง customer_code = C{branch_id}{id padded 3 หลัก}
      const customerCode = `C${newC.branch_id}${String(newC.id).padStart(3, '0')}`
      await supabase.from('customers')
        .update({ customer_code: customerCode })
        .eq('id', newC.id)

      customer = newC
    }
  }

  // ============================================
  // INSERT appointment
  // - status = 'รอดำเนินการ'
  // - appointment_type = 'pickup'
  // - service_id ไม่ใส่ (ลูกค้าส่งหลายคู่ในนัดเดียว)
  // ============================================
  const { data: apt, error: aptErr } = await supabase
    .from('appointments')
    .insert({
      customer_name: name,
      phone,
      location,
      shoe_count: shoeCount,
      appointment_date: date,
      appointment_time: time,
      end_time: endTime,
      status: 'รอดำเนินการ',
      branch_id: session.branchId,
      customer_id: customer.id,
      appointment_type: 'pickup',
      ...(note ? { notes: note } : {}),
    })
    .select('id').single()

  if (aptErr || !apt) {
    return NextResponse.json({
      error: 'สร้างการจองไม่สำเร็จ: ' + aptErr?.message,
    }, { status: 500 })
  }

  // แจ้ง LINE (non-blocking)
  after(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/line/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'booking_pending',
          branchId: session.branchId,
          data: {
            appointmentId: apt.id,
            lineUserId: session.lineUserId,
            customerName: name,
            phone,
            serviceName: 'นัดรับรองเท้า',
            branchName: branch.name,
            date,
            time,
            location,
            shoeCount,
          },
        }),
      })
    } catch (err) {
      console.error('LINE notify failed:', err)
    }
  })

  return NextResponse.json({ ok: true, appointmentId: apt.id })
}
