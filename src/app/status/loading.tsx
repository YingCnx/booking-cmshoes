export default function StatusLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 pt-14 pb-10">
        <div className="h-3 w-20 bg-gray-700 rounded mb-3 animate-pulse"></div>
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 w-32 bg-gray-700 rounded mt-3 animate-pulse"></div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl border border-gray-100 px-5 py-5 shadow-sm">
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-5 w-32 bg-gray-200 rounded mt-2 animate-pulse"></div>
            <div className="h-2 w-full bg-gray-100 rounded mt-4 animate-pulse"></div>
          </div>
        ))}
      </div>
    </main>
  )
}
