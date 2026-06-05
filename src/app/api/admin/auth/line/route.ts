import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { setAdminSession } from '@/lib/admin-session'
import { getBranchLineCredentials } from '@/lib/line'

async function checkGroupMembership(groupId: string, userId: string, accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.line.me/v2/bot/group/${groupId}/member/${userId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    return res.ok
  } catch { return false }
}

export async function POST(req: Request) {
  const { lineUserId, displayName, groupId } = await req.json()
  // 🔍 DEBUG: log LINE User ID เพื่อนำไปเพิ่มใน employees table
  console.log(`[admin-auth] lineUserId=${lineUserId} displayName=${displayName} groupId=${groupId}`)
  if (!lineUserId || !groupId) {
    return NextResponse.json({ error: 'lineUserId และ groupId required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, line_admin_group_id')
    .eq('line_admin_group_id', groupId)
    .maybeSingle()

  if (!branch) return NextResponse.json({ error: 'ไม่พบร้านที่ตรงกับกลุ่ม' }, { status: 404 })

  const creds = await getBranchLineCredentials(branch.id)
  if (!creds.accessToken) {
    return NextResponse.json({ error: 'LINE not configured' }, { status: 500 })
  }

  const isMember = await checkGroupMembership(groupId, lineUserId, creds.accessToken)
  if (!isMember) {
    return NextResponse.json({ error: 'คุณไม่ได้อยู่ในกลุ่มนี้' }, { status: 403 })
  }

  await setAdminSession({
    lineUserId,
    displayName: displayName ?? '',
    branchId: branch.id,
    branchName: branch.name,
    groupId,
  })

  return NextResponse.json({ ok: true, branchId: branch.id, branchName: branch.name })
}
