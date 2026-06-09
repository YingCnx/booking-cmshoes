import { requireAdminSession } from '@/lib/admin-session'
import { createClient } from '@/utils/supabase/server'
import { CustomerSearch } from './CustomerSearch'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ q?: string }> }

export default async function CustomersPage({ searchParams }: Props) {
  const admin = await requireAdminSession()
  const { q } = await searchParams
  const supabase = await createClient()

  let customers: any[] = []

  if (q && q.trim().length >= 2) {
    const term = q.trim()
    const [{ data: byName }, { data: byPhone }] = await Promise.all([
      supabase.from('customers').select('id, name, phone, location, line_user_id')
        .eq('branch_id', admin.branchId).ilike('name', `%${term}%`).order('name').limit(50),
      supabase.from('customers').select('id, name, phone, location, line_user_id')
        .eq('branch_id', admin.branchId).ilike('phone', `%${term}%`).order('name').limit(50),
    ])

    const seen = new Set<number>()
    customers = [...(byName ?? []), ...(byPhone ?? [])].filter((c: any) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 px-4 py-4 sticky top-0 z-10 bg-black">
        <div className="flex items-center gap-3">
          <Link href="/admin"
            className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-gray-400">
            <span className="text-lg leading-none">‹</span>
          </Link>
          <div>
            <h1 className="font-bold">ข้อมูลลูกค้า</h1>
            {q && q.trim().length >= 2 && (
              <p className="text-xs text-gray-500 mt-0.5">พบ {customers.length} รายการ</p>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <CustomerSearch key={q ?? ''} initialQuery={q ?? ''} customers={customers} />
      </div>
    </div>
  )
}
