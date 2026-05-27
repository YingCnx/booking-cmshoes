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
        // โหลด SDK
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

        // ✅ ลอง getProfile — ถ้า token expired จะ throw "The access token expired"
        setStatus('กำลังโหลดข้อมูล...')
        let profile
        try {
          profile = await window.liff.getProfile()
        } catch (e: any) {
          // ✅ token expired → logout + login ใหม่อัตโนมัติ
          const msg = String(e?.message || e)
          if (msg.toLowerCase().includes('expired') || msg.includes('access token')) {
            setStatus('Token หมดอายุ กำลัง login ใหม่...')
            try { window.liff.logout() } catch {}
            window.liff.login({ redirectUri: window.location.href })
            return
          }
          throw e
        }

        // ส่ง userId ไป server
        const res = await fetch('/api/liff/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId:  profile.userId,
            displayName: profile.displayName,
            pictureUrl:  profile.pictureUrl,
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
        const msg = err?.message ?? 'เกิดข้อผิดพลาด'
        // ✅ ถ้า error message เกี่ยวกับ token → relogin
        if (msg.toLowerCase().includes('expired') || msg.includes('access token')) {
          try { window.liff?.logout?.() } catch {}
          try { window.liff?.login?.({ redirectUri: window.location.href }) } catch {}
          return
        }
        setError(msg)
      }
    }
    start()
  }, [liffId, redirectTo])

  if (error) {
    return (
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={() => {
          // ✅ ปุ่มลองใหม่ — logout LIFF ก่อนแล้ว reload
          try { window.liff?.logout?.() } catch {}
          window.location.reload()
        }}
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
