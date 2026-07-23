import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import {
  Award,
  CheckCircle2,
  Gift,
  History,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Ticket,
  Trophy,
  WalletCards,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { LinkPhoneForm } from '../status/LinkPhoneForm'

export const dynamic = 'force-dynamic'

const GOOGLE_REVIEW_URL = 'https://g.page/r/CUaWHRM3krtXEBM/review'

type RewardMetadata = {
  reward_type?: string
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
      <main className="min-h-screen bg-[#F4F7FB]">
        <RewardsHeader />
        <section className="mx-auto max-w-lg px-4 py-6">
          <div className="mb-5 rounded-[28px] border border-amber-200 bg-white p-5 shadow-sm">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              ยังไม่พบบัญชีลูกค้า
            </div>
            <h2 className="text-xl font-black text-slate-950">ผูก LINE กับเบอร์โทรก่อนเช็คแต้ม</h2>
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
      .limit(8),
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
  const currentPoints = ledgerBalance === null || ledgerBalance === undefined
    ? accountPoints
    : Number(ledgerBalance)
  const lifetimeEarned = Number(account?.lifetime_earned_points ?? 0)
  const lifetimeRedeemed = Number(account?.lifetime_redeemed_points ?? 0)
  const nextReward = rewards.find((reward) => reward.points_cost > currentPoints)
  const redeemableCount = rewards.filter((reward) => reward.points_cost <= currentPoints).length

  return (
    <main className="min-h-screen bg-[#F4F7FB] pb-10 text-slate-950">
      <RewardsHeader />

      <div className="mx-auto max-w-lg space-y-5 px-4 py-5">
        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="bg-slate-950 px-5 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-100 ring-1 ring-cyan-200/20">
                  <WalletCards className="h-3.5 w-3.5" aria-hidden="true" />
                  แต้มสะสมของฉัน
                </div>
                <h2 className="mt-3 truncate text-xl font-black">{customer.name}</h2>
                {customer.customer_code && (
                  <div className="mt-1 font-mono text-xs text-slate-400">{customer.customer_code}</div>
                )}
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <Sparkles className="h-6 w-6 text-cyan-200" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-7 flex items-end gap-2">
              <span className="text-7xl font-black leading-none tracking-tight">{currentPoints.toLocaleString('th-TH')}</span>
              <span className="pb-2 text-lg font-bold text-slate-300">แต้ม</span>
            </div>

            {nextReward ? (
              <div className="mt-5 rounded-2xl bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-200">
                  <span>อีก {Math.max(nextReward.points_cost - currentPoints, 0).toLocaleString('th-TH')} แต้ม แลก {nextReward.name_th}</span>
                  <span>{Math.min(Math.round((currentPoints / nextReward.points_cost) * 100), 100)}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-cyan-300"
                    style={{ width: `${Math.min((currentPoints / nextReward.points_cost) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ) : rewards.length > 0 ? (
              <div className="mt-5 rounded-2xl bg-emerald-400/15 p-4 text-sm font-bold text-emerald-100 ring-1 ring-emerald-200/20">
                แต้มของคุณพร้อมแลกรางวัลได้หลายรายการแล้ว
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white">
            <Metric label="ได้ทั้งหมด" value={lifetimeEarned} />
            <Metric label="ใช้ไปแล้ว" value={lifetimeRedeemed} />
            <Metric label="แลกได้" value={redeemableCount} />
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">รับแต้มยังไง?</h2>
              <p className="mt-1 text-sm text-slate-500">สะสมง่าย ใช้ได้จริงกับบริการของร้าน</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <Trophy className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-3">
            <EarnRule icon={<CheckCircle2 className="h-5 w-5" />} title="รับรองเท้าสำเร็จ" value="1 คู่ = 1 แต้ม" text="เมื่อคิวถูกปิดงานและร้านยืนยันว่าสะสมแต้มได้" />
            <EarnRule
              icon={<Star className="h-5 w-5" />}
              title="รีวิว Google Maps"
              value="+3 แต้ม"
              text="รับได้ 1 ครั้งต่อบัญชี หลังรีวิวแล้วแจ้งแอดมินใน LINE เพื่อยืนยันแต้ม"
              actionHref={GOOGLE_REVIEW_URL}
              actionLabel="รีวิวร้านบน Google"
            />
            <EarnRule icon={<ShieldCheck className="h-5 w-5" />} title="แลกรางวัลผ่านแอดมิน" value="หักตามจริง" text="ลูกค้าแจ้งในแชท LINE แอดมินเป็นผู้ทำรายการให้" />
          </div>
        </section>

        <section className="rounded-[28px] border border-cyan-100 bg-cyan-50 p-5">
          <div className="flex gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" aria-hidden="true" />
            <div>
              <h3 className="font-black text-slate-950">ต้องการแลกรางวัล?</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                ลูกค้าดูแต้มและเลือกของรางวัลจากหน้านี้ได้ จากนั้นแจ้งแอดมินในแชท LINE เพื่อให้แอดมินกดแลกรางวัลและใช้สิทธิ์ให้
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-lg font-black text-slate-950">ของรางวัล</h2>
              <p className="text-sm text-slate-500">ดูว่าแต้มของคุณแลกอะไรได้บ้าง</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">{rewards.length} รายการ</span>
          </div>

          {rewards.length === 0 ? (
            <EmptyCard title="ยังไม่มีของรางวัลที่เปิดใช้งาน" text="รอติดตามของรางวัลใหม่จากทางร้านได้เลย" />
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} currentPoints={currentPoints} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-slate-950">รางวัลของฉัน</h2>
            <span className="text-xs font-bold text-slate-400">ล่าสุด 5 รายการ</span>
          </div>

          {redemptions.length === 0 ? (
            <EmptyCard title="ยังไม่มีรายการแลกรางวัล" text="เมื่อแอดมินแลกรางวัลให้ รายการจะแสดงตรงนี้" />
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              {redemptions.map((redemption) => (
                <div key={redemption.id} className="border-b border-slate-100 p-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-slate-950">
                        {redemption.reward_catalog?.name_th ?? 'ของรางวัล'}
                      </div>
                      <div className="mt-1 font-mono text-xs text-slate-400">{redemption.redemption_code}</div>
                    </div>
                    <StatusBadge status={redemptionDisplayStatus(redemption)} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>ใช้ {redemption.points_cost.toLocaleString('th-TH')} แต้ม</span>
                    <span>{formatDate(redemption.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-lg font-black text-slate-950">ประวัติแต้มล่าสุด</h2>
              <p className="text-sm text-slate-500">ยอดคงเหลือหลังแต่ละรายการ</p>
            </div>
            <History className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>

          {transactions.length === 0 ? (
            <EmptyCard title="ยังไม่มีประวัติแต้ม" text="เมื่อได้รับหรือใช้แต้ม รายการจะแสดงตรงนี้" />
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-950">{sourceLabel(transaction.source_type)}</div>
                    <div className="mt-1 text-xs text-slate-400">{formatDateTime(transaction.created_at)}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">คงเหลือ {Number(transaction.balance_after ?? 0).toLocaleString('th-TH')} แต้ม</div>
                  </div>
                  <div className={`shrink-0 rounded-2xl px-3 py-2 text-lg font-black ${transaction.points_delta > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {transaction.points_delta > 0 ? '+' : ''}
                    {transaction.points_delta.toLocaleString('th-TH')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/status"
          className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-black text-slate-900 shadow-sm active:scale-[0.99]"
        >
          เช็คสถานะรองเท้า
        </Link>
      </div>
    </main>
  )
}

function RewardsHeader() {
  return (
    <header className="bg-slate-950 px-6 pb-8 pt-14 text-white">
      <div className="mx-auto max-w-lg">
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">CM Shoes Care</div>
        <h1 className="text-3xl font-black tracking-tight">Rewards</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">เช็คแต้มสะสม ดูวิธีรับแต้ม และเลือกของรางวัลที่อยากแลก</p>
      </div>
    </header>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-4 text-center">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black text-slate-950">{Number(value || 0).toLocaleString('th-TH')}</div>
    </div>
  )
}

function EarnRule({
  icon,
  title,
  value,
  text,
  actionHref,
  actionLabel,
}: {
  icon: ReactNode
  title: string
  value: string
  text: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-cyan-700 ring-1 ring-slate-200">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-slate-950">{title}</h3>
          <span className="shrink-0 rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800">{value}</span>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
        {actionHref && actionLabel ? (
          <a
            href={actionHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-cyan-700 ring-1 ring-cyan-100 active:scale-[0.99]"
          >
            {actionLabel}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </div>
  )
}

function RewardCard({ reward, currentPoints }: { reward: RewardCatalogRow; currentPoints: number }) {
  const canRedeem = currentPoints >= reward.points_cost
  const remaining = Math.max(reward.points_cost - currentPoints, 0)
  const progress = reward.points_cost > 0 ? Math.min((currentPoints / reward.points_cost) * 100, 100) : 100

  return (
    <article className={`overflow-hidden rounded-[24px] border bg-white shadow-sm ${canRedeem ? 'border-emerald-200' : 'border-slate-200'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${canRedeem ? 'bg-emerald-50 text-emerald-700' : 'bg-cyan-50 text-cyan-700'}`}>
                <Ticket className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-black text-slate-950">{reward.name_th}</h3>
                <div className="mt-0.5 text-xs font-bold text-slate-400">{rewardTypeLabel(reward.metadata.reward_type)}</div>
              </div>
            </div>
            {reward.description && (
              <p className="mt-3 text-sm leading-6 text-slate-600">{reward.description}</p>
            )}
          </div>
          <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${canRedeem ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {canRedeem ? 'แลกได้' : `ขาด ${remaining.toLocaleString('th-TH')}`}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
            <span>{currentPoints.toLocaleString('th-TH')} / {reward.points_cost.toLocaleString('th-TH')} แต้ม</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full ${canRedeem ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip strong>{reward.points_cost.toLocaleString('th-TH')} แต้ม</Chip>
          {reward.metadata.valid_days ? <Chip>อายุ {reward.metadata.valid_days} วัน</Chip> : null}
          {reward.metadata.max_value ? <Chip>สูงสุด {reward.metadata.max_value} บาท</Chip> : null}
          {reward.metadata.discount_amount ? <Chip>ลด {reward.metadata.discount_amount} บาท</Chip> : null}
          {reward.metadata.quantity ? <Chip>{reward.metadata.quantity} ชิ้น</Chip> : null}
        </div>
      </div>

      <div className={`border-t px-4 py-3 text-xs leading-6 ${canRedeem ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-slate-100 bg-white text-slate-500'}`}>
        {canRedeem ? 'แต้มถึงแล้ว แจ้งแอดมินในแชท LINE เพื่อแลกรางวัลได้เลย' : 'สะสมเพิ่มอีกนิด แล้วกลับมาแลกรางวัลนี้ได้'}
      </div>
    </article>
  )
}

function Chip({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${strong ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>
      {children}
    </span>
  )
}

function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-6 text-center">
      <Gift className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
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

  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${className}`}>
      {label}
    </span>
  )
}

function rewardTypeLabel(type?: string) {
  if (type === 'fixed_discount') return 'ส่วนลด'
  if (type === 'standard_sneaker_cleaning') return 'ซักรองเท้าฟรี'
  if (type === 'physical_gift') return 'ของแถม'
  return 'ของรางวัล'
}

function sourceLabel(sourceType: string) {
  const labels: Record<string, string> = {
    service_delivery: 'ได้รับแต้มจากงานบริการ',
    google_review: 'ได้รับแต้มรีวิว Google',
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