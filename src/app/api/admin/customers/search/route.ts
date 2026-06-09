import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAdminSession } from '@/lib/admin-session'

export async function GET(req: Request) {
  const admin = await requireAdminSession()
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ debug: 'too_short', q, qLen: q.length })
  }

  const supabase = await createClient()

  const [{ data: byName }, { data: byPhone }] = await Promise.all([
    supabase.from('customers')
      .select('id, name, phone, location, line_user_id')
      .eq('branch_id', admin.branchId)
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(20),
    supabase.from('customers')
      .select('id, name, phone, location, line_user_id')
      .eq('branch_id', admin.branchId)
      .ilike('phone', `%${q}%`)
      .order('name')
      .limit(20),
  ])

  const seen = new Set<number>()
  const data = [...(byName ?? []), ...(byPhone ?? [])].filter((c: any) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })

  return NextResponse.json({ debug: 'ok', q, byNameCount: byName?.length, byPhoneCount: byPhone?.length, data })
}
