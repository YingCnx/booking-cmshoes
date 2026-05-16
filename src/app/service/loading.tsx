export default function ServiceLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 pt-14 pb-10">
        <div className="h-3 w-20 bg-gray-700 rounded mb-3 animate-pulse"></div>
        <div className="h-8 w-48 bg-gray-700 rounded animate-pulse"></div>
        <div className="h-4 w-32 bg-gray-700 rounded mt-3 animate-pulse"></div>
      </div>

      {/* Card skeleton */}
      <div className="px-4 py-6 max-w-lg mx-auto -mt-4">
        <div className="bg-white rounded-3xl border border-gray-100 px-5 py-5 shadow-sm">
          <div className="h-8 w-8 bg-gray-100 rounded mb-3 animate-pulse"></div>
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-56 bg-gray-100 rounded mt-2 animate-pulse"></div>
        </div>
      </div>
    </main>
  )
}
