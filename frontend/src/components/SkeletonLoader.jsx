// Skeleton loading components for better perceived performance

export function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="card p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}

export function SkeletonSession() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
      </div>
      <div className="flex gap-2 mt-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
      </div>

      {/* Settings list */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Shimmer effect overlay
export function Shimmer() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
  );
}

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  switch (type) {
    case 'list':
      return <SkeletonList count={count} />;
    case 'stats':
      return <SkeletonStats />;
    case 'session':
      return [...Array(count)].map((_, i) => <SkeletonSession key={i} />);
    case 'profile':
      return <SkeletonProfile />;
    default:
      return [...Array(count)].map((_, i) => <SkeletonCard key={i} />);
  }
}
