'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LinkContactModal } from './LinkContactModal'

type Contact = {
  id: number
  line_user_id: string
  display_name: string | null
  picture_url: string | null
  last_seen_at: string
  customer: { id: number; name: string; phone: string } | null
}

type Customer = { id: number; name: string; phone: string }

export function LineContactsList({
  contacts,
  customers,
}: {
  contacts: Contact[]
  customers: Customer[]
}) {
  const router = useRouter()
  const [active, setActive] = useState<Contact | null>(null)
  const [unlinking, setUnlinking] = useState<number | null>(null)

  async function handleUnlink(customerId: number) {
    if (!confirm('ยกเลิกการผูกบัญชีนี้?')) return
    setUnlinking(customerId)
    await fetch('/api/admin/unlink-line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    })
    setUnlinking(null)
    router.refresh()
  }

  if (contacts.length === 0) {
    return (
      <div className="border border-gray-800 bg-gray-900 rounded-xl px-5 py-10 text-center text-gray-600 text-sm">
        ยังไม่มีใครทักเข้ามา
      </div>
    )
  }

  return (
    <>
      <div className="border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800">
        {contacts.map((c) => (
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
              <div className="font-medium truncate">{c.display_name ?? 'ไม่ทราบชื่อ'}</div>
              {c.customer ? (
                <div className="text-xs text-emerald-400 mt-0.5 truncate">
                  ผูกแล้ว · {c.customer.name} · {c.customer.phone}
                </div>
              ) : (
                <div className="text-xs text-amber-500 mt-0.5">ยังไม่ผูกบัญชี</div>
              )}
            </div>

            {/* Action */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-xs text-gray-600">
                {new Date(c.last_seen_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
              </div>
              {c.customer ? (
                <button
                  onClick={() => handleUnlink(c.customer!.id)}
                  disabled={unlinking === c.customer.id}
                  className="text-xs border border-red-800 text-red-400 font-medium px-3 py-1.5 rounded-lg disabled:opacity-40"
                >
                  {unlinking === c.customer.id ? '...' : 'ยกเลิก'}
                </button>
              ) : (
                <button
                  onClick={() => setActive(c)}
                  className="text-xs bg-white text-black font-medium px-3 py-1.5 rounded-lg"
                >
                  ผูก
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {active && (
        <LinkContactModal
          lineUserId={active.line_user_id}
          displayName={active.display_name}
          customers={customers}
          onClose={() => setActive(null)}
          onDone={() => {
            setActive(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
