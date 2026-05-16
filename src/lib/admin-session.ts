import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const COOKIE_NAME = 'admin_session'

export type AdminSession = {
  lineUserId:  string
  displayName: string
  branchId:    number
  branchName:  string
  groupId:     string
}

export async function setAdminSession(s: AdminSession) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, JSON.stringify(s), {
    httpOnly: true, secure: true, sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, path: '/',
  })
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as AdminSession
    if (!s.lineUserId || !s.branchId || !s.groupId) return null

    const supabase = await createClient()
    const { data: branch } = await supabase
      .from('branches')
      .select('id, name, line_admin_group_id')
      .eq('id', s.branchId)
      .single()

    if (!branch || branch.line_admin_group_id !== s.groupId) return null
    return s
  } catch { return null }
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) redirect('/admin-login')
  return session
}
