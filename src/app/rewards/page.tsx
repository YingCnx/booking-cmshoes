import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gift,
  History,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Ticket,
  WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { LinkPhoneForm } from '../status/LinkPhoneForm'

export const dynamic = 'force-dynamic'

const GOOGLE_REVIEW_URL = 'https://g.page/r/CUaWHRM3krtXEBM/review'

type RewardMetadata = {
  reward_type?: string
  image_url?: string
  valid_days?: number
  max_value?: number
  discount_amount?: number
  min_order_value?: number
  free_pairs?: number
  quantity?: number
  excludes?: string[]
  cash_redeemable?: boolean
}

type RewardCatalogRow = {
  id: number
  code: string
  name_th: string
  description: string | null
  points_cost: number
  metadata: RewardMetadata
}

type LedgerRow = {
  id: number
  points_delta: number
  balance_after: number
  source_type: string
  note: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}

type RedemptionRow = {
  id: number
  redemption_code: string
  status: string
  points_cost: number
  created_at: string
  used_at: string | null
  cancelled_at: string | null
  metadata: {
    expires_at?: string
  } | null
  reward_catalog: {
    name_th: string
  } | null
}

export default async function RewardsPage() {
  const session = await getLineSession()
  if (!session) redirect('/liff?next=/rewards')

  const supabase = await createClient()
  const rewardsDb = createAdminClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, phone, customer_code, branch_id')
    .eq('line_user_id', session.lineUserId)
    .maybeSingle()

  if (!customer) {
    return (
      <main className="min-h-screen bg-[#F1FAFA] text-slate-950">
        <RewardsHeader sessionName={session.displayName} compact />
        <section className="mx-auto max-w-lg px-4 py-8">
          <div className="mb-5 rounded-[28px] border border-amber-200 bg-white p-6 shadow-sm">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              ยังไม่พบบัญชีลูกค้า
            </div>
            <h2 className="text-2xl font-black text-slate-950">ผูก LINE กับเบอร์โทรก่อนเช็คแต้ม</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              กรุณากรอกเบอร์โทรที่เคยใช้บริการกับร้าน เพื่อเชื่อมบัญชีและดูแต้มสะสม ของรางวัล และประวัติแต้มของคุณ
            </p>
          </div>
          <LinkPhoneForm displayName={session.displayName} />
        </section>
      </main>
    )
  }

  const [
    accountResult,
    latestLedgerResult,
    rewardsResult,
    ledgerResult,
    redemptionResult,
  ] = await Promise.all([
    rewardsDb
      .from('reward_accounts')
      .select('id, current_points, lifetime_earned_points, lifetime_redeemed_points')
      .eq('customer_id', customer.id)
      .maybeSingle(),
    rewardsDb
      .from('reward_point_ledger')
      .select('id, balance_after, created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle(),
    rewardsDb
      .from('reward_catalog')
      .select('id, code, name_th, description, points_cost, metadata')
      .eq('is_active', true)
      .order('points_cost', { ascending: true }),
    rewardsDb
      .from('reward_point_ledger')
      .select('id, points_delta, balance_after, source_type, note, created_at, metadata')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(6),
    rewardsDb
      .from('reward_redemptions')
      .select(`
        id,
        redemption_code,
        status,
        points_cost,
        created_at,
        used_at,
        cancelled_at,
        metadata,
        reward_catalog:reward_catalog_id ( name_th )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const account = accountResult.data
  const rewards = (rewardsResult.data ?? []) as RewardCatalogRow[]
  const transactions = (ledgerResult.data ?? []) as LedgerRow[]
  const redemptions = (redemptionResult.data ?? []) as unknown as RedemptionRow[]
  const accountPoints = Number(account?.current_points ?? 0)
  const ledgerBalance = latestLedgerResult.data?.balance_after
  const currentPoints = ledgerBalance === null || ledgerBalance === undefined ? accountPoints : Number(ledgerBalance)
  const lifetimeEarned = Number(account?.lifetime_earned_points ?? 0)
  const lifetimeRedeemed = Number(account?.lifetime_redeemed_points ?? 0)
  const nextReward = rewards.find((reward) => reward.points_cost > currentPoints)
  const redeemableCount = rewards.filter((reward) => reward.points_cost <= currentPoints).length
  const featuredRewards = rewards.slice(0, 4)

  return (
    <main className="min-h-screen bg-[#F7FBFB] text-slate-950">
      <RewardsHeader sessionName={customer.name} />

      <section className="relative overflow-hidden border-b border-cyan-100 bg-gradient-to-br from-[#E9FBFA] via-white to-[#D5F3F1]">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-80 md:block">
          <img src="/oncloud-after.jpg" alt="" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#E9FBFA] via-white/70 to-white/10" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1fr_360px] md:px-8 md:py-16">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-teal-800 shadow-sm ring-1 ring-teal-100">
              <Gift className="h-4 w-4" aria-hidden="true" />
              คะแนนสะสมของคุณ
            </div>
            <p className="mt-4 max-w-xl text-lg font-semibold leading-8 text-slate-700">
              สะสมง่าย แลกของรางวัลได้หลายแบบ ใช้คู่กับบัญชี LINE ของคุณ
            </p>

            <div className="mt-7 grid max-w-xl gap-3 rounded-[22px] bg-white/80 p-4 shadow-sm ring-1 ring-cyan-100 sm:grid-cols-2">
              <MiniRule icon={<ShoppingBag className="h-7 w-7" />} title="1 คู่ = 1 แต้ม" text="ทุกการใช้บริการที่ร้านยืนยัน" />
              <MiniRule icon={<Smartphone className="h-7 w-7" />} title="ผูกบัญชี LINE" text="สะสมอัตโนมัติทุกครั้ง" />
            </div>
          </div>

          <div className="rounded-[28px] bg-white/95 p-6 shadow-xl shadow-cyan-900/10 ring-1 ring-cyan-100 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-black text-teal-900">คะแนนของคุณ</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-7xl font-black leading-none text-teal-700">{currentPoints.toLocaleString('th-TH')}</span>
                  <span className="pb-2 text-lg font-black text-teal-900">แต้ม</span>
                </div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-4xl font-black text-teal-600 ring-8 ring-teal-50">
                P
              </div>
            </div>

            {nextReward ? (
              <div className="mt-6 rounded-2xl bg-teal-50 p-4 text-sm font-bold text-teal-900">
                อีก {Math.max(nextReward.points_cost - currentPoints, 0).toLocaleString('th-TH')} แต้ม แลก {nextReward.name_th}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{ width: `${Math.min((currentPoints / nextReward.points_cost) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ) : rewards.length > 0 ? (
              <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
                แต้มของคุณพร้อมแลกรางวัลได้หลายรายการแล้ว
              </div>
            ) : null}

            <a href="#rewards" className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-teal-700 px-5 py-4 text-base font-black text-white shadow-lg shadow-teal-900/15 active:scale-[0.99]">
              <Gift className="h-5 w-5" aria-hidden="true" />
              ดูของรางวัล
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-5 py-10 md:px-8">
        <section id="rewards">
          <SectionHeader icon={<Gift className="h-6 w-6" />} title="ของรางวัลแนะนำ" action={`${rewards.length} รายการ`} />
          {rewards.length === 0 ? (
            <EmptyCard title="ยังไม่มีของรางวัลที่เปิดใช้งาน" text="รอติดตามของรางวัลใหม่จากทางร้านได้เลย" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featuredRewards.map((reward, index) => (
                <RewardCard key={reward.id} reward={reward} currentPoints={currentPoints} image={rewardImage(reward, index)} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeader icon={<History className="h-6 w-6" />} title="ประวัติคะแนน" action="ล่าสุด" />
          {transactions.length === 0 ? (
            <EmptyCard title="ยังไม่มีประวัติแต้ม" text="เมื่อได้รับหรือใช้แต้ม รายการจะแสดงตรงนี้" />
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-cyan-100 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black text-slate-500">
                    <tr>
                      <th className="px-5 py-4">วันที่</th>
                      <th className="px-5 py-4">รายการ</th>
                      <th className="px-5 py-4 text-right">คะแนน</th>
                      <th className="px-5 py-4 text-right">ยอดคงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-5 py-4 text-slate-500">{formatDateTime(transaction.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                              {transaction.points_delta > 0 ? <ShoppingBag className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-950">{sourceLabel(transaction.source_type)}</div>
                              {transaction.note ? <div className="mt-1 text-xs text-slate-400">{transaction.note}</div> : null}
                            </div>
                          </div>
                        </td>
                        <td className={`px-5 py-4 text-right font-black ${transaction.points_delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {transaction.points_delta > 0 ? '+' : ''}
                          {transaction.points_delta.toLocaleString('th-TH')} แต้ม
                        </td>
                        <td className="px-5 py-4 text-right font-black text-teal-950">{Number(transaction.balance_after ?? 0).toLocaleString('th-TH')} แต้ม</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-cyan-100 bg-white p-6 shadow-sm">
          <div className="mb-6 inline-flex rounded-t-2xl border border-cyan-100 bg-white px-5 py-2 text-sm font-black text-teal-900 shadow-sm">
            เกี่ยวกับคะแนนสะสม
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            <InfoRule icon={<ShoppingBag />} title="1 คู่ = 1 แต้ม" text="รับ 1 แต้มต่อรองเท้า 1 คู่ เมื่อร้านยืนยันการสะสม" />
            <InfoRule icon={<CheckCircle2 />} title="สะสมอัตโนมัติ" text="หลังงานส่งมอบสำเร็จและแอดมินยืนยัน" />
            <InfoRule icon={<Smartphone />} title="เช็คคะแนนได้เอง" text="ดูได้ตลอด 24 ชั่วโมงผ่าน LINE OA" />
            <InfoRule icon={<Gift />} title="แลกรางวัลง่าย" text="แจ้งแอดมินใน LINE เพื่อทำรายการให้" />
          </div>
        </section>

        <section className="grid gap-4 rounded-[28px] bg-gradient-to-r from-teal-100 to-cyan-50 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-black text-teal-950">อยากได้แต้มรีวิวเพิ่ม?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              รีวิว Google Maps แล้วแจ้งแอดมินใน LINE เพื่อรับ +3 แต้ม ใช้ได้ 1 ครั้งต่อบัญชี
            </p>
          </div>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-teal-800 shadow-sm ring-1 ring-teal-100"
          >
            รีวิว Google
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>

        <section>
          <SectionHeader icon={<Ticket className="h-6 w-6" />} title="รางวัลของฉัน" action="ล่าสุด 5 รายการ" />
          {redemptions.length === 0 ? (
            <EmptyCard title="ยังไม่มีรายการแลกรางวัล" text="เมื่อแอดมินแลกรางวัลให้ รายการจะแสดงตรงนี้" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {redemptions.map((redemption) => (
                <div key={redemption.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-black text-slate-950">{redemption.reward_catalog?.name_th ?? 'ของรางวัล'}</div>
                      <div className="mt-1 text-xs text-slate-400">แลกเมื่อ {formatDate(redemption.created_at)}</div>
                    </div>
                    <StatusBadge status={redemptionDisplayStatus(redemption)} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-500">ใช้ {redemption.points_cost.toLocaleString('th-TH')} แต้ม</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[28px] bg-teal-800 px-6 py-7 text-white">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="text-2xl font-black">ร้านซักเกิบแอนด์สปา</div>
              <p className="mt-2 text-sm text-teal-100">ทุกการใช้บริการ มีคุณค่ามากกว่าที่เคย</p>
            </div>
            <div className="flex gap-3">
              <Link href="/status" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-teal-900">
                <Clock3 className="h-4 w-4" />
                เช็คสถานะ
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function RewardsHeader({ sessionName, compact = false }: { sessionName?: string | null; compact?: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-cyan-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <div className="min-w-0">
          <div className="text-xl font-black leading-tight text-teal-900 md:text-2xl">ซักเกิบแอนด์สปา</div>
          <div className="text-xs font-semibold text-teal-500">Shoe Spa & Cleaning</div>
        </div>

        <div className="inline-flex max-w-[180px] items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-black text-teal-900">
          <MessageCircle className="h-4 w-4 shrink-0 text-green-500" />
          <span className="truncate">{sessionName || 'บัญชีของฉัน'}</span>
        </div>
      </div>
    </header>
  )
}

function SectionHeader({ icon, title, action }: { icon: ReactNode; title: string; action?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-2xl font-black text-teal-950">
        <span className="text-teal-600">{icon}</span>
        {title}
      </h2>
      {action ? <span className="text-sm font-black text-slate-500">{action}</span> : null}
    </div>
  )
}

function MiniRule({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-teal-700">{icon}</div>
      <div>
        <div className="font-black text-teal-950">{title}</div>
        <div className="text-sm font-semibold text-slate-500">{text}</div>
      </div>
    </div>
  )
}

function RewardCard({ reward, currentPoints, image }: { reward: RewardCatalogRow; currentPoints: number; image: string }) {
  const canRedeem = currentPoints >= reward.points_cost
  const remaining = Math.max(reward.points_cost - currentPoints, 0)

  return (
    <article className="grid overflow-hidden rounded-[22px] border border-cyan-100 bg-white shadow-sm sm:grid-cols-[120px_1fr] md:block">
      <div className="h-full min-h-[140px] bg-cyan-50">
        <img src={image} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex min-h-[170px] flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-black leading-snug text-slate-950">{reward.name_th}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${canRedeem ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {canRedeem ? 'แลกได้' : `ขาด ${remaining.toLocaleString('th-TH')}`}
          </span>
        </div>
        <div className="mt-2 text-2xl font-black text-teal-600">{reward.points_cost.toLocaleString('th-TH')} <span className="text-sm">แต้ม</span></div>
        {reward.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{reward.description}</p> : null}
        <div className="mt-auto pt-4">
          <div className="inline-flex items-center gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-xs font-black text-teal-700">
            <Gift className="h-4 w-4" />
            แจ้งแอดมินเพื่อแลก
          </div>
        </div>
      </div>
    </article>
  )
}

function InfoRule({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="text-center md:border-r md:border-cyan-100 md:last:border-r-0">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-teal-700 [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
      <h3 className="mt-3 font-black text-teal-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-[220px] text-sm leading-6 text-slate-500">{text}</p>
    </div>
  )
}

function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-cyan-200 bg-white p-8 text-center">
      <Gift className="mx-auto h-8 w-8 text-cyan-300" aria-hidden="true" />
      <h3 className="mt-3 font-black text-slate-900">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = redemptionStatusLabel(status)
  const className = status === 'used'
    ? 'bg-slate-100 text-slate-600'
    : status === 'cancelled' || status === 'refunded'
      ? 'bg-rose-50 text-rose-700'
      : status === 'expired'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-emerald-50 text-emerald-700'

  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${className}`}>{label}</span>
}

function sourceLabel(sourceType: string) {
  const labels: Record<string, string> = {
    service_delivery: 'ใช้บริการซักรองเท้า',
    google_review: 'ได้รับแต้มรีวิว Google',
    facebook_review: 'ได้รับแต้มรีวิว Facebook',
    reward_redeem: 'แลกรางวัล',
    reward_use: 'ใช้รางวัล',
    reward_cancel: 'ยกเลิกรางวัล',
    reward_refund: 'คืนแต้ม',
    manual_adjust: 'ปรับแต้มโดยแอดมิน',
    system_adjust: 'ปรับแต้มโดยระบบ',
  }

  return labels[sourceType] ?? 'รายการแต้ม'
}

function redemptionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    requested: 'พร้อมใช้',
    ready_to_use: 'พร้อมใช้',
    used: 'ใช้แล้ว',
    cancelled: 'ยกเลิกแล้ว',
    refunded: 'คืนแต้มแล้ว',
    expired: 'หมดอายุ',
  }

  return labels[status] ?? status
}

function redemptionDisplayStatus(redemption: RedemptionRow) {
  if (redemption.status !== 'requested') return redemption.status
  const expiresAt = redemption.metadata?.expires_at ? new Date(redemption.metadata.expires_at) : null
  if (expiresAt && expiresAt.getTime() < Date.now()) return 'expired'
  return 'ready_to_use'
}

function rewardImage(reward: RewardCatalogRow, index: number) {
  if (reward.metadata.image_url) return reward.metadata.image_url

  const imagesByCode: Record<string, string> = {
    DISCOUNT_50_BAHT: '/rewards/discount-50-baht.jpg',
    FREE_SNEAKER_CLEANING_1_PAIR: '/rewards/free-sneaker-cleaning.jpg',
    SHOE_BAG: '/rewards/shoe-bag.jpg',
  }

  if (imagesByCode[reward.code]) return imagesByCode[reward.code]

  const images = ['/oncloud-after.jpg', '/after.jpg', '/birken-after.jpg', '/speedcat-after.jpg']
  return images[index % images.length]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
