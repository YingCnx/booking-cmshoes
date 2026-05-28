
// ============================================
// Status Flex Messages — Minimal Clean Style
// ============================================

import { getStatusStyle } from '@/lib/queue-status'

export type StatusQueue = {
  id: number
  status: string
  queue_number: string | null
  received_date: string | null
  total_price: number | null
  delivery_date: string | null
  item_count: number
}

// ============================================
// Compact Row
// ============================================

function compactRow(label: string, value: string | number) {
  const safe =
    value === null ||
    value === undefined ||
    value === ''
      ? '-'
      : String(value)

  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'text',
        text: label,
        color: '#9CA3AF',
        size: 'sm',
        flex: 3,
      },
      {
        type: 'text',
        text: safe,
        color: '#111827',
        size: 'sm',
        weight: 'bold',
        flex: 5,
        align: 'end',
        wrap: true,
      },
    ],
  }
}

// ============================================
// Progress Bar
// ============================================

function progressBar(currentStep: number) {
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',

    contents: Array.from({ length: 5 }, (_, i) => ({
      type: 'box',
      layout: 'vertical',
      flex: 1,
      height: '4px',
      backgroundColor:
        i < currentStep
          ? '#111827'
          : '#E5E7EB',
      cornerRadius: '999px',
      contents: [{ type: 'filler' }],
    })),
  }
}

// ============================================
// Queue Bubble
// ============================================

export function buildQueueBubble(
  q: StatusQueue
) {
  const style = getStatusStyle(q.status)

  const receivedLabel = q.received_date
    ? new Date(
        q.received_date
      ).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
      })
    : '-'

  const deliveryLabel = q.delivery_date
    ? new Date(
        q.delivery_date
      ).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
      })
    : null

  const queueLabel = String(
    q.queue_number || `#${q.id}`
  )

  const itemLabel = `${q.item_count || 0} คู่`

  const statusLabel = String(
    q.status || '-'
  )

  return {
    type: 'bubble',
    size: 'mega',

    styles: {
      body: {
        backgroundColor: '#FFFFFF',
      },
      footer: {
        separator: false,
      },
    },

    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      spacing: 'lg',

      contents: [
        // Header
        {
          type: 'box',
          layout: 'horizontal',
          alignItems: 'center',

          contents: [
            {
              type: 'box',
              layout: 'vertical',
              flex: 1,

              contents: [
                {
                  type: 'text',
                  text: queueLabel,
                  size: 'xs',
                  color: '#9CA3AF',
                  weight: 'bold',
                },

                {
                  type: 'text',
                  text: itemLabel,
                  size: 'xl',
                  weight: 'bold',
                  color: '#111827',
                  margin: 'xs',
                },
              ],
            },

            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: '#F3F4F6',
              cornerRadius: '999px',
              paddingStart: '10px',
              paddingEnd: '10px',
              paddingTop: '4px',
              paddingBottom: '4px',

              contents: [
                {
                  type: 'text',
                  text: statusLabel,
                  size: 'xs',
                  color: '#374151',
                  weight: 'bold',
                  align: 'center',
                },
              ],
            },
          ],
        },

        // Progress
        progressBar(style.step),

        // Divider
        {
          type: 'separator',
          color: '#F3F4F6',
        },

        // Detail
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',

          contents: [
            compactRow(
              'วันที่รับ',
              receivedLabel
            ),

            ...(deliveryLabel
              ? [
                  compactRow(
                    'วันที่ส่ง',
                    deliveryLabel
                  ),
                ]
              : []),

            ...(q.total_price &&
            q.total_price > 0
              ? [
                  compactRow(
                    'ยอดรวม',
                    `฿${q.total_price.toLocaleString()}`
                  ),
                ]
              : []),
          ],
        },
      ],
    },
  }
}

// ============================================
// Carousel
// ============================================

export function buildStatusCarouselFlex(
  queues: StatusQueue[]
) {
  if (queues.length === 0) return null

  const bubbles = queues
    .slice(0, 12)
    .map(buildQueueBubble)

  if (bubbles.length === 1) {
    return {
      type: 'flex',
      altText: 'สถานะรองเท้าของคุณ',
      contents: bubbles[0],
    }
  }

  return {
    type: 'flex',
    altText: `สถานะรองเท้า ${queues.length} รายการ`,
    contents: {
      type: 'carousel',
      contents: bubbles,
    },
  }
}

// ============================================
// Link Account
// ============================================

export function buildLinkAccountFlex(
  liffUrl: string
) {
  return {
    type: 'flex',
    altText: 'ผูกบัญชีก่อนเช็คสถานะ',

    contents: {
      type: 'bubble',
      size: 'mega',

      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '24px',
        spacing: 'lg',

        contents: [
          {
            type: 'text',
            text: 'เชื่อมบัญชี LINE',
            size: 'lg',
            weight: 'bold',
            color: '#111827',
          },

          {
            type: 'text',
            text:
              'กรุณาผูกบัญชีด้วยเบอร์โทรที่เคยใช้บริการ เพื่อเช็คสถานะรองเท้า',
            size: 'sm',
            color: '#6B7280',
            wrap: true,
          },

          {
            type: 'button',
            style: 'primary',
            color: '#111827',

            action: {
              type: 'uri',
              label: 'ผูกบัญชี',
              uri: liffUrl,
            },
          },
        ],
      },
    },
  }
}

// ============================================
// No Queue
// ============================================

export function buildNoQueueFlex() {
  return {
    type: 'flex',
    altText: 'ยังไม่มีรายการ',

    contents: {
      type: 'bubble',
      size: 'mega',

      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '28px',
        spacing: 'lg',

        contents: [
          {
            type: 'text',
            text: 'ยังไม่มีรายการ',
            size: 'lg',
            weight: 'bold',
            align: 'center',
            color: '#111827',
          },

          {
            type: 'text',
            text:
              'ตอนนี้ยังไม่มีรองเท้าอยู่ระหว่างดำเนินการ',
            size: 'sm',
            color: '#6B7280',
            align: 'center',
            wrap: true,
          },
        ],
      },
    },
  }
}

// ============================================
// Reply Message
// ============================================

export async function replyMessage(
  replyToken: string,
  messages: object[],
  accessToken: string
) {
  const res = await fetch(
    'https://api.line.me/v2/bot/message/reply',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',

        Authorization: `Bearer ${accessToken}`,
      },

      body: JSON.stringify({
        replyToken,
        messages,
      }),
    }
  )

  if (!res.ok) {
    console.error(
      '[replyMessage] error:',
      await res.json()
    )
  }

  return res.ok
}
