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
    console.log(`[webhook ${branch.name}]`, {
      type: event.type,
      source: event.source?.type,
      userId: event.source?.userId ?? '-',
      groupId: event.source?.groupId ?? '-',
      data: event.postback?.data,
    })

    // ✅ Postback action — 'check_status'
    if (event.type === 'postback' && event.postback?.data === 'check_status') {
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

  // กรณี 1: ไม่เจอ customer → ขอผูกบัญชีก่อน
  if (!customer) {
    const liffUrl = branch.line_liff_id
      ? `https://liff.line.me/${branch.line_liff_id}?next=/status`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/status`
    await replyMessage(
      replyToken,
      [buildLinkAccountFlex(liffUrl)],
      branch.line_access_token
    )
    return
  }

  // ดึง queue ของ customer
  const { data: queues } = await supabase
    .from('queue')
    .select(`
      id, status, queue_number, created_at, total_amount, due_date,
      queue_items ( id )
    `)
    .eq('customer_id', customer.id)
    .in('status', ACTIVE_QUEUE_STATUSES as any)
    .order('created_at', { ascending: false })

  // กรณี 2: ไม่มี queue
  if (!queues || queues.length === 0) {
    await replyMessage(
      replyToken,
      [buildNoQueueFlex()],
      branch.line_access_token
    )
    return
  }

  // กรณี 3: มี queue → ส่ง carousel
  const statusQueues: StatusQueue[] = queues.map((q: any) => ({
    id: q.id,
    status: q.status,
    queue_number: q.queue_number,
    created_at: q.created_at,
    total_amount: q.total_amount,
    due_date: q.due_date,
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
