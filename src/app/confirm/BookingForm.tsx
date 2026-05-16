'use client'

import { useState, useTransition } from 'react'

type Props = {
  time: string
  date: string
  defaults: { name: string; phone: string }
}

export function BookingForm({ time, date, defaults }: Props) {
  const [name, setName]         = useState(defaults.name)
  const [phone, setPhone]       = useState(defaults.phone)
  const [location, setLocation] = useState('')
  const [shoeCount, setShoeCount] = useState('1')
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
  }
  function handleShoeCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setShoeCount(e.target.value.replace(/\D/g, '').slice(0, 2))
  }

  function validate(): string {
    if (!name.trim()) return 'กรุณากรอกชื่อ'
    if (!/^\d{10}$/.test(phone)) return 'เบอร์โทรต้อง 10 หลัก'
    if (!location.trim()) return 'กรุณากรอกสถานที่รับรองเท้า'
    const sc = parseInt(shoeCount)
    if (!sc || sc < 1 || sc > 99) return 'จำนวนรองเท้า 1-99 คู่'
    return ''
  }

  function handleSubmitClick(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setConfirming(true)
  }

  function actuallySubmit() {
    if (pending) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/booking/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time, date,
            name: name.trim(),
            phone: phone.trim(),
            location: location.trim(),
            shoeCount: parseInt(shoeCount),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'ส่งคำขอไม่สำเร็จ')
          setConfirming(false)
          return
        }
        window.location.href = '/success?pending=true'
      } catch {
        setError('เกิดข้อผิดพลาด')
        setConfirming(false)
      }
    })
  }

  const inputCls = 'w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none disabled:opacity-50'

  return (
    <>
      <form onSubmit={handleSubmitClick} className="space-y-4">

        <Field label="ชื่อ" required>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="กรอกชื่อ" disabled={pending} className={inputCls} />
        </Field>

        <Field label="เบอร์โทรศัพท์" required>
          <input type="tel" value={phone} onChange={handlePhoneChange}
            placeholder="0812345678" inputMode="numeric" maxLength={10}
            disabled={pending} className={inputCls} />
          {phone.length > 0 && phone.length < 10 && (
            <p className="mt-1.5 text-xs text-amber-600">อีก {10 - phone.length} หลัก</p>
          )}
        </Field>

        <Field label="สถานที่รับรองเท้า" required>
          <textarea rows={3} value={location} onChange={e => setLocation(e.target.value)}
            placeholder="บ้านเลขที่ ซอย ถนน เขต/อำเภอ จังหวัด"
            disabled={pending} className={`${inputCls} resize-none`} />
        </Field>

        <Field label="จำนวนรองเท้า (คู่)" required>
          <input type="text" value={shoeCount} onChange={handleShoeCountChange}
            placeholder="1" inputMode="numeric"
            disabled={pending} className={inputCls} />
        </Field>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending}
          className="w-full rounded-2xl bg-black py-4 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-50">
          {pending ? 'กำลังบันทึก...' : 'ส่งคำขอจอง'}
        </button>
      </form>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">
            <div className="px-5 py-5">
              <h3 className="text-lg font-bold text-gray-900">ยืนยันการจอง?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                ส่งคำขอจองในชื่อ <span className="font-semibold text-gray-900">{name}</span>
                <br />เบอร์ <span className="font-semibold text-gray-900">{phone}</span>
                <br />จำนวน <span className="font-semibold text-gray-900">{shoeCount} คู่</span>
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setConfirming(false)} disabled={pending}
                className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl">
                ยกเลิก
              </button>
              <button onClick={actuallySubmit} disabled={pending}
                className="flex-1 py-3 bg-black text-white text-sm font-bold rounded-xl">
                {pending ? 'กำลังส่ง...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
