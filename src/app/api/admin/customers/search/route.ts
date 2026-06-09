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

  const [r1, r2] = await Promise.all([
    supabase.from('customers')
      .select('id, name, phone, line_user_id')
      .eq('branch_id', admin.branchId)
      .ilike('name', `%${q}%`)
      .order('name')
      .limit(20),
    supabase.from('customers')
      .select('id, name, phone, line_user_id')
      .eq('branch_id', admin.branchId)
      .ilike('phone', `%${q}%`)
      .order('name')
      .limit(20),
  ])

  const seen = new Set<number>()
  const data = [...(r1.data ?? []), ...(r2.data ?? [])].filter((c: any) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })

  return NextResponse.json({
    debug: 'ok', q,
    r1Count: r1.data?.length,
    r2Count: r2.data?.length,
    r1Err: r1.error,
    r2Err: r2.error,
    data,
  })
}
