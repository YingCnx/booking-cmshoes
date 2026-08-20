// ============================================
// Status Flex Messages — Clean Minimal UI
// ============================================

export type StatusQueue = {
  id: number
  status: string
  queue_number: string | null
  received_date: string | null
  total_pairs: number | null
  total_price: number | null
  delivery_date: string | null
  item_count: number
}

// ============================================
// Status Step
// ============================================
function getStatusStep(status: string) {
  switch (status) {
    case 'รับเข้า':                  return 1
    case 'อยู่ระหว่างทำความสะอาด':    return 2
    case 'เตรียมส่ง':                return 3
    case 'กำลังจัดส่ง':              return 4
    case 'จัดส่งสำเร็จ':             return 5
    default:                         return 1
  }
}

// ============================================
// Compact Row
// ============================================
function compactRow(icon: string, label: string, value: string | number) {
  const safe = value === null || value === undefined || value === '' ? '-' : String(value)
  return {
    type: 'box',
    layout: 'horizontal',
    margin: 'md',
    contents: [
      { type: 'text', text: String(icon), size: 'sm', flex: 1, color: '#6B7280' },
      { type: 'text', text: String(label), size: 'sm', color: '#6B7280', flex: 3 },
      { type: 'text', text: safe, size: 'sm', color: '#111827', weight: 'bold', align: 'end', flex: 4, wrap: true },
    ],
  }
}

// ============================================
// Progress Bar — 5 ขั้น ตรงกับ DB
// ============================================
function progressBar(step: number) {
  const labels = ['รับเข้า', 'ทำความสะอาด', 'เตรียมส่ง', 'กำลังส่ง', 'สำเร็จ']
  const contents: any[] = []

  labels.forEach((_, index) => {
    const stage = index + 1
    const completed = stage < step
    const current = stage === step

    contents.push({
      type: 'box',
      layout: 'vertical',
      width: '26px',
      height: '26px',
      cornerRadius: '13px',
      backgroundColor: completed ? '#14B8A6' : current ? '#0F766E' : '#F3F4F6',
      borderColor: completed || current ? undefined : '#D1D5DB',
      borderWidth: completed || current ? undefined : '1px',
      justifyContent: 'center',
      contents: [{
        type: 'text',
        text: completed ? '✓' : String(stage),
        size: 'sm',
        weight: completed || current ? 'bold' : 'regular',
        color: completed || current ? '#FFFFFF' : '#6B7280',
        align: 'center',
      }],
    })

    if (stage < labels.length) {
      contents.push({
        type: 'box',
        layout: 'vertical',
        height: '2px',
        backgroundColor: stage < step ? '#14B8A6' : '#D1D5DB',
        flex: 1,
        contents: [{ type: 'filler' }],
      })
    }
  })

  return {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',
    contents: [
      {
        type: 'box',
        layout: 'horizontal',
        alignItems: 'center',
        contents,
      },
      {
        type: 'box',
        layout: 'horizontal',
        contents: labels.map((label, index) => ({
          type: 'text',
          text: String(label),
          size: 'xxs',
          color: index + 1 === step ? '#0F766E' : '#6B7280',
          weight: index + 1 === step ? 'bold' : 'regular',
          align: 'center',
          flex: 1,
          wrap: true,
        })),
      },
    ],
  }
}

