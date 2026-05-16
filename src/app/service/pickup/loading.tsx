export default function PickupLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-9 h-9 bg-gray-100 rounded-full animate-pulse"></div>
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-gray-100 rounded mt-2 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Date skeleton */}
        <div>
          <div className="h-3 w-20 bg-gray-200 rounded mb-3 animate-pulse"></div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Time slots skeleton */}
        <div>
          <div className="h-3 w-20 bg-gray-200 rounded mb-3 animate-pulse"></div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-11 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
