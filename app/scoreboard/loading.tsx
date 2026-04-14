export default function ScoreboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 mt-4">
        <div>
          <div className="h-8 w-64 bg-dark-s1 rounded-lg mb-2 border border-dark-border" />
          <div className="h-4 w-96 bg-dark-s1 rounded border border-dark-border" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-dark-s1 rounded-lg border border-dark-border" />
          <div className="h-9 w-28 bg-dark-s1 rounded-lg border border-dark-border" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-dark-s1 rounded-lg border border-dark-border shrink-0" />
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-dark-s1 border border-dark-border rounded-xl p-5 h-48 flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-dark-s2" />
              <div className="h-6 w-3/4 bg-dark-s2 rounded" />
            </div>
            
            <div className="space-y-4">
              <div className="h-2 w-full bg-dark-s2 rounded" />
              <div className="flex justify-between">
                <div className="h-4 w-1/3 bg-dark-s2 rounded" />
                <div className="h-4 w-1/4 bg-dark-s2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
