'use client'

import { useRouter } from 'next/navigation'

type Props = { displayName: string; branchName: string }

export function AdminHeader({ displayName, branchName }: Props) {
  const router = useRouter()

  async function logout() {
    if (!confirm('ออกจากระบบ?')) return
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin-login')
  }

  return (
    <header className="border-b border-gray-800 px-5 py-4 sticky top-0 z-10 bg-black">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 uppercase tracking-widest truncate">{branchName}</div>
          <h1 className="text-2xl font-bold mt-1">Dashboard</h1>
        </div>
        <button onClick={logout} className="ml-3 text-right flex-shrink-0">
          <div className="text-xs text-gray-500">{displayName}</div>
          <div className="text-xs text-gray-600 mt-0.5">ออกจากระบบ ↗</div>
        </button>
      </div>
      {/* เมนู */}
      <div className="flex gap-2 mt-3">
        <a href="/admin"
          className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
          📅 นัดหมาย
        </a>
        <a href="/admin/customers"
          className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
          👤 ลูกค้า
        </a>
        <a href="/admin/line-contacts"
          className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
          💬 LINE
        </a>
      </div>
    </header>
  )
}
