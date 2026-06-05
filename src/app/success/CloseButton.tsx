'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window { liff: any }
}

export function CloseButton() {
  const [ready, setReady] = useState(false)

  // โหลด LIFF SDK + init
  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_DEFAULT_LIFF_ID
    if (!liffId) return

    async function init() {
      try {
        if (!document.querySelector('script[src*="liff/edge"]')) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script')
            s.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
            s.onload = () => resolve()
            s.onerror = () => reject()
            document.head.appendChild(s)
          })
        }
        if (!window.liff.isInClient && !window.liff._init) {
          await window.liff.init({ liffId })
        }
        setReady(true)
      } catch {
        setReady(false)
      }
    }
    init()
  }, [])

  function close() {
    try {
      if (window.liff?.closeWindow) {
        window.liff.closeWindow()
        return
      }
    } catch {}
    // fallback — ปิดหน้าต่างเอง
    window.close()
    // ถ้าปิดไม่ได้ (ไม่ใช่ popup) → ส่งกลับไปหน้าแรก
    setTimeout(() => { window.location.href = '/service' }, 100)
  }

  return (
    <button onClick={close}
      className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl text-base font-bold active:scale-[0.98] transition-transform">
      กลับไปหน้าแรก
    </button>
  )
}
