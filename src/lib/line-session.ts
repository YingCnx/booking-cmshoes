import { cookies } from 'next/headers'

export type LineSession = {
  lineUserId:  string
  displayName: string
  pictureUrl:  string
  branchId:    number   // ✅ ใช้ branchId แทน shopId (cm มีร้านเดียว)
}

export async function getLineSession(): Promise<LineSession | null> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('line_session')?.value
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LineSession>
    if (!parsed.lineUserId || !parsed.branchId) return null
    return {
      lineUserId:  parsed.lineUserId,
      displayName: parsed.displayName ?? '',
      pictureUrl:  parsed.pictureUrl ?? '',
      branchId:    parsed.branchId,
    }
  } catch {
    return null
  }
}
