import { createClient } from '@/utils/supabase/server'
import { requireAdminSession } from '@/lib/admin-session'
import { AdminHeader } from './_components/AdminHeader'
import { todayInBangkok } from '@/lib/timezone'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const admin = await requireAdminSession()
  const supabase = await createClient()
  const today = todayInBangkok()

  // pending ทั้งหมด (ที่ยังไม่ผ่าน)
  const { data: allPending } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, location, shoe_count,
      customer_name, phone,
      services ( service_name )
    `)
    .eq('branch_id', admin.branchId)
    .eq('status', 'รอดำเนินการ')
    .gte('appointment_date', today)
    .order('appointment_date')
    .order('appointment_time')

  // confirmed ของวันนี้
  const { data: todayConfirmed } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, location, shoe_count,
      customer_name, phone,
      services ( service_name )
    `)
    .eq('branch_id', admin.branchId)
    .eq('status', 'ยืนยันแล้ว')
    .eq('appointment_date', today)
    .order('appointment_time')

  const pending   = (allPending     ?? []) as any[]
  const confirmed = (todayConfirmed ?? []) as any[]

  function formatDate(dateStr: string) {
    if (dateStr === today) return 'วันนี้'
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`
    if (dateStr === tStr) return 'พรุ่งนี้'
    return new Date(dateStr).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader displayName={admin.displayName} branchName={admin.branchName} />

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-8">

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-4 border ${pending.length > 0 ? 'border-amber-700 bg-amber-950/30' : 'border-gray-800 bg-gray-900'}`}>
            <div className={`text-3xl font-bold tabular-nums ${pending.length > 0 ? 'text-amber-300' : 'text-white'}`}>
              {pending.length}
            </div>
            <div className="text-xs text-gray-500 mt-1.5 uppercase tracking-wider">รอยืนยัน</div>
          </div>
          <div className="border border-gray-800 bg-gray-900 rounded-xl p-4">
            <div className="text-3xl font-bold tabular-nums text-emerald-400">{confirmed.length}</div>
            <div className="text-xs text-gray-500 mt-1.5 uppercase tracking-wider">วันนี้</div>
          </div>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">⏳ รอยืนยัน</h2>
            {pending.length > 0 && (
              <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </div>

          {!pending.length ? (
            <div className="border border-gray-800 bg-gray-900 rounded-xl px-5 py-8 text-center text-gray-600 text-sm">
              ไม่มีรายการรอยืนยัน
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((b) => (
                <Link key={b.id}
                  href={`/admin/appointments/${b.id}`}
                  className="flex items-center gap-4 border border-amber-800/50 bg-amber-950/20 hover:bg-amber-950/40 rounded-xl px-4 py-4 transition"
                >
                  <div className="flex-shrink-0 text-center w-16">
                    <div className="text-xs text-amber-400 font-medium">{formatDate(b.appointment_date)}</div>
                    <div className="text-lg font-bold tabular-nums mt-0.5">{String(b.appointment_time).slice(0, 5)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{b.customer_name}</div>
                    <div className="text-sm text-gray-400 mt-0.5 truncate">
                      {b.services?.service_name} · {b.shoe_count} คู่
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-amber-600">ดูคิว →</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">✅ คิววันนี้</h2>
          {!confirmed.length ? (
            <div className="border border-gray-800 bg-gray-900 rounded-xl px-5 py-8 text-center text-gray-600 text-sm">
              ยังไม่มีคิวที่ยืนยันวันนี้
            </div>
          ) : (
            <div className="border border-gray-800 bg-gray-900 rounded-xl overflow-hidden divide-y divide-gray-800">
              {confirmed.map((b) => (
                <Link key={b.id}
                  href={`/admin/appointments/${b.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-800 transition">
                  <span className="text-base font-bold tabular-nums w-12 flex-shrink-0">
                    {String(b.appointment_time).slice(0, 5)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.customer_name}</div>
                    <div className="text-xs text-gray-500 truncate">{b.services?.service_name} · {b.shoe_count} คู่</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
