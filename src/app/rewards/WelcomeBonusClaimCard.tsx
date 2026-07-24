'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, Gift, Loader2, Sparkles } from 'lucide-react'

type WelcomeBonusClaimCardProps = {
  initialClaimed: boolean
  initialBalance: number
  points: number
}

type ClaimResponse = {
  success?: boolean
  error?: string
  claimed?: boolean
  already_claimed?: boolean
  points_awarded?: number
  balance_after?: number
}

export function WelcomeBonusClaimCard({
  initialClaimed,
  initialBalance,
  points,
}: WelcomeBonusClaimCardProps) {
  const router = useRouter()
  const [claimed, setClaimed] = useState(initialClaimed)
  const [balance, setBalance] = useState(initialBalance)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleClaim = async () => {
    if (claimed || loading) return

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/rewards/welcome-bonus/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = (await response.json()) as ClaimResponse

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถรับแต้มได้')
      }

      setClaimed(true)
      setBalance(Number(data.balance_after ?? balance))
      setMessage(data.already_claimed ? 'คุณรับแต้มฟรีรายการนี้แล้ว' : `รับแต้มฟรี +${points} แต้มเรียบร้อย`)
      router.refresh()
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : 'ไม่สามารถรับแต้มได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`mt-5 rounded-2xl p-4 ring-1 ${claimed ? 'bg-emerald-50 ring-emerald-100' : 'bg-amber-50 ring-amber-100'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${claimed ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-amber-600'}`}>
          {claimed ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-black ${claimed ? 'text-emerald-900' : 'text-amber-900'}`}>
            {claimed ? 'คุณรับแต้มฟรีแล้ว' : `รับแต้มฟรี ${points} แต้ม`}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {claimed
              ? `ยอดล่าสุดของคุณคือ ${balance.toLocaleString('th-TH')} แต้ม`
              : 'สำหรับลูกค้าที่ผูกบัญชี LINE แล้ว รับได้ 1 ครั้งต่อบัญชี'}
          </p>

          {message ? <div className="mt-2 text-xs font-bold text-emerald-700">{message}</div> : null}
          {error ? <div className="mt-2 text-xs font-bold text-rose-600">{error}</div> : null}

          <button
            type="button"
            onClick={handleClaim}
            disabled={claimed || loading}
            className={`mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition active:scale-[0.99] disabled:cursor-not-allowed ${
              claimed
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-500 text-white shadow-lg shadow-amber-900/10'
            }`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
            {claimed ? 'รับแล้ว' : 'กดรับแต้มฟรี'}
          </button>
        </div>
      </div>
    </div>
  )
}
