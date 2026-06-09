import { requireAdminSession } from '@/lib/admin-session'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { LineContactsList } from './LineContactsList'

export const dynamic = 'force-dynamic'

export default async function LineContactsPage() {
  const admin = await requireAdminSession()
  const supabase = await createClient()

  const { data: contacts } = await supabase
    .from('line_contacts')
    .select('id, line_user_id, display_name, picture_url, last_seen_at')
    .eq('branch_id', admin.branchId)
    .order('last_seen_at', { ascending: false })

  const { data: linked } = await supabase
    .from('customers')
    .select('id, name, phone, line_user_id')
    .eq('branch_id', admin.branchId)
    .not('line_user_id', 'is', null)

  const { data: allCustomers } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('branch_id', admin.branchId)
    .order('name')

  const linkedMap = new Map((linked ?? []).map((c: any) => [c.line_user_id, c]))

  const list = (contacts ?? []).map((c: any) => ({
    ...c,
    customer: linkedMap.get(c.line_user_id) ?? null,
  }))

  const linkedCount = list.filter(c => c.customer).length
  const unlinkedCount = list.length - linkedCount

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 px-4 py-4 sticky top-0 z-10 bg-black">
        <div className="flex items-center gap-3">
          <Link href="/admin"
            className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-gray-400">
            <span className="text-lg leading-none">‹</span>
          </Link>
          <div>
            <h1 className="font-bold">LINE ที่ทักเข้ามา</h1>
            <p className="text-xs text-gray-500 mt-0.5">{list.length} คน</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-gray-800 bg-gray-900 rounded-xl p-4">
            <div className="text-3xl font-bold tabular-nums text-emerald-400">{linkedCount}</div>
            <div className="text-xs text-gray-500 mt-1.5">ผูกบัญชีแล้ว</div>
          </div>
          <div className="border border-gray-800 bg-gray-900 rounded-xl p-4">
            <div className="text-3xl font-bold tabular-nums text-amber-400">{unlinkedCount}</div>
            <div className="text-xs text-gray-500 mt-1.5">ยังไม่ผูก</div>
          </div>
        </div>

        <LineContactsList contacts={list} customers={allCustomers ?? []} />
      </div>
    </div>
  )
}
