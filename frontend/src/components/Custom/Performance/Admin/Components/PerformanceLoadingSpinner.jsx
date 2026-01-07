export const PerformanceLoadingSpinner = ({ loadingType }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
        <p className="text-gray-800">
          Processing {loadingType === 'data' ? 'data' : loadingType}...
        </p>
      </div>
    </div>
  );
};
