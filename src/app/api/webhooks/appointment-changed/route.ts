import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getBranchLineCredentials, pushMessage } from '@/lib/line'

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
  if (!['ยืนยันแล้ว', 'ยกเลิก', 'สำเร็จ'].includes(newStatus)) {
    return NextResponse.json({ ok: true, skipped: `status ${newStatus} not notify` })
  }

  // ดึงข้อมูลเต็มของ appointment + customer + service
  const supabase = await createClient()
  const { data: apt } = await supabase
    .from('appointments')
    .select(`
      id, appointment_type, appointment_date, appointment_time, location, shoe_count, branch_id,
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
  const serviceName = (apt.services as any)?.service_name ?? 'นัดรับรองเท้า'
  const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/line/notify`

  // ✅ แจ้งลูกค้า เฉพาะ ยืนยันแล้ว / ยกเลิก / สำเร็จ
  if (lineUserId && ['ยืนยันแล้ว', 'ยกเลิก', 'สำเร็จ'].includes(newStatus)) {
    
    let notifyType

      if (newStatus === 'ยืนยันแล้ว') {
        notifyType =
          apt.appointment_type === 'delivery'
            ? 'booking_delivery_confirmed'
            : 'booking_pickup_confirmed'
      } else if (newStatus === 'ยกเลิก') {
        notifyType = 'booking_cancelled'
      } else if (newStatus === 'สำเร็จ') {
        notifyType =
          apt.appointment_type === 'pickup'
            ? 'shoe_received'
            : 'shoe_delivered'
      }
    try {
      await fetch(notifyUrl, {
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
            receivedAt: record.updated_at,
            ...(newStatus === 'ยกเลิก' && record.cancel_reason ? { reason: record.cancel_reason } : {}),
          },
        }),
      })
    } catch (err) {
      console.error('[webhook] customer notify failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'webhook endpoint' })
}