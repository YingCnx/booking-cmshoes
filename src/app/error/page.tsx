type Props = {
  searchParams: Promise<{ message?: string }>
}

export default async function ErrorPage({ searchParams }: Props) {
  const { message } = await searchParams
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-3">⚠️</div>
        <h1 className="text-lg font-bold text-gray-900">เกิดข้อผิดพลาด</h1>
        <p className="text-sm text-gray-500 mt-3">{message ?? 'ระบบมีปัญหา กรุณาลองใหม่'}</p>
      </div>
    </main>
  )
}
