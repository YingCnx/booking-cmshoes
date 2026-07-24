import { NextResponse } from 'next/server'
import { getLineSession } from '@/lib/line-session'
import { createAdminClient } from '@/utils/supabase/admin'

type ClaimResult = {
  success?: boolean
  error?: string
  claimed?: boolean
  already_claimed?: boolean
  points_awarded?: number
  balance_before?: number
  balance_after?: number
  campaign_code?: string
  ledger_id?: number | null
  claim_id?: number
}

export async function POST() {
  const session = await getLineSession()
  if (!session) {
    return NextResponse.json({ error: 'กรุณา login LINE ใหม่' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('claim_welcome_bonus_1_point', {
    p_line_user_id: session.lineUserId,
  })

  if (error) {
    return NextResponse.json({
      error: 'ไม่สามารถรับแต้มได้ กรุณาลองใหม่',
      detail: error.message,
    }, { status: 500 })
  }

  const result = data as ClaimResult
  if (!result?.success) {
    return NextResponse.json({
      error: result?.error || 'ไม่สามารถรับแต้มได้',
      ...result,
    }, { status: 400 })
  }

  return NextResponse.json(result)
}
