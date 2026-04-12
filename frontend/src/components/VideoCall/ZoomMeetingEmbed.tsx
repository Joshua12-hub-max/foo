import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2, Loader2, AlertCircle } from 'lucide-react';
import { zoomApi } from '@/api/zoomApi';

// ============================================================================
// Type Definitions
// ============================================================================

interface ZoomMeetingEmbedProps {
  meetingNumber: string;
  password?: string;
  userName: string;
  userEmail?: string;
  onClose: () => void;
  isInline?: boolean;
}

interface ZoomSignatureResponse {
  signature: string;
  sdkKey: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract meeting number and password from Zoom URL
 */
export const parseZoomUrl = (url: string): { meetingNumber: string; password?: string } | null => {
  try {
    const urlObj = new URL(url);
    
    // Handle zoom.us/j/123456789?pwd=xxx format
    const pathMatch = urlObj.pathname.match(/\/j\/(\d+)/);
    if (pathMatch) {
      const meetingNumber = pathMatch[1];
      const password = urlObj.searchParams.get('pwd') || undefined;
      return { meetingNumber, password };
    }
    
    return null;
  } catch {
    return null;
  }
};

// ============================================================================
// Component
// ============================================================================

const ZoomMeetingEmbed: React.FC<ZoomMeetingEmbedProps> = ({
  meetingNumber,
  password,
  userName,
  userEmail = '',
  onClose,
  isInline
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initZoom = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // 100% ISOLATION: Dynamically import Zoom SDK AFTER globals are set in main.tsx
        const ZoomMtgModule = await import('@zoom/meetingsdk/embedded');
        const ZoomMtgEmbedded = ZoomMtgModule.default || ZoomMtgModule;

        // Get signature from backend
        const signatureResponse = await zoomApi.getSignature(meetingNumber, 0);
        const { signature, sdkKey } = signatureResponse.data as ZoomSignatureResponse;

        // Create Zoom client
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        // Initialize the client
        await client.init({
          zoomAppRoot: containerRef.current,
          language: 'en-US',
          patchJsMedia: true,
          leaveOnPageUnload: true,
        });

        // Join the meeting
        await client.join({
          signature,
          sdkKey,
          meetingNumber,
          password: password || '',
          userName,
          userEmail,
        });

        setIsLoading(false);
      } catch (err: unknown) {
        console.error('Zoom initialization error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to join Zoom meeting';
        setError(errorMessage);
        if (errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('media')) {
          setError(errorMessage + '. Please ensure you have granted camera/microphone permissions in your browser and that no other application is using them.');
        }
        setIsLoading(false);
      }
    };

    initZoom();

    return () => {
      // Cleanup on unmount
      if (clientRef.current) {
        try {
          clientRef.current.leaveMeeting();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [meetingNumber, password, userName, userEmail]);

  const handleClose = () => {
    if (clientRef.current) {
      try {
        clientRef.current.leaveMeeting();
      } catch {
        // Ignore errors
      }
    }
    onClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`${
        isInline 
          ? 'relative w-full h-full flex flex-col' 
          : `fixed bg-gray-900 z-50 flex flex-col transition-all duration-300 ${
              isFullscreen
                ? 'inset-0'
                : 'inset-4 md:inset-8 lg:inset-16 rounded-xl overflow-hidden shadow-2xl'
            }`
      }`}
    >
      {/* Header - Only show if not inline or if fullscreen */}
      {(!isInline || isFullscreen) && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">Zoom Meeting</span>
            <span className="text-gray-400 text-xs">(ID: {meetingNumber})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
              title="Leave Meeting"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Meeting Container */}
      <div className="flex-1 relative bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-white text-sm">Connecting to Zoom...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-3 max-w-md text-center p-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-white font-medium">Failed to connect</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Zoom SDK will render here */}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default ZoomMeetingEmbed;
