import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(req: Request) {
  const { appointmentId, status, lineUserId, branchId, notifyData } = await req.json()

  console.log('[booking-status] ▶ request:', { appointmentId, status, lineUserId, branchId })

  const allowed = ['รอดำเนินการ', 'ยืนยันแล้ว', 'เสร็จสิ้น', 'ยกเลิก']
  if (!appointmentId || !allowed.includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', appointmentId)

  if (error) {
    console.error('[booking-status] ✗ update error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('[booking-status] ✓ status updated')

  // แจ้ง LINE
  if (lineUserId && (status === 'ยืนยันแล้ว' || status === 'ยกเลิก')) {
    const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/line/notify`
    const notifyType = status === 'ยืนยันแล้ว' ? 'booking_confirmed' : 'booking_cancelled'

    console.log('[booking-status] ▶ calling notify:', { notifyUrl, notifyType })

    try {
      const res = await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: notifyType,
          branchId,
          data: { ...notifyData, lineUserId },
        }),
      })
      const respText = await res.text()
      console.log('[booking-status] ◀ notify response:', res.status, respText)
    } catch (err) {
      console.error('[booking-status] ✗ notify failed:', err)
    }
  } else {
    console.log('[booking-status] ⚠ skip notify:', { hasLineUserId: !!lineUserId, status })
  }

  return NextResponse.json({ ok: true })
}
