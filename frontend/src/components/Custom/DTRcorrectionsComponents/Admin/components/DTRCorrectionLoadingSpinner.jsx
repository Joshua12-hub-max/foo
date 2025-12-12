export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-3 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-3 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}