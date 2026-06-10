'use client'

import { useState } from 'react'

type Props = {
  appointmentId: number
  currentStatus: string
  appointmentType: string
  lineUserId: string | null
  branchId: number
  appointmentDate: string
  appointmentTime: string
  notifyData: {
    serviceName: string
    date: string
    time: string
    location: string
    shoeCount: number
  }
}

type ActionType = 'confirm' | 'receive' | 'cancel' | null

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
  receive: {
    newStatus: 'สำเร็จ',
    title: 'รับรองเท้าเข้าร้านแล้ว?',
    desc: 'ยืนยันว่ารับรองเท้าจากลูกค้าเรียบร้อยแล้ว',
    btnText: 'รับรองเท้าแล้ว',
    btnClass: 'bg-blue-600 hover:bg-blue-500',
    loadingText: 'กำลังบันทึก...',
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

export function AppointmentActions({ appointmentId, currentStatus, appointmentType, lineUserId, branchId, appointmentDate, appointmentTime, notifyData }: Props) {
  const [pendingAction, setPendingAction] = useState<ActionType>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showReschedule, setShowReschedule] = useState(false)
  const [newDate, setNewDate] = useState(appointmentDate)
  const [newTime, setNewTime] = useState(appointmentTime)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [rescheduleError, setRescheduleError] = useState('')

  async function executeReschedule() {
    if (!newDate || !newTime) return
    setRescheduleLoading(true)
    setRescheduleError('')
    try {
      const res = await fetch('/api/admin/reschedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, date: newDate, time: newTime }),
      })
      if (!res.ok) {
        const data = await res.json()
        setRescheduleError(data.error ?? 'อัปเดตไม่สำเร็จ')
        setRescheduleLoading(false)
        return
      }
      window.location.reload()
    } catch {
      setRescheduleError('เกิดข้อผิดพลาด')
      setRescheduleLoading(false)
    }
  }

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
          ...(pendingAction === 'cancel' && cancelReason.trim() ? { reason: cancelReason.trim() } : {}),
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

  // ไม่แสดงปุ่มถ้าสำเร็จ / เสร็จสิ้น / ยกเลิก แล้ว
  if (['สำเร็จ', 'เสร็จสิ้น', 'ยกเลิก'].includes(currentStatus)) {
    return null
  }

  const isPickup = appointmentType === 'pickup'

  return (
    <>
      <div className="space-y-2">

        {/* รอดำเนินการ → ยืนยัน + เปลี่ยนเวลา */}
        {currentStatus === 'รอดำเนินการ' && (
          <>
            <button onClick={() => setPendingAction('confirm')}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition">
              ✓ ยืนยันการจอง
            </button>
            <button onClick={() => setShowReschedule(true)}
              className="w-full py-3 border border-zinc-700 text-zinc-300 font-medium rounded-2xl hover:bg-zinc-800 transition">
              ⏰ เปลี่ยนวันเวลา
            </button>
          </>
        )}

        {/* ยืนยันแล้ว + นัดรับ → รับรองเท้าแล้ว */}
        {currentStatus === 'ยืนยันแล้ว' && isPickup && (
          <button onClick={() => setPendingAction('receive')}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition">
            👟 รับรองเท้าแล้ว
          </button>
        )}

        {/* ยืนยันแล้ว + นัดส่ง → แจ้งให้ทำที่ Desktop */}
        {currentStatus === 'ยืนยันแล้ว' && !isPickup && (
          <div className="w-full py-4 border border-blue-800 text-blue-400 text-sm text-center rounded-2xl">
            นัดส่ง — กรุณาอัพเดทสถานะที่ระบบหลัก
          </div>
        )}

        {/* ยกเลิก (ทุก status) */}
        {currentStatus !== 'ยืนยันแล้ว' || isPickup ? (
          <button onClick={() => setPendingAction('cancel')}
            className="w-full py-3 border border-red-800 text-red-400 font-medium rounded-2xl hover:bg-red-950/30 transition">
            ✕ ยกเลิกการจอง
          </button>
        ) : (
          <button onClick={() => setPendingAction('cancel')}
            className="w-full py-3 border border-red-800 text-red-400 font-medium rounded-2xl hover:bg-red-950/30 transition">
            ✕ ยกเลิกการจอง
          </button>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
      </div>

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-5 space-y-4">
              <h3 className="text-lg font-bold text-white">เปลี่ยนวันเวลา</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">วันที่ใหม่</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    disabled={rescheduleLoading}
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">เวลาใหม่</label>
                  <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                    disabled={rescheduleLoading}
                    className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 disabled:opacity-50" />
                </div>
              </div>
              {rescheduleError && (
                <p className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-xl px-3 py-2">
                  {rescheduleError}
                </p>
              )}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => { setShowReschedule(false); setRescheduleError('') }} disabled={rescheduleLoading}
                className="flex-1 py-3 border border-zinc-700 text-zinc-400 text-sm font-medium rounded-xl disabled:opacity-50">
                กลับ
              </button>
              <button onClick={executeReschedule} disabled={rescheduleLoading || !newDate || !newTime}
                className="flex-1 py-3 bg-zinc-600 hover:bg-zinc-500 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition">
                {rescheduleLoading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              {pendingAction === 'cancel' && (
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value.slice(0, 200))}
                  placeholder="เหตุผลการยกเลิก (ถ้ามี)"
                  rows={3}
                  disabled={loading}
                  className="mt-3 w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 resize-none disabled:opacity-50"
                />
              )}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => { setPendingAction(null); setCancelReason('') }} disabled={loading}
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
