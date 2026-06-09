'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Customer = {
  id: number
  name: string
  phone: string
  location: string | null
  line_user_id: string | null
}

type Props = {
  initialQuery: string
  customers: Customer[]
}

export function CustomerSearch({ initialQuery, customers }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const q = query.trim()
      if (q.length >= 2) {
        router.push(`/admin/customers?q=${encodeURIComponent(q)}`)
      } else if (q.length === 0) {
        router.push('/admin/customers')
      }
    }, 300)
  }, [query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อหรือเบอร์โทร..."
          className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          autoFocus
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            ✕
          </button>
        )}
      </div>

      {query.trim().length < 2 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">
          ไม่พบ "{query}"
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map(c => (
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
