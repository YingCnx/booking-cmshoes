import { getStatusStyle, QUEUE_STATUSES } from '@/lib/queue-status'

type Queue = {
  id: number
  status: string
  queue_number: string | null
  created_at: string
  total_amount: number | null
  due_date: string | null
  queue_items: { id: number }[]
}

type Props = { queues: Queue[] }

export function QueueList({ queues }: Props) {
  if (queues.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 px-5 py-10 text-center shadow-sm">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-gray-500 text-sm">ยังไม่มีรายการที่กำลังดำเนินการ</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {queues.map(q => {
        const style = getStatusStyle(q.status)
        const totalSteps = 5
        const itemCount = q.queue_items?.length ?? 0
        const dateLabel = q.created_at
          ? new Date(q.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
          : ''
        const dueLabel = q.due_date
          ? new Date(q.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
          : null

        return (
          <div key={q.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-400 font-mono">
                  {q.queue_number ?? `Queue #${q.id}`}
                </div>
                <div className="font-bold text-gray-900 mt-1">{itemCount} คู่</div>
                <div className="text-xs text-gray-400 mt-0.5">เข้ารับ {dateLabel}</div>
              </div>
              {q.total_amount && q.total_amount > 0 ? (
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 tabular-nums">฿{q.total_amount.toLocaleString()}</div>
                </div>
              ) : null}
            </div>

            {/* Status badge */}
            <div className="px-5 pb-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}>
                <span>{style.icon}</span>
                <span>{q.status}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-1">
                {QUEUE_STATUSES.map((_, idx) => {
                  const stepNum = idx + 1
                  const isActive = stepNum <= style.step
                  const isCurrent = stepNum === style.step
                  return (
                    <div key={idx}
                      className={`flex-1 h-1.5 rounded-full transition ${
                        isCurrent
                          ? 'bg-gray-900'
                          : isActive
                          ? 'bg-gray-700'
                          : 'bg-gray-100'
                      }`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium">
                <span>รับเข้า</span>
                <span>ซัก</span>
                <span>เตรียมส่ง</span>
                <span>จัดส่ง</span>
                <span>สำเร็จ</span>
              </div>
            </div>

            {/* Due date */}
            {dueLabel && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
                <span className="font-medium">📅 รับกลับ:</span> {dueLabel}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
