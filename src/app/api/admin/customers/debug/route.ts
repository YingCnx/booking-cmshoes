import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAdminSession } from '@/lib/admin-session'

export async function GET() {
  const admin = await requireAdminSession()
  const supabase = await createClient()

  // นับ customers ทั้งหมดใน branch
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('branch_id', admin.branchId)

  // ดึง 3 รายการแรก
  const { data: sample } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('branch_id', admin.branchId)
    .limit(3)

  // ทดสอบ ilike เหมือน search API
  const q = 'ying'
  const [{ data: byName, error: nameErr }, { data: byPhone, error: phoneErr }] = await Promise.all([
    supabase.from('customers').select('id, name, phone').eq('branch_id', admin.branchId).ilike('name', `%${q}%`).limit(5),
    supabase.from('customers').select('id, name, phone').eq('branch_id', admin.branchId).ilike('phone', `%${q}%`).limit(5),
  ])

  return NextResponse.json({
    branchId: admin.branchId,
    totalCustomers: count,
    sample,
    byName,
    byPhone,
    nameErr: nameErr?.message,
    phoneErr: phoneErr?.message,
  })
}
