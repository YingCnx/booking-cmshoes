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
const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  'ยืนยันแล้ว':  { bg: '#D1FAE5', text: '#065F46', label: 'ยืนยันแล้ว' },
  'ยกเลิก':      { bg: '#FEE2E2', text: '#991B1B', label: 'ยกเลิกแล้ว' },
  'สำเร็จ':      { bg: '#CCFBF1', text: '#0F766E', label: 'รับแล้ว' },
  'รอดำเนินการ': { bg: '#FEF3C7', text: '#92400E', label: 'รอยืนยัน' },
}
const statusStrip: Record<string, string> = {
  'ยืนยันแล้ว':  '#059669',
  'ยกเลิก':      '#DC2626',
  'สำเร็จ':      '#2ABFAB',
  'รอดำเนินการ': '#D97706',
}

export type DayAppointment = {
  customerName: string
  time: string
  location: string
  status: string
  appointmentType?: string | null
}

const aptTypeBadge: Record<string, { bg: string; text: string; label: string }> = {
  'pickup':   { bg: '#D1FAE5', text: '#065F46', label: 'นัดรับ' },
  'delivery': { bg: '#FEF3C7', text: '#92400E', label: 'นัดส่ง' },
}

export function buildAdminStatusChangeFlex(data: {
  customerName: string
  serviceName: string
  date: string
  time: string
  oldStatus: string
  newStatus: string
  appointmentId: number
  dayAppointments?: DayAppointment[]
}) {
  const dateLabel = new Date(data.date).toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const badge = statusBadge[data.newStatus] ?? { bg: '#F3F4F6', text: '#374151', label: data.newStatus }
  const strip = statusStrip[data.newStatus] ?? '#6B7280'

  const dayList = data.dayAppointments ?? []

  const bubble = {
    type: 'bubble',
    size: 'kilo',
    styles: {
      header: { separator: true, backgroundColor: '#FFFFFF' },
      body: { backgroundColor: '#FFFFFF' },
      footer: { separator: true, backgroundColor: '#FFFFFF' },
    },
    header: {
      type: 'box', layout: 'vertical', paddingAll: '0px',
      contents: [
        { type: 'box', layout: 'vertical', height: '4px', backgroundColor: strip, contents: [] },
        {
          type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'xs',
          contents: [
            { type: 'text', text: 'ร้านซักเกิบแอนด์สปา', size: 'sm', color: '#6B7280' },
            {
              type: 'box', layout: 'horizontal', margin: 'sm', alignItems: 'center',
              contents: [
                { type: 'text', text: 'สถานะเปลี่ยนแปลง', size: 'md', weight: 'bold', color: '#111827', flex: 1 },
                {
                  type: 'box', layout: 'vertical',
                  backgroundColor: badge.bg, cornerRadius: '16px',
                  paddingStart: '10px', paddingEnd: '10px', paddingTop: '4px', paddingBottom: '4px', flex: 0,
                  contents: [{ type: 'text', text: badge.label, size: 'xs', weight: 'bold', color: badge.text }],
                },
              ],
            },
            { type: 'text', text: data.customerName, size: 'lg', weight: 'bold', color: '#111827', margin: 'xs' },
            {
              type: 'box', layout: 'horizontal', margin: 'sm', alignItems: 'center', spacing: 'sm',
              contents: [
                { type: 'text', text: data.serviceName, size: 'xs', color: '#6B7280', flex: 1, wrap: true },
                { type: 'text', text: `${data.time} น.`, size: 'xs', color: '#6B7280', flex: 0 },
                { type: 'text', text: data.oldStatus, size: 'xs', color: '#9CA3AF', flex: 0 },
                { type: 'text', text: '→', size: 'xs', color: '#9CA3AF', flex: 0 },
                {
                  type: 'box', layout: 'vertical',
                  backgroundColor: badge.bg, cornerRadius: '10px',
                  paddingStart: '6px', paddingEnd: '6px', paddingTop: '2px', paddingBottom: '2px', flex: 0,
                  contents: [{ type: 'text', text: badge.label, size: 'xxs', weight: 'bold', color: badge.text }],
                },
              ],
            },
          ],
        },
      ],
    },
    body: {
      type: 'box', layout: 'vertical', paddingAll: '16px',
      contents: [
        {
          type: 'box', layout: 'horizontal', alignItems: 'center',
          contents: [
            { type: 'text', text: 'ภาพรวมวันนี้', size: 'sm', weight: 'bold', color: '#111827', flex: 1 },
            {
              type: 'box', layout: 'vertical',
              backgroundColor: '#F3F4F6', cornerRadius: '12px',
              paddingStart: '8px', paddingEnd: '8px', paddingTop: '3px', paddingBottom: '3px', flex: 0,
              contents: [{ type: 'text', text: `${dayList.filter(a => a.status !== 'ยกเลิก').length} รายการ`, size: 'xxs', weight: 'bold', color: '#374151' }],
            },
          ],
        },
        { type: 'text', text: dateLabel, size: 'xs', color: '#6B7280', margin: 'none' },
        { type: 'box', layout: 'vertical', height: '1px', backgroundColor: '#E5E7EB', margin: 'md', contents: [] },
        {
          type: 'box', layout: 'vertical', spacing: 'md',
          contents: dayList.filter(apt => apt.status !== 'ยกเลิก').slice(0, 8).map(apt => {
            const b = aptTypeBadge[apt.appointmentType ?? ''] ?? { bg: '#F3F4F6', text: '#374151', label: apt.appointmentType ?? '-' }
            return {
              type: 'box', layout: 'vertical', spacing: 'xs',
              contents: [
                {
                  type: 'box', layout: 'horizontal', alignItems: 'center',
                  contents: [
                    { type: 'text', text: apt.time, size: 'sm', weight: 'bold', color: '#111827', flex: 2 },
                    { type: 'text', text: apt.customerName, size: 'sm', color: '#111827', flex: 4, wrap: true },
                    {
                      type: 'box', layout: 'vertical',
                      backgroundColor: b.bg, cornerRadius: '10px',
                      paddingStart: '6px', paddingEnd: '6px', paddingTop: '2px', paddingBottom: '2px', flex: 0,
                      contents: [{ type: 'text', text: b.label, size: 'xxs', weight: 'bold', color: b.text }],
                    },
                  ],
                },
                { type: 'text', text: apt.location, size: 'xs', color: '#6B7280', wrap: true },
                { type: 'separator', color: '#F3F4F6' },
              ],
            }
          }),
        },
      ],
    },
    footer: {
      type: 'box', layout: 'vertical', paddingAll: '12px',
      contents: [{
        type: 'button', style: 'primary', color: '#2ABFAB', height: 'sm',
        action: { type: 'uri', label: 'ดูใน Dashboard', uri: adminUrl(data.appointmentId) },
      }],
    },
  }

  return {
    type: 'flex',
    altText: `[อัพเดท] ${data.customerName} → ${data.newStatus}`,
    contents: bubble,
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
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return {
    type: 'flex',
    altText: `นัดหมายใหม่ ${data.customerName} ${data.time} น.`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      styles: {
        header: { separator: true },
        body: { backgroundColor: '#FFFFFF' },
        footer: { separator: true, backgroundColor: '#FFFFFF' },
      },
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
              { type: 'text', text: 'นัดหมายใหม่', size: 'md', weight: 'bold', color: '#111827', flex: 1 },
              {
                type: 'box', layout: 'vertical',
                backgroundColor: '#FEF3C7', cornerRadius: '16px',
                paddingStart: '10px', paddingEnd: '10px', paddingTop: '4px', paddingBottom: '4px', flex: 0,
                contents: [{ type: 'text', text: 'รอยืนยัน', size: 'xs', weight: 'bold', color: '#92400E' }],
              },
            ],
          },
          { type: 'text', text: data.customerName, size: 'lg', weight: 'bold', color: '#111827', margin: 'sm' },
          { type: 'box', layout: 'vertical', height: '1px', backgroundColor: '#E5E7EB', margin: 'lg', contents: [] },
          {
            type: 'box', layout: 'vertical', margin: 'lg', spacing: 'md',
            contents: [
              flexRow('บริการ', data.serviceName),
              flexRow('วันที่', dateLabel),
              flexRow('เวลา', `${data.time} น.`),
              { ...flexRow('เบอร์', data.phone || '-'), contents: [
                { type: 'text', text: 'เบอร์', size: 'sm', color: '#6B7280', flex: 3 },
                { type: 'text', text: data.phone || '-', size: 'sm', weight: 'bold', color: '#2ABFAB', align: 'end', flex: 5 },
              ]},
              { type: 'separator', color: '#E5E7EB' },
              flexRow('สถานที่รับ', data.location),
              flexRow('จำนวน', `${data.shoeCount} คู่`),
            ],
          },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [
          {
            type: 'button', style: 'primary', color: '#2ABFAB', height: 'sm',
            action: { type: 'uri', label: 'ดูใน Dashboard', uri: adminUrl(data.appointmentId) },
          },
        ],
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

export function buildPickupConfirmedFlex(data: {
  serviceName: string
  date: string
  time: string
  location: string
  shoeCount: number
}) {
  const dateLabel = new Date(data.date).toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return {
    type: 'flex',
    altText: `ยืนยันนัดรับรองเท้า`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      styles: {
        header: { separator: true },
        body: { backgroundColor: '#FFFFFF' },
      },
      header: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '0px',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            height: '4px',
            backgroundColor: '#059669',
            contents: [],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: 'ร้านซักเกิบแอนด์สปา',
            size: 'sm',
            color: '#6B7280',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'sm',
            alignItems: 'center',
            contents: [
              {
                type: 'text',
                text: '📦 ยืนยันนัดรับรองเท้าแล้ว',
                size: 'md',
                weight: 'bold',
                color: '#111827',
                flex: 1,
                wrap: true,
              },
            ],
          },
          {
            type: 'text',
            text: 'ทางร้านยืนยันการเข้ารับรองเท้าของคุณแล้ว',
            size: 'xs',
            color: '#4e4f52',
            margin: 'lg',
            wrap: true,
          },
          {
            type: 'box',
            layout: 'vertical',
            height: '1px',
            backgroundColor: '#E5E7EB',
            margin: 'lg',
            contents: [],
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'md',
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
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            paddingAll: '12px',
            backgroundColor: '#F0FDF4',
            cornerRadius: '10px',
            contents: [
              {
                type: 'text',
                text: 'เจ้าหน้าที่จะติดต่อคุณก่อนเข้ารับรองเท้าตามเวลานัดหมาย',
                size: 'xs',
                color: '#065F46',
                align: 'center',
                wrap: true,
              },
            ],
          },
        ],
      },
    },
    
  }
}

