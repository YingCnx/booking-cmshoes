export default function ConfirmLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Summary card */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 px-5 py-5">
            <div className="h-8 w-32 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-700 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Form skeleton */}
        <div className="bg-white rounded-3xl border border-gray-100 px-5 py-5 shadow-sm space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-gray-100 rounded mb-2 animate-pulse"></div>
              <div className="h-12 bg-gray-50 border border-gray-100 rounded-2xl animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
