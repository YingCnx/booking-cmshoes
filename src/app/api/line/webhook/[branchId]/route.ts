import {
  buildStatusCarouselFlex,
  buildLinkAccountFlex,
  buildNoQueueFlex,
  replyMessage,
  type StatusQueue,
} from '@/lib/status-flex'
import { ACTIVE_QUEUE_STATUSES } from '@/lib/queue-status'

async function handleCheckStatus(
  event: any,
  branch: any,
  supabase: any
) {
  const lineUserId = event.source?.userId
  const replyToken = event.replyToken

  if (
    !lineUserId ||
    !replyToken ||
    !branch.line_access_token
  ) {
    return
  }

  // ============================================
  // หา customer
  // ============================================

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name')
    .eq('line_user_id', lineUserId)
    .eq('branch_id', branch.id)
    .maybeSingle()

  // ============================================
  // ยังไม่ได้ผูกบัญชี
  // ============================================

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

  // ============================================
  // ดึง queue ล่าสุด
  // ============================================

  const { data: queue, error } =
    await supabase
      .from('queue')
      .select(`
        id,
        status,
        queue_number,
        received_date,
        total_price,
        delivery_date,
        queue_items (
          id
        )
      `)
      .eq('customer_id', customer.id)
      .in(
        'status',
        ACTIVE_QUEUE_STATUSES as any
      )
      .order('received_date', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()

  console.log(
    '[handleCheckStatus]',
    {
      customerId: customer.id,
      queueId: queue?.id ?? null,
      error,
    }
  )

  // ============================================
  // ไม่มี queue
  // ============================================

  if (!queue) {
    await replyMessage(
      replyToken,
      [buildNoQueueFlex()],
      branch.line_access_token
    )

    return
  }

  // ============================================
  // แปลงข้อมูล
  // ============================================

  const statusQueue: StatusQueue = {
    id: queue.id,
    status: queue.status,
    queue_number: queue.queue_number,
    received_date: queue.received_date,
    total_price: queue.total_price,
    delivery_date: queue.delivery_date,
    item_count:
      queue.queue_items?.length ?? 0,
  }

  // ============================================
  // Build Flex
  // ============================================

  const flex =
    buildStatusCarouselFlex([
      statusQueue,
    ])

  if (!flex) {
    return
  }

  // ============================================
  // Reply
  // ============================================

  await replyMessage(
    replyToken,
    [flex],
    branch.line_access_token
  )
}

