import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'

export async function POST(req: Request) {
  const { phone, displayName } = await req.json()

  if (!phone || !/^\d{10}$/.test(phone)) {
    return NextResponse.json({ error: 'เบอร์โทรต้อง 10 หลัก' }, { status: 400 })
  }

  const session = await getLineSession()
  if (!session) {
    return NextResponse.json({ error: 'กรุณา login ใหม่' }, { status: 401 })
  }

  const supabase = await createClient()

  // หา customer ด้วย phone + branch_id
  const { data: customer } = await supabase
    .from('customers')
    .select('id, line_user_id, name')
    .eq('phone', phone)
    .eq('branch_id', session.branchId)
    .maybeSingle()

  if (!customer) {
    return NextResponse.json({
      error: 'ไม่พบเบอร์โทรนี้ในระบบ — เบอร์โทรนี้ต้องเคยใช้บริการมาก่อน'
    }, { status: 404 })
  }

  // ตรวจสอบว่า line_user_id ซ้ำกับคนอื่นไหม
  if (customer.line_user_id && customer.line_user_id !== session.lineUserId) {
    return NextResponse.json({
      error: 'เบอร์โทรนี้ผูกกับบัญชี LINE อื่นแล้ว — กรุณาติดต่อร้านค้า'
    }, { status: 409 })
  }

  // UPDATE line_user_id
  const { error } = await supabase
    .from('customers')
    .update({
      line_user_id: session.lineUserId,
      line_display_name: displayName ?? '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', customer.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, customerId: customer.id })
}
