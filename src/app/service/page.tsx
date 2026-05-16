import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import { SelectableLink } from '@/components/SelectableLink'

export const revalidate = 60   // cache 1 นาที

export default async function ServicePage() {
  const session = await getLineSession()
  if (!session) redirect('/liff?next=/service')

  const supabase = await createClient()
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, phone')
    .eq('id', session.branchId)
    .single()

  if (!branch) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <p className="text-gray-500">ไม่พบสาขา</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-white">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 pt-14 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-semibold">{branch.name}</div>
          <h1 className="text-3xl font-bold tracking-tight text-white">จองคิวซักรองเท้า</h1>
          <p className="mt-2 text-gray-400 text-sm">บริการรับ-ส่งฟรีถึงบ้าน</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-3 max-w-lg mx-auto -mt-4">
        <SelectableLink href="/service/pickup"
          className="block bg-white rounded-3xl border border-gray-100 px-5 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="text-3xl mb-2">👟</div>
              <div className="font-bold text-gray-900 text-base">นัดหมายรับรองเท้า</div>
              <div className="text-sm text-gray-500 mt-1">เลือกวันและเวลาที่สะดวกให้พนักงานเข้ารับ</div>
              <div className="text-xs text-emerald-600 mt-2 font-semibold">✓ บริการรับ-ส่งฟรี</div>
            </div>
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
              <span className="text-gray-400">→</span>
            </div>
          </div>
        </SelectableLink>
      </div>
    </main>
  )
}
