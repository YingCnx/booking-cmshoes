import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import { SelectableLink } from '@/components/SelectableLink'
import { BeforeAfterSlider } from './BeforeAfterSlider'

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
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
          จองคิวซักรองเท้า
        </h1>
        <p className="mt-2 text-[#2ABFAB] font-semibold text-base">
          สะอาดเหมือนใหม่ โดยไม่ต้องออกจากบ้าน
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">⭐</span>
            <div className="font-extrabold text-gray-900 text-sm">4.9/5</div>
            <div className="text-xs text-gray-400 leading-tight text-center">จาก 1,200+ รีวิว</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">👟</span>
            <div className="font-extrabold text-gray-900 text-sm">10,000+ คู่</div>
            <div className="text-xs text-gray-400 leading-tight text-center">ซักแล้วมากกว่า</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🚚</span>
            <div className="font-extrabold text-gray-900 text-sm">รับ-ส่งฟรี</div>
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
                <span>📅</span> จองคิวรับรองเท้า
              </div>
              <div className="text-sm text-white/80 mt-0.5">เลือกวันและเวลา</div>
            </div>
            <span className="text-2xl">→</span>
          </div>
        </SelectableLink>
        <p className="text-center text-xs text-gray-400 mt-2">
          🛡 เร็วมาก ใช้เวลาไม่เกิน 1 นาที
        </p>
      </section>

      {/* ผลงานล่าสุด */}
      <section className="px-4 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">ผลงานล่าสุด</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Nike Air Force 1', desc: 'ขอบเหลืองกลับมาขาว' },
            { label: 'New Balance 530', desc: 'คราบฝังลึกหายเกลี้ยง' },
            { label: 'Adidas Stan Smith', desc: 'สีขาวสะอาดเหมือนใหม่' },
            { label: 'Vans Old Skool', desc: 'ผ้าใบดำขาวคืนความสดใหม่' },
          ].map((item, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
              {/* Placeholder รูป — เปลี่ยนเป็น <img> จริงได้เลย */}
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative">
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">ก่อนซัก</div>
                <div className="absolute top-2 right-2 bg-[#2ABFAB]/80 text-white text-[10px] px-2 py-0.5 rounded-full">หลังซัก</div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">👟</div>
              </div>
              <div className="px-3 py-2">
                <div className="font-semibold text-xs text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ขั้นตอน */}
      <section className="px-4 mt-8">
        <h2 className="font-bold text-gray-900 text-center mb-5">ขั้นตอนการใช้บริการ</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { step: 1, icon: '📅', label: 'จองคิว' },
            { step: 2, icon: '🚚', label: 'รับรองเท้า' },
            { step: 3, icon: '✨', label: 'ทำความสะอาด' },
            { step: 4, icon: '📦', label: 'ส่งคืน' },
          ].map(({ step, icon, label }, i) => (
            <div key={step} className="flex flex-col items-center gap-1.5 relative">
              {i < 3 && (
                <div className="absolute top-5 left-[60%] right-[-40%] h-0.5 bg-gray-200" />
              )}
              <div className="w-10 h-10 rounded-full bg-[#2ABFAB] text-white font-bold flex items-center justify-center text-lg z-10 relative">
                {icon}
              </div>
              <div className="text-xs text-gray-500 leading-tight">{label}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">
          🛡 ข้อมูลของคุณปลอดภัย 100%
        </p>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto">
          <SelectableLink
            href="/service/pickup"
            className="block w-full text-center bg-[#2ABFAB] text-white py-4 rounded-2xl font-bold text-base shadow-lg active:scale-[0.98] transition-transform"
          >
            📅 จองคิวรับรองเท้า
          </SelectableLink>
        </div>
      </div>

    </main>
  )
}
