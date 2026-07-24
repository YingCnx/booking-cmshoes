import { NextResponse } from 'next/server'
import { getLineSession } from '@/lib/line-session'
import { createAdminClient } from '@/utils/supabase/admin'

const CAMPAIGN_CODE = 'WELCOME_1_POINT_2026'

export async function GET() {
  const session = await getLineSession()
  if (!session) {
    return NextResponse.json({ error: 'กรุณา login LINE ใหม่' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, name, customer_code')
    .eq('line_user_id', session.lineUserId)
    .maybeSingle()

  if (customerError) {
    return NextResponse.json({ error: 'ไม่สามารถตรวจสอบลูกค้าได้' }, { status: 500 })
  }

  if (!customer) {
    return NextResponse.json({
      eligible: false,
      claimed: false,
      points: 1,
      campaign_code: CAMPAIGN_CODE,
      error: 'ไม่พบลูกค้า กรุณาผูกบัญชีก่อนรับแต้ม',
    })
  }

  const { data: claim, error: claimError } = await supabase
    .from('reward_campaign_claims')
    .select('id, claimed_at, ledger_id')
    .eq('campaign_code', CAMPAIGN_CODE)
    .eq('customer_id', customer.id)
    .maybeSingle()

  if (claimError && claimError.code !== '42P01') {
    return NextResponse.json({ error: 'ไม่สามารถตรวจสอบสิทธิ์รับแต้มได้' }, { status: 500 })
  }

  return NextResponse.json({
    eligible: !claim,
    claimed: Boolean(claim),
    points: 1,
    campaign_code: CAMPAIGN_CODE,
    claimed_at: claim?.claimed_at ?? null,
    ledger_id: claim?.ledger_id ?? null,
    customer: {
      id: customer.id,
      name: customer.name,
      customer_code: customer.customer_code,
    },
  })
}
