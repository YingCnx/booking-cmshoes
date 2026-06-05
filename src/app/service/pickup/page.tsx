import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SelectableLink } from '@/components/SelectableLink'
import { todayInBangkok, currentMinutesInBangkok, generateDates } from '@/lib/timezone'
import { CalendarDays, Clock, ChevronLeft, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ date?: string; time?: string }>
}

const DEFAULT_DURATION = 60

export default async function PickupTimePage({ searchParams }: Props) {
  const { date, time: selectedTime } = await searchParams

  const session = await getLineSession()
  if (!session) redirect('/liff?next=/service/pickup')

  const today = todayInBangkok()
  const selectedDate = date ?? today
  const dates = generateDates(7)

  const supabase = await createClient()
  const [
    { data: branch },
    { data: appointments },
  ] = await Promise.all([
    supabase.from('branches')
      .select('id, name, open_time, close_time, slot_interval_minutes, max_parallel_bookings, holiday_dates')
      .eq('id', session.branchId).single(),
    supabase.from('appointments')
      .select('appointment_time, end_time')
      .eq('branch_id', session.branchId)
      .eq('appointment_date', selectedDate)
      .in('status', ['รอดำเนินการ', 'ยืนยันแล้ว']),
  ])

  if (!branch) redirect('/service')

  const openTime     = String(branch.open_time  ?? '09:00').slice(0, 5)
  const closeTime    = String(branch.close_time ?? '18:00').slice(0, 5)
  const slotInterval = branch.slot_interval_minutes ?? 60
  const maxParallel  = branch.max_parallel_bookings ?? 3
  const isHoliday    = (branch.holiday_dates ?? []).includes(selectedDate)

  function toMinutes(t: string) {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  function toTime(m: number) {
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  }

  const openMin  = toMinutes(openTime)
  const closeMin = toMinutes(closeTime)
  const slots: string[] = []
  for (let m = openMin; m + DEFAULT_DURATION <= closeMin; m += slotInterval) {
    slots.push(toTime(m))
  }

  const currentMin = currentMinutesInBangkok()
  const isToday    = selectedDate === today

  const slotInfo = slots.map(time => {
    const startMin = toMinutes(time)
    const endMin   = startMin + DEFAULT_DURATION
    const endTime  = toTime(endMin)

    const overlapping = (appointments ?? []).filter((b: any) => {
      const bStart = toMinutes(String(b.appointment_time).slice(0, 5))
      const bEnd   = b.end_time
        ? toMinutes(String(b.end_time).slice(0, 5))
        : bStart + DEFAULT_DURATION
      return startMin < bEnd && endMin > bStart
    }).length

    const isPast = isToday && startMin < currentMin + 60
    const isFull = overlapping >= maxParallel

    return { time, endTime, isPast, isFull }
  })

  function formatDayName(d: string) {
    if (d === today) return 'วันนี้'
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tStr = tomorrow.toISOString().split('T')[0]
    if (d === tStr) return 'พรุ่งนี้'
    return new Date(d).toLocaleDateString('th-TH', { weekday: 'short' })
  }

  function formatDayNum(d: string) {
    return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-32">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/service"
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-900">เลือกวันที่และเวลา</h1>
          <Link href="/service" className="text-sm text-gray-400 font-medium">ปิด</Link>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 pb-4 px-6">
          {[
            { num: 1, label: 'เลือกวันและเวลา' },
            { num: 2, label: 'ข้อมูลติดต่อ' },
            { num: 3, label: 'ยืนยันการจอง' },
          ].map(({ num, label }, i) => (
            <div key={num} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  num === 1 ? 'bg-[#2ABFAB] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {num}
                </div>
                <span className={`text-[10px] whitespace-nowrap ${num === 1 ? 'text-[#2ABFAB] font-semibold' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className="w-8 h-px bg-gray-200 mb-4" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-6">

        {/* เลือกวันที่ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#2ABFAB] text-white text-xs font-bold flex items-center justify-center">1</div>
            <h2 className="font-bold text-gray-900">เลือกวันที่</h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {dates.map(d => {
              const isSelected = d === selectedDate
              const isClosed   = (branch.holiday_dates ?? []).includes(d)
              return (
                <Link key={d}
                  href={`/service/pickup?date=${d}`}
                  className={`flex-shrink-0 px-3 py-2.5 rounded-2xl text-center transition-all min-w-[72px] border-2 ${
                    isSelected
                      ? 'border-[#2ABFAB] bg-[#2ABFAB]/5 text-[#2ABFAB]'
                      : isClosed
                      ? 'border-transparent bg-gray-100 text-gray-300'
                      : 'border-gray-200 bg-white text-gray-700 active:scale-95'
                  }`}
                >
                  <div className="text-xs font-medium">{formatDayName(d)}</div>
                  <div className="text-sm font-bold mt-0.5">{new Date(d).getDate()}</div>
                  <div className="text-[10px] mt-0.5 opacity-70">
                    {new Date(d).toLocaleDateString('th-TH', { month: 'short' })}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* เลือกช่วงเวลา */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-[#2ABFAB] text-white text-xs font-bold flex items-center justify-center">2</div>
            <h2 className="font-bold text-gray-900">เลือกช่วงเวลา</h2>
          </div>
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1 ml-8">
            <Clock className="w-3 h-3" /> ใช้เวลาเดินทางรับประมาณ 30-60 นาที
          </p>

          {isHoliday ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-2">🚫</div>
              <p className="text-sm">วันนี้ร้านหยุด</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {slotInfo.map(({ time, endTime, isPast, isFull }) => {
                const disabled   = isPast || isFull
                const isSelected = time === selectedTime
                const label      = `${time} - ${endTime}`

                if (disabled) return (
                  <div key={time}
                    className="text-center py-3.5 rounded-2xl text-sm bg-gray-50 border border-gray-100">
                    {isFull && <div className="text-xs text-gray-400 font-medium">เต็ม</div>}
                    <div className="text-gray-300 font-medium">{label}</div>
                  </div>
                )

                return (
                  <SelectableLink key={time}
                    href={`/service/pickup?date=${selectedDate}&time=${time}`}
                    prefetch={false}
                    className={`text-center py-3.5 rounded-2xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                      isSelected
                        ? 'border-[#2ABFAB] bg-[#2ABFAB]/5 text-[#2ABFAB]'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-[#2ABFAB]/50'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#2ABFAB] mx-auto mb-1" />}
                    {label}
                  </SelectableLink>
                )
              })}
            </div>
          )}

          {!isHoliday && slotInfo.every(s => s.isPast || s.isFull) && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">ไม่มีเวลาว่างในวันนี้</p>
              <p className="text-xs mt-1">กรุณาเลือกวันอื่น</p>
            </div>
          )}
        </div>

        {/* Selected time banner */}
        {selectedTime && (
          <div className="bg-[#2ABFAB]/10 border border-[#2ABFAB]/30 rounded-2xl px-4 py-3 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#2ABFAB] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#2ABFAB]">
                รับรองเท้าที่บ้านในช่วง {selectedTime} - {toTime(toMinutes(selectedTime) + DEFAULT_DURATION)} น.
              </p>
              <p className="text-xs text-gray-500 mt-0.5">โดยประมาณ</p>
            </div>
          </div>
        )}

      </div>

      {/* Sticky CTA */}
      {selectedTime && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 p-4">
          <div className="max-w-lg mx-auto">
            <SelectableLink
              href={`/confirm?date=${selectedDate}&time=${selectedTime}`}
              className="flex items-center justify-center gap-2 w-full bg-[#2ABFAB] text-white py-4 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-transform"
            >
              ต่อไป: กรอกข้อมูลติดต่อ
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </SelectableLink>
          </div>
        </div>
      )}

    </main>
  )
}
