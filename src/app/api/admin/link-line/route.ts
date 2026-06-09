import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAdminSession } from '@/lib/admin-session'

export async function POST(req: Request) {
  const admin = await requireAdminSession()
  const { customerId, lineUserId } = await req.json()

  if (!customerId || !lineUserId) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })
  }

  const supabase = await createClient()

  // ตรวจว่า customer อยู่ใน branch เดียวกัน
  const { data: customer } = await supabase
    .from('customers')
    .select('id, line_user_id')
    .eq('id', customerId)
    .eq('branch_id', admin.branchId)
    .maybeSingle()

  if (!customer) {
    return NextResponse.json({ error: 'ไม่พบลูกค้า' }, { status: 404 })
  }

  if (customer.line_user_id && customer.line_user_id !== lineUserId) {
    return NextResponse.json({ error: 'ลูกค้านี้ผูก LINE อื่นไว้แล้ว' }, { status: 409 })
  }

  const { error } = await supabase
    .from('customers')
    .update({ line_user_id: lineUserId, updated_at: new Date().toISOString() })
    .eq('id', customerId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
