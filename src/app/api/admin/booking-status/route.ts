import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(req: Request) {
  const { appointmentId, status, reason } = await req.json()

  const allowed = ['รอดำเนินการ', 'ยืนยันแล้ว', 'เสร็จสิ้น', 'สำเร็จ', 'ยกเลิก']
  if (!appointmentId || !allowed.includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }

  const supabase = await createClient()
  const updatePayload: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'ยกเลิก' && reason) updatePayload.cancel_reason = reason

  const { error } = await supabase
    .from('appointments')
    .update(updatePayload)
    .eq('id', appointmentId)

  if (error) {
    console.error('[booking-status] ✗ update error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
