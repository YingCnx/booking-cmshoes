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

  console.log('[notify] ▶ type:', type, 'branchId:', branchId, 'lineUserId:', data?.lineUserId)

  if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 })

  const creds = await getBranchLineCredentials(branchId)
  console.log('[notify] creds:', {
    hasToken: !!creds.accessToken,
    hasGroupId: !!creds.adminGroupId,
  })

  if (!creds.accessToken) {
    console.error('[notify] ✗ no access token')
    return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })
  }

  if (type === 'booking_pending') {
    if (creds.adminGroupId) {
      console.log('[notify] → admin group')
      const ok = await pushMessage(
        creds.adminGroupId,
        [buildAdminNotifyFlex({ ...data, adminGroupId: creds.adminGroupId })],
        creds.accessToken
      )
      console.log('[notify] admin push result:', ok)
    }
    if (data.lineUserId) {
      console.log('[notify] → customer (1:1) pending')
      const ok = await pushMessage(data.lineUserId, [buildBookingPendingFlex(data)], creds.accessToken)
      console.log('[notify] customer push result:', ok)
    }
  } else if (type === 'booking_confirmed') {
    if (data.lineUserId) {
      console.log('[notify] → customer confirmed')
      const ok = await pushMessage(data.lineUserId, [buildBookingConfirmedFlex(data)], creds.accessToken)
      console.log('[notify] confirmed push result:', ok)
    }
  } else if (type === 'booking_cancelled') {
    if (data.lineUserId) {
      console.log('[notify] → customer cancelled')
      const ok = await pushMessage(data.lineUserId, [buildBookingCancelledFlex(data)], creds.accessToken)
      console.log('[notify] cancelled push result:', ok)
    }
  } else {
    console.log('[notify] ⚠ unknown type:', type)
  }

  return NextResponse.json({ ok: true })
}
