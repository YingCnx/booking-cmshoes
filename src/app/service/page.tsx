import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import { SelectableLink } from '@/components/SelectableLink'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import {
  Star, Footprints, Truck, CalendarDays,
  ArrowRight, ShieldCheck, Clock, ChevronRight,
  Package, Sparkles
} from 'lucide-react'

export const revalidate = 60

export default async function ServicePage() {
  const session = await getLineSession()
  if (!session) redirect('/liff?next=/service')

  const supabase = await createClient()
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, phone')
    .eq('id', session.branchId)
    .single()

  if (!branch) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <p className="text-gray-500">ไม่พบสาขา</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white pb-32">

      {/* Before/After Slider */}
      <section className="px-4 pt-5">
        <BeforeAfterSlider
          beforeSrc="/before.jpg"
          afterSrc="/after.jpg"
        />
      </section>

      {/* Title + Stats */}
      <section className="px-5 pt-6 text-center">
        <p className="text-xs font-semibold tracking-widest text-gray-400 mb-2">
          ร้านซักเกิบแอนด์สปา
        </p>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">
          จองคิวซักรองเท้า
        </h1>
        <p className="mt-2 text-[#2ABFAB] font-semibold text-base">
          รับ-ส่งถึงบ้าน สะอาดทุกคู่
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="font-bold text-gray-900 text-sm">4.9/5</div>
            <div className="text-xs text-gray-400 leading-tight text-center">จาก 1,200+ รีวิว</div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
              <Footprints className="w-5 h-5 text-[#2ABFAB]" />
            </div>
            <div className="font-bold text-gray-900 text-sm">10,000+ คู่</div>
            <div className="text-xs text-gray-400 leading-tight text-center">ซักแล้วมากกว่า</div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-500" />
            </div>
            <div className="font-bold text-gray-900 text-sm">รับ-ส่งฟรี</div>
            <div className="text-xs text-gray-400 leading-tight text-center">ทั่วเชียงใหม่</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 mt-6">
        <SelectableLink
          href="/service/pickup"
          className="block w-full bg-[#2ABFAB] text-white rounded-2xl px-5 py-4 shadow-lg active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg">
                <CalendarDays className="w-5 h-5" />
                จองคิวรับรองเท้า
              </div>
              <div className="text-sm text-white/70 mt-0.5 font-medium">Book a Pickup</div>
            </div>
            <ArrowRight className="w-6 h-6" />
          </div>
        </SelectableLink>
        <p className="text-center text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" /> เร็วมาก ใช้เวลาไม่เกิน 1 นาที
        </p>
      </section>

      {/* ผลงานล่าสุด */}
      <section className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-base">ผลงานล่าสุด</h2>
          <button className="flex items-center gap-0.5 text-xs text-[#2ABFAB] font-medium">
            ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Adidas Adizero', desc: 'คราบฝังลึกหายเกลี้ยง', before: '/adizero-before.jpg', after: '/adizero-after.jpg' },
            { label: 'Birkenstock',     desc: 'สะอาด วัสดุไม่เสียหาย', before: '/birken-before.jpg', after: '/birken-after.jpg' },
            { label: 'On Cloud',        desc: 'คราบดินโคลนไม่เหลือ', before: '/oncloud-before.jpg', after: '/oncloud-after.jpg' },
            { label: 'Puma Speedcat',   desc: 'หนังแท้กลับมาเงางาม', before: '/speedcat-before.jpg', after: '/speedcat-after.jpg' },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <BeforeAfterSlider
                beforeSrc={item.before}
                afterSrc={item.after}
              />
              <div className="px-3 py-2.5">
                <div className="font-semibold text-xs text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ขั้นตอน */}
      <section className="px-4 mt-8">
        <h2 className="font-bold text-gray-900 text-base text-center mb-5">ขั้นตอนการใช้บริการ</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { icon: CalendarDays, label: 'จองคิว', color: 'text-[#2ABFAB]', bg: 'bg-teal-50' },
            { icon: Truck,        label: 'รับรองเท้า', color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Sparkles,     label: 'ทำความสะอาด', color: 'text-purple-500', bg: 'bg-purple-50' },
            { icon: Package,      label: 'ส่งคืน', color: 'text-orange-500', bg: 'bg-orange-50' },
          ].map(({ icon: Icon, label, color, bg }, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 relative">
              {i < 3 && (
                <div className="absolute top-5 left-[60%] right-[-40%] h-px bg-gray-200" />
              )}
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center z-10 relative`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-xs text-gray-500 leading-tight">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-5 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
          ข้อมูลของคุณปลอดภัย 100%
        </p>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto">
          <SelectableLink
            href="/service/pickup"
            className="flex items-center justify-center gap-2 w-full bg-[#2ABFAB] text-white py-4 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-transform"
          >
            <CalendarDays className="w-5 h-5" />
            จองคิวรับรองเท้า
          </SelectableLink>
        </div>
      </div>

    </main>
  )
}
