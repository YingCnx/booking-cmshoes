// ==============================================
// LINE Messaging API — per-branch credentials
// ==============================================

type LineCredentials = {
  accessToken: string
  channelSecret: string
  adminGroupId: string | null
  liffId: string | null
}

export async function getBranchLineCredentials(branchId: number): Promise<LineCredentials> {
  const { createClient } = await import('@/utils/supabase/server')
  const supabase = await createClient()
  const { data: branch } = await supabase
    .from('branches')
    .select('line_access_token, line_channel_secret, line_admin_group_id, line_liff_id')
    .eq('id', branchId)
    .single()
  return {
    accessToken:   branch?.line_access_token   ?? '',
    channelSecret: branch?.line_channel_secret ?? '',
    adminGroupId:  branch?.line_admin_group_id ?? null,
    liffId:        branch?.line_liff_id        ?? null,
  }
}

export async function pushMessage(to: string, messages: object[], accessToken: string) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to, messages }),
  })
  if (!res.ok) console.error('LINE push error:', await res.json())
  return res.ok
}

// ==============================================
// Admin link — group-based
// ==============================================
function adminUrl(groupId: string, appointmentId?: number) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const params = new URLSearchParams({ groupId })
  if (appointmentId) params.set('appointmentId', String(appointmentId))
  return `${base}/admin-login?${params.toString()}`
}

// ==============================================
// Flex Templates (kilo size, สีดำ)
// ==============================================
function compactRow(label: string, value: string | number | null | undefined) {
  const safe = (value === null || value === undefined || value === '') ? '-' : String(value)
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label || '-', color: '#8E8E93', size: 'xs', flex: 2 },
      { type: 'text', text: safe, color: '#1C1C1E', size: 'xs', weight: 'bold', flex: 4, align: 'end', wrap: true },
    ],
  }
}

// แจ้ง admin group — มีจองใหม่
export function buildAdminNotifyFlex(data: {
  customerName: string
  phone: string
  serviceName: string
  branchName: string
  date: string
  time: string
  location: string
  shoeCount: number
  appointmentId: number
  adminGroupId: string
  lineUserId?: string | null
}) {
  const dateLabel = new Date(data.date).toLocaleDateString('th-TH', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  const footerButtons: any[] = [
    {
      type: 'button',
      style: 'primary',
      color: '#18181B',
      height: 'sm',
      action: { type: 'uri', label: 'Dashboard', uri: adminUrl(data.adminGroupId, data.appointmentId) },
    },
  ]

  if (data.phone) {
    footerButtons.push({
      type: 'button',
      style: 'secondary',
      height: 'sm',
      action: { type: 'uri', label: `โทร ${data.phone}`, uri: `tel:${data.phone}` },
      margin: 'xs',
    })
  }

  return {
    type: 'flex',
    altText: `จองใหม่ ${data.customerName} ${data.time} น.`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: '#18181B',
        paddingAll: '10px', paddingBottom: '12px',
        contents: [
          { type: 'text', text: 'จองใหม่ — รอยืนยัน', color: '#FBBF24', size: 'xxs', weight: 'bold' },
          { type: 'text', text: data.customerName, color: '#FFFFFF', size: 'md', weight: 'bold', margin: 'xs' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '10px', spacing: 'xs',
        contents: [
          compactRow('บริการ', data.serviceName),
          compactRow('วันที่', `${dateLabel} · ${data.time} น.`),
          compactRow('เบอร์', data.phone || '-'),
          { type: 'separator', margin: 'sm' },
          compactRow('สถานที่รับ', data.location),
          compactRow('จำนวน', `${data.shoeCount} คู่`),
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '8px', spacing: 'xs',
        contents: footerButtons,
      },
    },
  }
}

// แจ้งลูกค้า — รอยืนยัน
export function buildBookingPendingFlex(data: {
  customerName: string
  serviceName: string
  date: string
  time: string
  location: string
  shoeCount: number
}) {
  const dateLabel = new Date(data.date).toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return {
    type: 'flex',
    altText: `คำขอจอง ${data.serviceName} ${dateLabel}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: '#18181B',
        paddingAll: '12px',
        contents: [
          { type: 'text', text: 'รอการยืนยัน', color: '#FBBF24', size: 'xxs', weight: 'bold' },
          { type: 'text', text: 'ส่งคำขอจองสำเร็จ', color: '#FFFFFF', size: 'md', weight: 'bold', margin: 'xs' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '10px', spacing: 'xs',
        contents: [
          compactRow('บริการ', data.serviceName),
          compactRow('วันที่', dateLabel),
          compactRow('เวลา', `${data.time} น.`),
          { type: 'separator', margin: 'sm' },
          compactRow('สถานที่รับ', data.location),
          compactRow('จำนวน', `${data.shoeCount} คู่`),
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '10px',
        backgroundColor: '#FEFCE8',
        contents: [
          { type: 'text', text: 'ร้านจะแจ้งผลยืนยันให้ทราบโดยเร็ว', color: '#92400E', size: 'xxs', align: 'center' },
        ],
      },
    },
  }
}

// แจ้งลูกค้า — ยืนยันแล้ว
export function buildBookingConfirmedFlex(data: {
  serviceName: string
  date: string
  time: string
  location: string
  shoeCount: number
}) {
  const dateLabel = new Date(data.date).toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return {
    type: 'flex',
    altText: `ยืนยันการจอง ${data.serviceName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: '#052E16',
        paddingAll: '12px',
        contents: [
          { type: 'text', text: 'ยืนยันการจอง', color: '#4ADE80', size: 'xxs', weight: 'bold' },
          { type: 'text', text: 'นัดหมายได้รับการยืนยันแล้ว', color: '#FFFFFF', size: 'md', weight: 'bold', margin: 'xs', wrap: true },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '10px', spacing: 'xs',
        contents: [
          compactRow('บริการ', data.serviceName),
          compactRow('วันที่', dateLabel),
          compactRow('เวลา', `${data.time} น.`),
          { type: 'separator', margin: 'sm' },
          compactRow('สถานที่รับ', data.location),
          compactRow('จำนวน', `${data.shoeCount} คู่`),
        ],
      },
    },
  }
}

// แจ้งลูกค้า — ยกเลิก
export function buildBookingCancelledFlex(data: {
  serviceName: string
  date: string
  time: string
  reason?: string
}) {
  const dateLabel = new Date(data.date).toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return {
    type: 'flex',
    altText: `ยกเลิกการจอง ${data.serviceName}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: '#7F1D1D',
        paddingAll: '12px',
        contents: [
          { type: 'text', text: 'ยกเลิก', color: '#FCA5A5', size: 'xxs', weight: 'bold' },
          { type: 'text', text: 'การจองถูกยกเลิก', color: '#FFFFFF', size: 'md', weight: 'bold', margin: 'xs' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '10px', spacing: 'xs',
        contents: [
          compactRow('บริการ', data.serviceName),
          compactRow('วันที่', `${dateLabel} · ${data.time} น.`),
          ...(data.reason ? [compactRow('เหตุผล', data.reason)] : []),
        ],
      },
    },
  }
}