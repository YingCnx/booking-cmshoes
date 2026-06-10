import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(req: Request) {
  const { appointmentId, date, time } = await req.json()

  if (!appointmentId || !date || !time) {
    return NextResponse.json({ error: 'appointmentId, date, time required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({
      appointment_date: date,
      appointment_time: time,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)

  if (error) {
    console.error('[reschedule] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
