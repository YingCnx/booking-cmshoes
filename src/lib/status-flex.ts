
// ============================================
// Status Flex Messages — Clean Minimal UI
// ============================================

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
// Status Step
// ============================================

function getStatusStep(status: string) {
  switch (status) {
    case 'รับเข้า':
      return 1

    case 'อยู่ระหว่างทำความสะอาด':
      return 2

    case 'เตรียมส่ง':
      return 3

    case 'กำลังจัดส่ง':
      return 4

    case 'จัดส่งสำเร็จ':
      return 5

    default:
      return 1
  }
}

// ============================================
// Compact Row
// ============================================

function compactRow(
  icon: string,
  label: string,
  value: string | number
) {
  const safe =
    value === null ||
    value === undefined ||
    value === ''
      ? '-'
      : String(value)

  return {
    type: 'box',
    layout: 'horizontal',
    margin: 'md',

    contents: [
      {
        type: 'text',
        text: String(icon),
        size: 'sm',
        flex: 1,
        color: '#6B7280',
      },

      {
        type: 'text',
        text: String(label),
        size: 'sm',
        color: '#6B7280',
        flex: 3,
      },

      {
        type: 'text',
        text: safe,
        size: 'sm',
        color: '#111827',
        weight: 'bold',
        align: 'end',
        flex: 4,
        wrap: true,
      },
    ],
  }
}

// ============================================
// Progress Bar
// ============================================

function progressBar(step: number) {
  const labels = [
    'รับแล้ว',
    'ทำความสะอาด',
    'เตรียมส่ง',
    'กำลังส่ง',
    'สำเร็จ',
  ]

  return {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',

    contents: [
      {
        type: 'box',
        layout: 'horizontal',

        contents: labels.map(
          (_, index) => ({
            type: 'box',
            layout: 'vertical',
            flex: 1,
            alignItems: 'center',

            contents: [
              {
                type: 'box',
                layout: 'vertical',

                width: '14px',
                height: '14px',

                cornerRadius: '100px',

                backgroundColor:
                  index + 1 <= step
                    ? '#1877F2'
                    : '#D1D5DB',

                contents: [
                  {
                    type: 'filler',
                  },
                ],
              },
            ],
          })
        ),
      },

      {
        type: 'box',
        layout: 'horizontal',

        contents: labels.map(
          (label) => ({
            type: 'text',
            text: String(label),
            size: 'xxs',
            color: '#374151',
            align: 'center',
            flex: 1,
            wrap: true,
          })
        ),
      },
    ],
  }
}

// ============================================
// Queue Bubble
// ============================================

export function buildQueueBubble(
  q: StatusQueue
) {
  const step = getStatusStep(q.status)

  const receivedLabel = q.received_date
    ? new Date(
        q.received_date
      ).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-'

  const deliveryLabel = q.delivery_date
    ? new Date(
        q.delivery_date
      ).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-'

  return {
    type: 'bubble',

    size: 'mega',

    styles: {
      body: {
        backgroundColor: '#FFFFFF',
      },
    },

    body: {
      type: 'box',
      layout: 'vertical',

      paddingAll: '20px',
      spacing: 'lg',

      contents: [
        {
          type: 'box',
          layout: 'horizontal',

          contents: [
            {
              type: 'text',
              text: String(
                q.queue_number || `#${q.id}`
              ),
              size: 'sm',
              color: '#6B7280',
              weight: 'bold',
            },

            {
              type: 'box',
              layout: 'vertical',

              backgroundColor: '#2263e6',

              cornerRadius: '20px',

              paddingStart: '10px',
              paddingEnd: '10px',
              paddingTop: '4px',
              paddingBottom: '4px',

              contents: [
                {
                  type: 'text',
                  text: String(q.status || '-'),
                  size: 'xs',
                  color: '#111827',
                  weight: 'bold',
                  align: 'center',
                },
              ],
            },
          ],
        },

        {
          type: 'text',
          text: String(
            `${q.item_count || 0} คู่`
          ),
          size: '3xl',
          weight: 'bold',
          color: '#111827',
        },

        progressBar(step),

        {
          type: 'separator',
          margin: 'lg',
          color: '#E5E7EB',
        },

        compactRow(
          '📅',
          'วันที่รับ',
          receivedLabel
        ),

        compactRow(
          '⏱',
          'กำหนดส่ง',
          deliveryLabel
        ),

        compactRow(
          '💵',
          'ยอดรวม',
          q.total_price
            ? `฿${q.total_price.toLocaleString()}`
            : '-'
        ),
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
  if (!queues || queues.length === 0) {
    return null
  }

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

    altText:
      'ผูกบัญชีก่อนเช็คสถานะ',

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
            text: 'ยังไม่ได้ผูกบัญชี',
            size: 'xl',
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

        spacing: 'md',

        contents: [
          {
            type: 'text',
            text: '📦',
            size: '4xl',
            align: 'center',
          },

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
              'ตอนนี้ยังไม่มีรองเท้าอยู่ในร้าน',
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
