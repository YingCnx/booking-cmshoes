import { NextResponse } from 'next/server'
import {
  getBranchLineCredentials,
  pushMessage,
  buildAdminNotifyFlex,
  buildBookingPendingFlex,
  buildBookingConfirmedFlex,
  buildBookingCancelledFlex,
} from '@/lib/line'

export async function POST(req: Request) {
  const { type, branchId, data } = await req.json()
  if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 })

  const creds = await getBranchLineCredentials(branchId)
  if (!creds.accessToken) {
    return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })
  }

  if (type === 'booking_pending') {
    // 1. แจ้ง admin group
    if (creds.adminGroupId) {
      await pushMessage(
        creds.adminGroupId,
        [buildAdminNotifyFlex({ ...data, adminGroupId: creds.adminGroupId })],
        creds.accessToken
      )
    }
    // 2. แจ้งลูกค้า (1:1)
    if (data.lineUserId) {
      await pushMessage(data.lineUserId, [buildBookingPendingFlex(data)], creds.accessToken)
    }
  } else if (type === 'booking_confirmed') {
    if (data.lineUserId) {
      await pushMessage(data.lineUserId, [buildBookingConfirmedFlex(data)], creds.accessToken)
    }
  } else if (type === 'booking_cancelled') {
    if (data.lineUserId) {
      await pushMessage(data.lineUserId, [buildBookingCancelledFlex(data)], creds.accessToken)
    }
  }

  return NextResponse.json({ ok: true })
}