//นัดส่งรองเท้า
export function buildDeliveryConfirmedFlex(data: {
  serviceName: string
  date: string
  time: string
  location: string
  shoeCount: number
}) {
  const dateLabel = new Date(data.date).toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return {
    type: 'flex',
    altText: `ยืนยันนัดส่งรองเท้า`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      styles: {
        header: { separator: true },
        body: { backgroundColor: '#FFFFFF' },
      },
      header: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '0px',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            height: '4px',
            backgroundColor: '#2563EB',
            contents: [],
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: 'ร้านซักเกิบแอนด์สปา',
            size: 'sm',
            color: '#6B7280',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'sm',
            alignItems: 'center',
            contents: [
              {
                type: 'text',
                text: 'นัดหมายจัดส่งรองเท้า',
                size: 'md',
                weight: 'bold',
                color: '#111827',
                flex: 1,
                wrap: true,
              },
            ],
          },
          {
            type: 'text',
            text: 'บันทึกนัดหมายจัดส่งรองเท้าให้คุณแล้ว',
            size: 'xs',
            color: '#4e4f52',
            margin: 'lg',
            wrap: true,
          },
          {
            type: 'box',
            layout: 'vertical',
            height: '1px',
            backgroundColor: '#E5E7EB',
            margin: 'lg',
            contents: [],
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'md',
            contents: [
             // flexRow('บริการ', data.serviceName),
              flexRow('บริการ', "จัดส่งรองเท้า"),
              flexRow('วันที่', dateLabel),
              flexRow('เวลา', `${data.time} น.`),
              { type: 'separator', color: '#E5E7EB' },
              flexRow('สถานที่ส่ง', data.location),
              flexRow('จำนวน', `${data.shoeCount} คู่`),
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xl',
            paddingAll: '12px',
            backgroundColor: '#EFF6FF',
            cornerRadius: '10px',
            contents: [
              {
                type: 'text',
                text: 'กรุณาเตรียมรับรองเท้าตามวันและเวลาที่นัดหมาย',
                size: 'xs',
                color: '#1D4ED8',
                align: 'center',
                wrap: true,
              },
            ],
          },
        ],
      },
    },
  }
}


