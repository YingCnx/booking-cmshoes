const BANGKOK_TZ = 'Asia/Bangkok'

export function nowInBangkok(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: BANGKOK_TZ }))
}

export function todayInBangkok(): string {
  const now = nowInBangkok()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function currentMinutesInBangkok(): number {
  const now = nowInBangkok()
  return now.getHours() * 60 + now.getMinutes()
}

export function generateDates(daysAhead: number = 7): string[] {
  const dates: string[] = []
  const today = nowInBangkok()
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return dates
}
