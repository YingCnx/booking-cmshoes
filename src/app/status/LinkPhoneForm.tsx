'use client'

import { useState, useTransition } from 'react'

type Props = { displayName: string }

export function LinkPhoneForm({ displayName }: Props) {
  const [phone, setPhone] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{10}$/.test(phone)) {
      setError('เบอร์โทรต้อง 10 หลัก')
      return
    }
    setError('')

    // ✅ กล่องยืนยัน 
    const confirmed = confirm( `ยืนยันการผูกบัญชีกับเบอร์\n${phone}` ) 
    if (!confirmed) { return }
    
    startTransition(async () => {
      try {
        const res = await fetch('/api/customer/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, displayName }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'ไม่สามารถผูกบัญชีได้')
          return
        }

        // สำเร็จ → reload หน้านี้
        window.location.reload()
      } catch {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
    })
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl border border-gray-100 px-5 py-5 shadow-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          เบอร์โทรศัพท์ <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="0812345678"
          inputMode="numeric"
          maxLength={10}
          disabled={pending}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none disabled:opacity-50"
        />
        {phone.length > 0 && phone.length < 10 && (
          <p className="mt-1.5 text-xs text-amber-600">อีก {10 - phone.length} หลัก</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || phone.length !== 10}
        className="w-full rounded-2xl bg-black py-4 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-50"
      >
        {pending ? 'กำลังผูกบัญชี...' : 'ผูกบัญชี'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        เบอร์โทรนี้ต้องเคยใช้บริการกับร้านมาก่อน
      </p>
    </form>
  )
}