// ============================================
// Queue Bubble
// ============================================
export function buildQueueBubble(q: StatusQueue) {
  const step = getStatusStep(q.status)

  const receivedLabel = q.received_date
    ? new Date(q.received_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-'

  const deliveryLabel = q.delivery_date
    ? new Date(q.delivery_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'ยังไม่กำหนด'

  // ✅ แก้ operator precedence — ใช้ queue_number ถ้ามี ไม่งั้น fallback #id
  const queueLabel = q.queue_number ? `คิว #${q.queue_number}` : `คิว #${q.id}`

  const statusLabel = q.status === 'อยู่ระหว่างทำความสะอาด'
    ? 'อยู่ระหว่างทำความสะอาด'
    : String(q.status || '-')

  return {
    type: 'bubble',
    size: 'mega',
    styles: {
      body: { backgroundColor: '#FFFFFF' },
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '20px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          alignItems: 'center',
          contents: [
            {
              type: 'box', layout: 'vertical', width: '48px', height: '48px',
              cornerRadius: '24px', backgroundColor: '#E6FFFB', justifyContent: 'center',
              contents: [{ type: 'text', text: '👟', size: 'xl', align: 'center' }],
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'md', flex: 1,
              contents: [
                { type: 'text', text: 'สถานะรองเท้าของคุณ', size: 'sm', weight: 'bold', color: '#334155' },
                { type: 'text', text: queueLabel, size: 'xxl', weight: 'bold', color: '#0F766E', margin: 'xs' },
              ],
            },
          ],
        },
        {
          type: 'box', layout: 'vertical', backgroundColor: '#CCFBF1', cornerRadius: '20px',
          paddingAll: '10px', margin: 'lg',
          contents: [{ type: 'text', text: `✨  ${statusLabel}`, size: 'sm', weight: 'bold', color: '#0F766E', align: 'center' }],
        },
        {
          type: 'box', layout: 'horizontal', backgroundColor: '#F8FAFC', cornerRadius: '16px',
          height: '112px', paddingAll: '16px', margin: 'lg', alignItems: 'center', justifyContent: 'center',
          contents: [
            { type: 'text', text: String(q.total_pairs ?? 0), size: '4xl', weight: 'bold', color: '#0F766E', gravity: 'center', flex: 0 },
            { type: 'text', text: 'คู่', size: 'lg', weight: 'bold', color: '#334155', gravity: 'center', margin: 'md', flex: 0 },
          ],
        },
        { ...progressBar(step), margin: 'xl' },
        {
          type: 'box', layout: 'vertical', backgroundColor: '#CCFBF1', cornerRadius: '14px',
          paddingAll: '12px', margin: 'xl',
          contents: [
            { type: 'text', text: `✨ ขั้นตอนที่ ${step} จาก 5`, size: 'sm', weight: 'bold', color: '#0F766E' },
            { type: 'text', text: statusLabel, size: 'xs', color: '#115E59', margin: 'xs' },
          ],
        },
        {
          type: 'box', layout: 'vertical', backgroundColor: '#F8FAFC', cornerRadius: '16px',
          paddingAll: '16px', margin: 'lg',
          contents: [
            compactRow('📅', 'วันที่รับ', receivedLabel),
            { type: 'separator', color: '#E2E8F0', margin: 'md' },
            compactRow('🚚', 'กำหนดส่ง', deliveryLabel),
            { type: 'separator', color: '#E2E8F0', margin: 'md' },
            compactRow('💳', 'ยอดรวม', q.total_price == null ? '-' : `฿${q.total_price.toLocaleString()}`),
          ],
        },
      ],
    },
  }
}

// ============================================
// Carousel
// ============================================
export function buildStatusCarouselFlex(queues: StatusQueue[]) {
  if (!queues || queues.length === 0) return null

  const bubbles = queues.slice(0, 8).map(buildQueueBubble)

  if (bubbles.length === 1) {
    const queue = queues[0]
    const queueLabel = queue.queue_number ? `คิว ${queue.queue_number}` : `คิว ${queue.id}`
    return { type: 'flex', altText: `${queueLabel}: ${queue.status}`, contents: bubbles[0] }
  }

  return {
    type: 'flex',
    altText: `สถานะรองเท้า ${queues.length} รายการ`,
    contents: { type: 'carousel', contents: bubbles },
  }
}

// ============================================
// Link Account
// ============================================
export function buildLinkAccountFlex(liffUrl: string) {
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
          { type: 'text', text: 'ยังไม่ได้ผูกบัญชี', size: 'xl', weight: 'bold', color: '#111827' },
          {
            type: 'text',
            text: 'กรุณาผูกบัญชีด้วยเบอร์โทรที่เคยใช้บริการ เพื่อเช็คสถานะรองเท้า',
            size: 'sm',
            color: '#6B7280',
            wrap: true,
          },
          {
            type: 'button',
            style: 'primary',
            color: '#111827',
            action: { type: 'uri', label: 'ผูกบัญชี', uri: liffUrl },
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
          { type: 'text', text: '📦', size: '4xl', align: 'center' },
          { type: 'text', text: 'ยังไม่มีรายการ', size: 'lg', weight: 'bold', align: 'center', color: '#111827' },
          { type: 'text', text: 'ไม่พบข้อมูลรองเท้าลูกค้า', size: 'sm', color: '#6B7280', align: 'center', wrap: true },
        ],
      },
    },
  }
}

// ============================================
// Reply Message
// ============================================
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
