import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAdminSession } from '@/lib/admin-session'

export async function GET(req: Request) {
  const admin = await requireAdminSession()
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('customers')
    .select('id, name, phone, location, line_user_id')
    .eq('branch_id', admin.branchId)
    .or(`name.ilike.*${q}*,phone.ilike.*${q}*`)
    .order('name')
    .limit(20)

  return NextResponse.json(data ?? [])
}
