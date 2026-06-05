import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getBranchLineCredentials, pushMessage, buildAdminStatusChangeFlex } from '@/lib/line'

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

  // ดึงข้อมูลเต็มของ appointment + customer + service
  const supabase = await createClient()
  const { data: apt } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, location, shoe_count, branch_id,
      customer_name,
      customers ( line_user_id ),
      services ( service_name )
    `)
    .eq('id', record.id)
    .single()

  if (!apt) {
    console.error('[webhook] appointment not found:', record.id)
    return NextResponse.json({ error: 'appointment not found' }, { status: 404 })
  }

  const creds = await getBranchLineCredentials(apt.branch_id)
  const lineUserId = (apt.customers as any)?.line_user_id
  const serviceName = (apt.services as any)?.service_name ?? 'นัดหมายรับรองเท้า'
  const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/line/notify`

  // ✅ แจ้ง admin group ทุกครั้งที่สถานะเปลี่ยน
  if (creds.adminGroupId && creds.accessToken) {
    try {
      await pushMessage(
        creds.adminGroupId,
        [buildAdminStatusChangeFlex({
          customerName: apt.customer_name,
          serviceName,
          date: apt.appointment_date,
          time: String(apt.appointment_time).slice(0, 5),
          oldStatus,
          newStatus,
          appointmentId: apt.id,
        })],
        creds.accessToken
      )
      console.log('[webhook] → admin group notified')
    } catch (err) {
      console.error('[webhook] admin notify failed:', err)
    }
  }

  // ✅ แจ้งลูกค้า เฉพาะ ยืนยันแล้ว / ยกเลิก
  if (lineUserId && (newStatus === 'ยืนยันแล้ว' || newStatus === 'ยกเลิก')) {
    const notifyType = newStatus === 'ยืนยันแล้ว' ? 'booking_confirmed' : 'booking_cancelled'
    console.log('[webhook] → notify customer:', { notifyType, lineUserId })
    try {
      const res = await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: notifyType,
          branchId: apt.branch_id,
          data: {
            lineUserId,
            serviceName,
            date: apt.appointment_date,
            time: String(apt.appointment_time).slice(0, 5),
            location: apt.location,
            shoeCount: apt.shoe_count,
          },
        }),
      })
      console.log('[webhook] customer notify response:', res.status)
    } catch (err) {
      console.error('[webhook] customer notify failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'webhook endpoint' })
}