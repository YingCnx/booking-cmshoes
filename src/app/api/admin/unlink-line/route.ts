import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAdminSession } from '@/lib/admin-session'

export async function POST(req: Request) {
  const admin = await requireAdminSession()
  const { customerId } = await req.json()

  if (!customerId) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .update({ line_user_id: null, updated_at: new Date().toISOString() })
    .eq('id', customerId)
    .eq('branch_id', admin.branchId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
