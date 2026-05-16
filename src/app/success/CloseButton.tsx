'use client'
import { useEffect } from 'react'

export function CloseButton() {
  function close() {
    if (typeof window !== 'undefined' && (window as any).liff) {
      try { (window as any).liff.closeWindow() } catch {}
    }
  }
  return (
    <button onClick={close}
      className="bg-black text-white px-8 py-3 rounded-2xl text-sm font-bold">
      ปิดหน้านี้
    </button>
  )
}
