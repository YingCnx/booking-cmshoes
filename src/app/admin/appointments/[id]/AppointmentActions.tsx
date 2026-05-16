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

export function AppointmentActions({ appointmentId, currentStatus, lineUserId, branchId, notifyData }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function updateStatus(newStatus: string, label: string) {
    if (!confirm(`${label}?`)) return
    setLoading(newStatus)
    setError('')
    try {
      const res = await fetch('/api/admin/booking-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          status: newStatus,
          lineUserId,
          branchId,
          notifyData,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'อัพเดตไม่สำเร็จ')
        return
      }
      window.location.reload()
    } finally {
      setLoading(null)
    }
  }

  if (currentStatus === 'ยกเลิก' || currentStatus === 'เสร็จสิ้น') {
    return null
  }

  return (
    <div className="space-y-2">
      {currentStatus === 'รอดำเนินการ' && (
        <button onClick={() => updateStatus('ยืนยันแล้ว', 'ยืนยันการจอง')}
          disabled={loading !== null}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl disabled:opacity-50 transition">
          {loading === 'ยืนยันแล้ว' ? 'กำลังยืนยัน...' : '✓ ยืนยันการจอง'}
        </button>
      )}

      {currentStatus === 'ยืนยันแล้ว' && (
        <button onClick={() => updateStatus('เสร็จสิ้น', 'ทำเครื่องหมายเสร็จสิ้น')}
          disabled={loading !== null}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl disabled:opacity-50 transition">
          {loading === 'เสร็จสิ้น' ? 'กำลังบันทึก...' : '✓ ทำเครื่องหมายเสร็จสิ้น'}
        </button>
      )}

      <button onClick={() => updateStatus('ยกเลิก', 'ยกเลิกการจอง')}
        disabled={loading !== null}
        className="w-full py-3 border border-red-800 text-red-400 font-medium rounded-2xl disabled:opacity-50">
        {loading === 'ยกเลิก' ? 'กำลังยกเลิก...' : 'ยกเลิกการจอง'}
      </button>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-800 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
    </div>
  )
}
