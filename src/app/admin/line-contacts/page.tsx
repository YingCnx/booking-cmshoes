import { requireAdminSession } from '@/lib/admin-session'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LineContactsPage() {
  const admin = await requireAdminSession()
  const supabase = await createClient()

  const { data: contacts } = await supabase
    .from('line_contacts')
    .select(`
      id, line_user_id, display_name, picture_url, last_seen_at
    `)
    .eq('branch_id', admin.branchId)
    .order('last_seen_at', { ascending: false })

  // ดึง customers ที่ผูก line_user_id แล้ว เพื่อ join ฝั่ง JS
  const { data: linked } = await supabase
    .from('customers')
    .select('id, name, phone, line_user_id')
    .eq('branch_id', admin.branchId)
    .not('line_user_id', 'is', null)

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

        {/* List */}
        {list.length === 0 ? (
          <div className="border border-gray-800 bg-gray-900 rounded-xl px-5 py-10 text-center text-gray-600 text-sm">
            ยังไม่มีใครทักเข้ามา
          </div>
        ) : (
          <div className="border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800">
            {list.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3.5 bg-gray-900">
                {/* Avatar */}
                {c.picture_url ? (
                  <img src={c.picture_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-400 text-sm">
                    {c.display_name?.[0] ?? '?'}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {c.display_name ?? 'ไม่ทราบชื่อ'}
                  </div>
                  {c.customer ? (
                    <div className="text-xs text-emerald-400 mt-0.5 truncate">
                      ผูกแล้ว · {c.customer.name} · {c.customer.phone}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-500 mt-0.5">ยังไม่ผูกบัญชี</div>
                  )}
                </div>

                {/* Last seen */}
                <div className="text-xs text-gray-600 flex-shrink-0 text-right">
                  {new Date(c.last_seen_at).toLocaleDateString('th-TH', {
                    day: 'numeric', month: 'short',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
