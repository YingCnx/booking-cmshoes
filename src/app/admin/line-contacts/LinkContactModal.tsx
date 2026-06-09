'use client'

import { useState, useTransition } from 'react'

type Customer = {
  id: number
  name: string
  phone: string
}

type Props = {
  lineUserId: string
  displayName: string | null
  customers: Customer[]
  onDone: () => void
  onClose: () => void
}

export function LinkContactModal({ lineUserId, displayName, customers, onDone, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const filtered = customers.filter(c => {
    const q = query.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
  })

  function confirm() {
    if (!selected) return
    startTransition(async () => {
      const res = await fetch('/api/admin/link-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: selected.id, lineUserId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      onDone()
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <div className="font-bold">ผูกบัญชีลูกค้า</div>
            <div className="text-xs text-gray-500 mt-0.5">{displayName ?? lineUserId}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อหรือเบอร์โทร..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Customer list */}
          <div className="max-h-60 overflow-y-auto space-y-1.5">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-gray-600 text-sm">
                {query ? `ไม่พบ "${query}"` : 'ไม่มีข้อมูลลูกค้า'}
              </div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                    selected?.id === c.id
                      ? 'border-white bg-white/10'
                      : 'border-gray-800 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.phone}</div>
                </button>
              ))
            )}
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Confirm */}
          <button
            onClick={confirm}
            disabled={!selected || pending}
            className="w-full bg-white text-black font-bold py-3 rounded-xl disabled:opacity-40 transition"
          >
            {pending ? 'กำลังผูก...' : selected ? `ผูกกับ ${selected.name}` : 'เลือกลูกค้าก่อน'}
          </button>
        </div>
      </div>
    </div>
  )
}
