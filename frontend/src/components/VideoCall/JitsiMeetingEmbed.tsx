import React, { useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { X, Maximize2, Minimize2 } from 'lucide-react';

// ============================================================================
// Type Definitions
// ============================================================================

interface JitsiMeetingEmbedProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
  onApiReady?: (api: unknown) => void;
}

interface JitsiApi {
  executeCommand: (command: string, ...args: unknown[]) => void;
  addListener: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  dispose: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract room name from Jitsi Meet URL
 */
export const extractJitsiRoomName = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // Handle meet.jit.si/room-name format
    if (urlObj.hostname === 'meet.jit.si') {
      return urlObj.pathname.substring(1); // Remove leading slash
    }
    return null;
  } catch {
    return null;
  }
};

// ============================================================================
// Component
// ============================================================================

const JitsiMeetingEmbed: React.FC<JitsiMeetingEmbedProps> = ({
  roomName,
  displayName,
  onClose,
  onApiReady,
}) => {
  const apiRef = useRef<JitsiApi | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const handleApiReady = (externalApi: unknown) => {
    apiRef.current = externalApi as JitsiApi;

    // Listen for meeting end
    apiRef.current.addListener('readyToClose', () => {
      onClose();
    });

    // Listen for participant left (when user leaves)
    apiRef.current.addListener('videoConferenceLeft', () => {
      onClose();
    });

    if (onApiReady) {
      onApiReady(externalApi);
    }
  };

  const handleClose = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
      apiRef.current.dispose();
    }
    onClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`fixed bg-gray-900 z-50 flex flex-col transition-all duration-300 ${
        isFullscreen
          ? 'inset-0'
          : 'inset-4 md:inset-8 lg:inset-16 rounded-xl overflow-hidden shadow-2xl'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">Jitsi Meeting</span>
          <span className="text-gray-400 text-xs">({roomName})</span>
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

      {/* Meeting Container */}
      <div className="flex-1 relative">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            disableModeratorIndicator: true,
            enableEmailInStats: false,
            prejoinPageEnabled: true,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            MOBILE_APP_PROMO: false,
            SHOW_CHROME_EXTENSION_BANNER: false,
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'closedcaptions',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'chat',
              'recording',
              'settings',
              'raisehand',
              'videoquality',
              'tileview',
            ],
          }}
          userInfo={{
            displayName: displayName,
            email: '',
          }}
          onApiReady={handleApiReady}
          getIFrameRef={(iframeRef) => {
            if (iframeRef) {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
            }
          }}
        />
      </div>
    </div>
  );
};

export default JitsiMeetingEmbed;
