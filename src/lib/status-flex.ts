// ============================================
// Status Flex Messages — ตอบในแชท
// ============================================

import { getStatusStyle, QUEUE_STATUSES } from '@/lib/queue-status'

export type StatusQueue = {
  id: number
  status: string
  queue_number: string | null
  received_date: string | null
  total_price: number | null
  delivery_date: string | null
  item_count: number
}

function compactRow(label: string, value: string | number) {
  const safe = value === null || value === undefined || value === '' ? '-' : String(value)
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, color: '#8E8E93', size: 'xs', flex: 2 },
      { type: 'text', text: safe, color: '#1C1C1E', size: 'xs', weight: 'bold', flex: 4, align: 'end', wrap: true },
    ],
  }
}

function progressBar(currentStep: number) {
  const steps = []
  for (let i = 1; i <= 5; i++) {
    steps.push({
      type: 'box',
      layout: 'vertical',
      flex: 1,
      height: '6px',
      backgroundColor: i <= currentStep ? '#18181B' : '#E5E7EB',
      cornerRadius: '3px',
      contents: [{ type: 'filler' }],
    })
  }
  return {
    type: 'box',
    layout: 'horizontal',
    spacing: 'xs',
    contents: steps,
  }
}

export function buildQueueBubble(q: StatusQueue) {
  const style = getStatusStyle(q.status)
  const receivedLabel = q.received_date
    ? new Date(q.received_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    : '-'
  const deliveryLabel = q.delivery_date
    ? new Date(q.delivery_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    : null

  return {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#18181B',
      paddingAll: '12px',
      contents: [
        {
          type: 'text',
          text: q.queue_number ?? `Queue #${q.id}`,
          color: '#9CA3AF',
          size: 'xxs',
          weight: 'bold',
        },
        {
          type: 'text',
          text: `${q.item_count} คู่`,
          color: '#FFFFFF',
          size: 'lg',
          weight: 'bold',
          margin: 'xs',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '12px',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: style.icon, size: 'sm', flex: 0 },
            { type: 'text', text: q.status, size: 'sm', weight: 'bold', color: '#1C1C1E', margin: 'sm', flex: 1, wrap: true },
          ],
        },
        progressBar(style.step),
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'รับเข้า',   size: 'xxs', color: '#9CA3AF', align: 'start',  flex: 1 },
            { type: 'text', text: 'ซัก',       size: 'xxs', color: '#9CA3AF', align: 'center', flex: 1 },
            { type: 'text', text: 'เตรียมส่ง', size: 'xxs', color: '#9CA3AF', align: 'center', flex: 1 },
            { type: 'text', text: 'จัดส่ง',    size: 'xxs', color: '#9CA3AF', align: 'center', flex: 1 },
            { type: 'text', text: 'สำเร็จ',    size: 'xxs', color: '#9CA3AF', align: 'end',    flex: 1 },
          ],
        },
        { type: 'separator', margin: 'md' },
        compactRow('เข้ารับ', receivedLabel),
        ...(deliveryLabel ? [compactRow('นัดส่ง', deliveryLabel)] : []),
        ...(q.total_price && q.total_price > 0 ? [compactRow('ยอด', `฿${q.total_price.toLocaleString()}`)] : []),
      ],
    },
  }
}

export function buildStatusCarouselFlex(queues: StatusQueue[]) {
  if (queues.length === 0) return null
  const bubbles = queues.slice(0, 12).map(buildQueueBubble)

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

export function buildLinkAccountFlex(liffUrl: string) {
  return {
    type: 'flex',
    altText: 'ผูกบัญชีก่อนเช็คสถานะ',
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#18181B',
        paddingAll: '12px',
        contents: [
          { type: 'text', text: 'เช็คสถานะ', color: '#FBBF24', size: 'xxs', weight: 'bold' },
          { type: 'text', text: 'ผูกบัญชีก่อนใช้งาน', color: '#FFFFFF', size: 'md', weight: 'bold', margin: 'xs' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [
          {
            type: 'text',
            text: 'กรุณาผูกบัญชี LINE กับเบอร์โทรที่เคยใช้บริการ',
            size: 'sm',
            color: '#6B7280',
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '12px',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#18181B',
            height: 'sm',
            action: { type: 'uri', label: 'ผูกบัญชี', uri: liffUrl },
          },
        ],
      },
    },
  }
}

export function buildNoQueueFlex() {
  return {
    type: 'flex',
    altText: 'ยังไม่มีรายการ',
    contents: {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        spacing: 'md',
        contents: [
          { type: 'text', text: '📭', size: '4xl', align: 'center' },
          { type: 'text', text: 'ยังไม่มีรายการ', size: 'md', weight: 'bold', align: 'center', color: '#1C1C1E' },
          { type: 'text', text: 'ตอนนี้ยังไม่มีรองเท้าอยู่ในร้าน', size: 'sm', color: '#6B7280', align: 'center', wrap: true },
        ],
      },
    },
  }
}

export async function replyMessage(replyToken: string, messages: object[], accessToken: string) {
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
  if (!res.ok) console.error('[replyMessage] error:', await res.json())
  return res.ok
}
