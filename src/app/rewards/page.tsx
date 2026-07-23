import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import { Gift, History, MessageCircle, Sparkles, Ticket } from 'lucide-react'
import Link from 'next/link'
import { LinkPhoneForm } from '../status/LinkPhoneForm'

export const dynamic = 'force-dynamic'

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
      <main className="min-h-screen bg-slate-50">
        <RewardsHeader />
        <section className="mx-auto max-w-lg px-4 py-6">
          <div className="mb-5 rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="mb-2 text-sm font-semibold text-amber-700">ยังไม่พบบัญชีลูกค้า</div>
            <h2 className="text-xl font-bold text-slate-950">ผูก LINE กับเบอร์โทรก่อนเช็คแต้ม</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              กรุณากรอกเบอร์โทรที่เคยใช้บริการกับร้าน เพื่อเชื่อมบัญชีและดูแต้มสะสมของคุณ
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

  return (
    <main className="min-h-screen bg-slate-50 pb-10">
      <RewardsHeader />

      <div className="mx-auto max-w-lg space-y-4 px-4 py-5">
        <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-lg shadow-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">แต้มของฉัน</div>
              <h2 className="mt-2 text-lg font-bold">{customer.name}</h2>
              {customer.customer_code && (
                <div className="mt-0.5 font-mono text-xs text-slate-400">{customer.customer_code}</div>
              )}
            </div>
            <Sparkles className="h-7 w-7 text-cyan-200" aria-hidden="true" />
          </div>

          <div className="mt-6 flex items-end gap-2">
            <span className="text-6xl font-black leading-none tracking-tight">{currentPoints}</span>
            <span className="pb-2 text-lg font-bold text-slate-300">แต้ม</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="แต้มที่เคยได้รับ" value={account?.lifetime_earned_points ?? 0} />
            <Metric label="แต้มที่เคยใช้" value={account?.lifetime_redeemed_points ?? 0} />
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
          <div className="flex gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-slate-950">ต้องการแลกรางวัล?</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                ลูกค้าสามารถดูแต้มและของรางวัลได้จากหน้านี้ หากต้องการแลกแต้ม กรุณาแจ้งแอดมินในแชท LINE
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-950">ของรางวัล</h2>
            <span className="text-xs font-semibold text-slate-400">{rewards.length} รายการ</span>
          </div>

          {rewards.length === 0 ? (
            <EmptyCard title="ยังไม่มีของรางวัลที่เปิดใช้งาน" text="รอติดตามของรางวัลใหม่จากทางร้านได้เลย" />
          ) : (
            rewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} currentPoints={currentPoints} />
            ))
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-950">รางวัลที่เคยแลก</h2>
            <span className="text-xs font-semibold text-slate-400">ล่าสุด 5 รายการ</span>
          </div>

          {redemptions.length === 0 ? (
            <EmptyCard title="ยังไม่มีรายการแลกรางวัล" text="เมื่อแอดมินแลกรางวัลให้ รายการจะแสดงตรงนี้" />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              {redemptions.map((redemption) => (
                <div key={redemption.id} className="border-b border-slate-100 p-4 last:border-b-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-950">
                        {redemption.reward_catalog?.name_th ?? 'ของรางวัล'}
                      </div>
                      <div className="mt-1 font-mono text-xs text-slate-400">{redemption.redemption_code}</div>
                    </div>
                    <StatusBadge status={redemptionDisplayStatus(redemption)} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>ใช้ {redemption.points_cost} แต้ม</span>
                    <span>{formatDate(redemption.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-950">ประวัติแต้มล่าสุด</h2>
            <History className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>

          {transactions.length === 0 ? (
            <EmptyCard title="ยังไม่มีประวัติแต้ม" text="เมื่อได้รับหรือใช้แต้ม รายการจะแสดงตรงนี้" />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0">
                  <div>
                    <div className="text-sm font-bold text-slate-950">{sourceLabel(transaction.source_type)}</div>
                    <div className="mt-1 text-xs text-slate-400">{formatDateTime(transaction.created_at)}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">คงเหลือ {Number(transaction.balance_after ?? 0).toLocaleString('th-TH')} แต้ม</div>
                  </div>
                  <div className={`text-lg font-black ${transaction.points_delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {transaction.points_delta > 0 ? '+' : ''}
                    {transaction.points_delta}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/status"
          className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center text-sm font-bold text-slate-900 shadow-sm active:scale-[0.99]"
        >
          เช็คสถานะรองเท้า
        </Link>
      </div>
    </main>
  )
}

function RewardsHeader() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 pb-9 pt-14 text-white">
      <div className="absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="relative">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">CM Shoes Care</div>
        <h1 className="text-3xl font-black tracking-tight">Rewards</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">เช็คแต้มสะสมและดูของรางวัลที่แลกได้</p>
      </div>
    </header>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  )
}

function RewardCard({ reward, currentPoints }: { reward: RewardCatalogRow; currentPoints: number }) {
  const canRedeem = currentPoints >= reward.points_cost
  const remaining = Math.max(reward.points_cost - currentPoints, 0)

  return (
    <article className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 shrink-0 text-cyan-700" aria-hidden="true" />
            <h3 className="font-bold text-slate-950">{reward.name_th}</h3>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{reward.description}</p>
        </div>
        <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${canRedeem ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {canRedeem ? 'แลกได้' : `ขาด ${remaining}`}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip>{reward.points_cost} แต้ม</Chip>
        {reward.metadata.valid_days ? <Chip>อายุ {reward.metadata.valid_days} วัน</Chip> : null}
        {reward.metadata.max_value ? <Chip>สูงสุด {reward.metadata.max_value} บาท</Chip> : null}
        {reward.metadata.discount_amount ? <Chip>ลด {reward.metadata.discount_amount} บาท</Chip> : null}
        {reward.metadata.quantity ? <Chip>จำนวน {reward.metadata.quantity} ชิ้น</Chip> : null}
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-500">
        <div className="font-semibold text-slate-700">{rewardTypeLabel(reward.metadata.reward_type)}</div>
        <div>หากต้องการแลก กรุณาแจ้งแอดมินในแชท LINE</div>
      </div>
    </article>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      {children}
    </span>
  )
}

function EmptyCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center">
      <Gift className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" />
      <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = redemptionStatusLabel(status)
  const className = status === 'used'
    ? 'bg-slate-100 text-slate-600'
    : status === 'cancelled' || status === 'refunded'
      ? 'bg-rose-50 text-rose-700'
      : 'bg-emerald-50 text-emerald-700'

  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${className}`}>
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
