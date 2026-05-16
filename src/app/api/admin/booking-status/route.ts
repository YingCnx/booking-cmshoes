import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(req: Request) {
  const { appointmentId, status, lineUserId, branchId, notifyData } = await req.json()

  const allowed = ['รอดำเนินการ', 'ยืนยันแล้ว', 'เสร็จสิ้น', 'ยกเลิก']
  if (!appointmentId || !allowed.includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', appointmentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // แจ้ง LINE
  if (lineUserId && (status === 'ยืนยันแล้ว' || status === 'ยกเลิก')) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/line/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: status === 'ยืนยันแล้ว' ? 'booking_confirmed' : 'booking_cancelled',
          branchId,
          data: { ...notifyData, lineUserId },
        }),
      })
    } catch (err) {
      console.error('notify failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