// แจ้งลูกค้า — รับรองเท้าสำเร็จ
export function buildShoeReceivedFlex(data: {
  serviceName: string
  shoeCount: number
  receivedAt: string
  liffUrl: string
}) {
  const receivedDate = new Date(data.receivedAt)
  const dateLabel = receivedDate.toLocaleDateString('th-TH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const timeLabel = receivedDate.toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit',
  })

  return {
    type: 'flex',
    altText: 'รับรองเท้าสำเร็จ',
    contents: {
      type: 'bubble',
      size: 'kilo',
      styles: { header: { separator: true }, body: { backgroundColor: '#FFFFFF' }, footer: { separator: true, backgroundColor: '#FFFFFF' } },
      header: {
        type: 'box', layout: 'vertical', paddingAll: '0px',
        contents: [
          { type: 'box', layout: 'vertical', height: '4px', backgroundColor: '#2ABFAB', contents: [] },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px',
        contents: [
          { type: 'text', text: 'ร้านซักเกิบแอนด์สปา', size: 'sm', color: '#6B7280' },
          {
            type: 'box', layout: 'horizontal', margin: 'sm', alignItems: 'center',
            contents: [
              { type: 'text', text: 'รับรองเท้าสำเร็จ', size: 'md', weight: 'bold', color: '#111827', flex: 1, wrap: true },
              {
                type: 'box', layout: 'vertical',
                backgroundColor: '#CCFBF1', cornerRadius: '16px',
                paddingStart: '10px', paddingEnd: '10px', paddingTop: '4px', paddingBottom: '4px', flex: 0,
                contents: [{ type: 'text', text: 'รับแล้ว', size: 'xs', weight: 'bold', color: '#0F766E' }],
              },
            ],
          },
          { type: 'text', text: `เมื่อ ${dateLabel} เวลา ${timeLabel} น.`, size: 'xs', color: '#4e4f52', margin: 'lg', wrap: true },
          { type: 'box', layout: 'vertical', height: '1px', backgroundColor: '#E5E7EB', margin: 'lg', contents: [] },
          {
            type: 'box', layout: 'vertical', margin: 'lg', spacing: 'md',
            contents: [
              flexRow('บริการ', data.serviceName),
              flexRow('จำนวน', `${data.shoeCount} คู่`),
            ],
          },
          {
            type: 'box', layout: 'vertical', margin: 'xl', paddingAll: '12px',
            backgroundColor: '#F0FDFA', cornerRadius: '10px',
            contents: [
              { type: 'text', text: 'สามารถตรวจสอบสถานะรองเท้าของคุณได้ที่ปุ่มด้านล่าง', size: 'xs', color: '#0F766E', align: 'center', wrap: true },
            ],
          },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [
          {
            type: 'button', style: 'primary', color: '#2ABFAB', height: 'sm',
            action: { type: 'message', label: 'เช็คสถานะรองเท้า', text: 'เช็คสถานะ' },
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
