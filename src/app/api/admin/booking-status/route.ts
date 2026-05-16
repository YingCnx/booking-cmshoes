import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(req: Request) {
  const { appointmentId, status } = await req.json()

  console.log('[booking-status] ▶ request:', { appointmentId, status })

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

  console.log('[booking-status] ✓ status updated — LINE notify will be triggered by Supabase webhook')

  return NextResponse.json({ ok: true })
}
