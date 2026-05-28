import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import { LinkPhoneForm } from './LinkPhoneForm'
import { QueueList } from './QueueList'
import { ACTIVE_QUEUE_STATUSES } from '@/lib/queue-status'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StatusPage() {
  const session = await getLineSession()
  if (!session) redirect('/liff?next=/status')

  const supabase = await createClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, phone, customer_code, branch_id')
    .eq('line_user_id', session.lineUserId)
    .maybeSingle()

  if (!customer) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <div className="text-center pt-6 pb-2">
            <div className="text-5xl mb-3">🔗</div>
            <h2 className="text-xl font-bold text-gray-900">ผูกบัญชี LINE กับเบอร์โทร</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              เพื่อให้คุณดูสถานะการรับ-ส่งรองเท้าได้
              <br />กรุณากรอกเบอร์โทรที่เคยใช้บริการ
            </p>
          </div>
          <LinkPhoneForm displayName={session.displayName} />
        </div>
      </main>
    )
  }

  // ✅ ใช้ received_date, total_price, delivery_date
  const { data: activeQueues } = await supabase
    .from('queue')
    .select(`
      id, status, queue_number, received_date, total_price, delivery_date,
      queue_items ( id )
    `)
    .eq('customer_id', customer.id)
    .in('status', ACTIVE_QUEUE_STATUSES as any)
    .order('received_date', { ascending: false })

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        <div className="bg-white rounded-3xl border border-gray-100 px-5 py-4 shadow-sm">
          <div className="text-xs text-gray-400 uppercase tracking-wider">ลูกค้า</div>
          <div className="font-bold text-gray-900 mt-1">{customer.name}</div>
          {customer.customer_code && (
            <div className="text-xs text-gray-500 mt-0.5 font-mono">{customer.customer_code}</div>
          )}
        </div>

        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            กำลังดำเนินการ
          </h2>
          <QueueList queues={activeQueues ?? []} />
        </div>

        <Link href="/service"
          className="block bg-gray-900 text-white rounded-2xl px-5 py-4 text-center text-sm font-bold active:scale-[0.99] transition">
          + จองคิวใหม่
        </Link>

      </div>
    </main>
  )
}

function Header() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 pt-14 pb-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>
      <div className="relative">
        <div className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-semibold">เช็คสถานะ</div>
        <h1 className="text-3xl font-bold tracking-tight text-white">รองเท้าของคุณ</h1>
        <p className="mt-2 text-gray-400 text-sm">ติดตามสถานะการรับ-ส่งรองเท้า</p>
      </div>
    </div>
  )
}
