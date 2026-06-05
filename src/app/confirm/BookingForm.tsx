'use client'

import { useState, useTransition } from 'react'
import { MapPin, PenLine, CalendarDays, ShieldCheck, Lock } from 'lucide-react'

type Props = {
  time: string
  date: string
  dateLabel: string
  branchName: string
  hasLine: boolean
  defaults: { name: string; phone: string; location: string }
}

export function BookingForm({ time, date, dateLabel, branchName, hasLine, defaults }: Props) {
  const [name, setName]           = useState(defaults.name)
  const [phone, setPhone]         = useState(defaults.phone)
  const [location, setLocation]   = useState(defaults.location)
  const [useOther, setUseOther]   = useState(!defaults.location)
  const [shoeCount, setShoeCount] = useState('1')
  const [note, setNote]           = useState('')
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError]         = useState('')

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
  }

  function validate(): string {
    if (!name.trim()) return 'กรุณากรอกชื่อ'
    if (!/^\d{10}$/.test(phone)) return 'เบอร์โทรต้อง 10 หลัก'
    if (!location.trim()) return 'กรุณากรอกสถานที่รับรองเท้า'
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
            shoeCount: parseInt(shoeCount) || 1,
            note: note.trim(),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'ส่งคำขอไม่สำเร็จ')
          setConfirming(false)
          return
        }
        const p = new URLSearchParams({
          pending: 'true',
          date, time,
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim(),
          note: note.trim(),
        })
        window.location.href = `/success?${p.toString()}`
      } catch {
        setError('เกิดข้อผิดพลาด')
        setConfirming(false)
      }
    })
  }

  const inputCls = 'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#2ABFAB] focus:outline-none focus:ring-2 focus:ring-[#2ABFAB]/20 disabled:opacity-50 transition'

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* นัดรับรองเท้า card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2ABFAB]/10 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-6 h-6 text-[#2ABFAB]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 font-medium">นัดรับรองเท้า</div>
              <div className="text-lg font-extrabold text-gray-900 mt-0.5">{dateLabel}</div>
              <div className="text-xl font-extrabold text-[#2ABFAB]">{time} น.</div>
              <div className="text-xs text-gray-400 mt-0.5">{branchName}</div>
            </div>
            <a href={`/service/pickup?date=${date}`}
              className="text-gray-300 flex-shrink-0">›</a>
          </div>
        </div>

        {/* LINE connected */}
        {hasLine && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-green-800">เชื่อมต่อ LINE แล้ว</div>
              <div className="text-xs text-green-600 mt-0.5">ร้านจะส่งการยืนยันผ่าน LINE และสามารถแก้ไขข้อมูลได้ภายหลัง</div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmitClick} className="space-y-4">
          <h2 className="font-bold text-gray-900 text-base">ข้อมูลของคุณ</h2>

          {/* ชื่อ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="กรอกชื่อ-นามสกุล" disabled={pending} className={inputCls} />
          </div>

          {/* เบอร์ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input type="tel" value={phone} onChange={handlePhoneChange}
              placeholder="0812345678" inputMode="numeric" maxLength={10}
              disabled={pending} className={inputCls} />
            {phone.length > 0 && phone.length < 10 && (
              <p className="mt-1.5 text-xs text-amber-600">อีก {10 - phone.length} หลัก</p>
            )}
          </div>

          {/* สถานที่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              สถานที่รับรองเท้า <span className="text-red-500">*</span>
            </label>

            {defaults.location && !useOther ? (
              <div className="border-2 border-[#2ABFAB] rounded-2xl px-4 py-3.5 bg-[#2ABFAB]/5">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#2ABFAB] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">บ้าน</div>
                    <div className="text-sm text-gray-600 mt-0.5">{defaults.location}</div>
                  </div>
                  <button type="button" onClick={() => setUseOther(true)}
                    className="text-gray-300 flex-shrink-0">›</button>
                </div>
              </div>
            ) : (
              <textarea rows={3} value={location} onChange={e => setLocation(e.target.value)}
                placeholder="พิกัด สถานที่ใกล้เคียง"
                disabled={pending} className={`${inputCls} resize-none`} />
            )}

            {defaults.location && !useOther && (
              <button type="button" onClick={() => { setUseOther(true); setLocation('') }}
                className="flex items-center gap-1 text-xs text-[#2ABFAB] font-medium mt-2">
                <PenLine className="w-3 h-3" /> ใช้ที่อยู่อื่น
              </button>
            )}
          </div>

          {/* หมายเหตุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              หมายเหตุ <span className="text-gray-400 font-normal">(ถ้ามี)</span>
            </label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value.slice(0, 200))}
              placeholder="เช่น รายละเอียดเพิ่มเติม, เบอร์ติดต่ออื่น"
              disabled={pending} className={`${inputCls} resize-none`} />
            <div className="text-right text-xs text-gray-400 mt-1">{note.length}/200</div>
          </div>

          {/* Privacy */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-[#2ABFAB] flex-shrink-0" />
            <span>ข้อมูลของคุณปลอดภัย 100% เราจะไม่เปิดเผยข้อมูลของคุณ</span>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending}
            className="w-full rounded-2xl bg-[#2ABFAB] py-4 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {pending ? 'กำลังบันทึก...' : 'ยืนยันการจอง'}
          </button>

          <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> กดยืนยันแล้วไม่สามารถยกเลิกได้
          </p>
        </form>
      </div>

      {/* Confirm Modal */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden">
            <div className="px-5 py-5">
              <h3 className="text-lg font-bold text-gray-900">ยืนยันการจอง?</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                ชื่อ: <span className="font-semibold text-gray-900">{name}</span><br />
                เบอร์: <span className="font-semibold text-gray-900">{phone}</span><br />
                วันที่: <span className="font-semibold text-gray-900">{dateLabel} {time} น.</span>
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setConfirming(false)} disabled={pending}
                className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl">
                กลับ
              </button>
              <button onClick={actuallySubmit} disabled={pending}
                className="flex-1 py-3 bg-[#2ABFAB] text-white text-sm font-bold rounded-xl disabled:opacity-50">
                {pending ? 'กำลังส่ง...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
