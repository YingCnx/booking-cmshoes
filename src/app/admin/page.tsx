import { createClient } from '@/utils/supabase/server'
import { requireAdminSession } from '@/lib/admin-session'
import { AdminHeader } from './_components/AdminHeader'
import { todayInBangkok } from '@/lib/timezone'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  'รอดำเนินการ': { bg: 'bg-amber-950/30',  text: 'text-amber-300',  label: '⏳ รอยืนยัน' },
  'ยืนยันแล้ว':  { bg: 'bg-emerald-950/30', text: 'text-emerald-300', label: '✅ ยืนยันแล้ว' },
}

export default async function AdminPage() {
  const admin = await requireAdminSession()
  const supabase = await createClient()
  const today = todayInBangkok()

  // ดึงนัดหมายทั้งหมดที่ไม่ใช่ เสร็จสิ้น / ยกเลิก / สำเร็จ
  const { data: allAppointments } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, location, shoe_count,
      customer_name, phone, status,
      services ( service_name )
    `)
    .eq('branch_id', admin.branchId)
    .not('status', 'in', '("เสร็จสิ้น","ยกเลิก","สำเร็จ")')
    .gte('appointment_date', today)
    .order('appointment_date')
    .order('appointment_time')

  // ดึงนัดหมายที่สำเร็จวันนี้ (updated_at = วันนี้)
  const todayStart = `${today}T00:00:00+07:00`
  const todayEnd   = `${today}T23:59:59+07:00`
  const { data: completedToday } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, location, shoe_count,
      customer_name, phone, updated_at,
      services ( service_name )
    `)
    .eq('branch_id', admin.branchId)
    .eq('status', 'สำเร็จ')
    .gte('updated_at', todayStart)
    .lte('updated_at', todayEnd)
    .order('updated_at', { ascending: false })

  const appointments = (allAppointments ?? []) as any[]
  const completed    = (completedToday  ?? []) as any[]

  // จำนวนรอยืนยัน
  const pendingCount = appointments.filter(a => a.status === 'รอดำเนินการ').length

  // จัดกลุ่มตามวัน
  const grouped: Record<string, any[]> = {}
  for (const a of appointments) {
    if (!grouped[a.appointment_date]) grouped[a.appointment_date] = []
    grouped[a.appointment_date].push(a)
  }
  const sortedDates = Object.keys(grouped).sort()

  function formatDate(dateStr: string) {
    if (dateStr === today) return 'วันนี้'
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    const tomorrow = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if (dateStr === tomorrow) return 'พรุ่งนี้'
    return new Date(dateStr).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'short' })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader displayName={admin.displayName} branchName={admin.branchName} />

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-8">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-xl p-4 border ${pendingCount > 0 ? 'border-amber-700 bg-amber-950/30' : 'border-gray-800 bg-gray-900'}`}>
            <div className={`text-3xl font-bold tabular-nums ${pendingCount > 0 ? 'text-amber-300' : 'text-white'}`}>
              {pendingCount}
            </div>
            <div className="text-xs text-gray-500 mt-1.5 uppercase tracking-wider">รอยืนยัน</div>
          </div>
          <div className="border border-gray-800 bg-gray-900 rounded-xl p-4">
            <div className="text-3xl font-bold tabular-nums text-white">{appointments.length}</div>
            <div className="text-xs text-gray-500 mt-1.5 uppercase tracking-wider">นัดหมาย</div>
          </div>
          <div className="border border-blue-900 bg-blue-950/30 rounded-xl p-4">
            <div className="text-3xl font-bold tabular-nums text-blue-300">{completed.length}</div>
            <div className="text-xs text-gray-500 mt-1.5 uppercase tracking-wider">รับแล้ววันนี้</div>
          </div>
        </div>

        {/* แยกตามวัน */}
        {sortedDates.length === 0 ? (
          <div className="border border-gray-800 bg-gray-900 rounded-xl px-5 py-10 text-center text-gray-600 text-sm">
            ไม่มีนัดหมายที่รอดำเนินการ
          </div>
        ) : (
          sortedDates.map(date => (
            <section key={date}>
              {/* หัววัน */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-bold">{formatDate(date)}</h2>
                <span className="text-xs text-gray-500">
                  {new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="ml-auto text-xs text-gray-600">{grouped[date].length} รายการ</span>
              </div>

              <div className="space-y-2">
                {grouped[date].map((b) => {
                  const style = STATUS_STYLE[b.status] ?? { bg: 'bg-gray-900', text: 'text-gray-400', label: b.status }
                  return (
                    <Link key={b.id}
                      href={`/admin/appointments/${b.id}`}
                      className={`flex items-center gap-4 border border-gray-800 ${style.bg} hover:brightness-125 rounded-xl px-4 py-4 transition`}
                    >
                      <div className="flex-shrink-0 text-center w-14">
                        <div className="text-lg font-bold tabular-nums">
                          {String(b.appointment_time).slice(0, 5)}
                        </div>
                        <div className={`text-xs font-medium mt-0.5 ${style.text}`}>
                          {style.label}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{b.customer_name}</div>
                        <div className="text-sm text-gray-400 mt-0.5 truncate">
                          {b.services?.service_name} · {b.shoe_count} คู่
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5 truncate">{b.location}</div>
                      </div>
                      <div className="text-gray-600 flex-shrink-0">›</div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))
        )}

        {/* รับรองเท้าแล้ววันนี้ */}
        {completed.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-bold">👟 รับรองเท้าแล้ววันนี้</h2>
              <span className="text-xs text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded-full">{completed.length} รายการ</span>
            </div>
            <div className="border border-gray-800 bg-gray-900 rounded-xl overflow-hidden divide-y divide-gray-800">
              {completed.map((b) => (
                <Link key={b.id}
                  href={`/admin/appointments/${b.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-800 transition">
                  <div className="flex-shrink-0 text-center w-14">
                    <div className="text-base font-bold tabular-nums">
                      {String(b.appointment_time).slice(0, 5)}
                    </div>
                    <div className="text-xs text-blue-400 mt-0.5">สำเร็จ</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.customer_name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {b.services?.service_name} · {b.shoe_count} คู่
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(b.updated_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
