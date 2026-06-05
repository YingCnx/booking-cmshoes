import { createClient } from '@/utils/supabase/server'
import { requireAdminSession } from '@/lib/admin-session'
import { AppointmentActions } from './AppointmentActions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params
  const admin = await requireAdminSession()
  const supabase = await createClient()

  const { data: apt } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, end_time,
      customer_name, phone, location, shoe_count, status, notes,
      created_at, appointment_type, branch_id, customer_id,
      services ( service_name, base_price ),
      customers ( line_user_id )
    `)
    .eq('id', parseInt(id))
    .single()

  if (!apt || apt.branch_id !== admin.branchId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black text-white">
        <p className="text-gray-500">ไม่พบรายการ</p>
      </main>
    )
  }

  const dateLabel = new Date(apt.appointment_date).toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const statusColor: any = {
    'รอดำเนินการ': 'bg-amber-950/30 border-amber-800 text-amber-300',
    'ยืนยันแล้ว':  'bg-emerald-950/30 border-emerald-800 text-emerald-300',
    'เสร็จสิ้น':   'bg-blue-950/30 border-blue-800 text-blue-300',
    'ยกเลิก':     'bg-red-950/30 border-red-800 text-red-300',
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 px-4 py-4 sticky top-0 z-10 bg-black">
        <div className="flex items-center gap-3">
          <Link href="/admin"
            className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-gray-400">
            <span className="text-lg leading-none">‹</span>
          </Link>
          <h1 className="font-bold">รายละเอียดการจอง</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Status badge */}
        <div className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold border ${statusColor[apt.status] ?? 'bg-gray-800 border-gray-700'}`}>
          {apt.status}
        </div>

        {/* Main info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-5 py-5">
            <div className="text-3xl font-bold tabular-nums">{String(apt.appointment_time).slice(0,5)} น.</div>
            <div className="text-gray-400 text-sm mt-1">{dateLabel}</div>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm">
            <DetailRow label="ชื่อลูกค้า" value={apt.customer_name} />
            <DetailRow label="เบอร์" value={apt.phone} link={`tel:${apt.phone}`} />
            <DetailRow label="บริการ" value={(apt.services as any)?.service_name} />
            <DetailRow label="สถานที่รับ" value={apt.location} />
            <DetailRow label="จำนวน" value={`${apt.shoe_count} คู่`} />
            <DetailRow label="ที่มา" value={apt.appointment_type ?? 'walk-in'} />
            {apt.notes && <DetailRow label="หมายเหตุ" value={apt.notes} />}
          </div>
        </div>

        {/* Actions */}
        <AppointmentActions
          appointmentId={apt.id}
          currentStatus={apt.status}
          appointmentType={apt.appointment_type ?? 'pickup'}
          lineUserId={(apt.customers as any)?.line_user_id ?? null}
          branchId={admin.branchId}
          notifyData={{
            serviceName: (apt.services as any)?.service_name ?? '',
            date: apt.appointment_date,
            time: String(apt.appointment_time).slice(0,5),
            location: apt.location,
            shoeCount: apt.shoe_count,
          }}
        />

      </div>
    </div>
  )
}

function DetailRow({ label, value, link }: { label: string; value?: string | null; link?: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      {link ? (
        <a href={link} className="font-medium text-white text-right break-all underline">{value ?? '-'}</a>
      ) : (
        <span className="font-medium text-white text-right break-all">{value ?? '-'}</span>
      )}
    </div>
  )
}
