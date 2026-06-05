'use client'

import { useState } from 'react'

type Customer = {
  id: number
  name: string
  phone: string
  location: string | null
  line_user_id: string | null
  created_at: string
}

export function CustomerSearch({ customers }: { customers: Customer[] }) {
  const [query, setQuery] = useState('')

  const filtered = customers.filter(c => {
    const q = query.toLowerCase()
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.location?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อ, เบอร์โทร, ที่อยู่..."
          className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          {query ? `ไม่พบ "${query}"` : 'ไม่มีข้อมูลลูกค้า'}
        </div>
      ) : (
        <div className="space-y-2">
          {query && (
            <p className="text-xs text-gray-500 px-1">พบ {filtered.length} รายการ</p>
          )}
          {filtered.map(c => (
            <div key={c.id}
              className="border border-gray-800 bg-gray-900 rounded-xl px-4 py-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold truncate">{c.name || '-'}</div>
                {c.line_user_id && (
                  <span className="text-xs text-green-500 bg-green-950/40 border border-green-900 px-2 py-0.5 rounded-full flex-shrink-0">
                    LINE ✓
                  </span>
                )}
              </div>
              <a href={`tel:${c.phone}`}
                className="flex items-center gap-2 text-sm text-blue-400">
                📞 {c.phone}
              </a>
              {c.location && (
                <div className="text-sm text-gray-400 truncate">
                  📍 {c.location}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
