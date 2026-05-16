import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const { lineUserId, displayName, pictureUrl, liffId } = await req.json()

  if (!lineUserId || !liffId) {
    return NextResponse.json({ message: 'lineUserId และ liffId required' }, { status: 400 })
  }

  // หา branch จาก liffId
  const supabase = await createClient()
  const { data: branch } = await supabase
    .from('branches')
    .select('id')
    .eq('line_liff_id', liffId)
    .maybeSingle()

  if (!branch) {
    return NextResponse.json({ message: 'ไม่พบสาขาที่ตรงกับ LIFF นี้' }, { status: 404 })
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
