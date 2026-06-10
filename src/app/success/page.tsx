import Link from 'next/link'
import { CloseButton } from './CloseButton'
import { CalendarDays, Phone, MapPin, FileText, MessageCircle, Truck, Clock, Scissors } from 'lucide-react'

type Props = {
  searchParams: Promise<{
    pending?: string
    date?: string
    time?: string
    name?: string
    phone?: string
    location?: string
    branch?: string
    note?: string
  }>
}

export default async function SuccessPage({ searchParams }: Props) {
  const params  = await searchParams
  const isPending = params.pending === 'true'

  const dateLabel = params.date
    ? new Date(params.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <main className="min-h-screen bg-gray-50 pb-16">

      {/* Success Hero */}
      <div className="bg-white px-6 pt-12 pb-8 text-center">
        {/* Checkmark */}
        <div className="relative inline-flex items-center justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-[#2ABFAB] flex items-center justify-center shadow-lg shadow-[#2ABFAB]/30">
            <svg width="32" height="26" viewBox="0 0 32 26" fill="none">
              <path d="M2 13L11 22L30 2" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* Confetti dots */}
          <div className="absolute -top-2 -left-4 w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
          <div className="absolute -top-3 right-0 w-2 h-2 rounded-full bg-blue-400 opacity-80" />
          <div className="absolute top-2 -right-5 w-3 h-3 rounded-full bg-pink-400 opacity-80" />
          <div className="absolute bottom-0 -left-5 w-2 h-2 rounded-full bg-green-400 opacity-80" />
          <div className="absolute -bottom-2 right-2 w-3 h-3 rounded-full bg-purple-400 opacity-80" />
        </div>

        <h1 className="text-2xl font-extrabold text-gray-900">นัดหมายสำเร็จแล้ว!</h1>
        <p className="text-sm text-gray-500 mt-2">ร้านได้รับข้อมูลของคุณเรียบร้อย</p>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4 mt-4">

        {/* Appointment card */}
        {dateLabel && params.time && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-12 rounded-2xl bg-[#2ABFAB]/10 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-6 h-6 text-[#2ABFAB]" />
              </div>
              <div>
                <div className="text-xs text-gray-400 font-medium">นัดรับรองเท้า</div>
                <div className="text-base font-extrabold text-gray-900 mt-0.5">{dateLabel}</div>
                <div className="text-lg font-extrabold text-[#2ABFAB]">{params.time} น.</div>
                {params.branch && <div className="text-xs text-gray-400 mt-0.5">{params.branch}</div>}
              </div>
            </div>

            {/* Details */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-3">
              {params.name && (
                <DetailRow icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>} label="ชื่อ" value={params.name} />
              )}
              {params.phone && (
                <DetailRow icon={<Phone className="w-3.5 h-3.5" />} label="เบอร์โทรศัพท์" value={params.phone} />
              )}
              {params.location && (
                <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="สถานที่รับรองเท้า" value={params.location} multiline />
              )}
              <DetailRow icon={<FileText className="w-3.5 h-3.5" />} label="หมายเหตุ" value={params.note || '-'} />
            </div>
          </div>
        )}

        {/* LINE notify */}
        <div className="bg-green-50 border border-green-100 rounded-3xl px-5 py-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-green-800 text-sm">เราจะส่งการยืนยันการจอง</div>
            <div className="text-xs text-green-600 mt-0.5">และรายละเอียดไปทาง LINE ภายในไม่กี่นาที</div>
          </div>
        </div>

        {/* สิ่งที่ควรรู้ */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-5">
          <h2 className="font-bold text-gray-900 mb-4">สิ่งที่คุณควรรู้</h2>
          <div className="space-y-4">
            {[
              { icon: <Truck className="w-5 h-5 text-[#2ABFAB]" />, bg: 'bg-[#2ABFAB]/10', title: 'เตรียมรองเท้าให้พร้อม', desc: 'ถ่ายรูปก่อนส่งเป็นหลักฐาน' },
              { icon: <Clock className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50', title: 'รอส่งรองเท้าตามนัดหมาย', desc: 'เจ้าหน้าที่จะติดต่อคุณก่อนเข้ารับ 30-60 นาที' },
              { icon: <Scissors className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50', title: 'ระยะเวลาดำเนินการ', desc: 'โดยประมาณ 3-5 วันทำการ' },
            ].map(({ icon, bg, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  {icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <CloseButton />

        <Link href="/status"
          className="flex items-center justify-center gap-1 text-sm text-[#2ABFAB] font-semibold py-3">
          ดูประวัติการจอง ›
        </Link>

      </div>
    </main>
  )
}

function DetailRow({ icon, label, value, multiline }: {
  icon: React.ReactNode
  label: string
  value: string
  multiline?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 flex justify-between gap-2">
        <span className="text-sm text-gray-500 flex-shrink-0">{label}</span>
        <span className={`text-sm text-gray-900 font-medium ${multiline ? 'text-right' : ''}`}>{value}</span>
      </div>
    </div>
  )
}
