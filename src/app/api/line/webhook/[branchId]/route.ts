import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import {
  buildStatusCarouselFlex,
  buildLinkAccountFlex,
  buildNoQueueFlex,
  replyMessage,
  type StatusQueue,
} from '@/lib/status-flex'
import { ACTIVE_QUEUE_STATUSES } from '@/lib/queue-status'
import crypto from 'crypto'

function verifySignature(body: string, signature: string, secret: string): boolean {
  const hash = crypto.createHmac('SHA256', secret).update(body).digest('base64')
  return hash === signature
}

type Props = { params: Promise<{ branchId: string }> }

export async function POST(req: Request, { params }: Props) {
  const { branchId } = await params
  const branchIdNum = parseInt(branchId)

  const rawBody = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''

  const supabase = await createClient()
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, line_channel_secret, line_access_token, line_liff_id')
    .eq('id', branchIdNum)
    .maybeSingle()

  if (!branch || !branch.line_channel_secret) {
    return NextResponse.json({ error: 'branch/secret not found' }, { status: 404 })
  }

  if (!verifySignature(rawBody, signature, branch.line_channel_secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(rawBody)
  const events = body.events ?? []

  for (const event of events) {
    const trigger =
      event.postback?.data ??
      (event.type === 'message' && event.message?.type === 'text' ? event.message.text : null)

    console.log(`[webhook ${branch.name}]`, {
      type: event.type,
      userId: event.source?.userId ?? '-',
      trigger,
    })

    // บันทึก/อัปเดต line_contacts ทุกครั้งที่มีคนทัก
    const lineUserId = event.source?.userId
    if (lineUserId) {
      // เช็คว่ามีชื่ออยู่แล้วไหม ถ้ามีแล้วไม่ต้องเรียก LINE API ซ้ำ
      const { data: existing } = await supabase
        .from('line_contacts')
        .select('display_name')
        .eq('branch_id', branch.id)
        .eq('line_user_id', lineUserId)
        .maybeSingle()

      let displayName: string | null = existing?.display_name ?? null
      let pictureUrl: string | null = null

      if (!existing?.display_name) {
        try {
          const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
            headers: { Authorization: `Bearer ${branch.line_access_token}` },
          })
          if (profileRes.ok) {
            const p = await profileRes.json()
            displayName = p.displayName ?? null
            pictureUrl = p.pictureUrl ?? null
          }
        } catch {
          // ไม่ได้ชื่อก็ยังบันทึก userId ได้
        }
      }

      const { error: upsertError } = await supabase.from('line_contacts').upsert({
        branch_id: branch.id,
        line_user_id: lineUserId,
        display_name: displayName,
        picture_url: pictureUrl,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'branch_id,line_user_id' })

      if (upsertError) console.error('[line_contacts upsert]', upsertError)
    }

    if (trigger === 'เช็คสถานะ' || trigger === 'check_status') {
      await handleCheckStatus(event, branch, supabase)
    }
  }

  return NextResponse.json({ ok: true })
}

async function handleCheckStatus(event: any, branch: any, supabase: any) {
  const lineUserId = event.source?.userId
  const replyToken = event.replyToken
  if (!lineUserId || !replyToken || !branch.line_access_token) return

  // หา customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name')
    .eq('line_user_id', lineUserId)
    .eq('branch_id', branch.id)
    .maybeSingle()

  // กรณี 1: ไม่เจอ customer
  if (!customer) {
    const liffUrl = branch.line_liff_id
      ? `https://liff.line.me/${branch.line_liff_id}?next=/status`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/status`
    await replyMessage(replyToken, [buildLinkAccountFlex(liffUrl)], branch.line_access_token)
    return
  }

  // ✅ ใช้ column ที่ถูกต้องตาม schema:
  //    received_date, total_price, delivery_date
  const { data: queues } = await supabase
    .from('queue')
    .select(`
      id, status, queue_number, received_date, total_pairs, total_price, delivery_date,
      queue_items ( id )
    `)
    .eq('customer_id', customer.id)
    .in('status', ACTIVE_QUEUE_STATUSES as any)
    .order('received_date', { ascending: false })
    .limit(1)
  console.log('[handleCheckStatus] customer:', customer.id, 'queues:', queues?.length ?? 0)

  if (!queues || queues.length === 0) {
    await replyMessage(replyToken, [buildNoQueueFlex()], branch.line_access_token)
    return
  }

  const statusQueues: StatusQueue[] = queues.map((q: any) => ({
    id: q.id,
    status: q.status,
    queue_number: q.queue_number,
    received_date: q.received_date,
    total_pairs: q.total_pairs,
    total_price: q.total_price,
    delivery_date: q.delivery_date,
    item_count: q.queue_items?.length ?? 0,
  }))

  const flex = buildStatusCarouselFlex(statusQueues)
  if (flex) {
    await replyMessage(replyToken, [flex], branch.line_access_token)
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
