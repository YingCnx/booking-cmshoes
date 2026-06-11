import { NextResponse } from 'next/server'
import {
  getBranchLineCredentials,
  pushMessage,
  buildAdminNotifyFlex,
  buildBookingPendingFlex,
  buildBookingConfirmedFlex,
  buildBookingCancelledFlex,
  buildShoeReceivedFlex,
} from '@/lib/line'

export async function POST(req: Request) {
  const { type, branchId, data } = await req.json()

  if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 })

  const creds = await getBranchLineCredentials(branchId)

  if (!creds.accessToken) {
    console.error('[notify] ✗ no access token')
    return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })
  }

  if (type === 'booking_pending') {
    if (creds.adminGroupId) {
      await pushMessage(
        creds.adminGroupId,
        [buildAdminNotifyFlex({ ...data, adminGroupId: creds.adminGroupId })],
        creds.accessToken
      )
    }
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
  } else if (type === 'shoe_received') {
    if (data.lineUserId) {
      const liffUrl = creds.liffId ? `https://liff.line.me/${creds.liffId}` : ''
      await pushMessage(data.lineUserId, [buildShoeReceivedFlex({ ...data, liffUrl })], creds.accessToken)
    }
  }

  return NextResponse.json({ ok: true })
}
