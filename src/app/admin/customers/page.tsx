import { requireAdminSession } from '@/lib/admin-session'
import { CustomerSearch } from './CustomerSearch'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  await requireAdminSession()

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
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        <CustomerSearch />
      </div>
    </div>
  )
}
