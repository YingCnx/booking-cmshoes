'use client'

import { useState } from 'react'

type Props = {
  appointmentId: number
  currentStatus: string
  lineUserId: string | null
  branchId: number
  notifyData: {
    serviceName: string
    date: string
    time: string
    location: string
    shoeCount: number
  }
}

type ActionType = 'confirm' | 'cancel' | null

const ACTION_CONFIG: Record<Exclude<ActionType, null>, {
  newStatus: string
  title: string
  desc: string
  btnText: string
  btnClass: string
  loadingText: string
}> = {
  confirm: {
    newStatus: 'ยืนยันแล้ว',
    title: 'ยืนยันการจอง?',
    desc: 'ระบบจะแจ้งลูกค้าผ่าน LINE ทันที',
    btnText: 'ยืนยัน',
    btnClass: 'bg-emerald-600 hover:bg-emerald-500',
    loadingText: 'กำลังยืนยัน...',
  },
  cancel: {
    newStatus: 'ยกเลิก',
    title: 'ยกเลิกการจอง?',
    desc: 'ระบบจะแจ้งลูกค้าผ่าน LINE และไม่สามารถกู้คืนได้',
    btnText: 'ยกเลิกการจอง',
    btnClass: 'bg-red-600 hover:bg-red-500',
    loadingText: 'กำลังยกเลิก...',
  },
}

export function AppointmentActions({ appointmentId, currentStatus, lineUserId, branchId, notifyData }: Props) {
  const [pendingAction, setPendingAction] = useState<ActionType>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function executeAction() {
    if (!pendingAction) return
    const config = ACTION_CONFIG[pendingAction]
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/booking-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          status: config.newStatus,
          lineUserId,
          branchId,
          notifyData,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'อัพเดตไม่สำเร็จ')
        setLoading(false)
        return
      }
      window.location.reload()
    } catch {
      setError('เกิดข้อผิดพลาด')
      setLoading(false)
    }
  }

  // ✅ ไม่แสดงปุ่มถ้า status เป็น ยืนยันแล้ว / เสร็จสิ้น / ยกเลิก
  if (currentStatus !== 'รอดำเนินการ') {
    return null
  }

  return (
    <>
      <div className="space-y-2">
        <button onClick={() => setPendingAction('confirm')}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition">
          ✓ ยืนยันการจอง
        </button>
        <button onClick={() => setPendingAction('cancel')}
          className="w-full py-3 border border-red-800 text-red-400 font-medium rounded-2xl hover:bg-red-950/30 transition">
          ✕ ยกเลิกการจอง
        </button>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
      </div>

      {/* Confirm Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-5">
              <h3 className="text-lg font-bold text-white">{ACTION_CONFIG[pendingAction].title}</h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                {ACTION_CONFIG[pendingAction].desc}
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setPendingAction(null)} disabled={loading}
                className="flex-1 py-3 border border-zinc-700 text-zinc-400 text-sm font-medium rounded-xl disabled:opacity-50">
                กลับ
              </button>
              <button onClick={executeAction} disabled={loading}
                className={`flex-1 py-3 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition ${ACTION_CONFIG[pendingAction].btnClass}`}>
                {loading ? ACTION_CONFIG[pendingAction].loadingText : ACTION_CONFIG[pendingAction].btnText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
