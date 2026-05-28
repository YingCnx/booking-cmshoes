// ============================================
// Queue status — แสดงผลและสีตาม status
// ============================================

export const QUEUE_STATUSES = [
  'รับเข้า',
  'อยู่ระหว่างทำความสะอาด',
  'เตรียมส่ง',
  'กำลังจัดส่ง',
  'จัดส่งสำเร็จ',
] as const

export type QueueStatus = typeof QUEUE_STATUSES[number]

// สถานะที่แสดงในหน้า /status (ไม่รวม จัดส่งสำเร็จ)
export const ACTIVE_QUEUE_STATUSES: QueueStatus[] = [
  'รับเข้า',
  'อยู่ระหว่างทำความสะอาด',
  'เตรียมส่ง',
  'กำลังจัดส่ง',
]

// สี + icon ของแต่ละ status
type StatusStyle = {
  bg: string
  text: string
  border: string
  icon: string
  step: number  // ลำดับ 1-5
}

export const STATUS_STYLE: Record<string, StatusStyle> = {
  'รับเข้า':              { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  icon: '📥', step: 1 },
  'กำลังทำความสะอาด':     { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   icon: '🧼', step: 2 },
  'เตรียมส่ง':            { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '📦', step: 3 },
  'กำลังจัดส่ง':          { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200',   icon: '🚚', step: 4 },
  'จัดส่งสำเร็จ':         { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✅', step: 5 },
}

export function getStatusStyle(status: string): StatusStyle {
  return STATUS_STYLE[status] ?? {
    bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200',
    icon: '•', step: 0,
  }
}
