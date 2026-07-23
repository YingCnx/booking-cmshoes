import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const { lineUserId, displayName, pictureUrl, liffId } = await req.json()

  if (!lineUserId || !liffId) {
    return NextResponse.json({ message: 'lineUserId and liffId required' }, { status: 400 })
  }

  const defaultLiffId = process.env.NEXT_PUBLIC_DEFAULT_LIFF_ID ?? ''
  const rewardsLiffId = process.env.NEXT_PUBLIC_REWARDS_LIFF_ID ?? ''
  const branchLookupLiffId = liffId === rewardsLiffId && defaultLiffId ? defaultLiffId : liffId

  const supabase = await createClient()
  let { data: branch } = await supabase
    .from('branches')
    .select('id')
    .eq('line_liff_id', branchLookupLiffId)
    .maybeSingle()

  if (!branch && branchLookupLiffId !== defaultLiffId && defaultLiffId) {
    const fallback = await supabase
      .from('branches')
      .select('id')
      .eq('line_liff_id', defaultLiffId)
      .maybeSingle()

    branch = fallback.data
  }

  if (!branch) {
    return NextResponse.json({ message: 'Branch not found for this LIFF app' }, { status: 404 })
  }

  const sessionData = {
    lineUserId,
    displayName: displayName ?? '',
    pictureUrl:  pictureUrl ?? '',
    branchId:    branch.id,
  }

  const cookieStore = await cookies()
  cookieStore.set('line_session', JSON.stringify(sessionData), {
    httpOnly: true, secure: true, sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, path: '/',
  })

  return NextResponse.json({ ok: true, branchId: branch.id })
}
