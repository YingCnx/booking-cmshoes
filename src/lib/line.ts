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
// Admin link
// ==============================================
function adminUrl(appointmentId?: number) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return `${base}/admin`
}

// ==============================================
// แจ้ง admin group — สถานะเปลี่ยน
// ==============================================
export function buildAdminStatusChangeFlex(data: {
  customerName: string
  serviceName: string
  date: string
  time: string
  oldStatus: string
  newStatus: string
  appointmentId: number
}) {
  const dateLabel = new Date(data.date).toLocaleDateString('th-TH', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  const statusColor: Record<string, string> = {
    'ยืนยันแล้ว': '#4ADE80',
    'ยกเลิก':     '#F87171',
    'สำเร็จ':     '#60A5FA',
    'รอดำเนินการ': '#FBBF24',
  }
  const color = statusColor[data.newStatus] ?? '#FFFFFF'

  return {
    type: 'flex',
    altText: `[อัพเดท] ${data.customerName} → ${data.newStatus}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: '#18181B',
        paddingAll: '10px',
        contents: [
          { type: 'text', text: 'สถานะนัดหมายเปลี่ยนแปลง', color: '#8E8E93', size: 'xxs', weight: 'bold' },
          { type: 'text', text: data.customerName, color: '#FFFFFF', size: 'md', weight: 'bold', margin: 'xs' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '10px', spacing: 'xs',
        contents: [
          compactRow('บริการ', data.serviceName),
          compactRow('วันที่', `${dateLabel} · ${data.time} น.`),
          { type: 'separator', margin: 'sm' },
          {
            type: 'box', layout: 'horizontal', margin: 'sm',
            contents: [
              { type: 'text', text: data.oldStatus, color: '#8E8E93', size: 'xs', flex: 2 },
              { type: 'text', text: '→', color: '#8E8E93', size: 'xs', flex: 1, align: 'center' },
              { type: 'text', text: data.newStatus, color, size: 'xs', weight: 'bold', flex: 2, align: 'end' },
            ],
          },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '8px',
        contents: [{
          type: 'button', style: 'primary', color: '#18181B', height: 'sm',
          action: { type: 'uri', label: 'ดูรายละเอียด', uri: adminUrl(data.appointmentId) },
        }],
      },
    },
  }
}

// ==============================================
// Flex Templates
// ==============================================
function flexRow(label: string, value: string | number | null | undefined) {
  const safe = (value === null || value === undefined || value === '') ? '-' : String(value)
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, color: '#6B7280', size: 'sm', flex: 3 },
      { type: 'text', text: safe, color: '#111827', size: 'sm', weight: 'bold', flex: 5, align: 'end', wrap: true },
    ],
  }
}

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
      action: { type: 'uri', label: 'Dashboard', uri: adminUrl(data.appointmentId) },
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
      styles: { header: { separator: true }, body: { backgroundColor: '#FFFFFF' } },
      header: {
        type: 'box', layout: 'vertical', paddingAll: '0px',
        contents: [
          { type: 'box', layout: 'vertical', height: '4px', backgroundColor: '#D97706', contents: [] },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px',
        contents: [
          { type: 'text', text: 'ร้านซักเกิบแอนด์สปา', size: 'sm', color: '#6B7280' },
          {
            type: 'box', layout: 'horizontal', margin: 'sm', alignItems: 'center',
            contents: [
              { type: 'text', text: 'คำขอนัดหมาย', size: 'md', weight: 'bold', color: '#111827', flex: 1, wrap: true },
              {
                type: 'box', layout: 'vertical',
                backgroundColor: '#FEF3C7', cornerRadius: '16px',
                paddingStart: '10px', paddingEnd: '10px', paddingTop: '4px', paddingBottom: '4px', flex: 0,
                contents: [{ type: 'text', text: 'รอการยืนยัน', size: 'xs', weight: 'bold', color: '#92400E' }],
              },
            ],
          },
          { type: 'text', text: 'กรุณารอการยืนยันจากทางร้านสักครู่..', size: 'xs', color: '#4e4f52', margin: 'lg', wrap: true },
          { type: 'box', layout: 'vertical', height: '1px', backgroundColor: '#E5E7EB', margin: 'lg', contents: [] },
          {
            type: 'box', layout: 'vertical', margin: 'lg', spacing: 'md',
            contents: [
              flexRow('บริการ', data.serviceName),
              flexRow('วันที่', dateLabel),
              flexRow('เวลา', `${data.time} น.`),
              { type: 'separator', color: '#E5E7EB' },
              flexRow('สถานที่รับ', data.location),
              flexRow('จำนวน', `${data.shoeCount} คู่`),
            ],
          },
          {
            type: 'box', layout: 'vertical', margin: 'xl', paddingAll: '12px',
            backgroundColor: '#F9FAFB', cornerRadius: '10px',
            contents: [
              { type: 'text', text: 'ร้านจะแจ้งผลยืนยันให้ทราบโดยเร็ว', size: 'xs', color: '#6B7280', align: 'center', wrap: true },
            ],
          },
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
      styles: { header: { separator: true }, body: { backgroundColor: '#FFFFFF' } },
      header: {
        type: 'box', layout: 'vertical', paddingAll: '0px',
        contents: [
          { type: 'box', layout: 'vertical', height: '4px', backgroundColor: '#059669', contents: [] },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px',
        contents: [
          { type: 'text', text: 'ร้านซักเกิบแอนด์สปา', size: 'sm', color: '#6B7280' },
          {
            type: 'box', layout: 'horizontal', margin: 'sm', alignItems: 'center',
            contents: [
              { type: 'text', text: 'ยืนยันนัดหมายแล้ว', size: 'md', weight: 'bold', color: '#111827', flex: 1, wrap: true },
              {
                type: 'box', layout: 'vertical',
                backgroundColor: '#D1FAE5', cornerRadius: '16px',
                paddingStart: '10px', paddingEnd: '10px', paddingTop: '4px', paddingBottom: '4px', flex: 0,
                contents: [{ type: 'text', text: 'ยืนยันแล้ว', size: 'xs', weight: 'bold', color: '#065F46' }],
              },
            ],
          },
          { type: 'text', text: 'ทางร้านยืนยันการนัดหมายของคุณแล้ว', size: 'xs', color: '#4e4f52', margin: 'lg', wrap: true },
          { type: 'box', layout: 'vertical', height: '1px', backgroundColor: '#E5E7EB', margin: 'lg', contents: [] },
          {
            type: 'box', layout: 'vertical', margin: 'lg', spacing: 'md',
            contents: [
              flexRow('บริการ', data.serviceName),
              flexRow('วันที่', dateLabel),
              flexRow('เวลา', `${data.time} น.`),
              { type: 'separator', color: '#E5E7EB' },
              flexRow('สถานที่รับ', data.location),
              flexRow('จำนวน', `${data.shoeCount} คู่`),
            ],
          },
          {
            type: 'box', layout: 'vertical', margin: 'xl', paddingAll: '12px',
            backgroundColor: '#F0FDF4', cornerRadius: '10px',
            contents: [
              { type: 'text', text: 'ทางร้านจะติดต่อหาคุณก่อนเข้ารับรองเท้า', size: 'xs', color: '#065F46', align: 'center', wrap: true },
            ],
          },
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
      styles: { header: { separator: true }, body: { backgroundColor: '#FFFFFF' } },
      header: {
        type: 'box', layout: 'vertical', paddingAll: '0px',
        contents: [
          { type: 'box', layout: 'vertical', height: '4px', backgroundColor: '#DC2626', contents: [] },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px',
        contents: [
          { type: 'text', text: 'ร้านซักเกิบแอนด์สปา', size: 'sm', color: '#6B7280' },
          {
            type: 'box', layout: 'horizontal', margin: 'sm', alignItems: 'center',
            contents: [
              { type: 'text', text: 'ยกเลิกนัดหมาย', size: 'md', weight: 'bold', color: '#111827', flex: 1, wrap: true },
              {
                type: 'box', layout: 'vertical',
                backgroundColor: '#FEE2E2', cornerRadius: '16px',
                paddingStart: '10px', paddingEnd: '10px', paddingTop: '4px', paddingBottom: '4px', flex: 0,
                contents: [{ type: 'text', text: 'ยกเลิกแล้ว', size: 'xs', weight: 'bold', color: '#991B1B' }],
              },
            ],
          },
          { type: 'text', text: 'การนัดหมายของคุณถูกยกเลิกแล้ว', size: 'xs', color: '#4e4f52', margin: 'lg', wrap: true },
          { type: 'box', layout: 'vertical', height: '1px', backgroundColor: '#E5E7EB', margin: 'lg', contents: [] },
          {
            type: 'box', layout: 'vertical', margin: 'lg', spacing: 'md',
            contents: [
              flexRow('บริการ', data.serviceName),
              flexRow('วันที่', dateLabel),
              flexRow('เวลา', `${data.time} น.`),
              ...(data.reason ? [
                { type: 'separator', color: '#E5E7EB' },
                { ...flexRow('เหตุผล', data.reason), contents: [
                  { type: 'text', text: 'เหตุผล', size: 'sm', color: '#6B7280', flex: 3 },
                  { type: 'text', text: data.reason, size: 'sm', weight: 'bold', color: '#DC2626', align: 'end', flex: 5, wrap: true },
                ]},
              ] : []),
            ],
          },
          {
            type: 'box', layout: 'vertical', margin: 'xl', paddingAll: '12px',
            backgroundColor: '#FEF2F2', cornerRadius: '10px',
            contents: [
              { type: 'text', text: 'หากมีข้อสงสัยสามารถสอบถามได้ทางข้อความ', size: 'xs', color: '#991B1B', align: 'center', wrap: true },
            ],
          },
        ],
      },
    },
  }
}