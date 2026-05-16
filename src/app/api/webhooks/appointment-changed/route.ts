import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// ============================================
// Supabase Database Webhook
// Trigger: UPDATE on public.appointments
// ============================================
// Headers ที่ Supabase ส่งมา:
//   - x-supabase-webhook-secret (verify)
// Body format:
//   {
//     "type": "UPDATE",
//     "table": "appointments",
//     "schema": "public",
//     "record":     { id, status, ... },   ← ค่าใหม่
//     "old_record": { id, status, ... },   ← ค่าเก่า
//   }

export async function POST(req: Request) {
  // ✅ verify webhook secret
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    console.error('[webhook] invalid secret')
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const payload = await req.json()
  const { type, table, record, old_record } = payload

  console.log('[webhook] received:', { type, table, id: record?.id, oldStatus: old_record?.status, newStatus: record?.status })

  // เช็คว่าเป็น UPDATE บน appointments + status เปลี่ยนจริง
  if (type !== 'UPDATE' || table !== 'appointments') {
    return NextResponse.json({ ok: true, skipped: 'not appointment update' })
  }

  const oldStatus = old_record?.status
  const newStatus = record?.status

  if (oldStatus === newStatus) {
    return NextResponse.json({ ok: true, skipped: 'status not changed' })
  }

  // เช็คว่า status ใหม่ เป็น สถานะที่ต้องแจ้งลูกค้า
  if (newStatus !== 'ยืนยันแล้ว' && newStatus !== 'ยกเลิก') {
    return NextResponse.json({ ok: true, skipped: `status ${newStatus} not notify` })
  }

  // ดึงข้อมูลเต็มของ appointment + customer
  const supabase = await createClient()
  const { data: apt } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, location, shoe_count, branch_id,
      customers ( line_user_id )
    `)
    .eq('id', record.id)
    .single()

  if (!apt) {
    console.error('[webhook] appointment not found:', record.id)
    return NextResponse.json({ error: 'appointment not found' }, { status: 404 })
  }

  const lineUserId = (apt.customers as any)?.line_user_id
  if (!lineUserId) {
    console.log('[webhook] no lineUserId for appointment:', apt.id)
    return NextResponse.json({ ok: true, skipped: 'no line_user_id' })
  }

  // เรียก notify endpoint
  const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/line/notify`
  const notifyType = newStatus === 'ยืนยันแล้ว' ? 'booking_confirmed' : 'booking_cancelled'

  console.log('[webhook] → notify:', { notifyType, lineUserId, appointmentId: apt.id })

  try {
    const res = await fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: notifyType,
        branchId: apt.branch_id,
        data: {
          lineUserId,
          serviceName: 'นัดหมายรับรองเท้า',
          date: apt.appointment_date,
          time: String(apt.appointment_time).slice(0, 5),
          location: apt.location,
          shoeCount: apt.shoe_count,
        },
      }),
    })
    const respText = await res.text()
    console.log('[webhook] notify response:', res.status, respText)
  } catch (err) {
    console.error('[webhook] notify failed:', err)
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'webhook endpoint' })
}