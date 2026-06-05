import { requireAdminSession } from '@/lib/admin-session'
import { createClient } from '@/utils/supabase/server'
import { CustomerSearch } from './CustomerSearch'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const admin = await requireAdminSession()
  const supabase = await createClient()

  const { data } = await supabase
    .from('customers')
    .select('id, name, phone, location, line_user_id, created_at')
    .eq('branch_id', admin.branchId)
    .order('name')

  const customers = (data ?? []) as any[]

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
            <p className="text-xs text-gray-500 mt-0.5">{customers.length} รายการ</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <CustomerSearch customers={customers} />
      </div>
    </div>
  )
}
