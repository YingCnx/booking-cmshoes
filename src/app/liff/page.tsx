import { LiffGate } from './LiffGate'

type Props = { searchParams: Promise<{ next?: string; liffId?: string }> }

export default async function LiffPage({ searchParams }: Props) {
  const { next, liffId: queryLiffId } = await searchParams
  const defaultLiffId = process.env.NEXT_PUBLIC_DEFAULT_LIFF_ID ?? ''
  const rewardsLiffId = process.env.NEXT_PUBLIC_REWARDS_LIFF_ID ?? ''
  const redirectTo = next ?? '/service'
  const liffId = queryLiffId || (redirectTo === '/rewards' ? rewardsLiffId : '') || defaultLiffId

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-6">
      <LiffGate liffId={liffId} redirectTo={redirectTo} />
    </main>
  )
}
