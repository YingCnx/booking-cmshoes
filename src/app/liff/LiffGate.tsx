'use client'
import { useEffect, useState } from 'react'

declare global {
  interface Window { liff: any }
}

type Props = { liffId: string; redirectTo: string }

export function LiffGate({ liffId, redirectTo }: Props) {
  const [status, setStatus] = useState('กำลังเชื่อมต่อ LINE...')
  const [error, setError]   = useState('')

  useEffect(() => {
    if (!liffId) {
      setError('ระบบยังไม่ได้ตั้งค่า LIFF')
      return
    }
    async function start() {
      try {
        if (!document.querySelector('script[src*="liff/edge"]')) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script')
            s.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
            s.onload = () => resolve()
            s.onerror = () => reject(new Error('โหลด LIFF ไม่สำเร็จ'))
            document.head.appendChild(s)
          })
        }

        await window.liff.init({ liffId, withLoginOnExternalBrowser: true })

        if (!window.liff.isLoggedIn()) {
          setStatus('กรุณา login LINE...')
          window.liff.login({ redirectUri: window.location.href })
          return
        }

        setStatus('กำลังโหลดข้อมูล...')
        const profile = await window.liff.getProfile()

        // ✅ ส่ง userId ตรงๆ (ไม่ใช้ idToken)
        const res = await fetch('/api/liff/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            liffId,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.message ?? 'ตรวจสอบไม่ผ่าน')
          return
        }
        window.location.href = redirectTo
      } catch (err: any) {
        setError(err?.message ?? 'เกิดข้อผิดพลาด')
      }
    }
    start()
  }, [liffId, redirectTo])

  if (error) {
    return (
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={() => window.location.reload()}
          className="mt-6 bg-black text-white px-6 py-3 rounded-xl text-sm font-bold">
          ลองใหม่
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-10 h-10 mx-auto border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      <p className="text-gray-500 text-sm mt-4">{status}</p>
    </div>
  )
}
