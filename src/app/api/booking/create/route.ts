import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { after } from 'next/server'

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m + minutes, 0, 0)
  return d.toTimeString().slice(0, 5)
}

export async function POST(req: Request) {
  const { serviceId, time, date, name, phone, location, shoeCount } = await req.json()

  if (!serviceId || !time || !date || !name || !phone || !location || !shoeCount) {
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
    { data: service },
    { data: branch },
    { data: existing },
  ] = await Promise.all([
    supabase.from('services').select('id, service_name, duration_minutes, base_price').eq('id', serviceId).single(),
    supabase.from('branches').select('id, name, max_parallel_bookings').eq('id', session.branchId).single(),
    supabase.from('appointments')
      .select('appointment_time, end_time')
      .eq('branch_id', session.branchId)
      .eq('appointment_date', date)
      .in('status', ['รอดำเนินการ', 'ยืนยันแล้ว']),
  ])

  if (!service) return NextResponse.json({ error: 'ไม่พบบริการ' }, { status: 404 })
  if (!branch)  return NextResponse.json({ error: 'ไม่พบสาขา' }, { status: 404 })

  const duration = service.duration_minutes ?? 60
  const endTime = addMinutes(time, duration)
  const maxParallel = branch.max_parallel_bookings ?? 3

  // เช็คช่วงเวลาซ้อนทับ
  function toMinutes(t: string) { const [h,m] = t.split(':').map(Number); return h*60+m }
  const startMin = toMinutes(time)
  const endMin   = toMinutes(endTime)

  const overlap = (existing ?? []).filter((b: any) => {
    const bStart = toMinutes(String(b.appointment_time).slice(0,5))
    const bEnd   = b.end_time
      ? toMinutes(String(b.end_time).slice(0,5))
      : bStart + duration
    return startMin < bEnd && endMin > bStart
  }).length

  if (overlap >= maxParallel) {
    return NextResponse.json({ error: 'เวลานี้เต็มแล้ว' }, { status: 409 })
  }

  // ============================
  // Upsert customer — ยึด line_user_id เป็นหลัก
  // ============================
  let customer: any = null

  if (session.lineUserId) {
    const { data } = await supabase
      .from('customers')
      .select('id')
      .eq('line_user_id', session.lineUserId)
      .maybeSingle()
    customer = data
  }

  if (customer) {
    // UPDATE
    await supabase.from('customers').update({
      name, phone, address: location,
      line_display_name: session.displayName,
      updated_at: new Date().toISOString(),
    }).eq('id', customer.id)
  } else {
    // ตรวจสอบ phone ก่อน — เผื่อ customer เคยมาจาก walk-in แล้ว
    const { data: byPhone } = await supabase
      .from('customers')
      .select('id, line_user_id')
      .eq('phone', phone)
      .eq('branch_id', session.branchId)
      .maybeSingle()

    if (byPhone) {
      const updates: any = {
        name, address: location,
        line_display_name: session.displayName,
        updated_at: new Date().toISOString(),
      }
      if (!byPhone.line_user_id) updates.line_user_id = session.lineUserId
      await supabase.from('customers').update(updates).eq('id', byPhone.id)
      customer = byPhone
    } else {
      const { data: newC, error: cErr } = await supabase
        .from('customers')
        .insert({
          name, phone, address: location,
          branch_id: session.branchId,
          line_user_id: session.lineUserId,
          line_display_name: session.displayName,
          origin_source: 'line_booking',
          status: 'active',
        })
        .select('id').single()
      if (cErr || !newC) {
        return NextResponse.json({ error: 'บันทึกลูกค้าไม่สำเร็จ: ' + cErr?.message }, { status: 500 })
      }
      customer = newC
    }
  }

  // ============================
  // INSERT appointment
  // ============================
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
      service_id: serviceId,
      appointment_type: 'line_booking',
    })
    .select('id').single()

  if (aptErr || !apt) {
    return NextResponse.json({ error: 'สร้างการจองไม่สำเร็จ: ' + aptErr?.message }, { status: 500 })
  }

  // ============================
  // Notify LINE (non-blocking)
  // ============================
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
            serviceName: service.service_name,
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
