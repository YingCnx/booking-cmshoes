import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import { SelectableLink } from '@/components/SelectableLink'

export const revalidate = 60   // cache 1 นาที

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
  <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

    {/* Hero */}
    <section className="relative overflow-hidden bg-gradient-to-br from-[#102A56] via-[#163A6B] to-[#102A56] px-6 pt-12 pb-10">

      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="relative max-w-lg mx-auto">

        <div className="text-xs uppercase tracking-[0.2em] text-slate-300 font-semibold">
          {branch.name}
        </div>

        <h1 className="mt-3 text-3xl font-bold text-white leading-tight">
          จองคิวซักรองเท้า
        </h1>

        <p className="mt-2 text-slate-300">
          รับ-ส่งฟรีถึงบ้าน สะดวก ไม่ต้องเดินทาง
        </p>

        <div className="flex flex-wrap gap-2 mt-5">
          <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white">
            ✓ รับ-ส่งฟรี
          </span>

          <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white">
            ✓ รีวิว 4.9/5
          </span>

          <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white">
            ✓ ซักแล้ว 10,000+ คู่
          </span>
        </div>

      </div>
    </section>

    {/* Steps */}
    <section className="max-w-lg mx-auto px-4 -mt-5 relative z-10">

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">

        <div className="text-sm font-semibold text-slate-800 mb-4">
          ขั้นตอนการใช้บริการ
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">

          <div>
            <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 font-bold flex items-center justify-center mx-auto">
              1
            </div>
            <div className="text-xs mt-2 text-slate-600">
              จองคิว
            </div>
          </div>

          <div>
            <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 font-bold flex items-center justify-center mx-auto">
              2
            </div>
            <div className="text-xs mt-2 text-slate-600">
              เข้ารับรองเท้า
            </div>
          </div>

          <div>
            <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 font-bold flex items-center justify-center mx-auto">
              3
            </div>
            <div className="text-xs mt-2 text-slate-600">
              ทำความสะอาด
            </div>
          </div>

          <div>
            <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-700 font-bold flex items-center justify-center mx-auto">
              4
            </div>
            <div className="text-xs mt-2 text-slate-600">
              จัดส่งคืน
            </div>
          </div>

        </div>

      </div>
    </section>

    {/* Services */}
    <section className="max-w-lg mx-auto px-4 py-5">

      <SelectableLink
        href="/service/pickup"
        className="group block bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
      >

        <div className="flex items-center justify-between">

          <div className="flex gap-4 flex-1 min-w-0">

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
              
            </div>

            <div className="min-w-0">

              <h2 className="font-bold text-slate-900 text-lg">
                นัดหมายรับรองเท้า
              </h2>

              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                เลือกวันและเวลาที่สะดวกให้พนักงานเข้ารับถึงบ้าน
              </p>

              <div className="mt-3 inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold">
                ✓ บริการรับ-ส่งฟรี
              </div>

            </div>

          </div>

          <div className="w-11 h-11 rounded-full bg-[#2ABFAB] flex items-center justify-center text-white flex-shrink-0 ml-3">
            →
          </div>

        </div>

      </SelectableLink>

    </section>

    {/* Trust Section */}
    <section className="max-w-lg mx-auto px-4 pb-24">

      <div className="bg-slate-50 rounded-3xl p-5">

        <div className="font-semibold text-slate-900 mb-3">
          ทำไมลูกค้าถึงเลือกเรา
        </div>

        <div className="space-y-3 text-sm text-slate-600">

          <div>✓ รับ-ส่งฟรีทั่วเชียงใหม่</div>

          <div>✓ ดูแลรองเท้าทุกประเภท</div>

          <div>✓ ทีมงานมีประสบการณ์</div>

          <div>✓ สะดวก ไม่ต้องออกจากบ้าน</div>

        </div>

      </div>

    </section>

    {/* Sticky CTA */}
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-slate-200 p-4">

      <div className="max-w-lg mx-auto">

        <SelectableLink
          href="/service/pickup"
          className="block w-full text-center bg-[#2ABFAB] text-white py-4 rounded-2xl font-semibold shadow-lg"
        >
          จองคิวรับรองเท้า
        </SelectableLink>

      </div>

    </div>

  </main>
)
}