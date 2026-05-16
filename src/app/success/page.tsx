import { CloseButton } from './CloseButton'

type Props = {
  searchParams: Promise<{ pending?: string }>
}

export default async function SuccessPage({ searchParams }: Props) {
  const { pending } = await searchParams
  const isPending = pending === 'true'

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">{isPending ? '⏳' : '✅'}</div>
        <h1 className="text-xl font-bold text-gray-900">
          {isPending ? 'ส่งคำขอจองสำเร็จ' : 'การจองสำเร็จ'}
        </h1>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">
          {isPending
            ? 'ร้านจะติดต่อกลับเพื่อยืนยันการจอง\nกรุณารอข้อความใน LINE'
            : 'ขอบคุณที่ใช้บริการ'}
        </p>
        <div className="mt-8">
          <CloseButton />
        </div>
      </div>
    </main>
  )
}
