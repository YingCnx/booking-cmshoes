import { createClient } from '@/utils/supabase/server'
import { getLineSession } from '@/lib/line-session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookingForm } from './BookingForm'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ date?: string; time?: string }>
}

export default async function ConfirmPage({ searchParams }: Props) {
  const { date, time } = await searchParams

  if (!date || !time) redirect('/service')

  const session = await getLineSession()
  if (!session) redirect(`/liff?next=/confirm?date=${date}&time=${time}`)

  const supabase = await createClient()

  const [
    { data: branch },
    { data: existing },
  ] = await Promise.all([
    supabase.from('branches').select('id, name').eq('id', session.branchId).single(),
    supabase.from('customers')
      .select('name, phone, location')
      .eq('line_user_id', session.lineUserId)
      .maybeSingle(),
  ])

  if (!branch) redirect('/service')

  const dateLabel = new Date(date).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const defaultName     = existing?.name     ?? session.displayName ?? ''
  const defaultPhone    = existing?.phone    ?? ''
  const defaultLocation = existing?.location ?? ''

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <Link href={`/service/pickup?date=${date}`}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-900">ยืนยันการจอง</h1>
          <div className="w-9" />
        </div>
      </div>

      <BookingForm
        time={time}
        date={date}
        dateLabel={dateLabel}
        branchName={branch.name}
        hasLine={!!session.lineUserId}
        defaults={{
          name: defaultName,
          phone: defaultPhone,
          location: defaultLocation,
        }}
      />

    </main>
  )
}
