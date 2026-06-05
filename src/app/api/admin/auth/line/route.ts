import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { setAdminSession } from '@/lib/admin-session'

export async function POST(req: Request) {
  const { lineUserId, displayName } = await req.json()
  if (!lineUserId) {
    return NextResponse.json({ error: 'lineUserId required' }, { status: 400 })
  }

  const supabase = await createClient()

  // ✅ เช็คจาก employees table โดยตรง ไม่ต้องพึ่ง groupId อีกต่อไป
  const { data: employee } = await supabase
    .from('employees')
    .select('id, name, role, branch_id, branches(name)')
    .eq('line_user_id', lineUserId)
    .maybeSingle()

  if (!employee) {
    return NextResponse.json({ error: 'ไม่พบข้อมูลพนักงาน กรุณาติดต่อแอดมิน' }, { status: 403 })
  }

  const branchName = (employee.branches as any)?.name ?? ''

  await setAdminSession({
    lineUserId,
    displayName: displayName ?? employee.name ?? '',
    branchId: employee.branch_id,
    branchName,
    groupId: '',
  })

  return NextResponse.json({ ok: true, branchId: employee.branch_id, branchName })
}
