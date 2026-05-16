import { LiffGate } from './LiffGate'

type Props = { searchParams: Promise<{ next?: string }> }

export default async function LiffPage({ searchParams }: Props) {
  const { next } = await searchParams
  const liffId = process.env.NEXT_PUBLIC_DEFAULT_LIFF_ID ?? ''
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-6">
      <LiffGate liffId={liffId} redirectTo={next ?? '/service'} />
    </main>
  )
}
