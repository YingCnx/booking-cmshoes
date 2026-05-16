import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SelectableLink } from '@/components/SelectableLink'
import { todayInBangkok, currentMinutesInBangkok, generateDates } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ date?: string }>
}

const DEFAULT_DURATION = 60   // นัดละ 60 นาที (รับรองเท้า)

export default async function PickupTimePage({ searchParams }: Props) {
  const { date } = await searchParams

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

  const openTime  = String(branch.open_time  ?? '09:00').slice(0, 5)
  const closeTime = String(branch.close_time ?? '18:00').slice(0, 5)
  const slotInterval = branch.slot_interval_minutes ?? 60
  const maxParallel  = branch.max_parallel_bookings ?? 3
  const isHoliday = (branch.holiday_dates ?? []).includes(selectedDate)

  function toMinutes(t: string) { const [h,m] = t.split(':').map(Number); return h*60+m }
  function toTime(m: number) { return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}` }

  const openMin  = toMinutes(openTime)
  const closeMin = toMinutes(closeTime)
  const slots: string[] = []
  for (let m = openMin; m + DEFAULT_DURATION <= closeMin; m += slotInterval) {
    slots.push(toTime(m))
  }

  const currentMin = currentMinutesInBangkok()
  const isToday = selectedDate === today

  const slotInfo = slots.map(time => {
    const startMin = toMinutes(time)
    const endMin = startMin + DEFAULT_DURATION

    const overlapping = (appointments ?? []).filter((b: any) => {
      const bStart = toMinutes(String(b.appointment_time).slice(0,5))
      const bEnd   = b.end_time
        ? toMinutes(String(b.end_time).slice(0,5))
        : bStart + DEFAULT_DURATION
      return startMin < bEnd && endMin > bStart
    }).length

    const isPast = isToday && startMin < currentMin + 60
    const isFull = overlapping >= maxParallel

    return { time, isPast, isFull, count: overlapping }
  })

  function formatDateLabel(d: string) {
    if (d === today) return 'วันนี้'
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`
    if (d === tStr) return 'พรุ่งนี้'
    return new Date(d).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href="/service"
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-transform">
            <span className="text-lg leading-none">‹</span>
          </Link>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">นัดหมายรับรองเท้า</h1>
            <p className="text-xs text-gray-400 mt-0.5">{branch.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">เลือกวันที่</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {dates.map(d => {
              const isSelected = d === selectedDate
              const isClosed = (branch.holiday_dates ?? []).includes(d)
              return (
                <Link key={d}
                  href={`/service/pickup?date=${d}`}
                  className={`flex-shrink-0 px-4 py-3 rounded-2xl text-center transition-all min-w-[80px] ${
                    isSelected
                      ? 'bg-black text-white'
                      : isClosed
                      ? 'bg-gray-100 text-gray-300'
                      : 'bg-white border border-gray-200 text-gray-700 active:scale-95'
                  }`}
                >
                  <div className="text-xs opacity-70">{formatDateLabel(d).split(' ')[0]}</div>
                  <div className="text-base font-bold mt-0.5">{new Date(d).getDate()}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {new Date(d).toLocaleDateString('th-TH', { month: 'short' })}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">เลือกเวลา</h2>

          {isHoliday ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-2">🚫</div>
              <p className="text-sm">วันนี้ร้านหยุด</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slotInfo.map(({ time, isPast, isFull }) => {
                const disabled = isPast || isFull
                return disabled ? (
                  <div key={time}
                    className="text-center py-3 rounded-xl text-sm font-medium bg-gray-50 text-gray-300 opacity-50">
                    {time}
                  </div>
                ) : (
                  <SelectableLink key={time}
                    href={`/confirm?date=${selectedDate}&time=${time}`}
                    prefetch={false}
                    className="text-center py-3 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-900 hover:border-gray-400 transition-colors"
                  >
                    {time}
                  </SelectableLink>
                )
              })}
            </div>
          )}

          {!isHoliday && slotInfo.every(s => s.isPast || s.isFull) && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">วันนี้ไม่มีเวลาว่างแล้ว</p>
              <p className="text-xs mt-1">กรุณาเลือกวันอื่น</p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
