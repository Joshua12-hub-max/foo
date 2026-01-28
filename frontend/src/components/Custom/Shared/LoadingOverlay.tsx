import { memo } from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const LoadingOverlay = memo(({ isVisible, message = 'Loading...' }: LoadingOverlayProps) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center transition-all duration-300 animate-in fade-in">
       <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-gray-700">{message}</span>
       </div>
    </div>
  );
});

LoadingOverlay.displayName = 'LoadingOverlay';
export default LoadingOverlay;
