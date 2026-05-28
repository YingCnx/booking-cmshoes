import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookingForm } from './BookingForm'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ date?: string; time?: string }>
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { date, time } = await searchParams

  if (!date || !time) redirect('/service')

  const session = await getLineSession()
  if (!session) redirect(`/liff?next=/confirm?date=${date}&time=${time}`)

  const supabase = await createClient()

  // ✅ ดึง branch + existing customer parallel
  const [
    { data: branch },
    { data: existing },
  ] = await Promise.all([
    supabase.from('branches').select('id, name').eq('id', session.branchId).single(),
    supabase.from('customers')
      .select('name, phone')
      .eq('line_user_id', session.lineUserId)
      .maybeSingle(),
  ])

  if (!branch) redirect('/service')

  const dateLabel = new Date(date).toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // ✅ prefill — ถ้าเจอ customer แล้ว ใช้ค่าจาก DB
  // ถ้าไม่เจอ ใช้ displayName จาก LINE เป็นชื่อ
  const defaultName  = existing?.name  ?? session.displayName ?? ''
  const defaultPhone = existing?.phone ?? ''

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <Link href={`/service/pickup?date=${date}`}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:scale-95 transition-transform">
            <span className="text-lg leading-none">‹</span>
          </Link>
          <h1 className="font-bold text-gray-900">ยืนยันการจอง</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-5 py-5">
            <div className="text-3xl font-bold">{time} น.</div>
            <div className="text-gray-400 text-sm mt-1">{dateLabel}</div>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm">
            <Row label="บริการ" value="นัดหมายรับรองเท้า" />
            <Row label="สาขา" value={branch.name} />
          </div>
        </div>

        {session && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
            {session.pictureUrl && (
              <img src={session.pictureUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            )}
            <div>
              <div className="text-xs font-medium text-green-700">เชื่อมต่อ LINE แล้ว</div>
              <div className="text-sm font-semibold text-green-900">{session.displayName}</div>
            </div>
          </div>
        )}

        {existing?.phone && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-blue-800">
            <span className="text-base leading-none">✓</span>
            <span>ระบบดึงข้อมูลที่เคยใช้บริการมาให้แล้ว — สามารถแก้ไขได้</span>
          </div>
        )}

        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3.5 text-sm text-amber-800">
          <span className="text-lg leading-none">⏳</span>
          <span>ร้านจะยืนยันการจองให้ทราบทาง LINE ภายหลัง</span>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 px-5 py-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">ข้อมูลของคุณ</h2>
          <BookingForm
            time={time}
            date={date}
            defaults={{ name: defaultName, phone: defaultPhone }}
          />
        </div>

      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value ?? '-'}</span>
    </div>
  )
}
