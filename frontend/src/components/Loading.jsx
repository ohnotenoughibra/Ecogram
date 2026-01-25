export default function Loading({ size = 'default', text = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-4 h-4 border',
    default: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`${sizeClasses[size]} border-gray-200 dark:border-gray-700 border-t-primary-600 rounded-full animate-spin`} />
      {text && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Loading size="large" />
    </div>
  );
}
