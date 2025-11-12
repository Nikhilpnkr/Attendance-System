export default function Loading() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="h-7 w-56 bg-gray-200 rounded mb-4 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-9 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
