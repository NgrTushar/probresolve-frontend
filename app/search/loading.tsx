export default function SearchLoading() {
  return (
    <div className="animate-pulse">
      {/* Search Bar Skeleton */}
      <div className="mb-6 flex max-w-xl">
        <div className="flex-1 h-10 bg-dark-s1 border border-dark-border rounded-l-md" />
        <div className="h-10 w-24 bg-dark-s2 rounded-r-md border-y border-r border-dark-border" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-dark-s1 rounded-lg border border-dark-border shrink-0" />
        ))}
      </div>

      <div className="h-6 w-48 bg-dark-s1 rounded mb-4" />

      {/* Problem Cards Skeleton */}
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="block bg-dark-s0 border border-dark-border rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-16 bg-dark-s1 rounded" />
                  <div className="h-3 w-3 bg-dark-s2 rounded-full" />
                  <div className="h-4 w-32 bg-dark-s1 rounded" />
                </div>
                <div className="h-6 w-3/4 bg-dark-s1 rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-dark-s1 rounded" />
                  <div className="h-4 w-5/6 bg-dark-s1 rounded" />
                  <div className="h-4 w-2/3 bg-dark-s1 rounded" />
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="h-6 w-24 bg-dark-s2 rounded-full" />
                  <div className="h-6 w-24 bg-dark-s2 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
