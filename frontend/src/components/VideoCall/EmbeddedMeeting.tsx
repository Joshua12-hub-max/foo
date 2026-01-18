import React from 'react';
import JitsiMeetingEmbed, { extractJitsiRoomName } from './JitsiMeetingEmbed';
import ZoomMeetingEmbed, { parseZoomUrl } from './ZoomMeetingEmbed';
import { ExternalLink } from 'lucide-react';

// ============================================================================
// Type Definitions
// ============================================================================

export type MeetingPlatform = 'Jitsi Meet' | 'Zoom' | 'Google Meet' | 'Other';

interface EmbeddedMeetingProps {
  platform: MeetingPlatform;
  meetingUrl: string;
  userName: string;
  userEmail?: string;
  onClose: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect platform from meeting URL
 */
export const detectPlatform = (url: string): MeetingPlatform => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('jit.si') || hostname.includes('jitsi')) {
      return 'Jitsi Meet';
    }
    if (hostname.includes('zoom.us')) {
      return 'Zoom';
    }
    if (hostname.includes('meet.google.com')) {
      return 'Google Meet';
    }
    return 'Other';
  } catch {
    return 'Other';
  }
};

/**
 * Check if platform supports embedding
 */
export const supportsEmbedding = (platform: MeetingPlatform): boolean => {
  return platform === 'Jitsi Meet' || platform === 'Zoom';
};

// ============================================================================
// Component
// ============================================================================

const EmbeddedMeeting: React.FC<EmbeddedMeetingProps> = ({
  platform,
  meetingUrl,
  userName,
  userEmail,
  onClose,
}) => {
  // Handle Jitsi
  if (platform === 'Jitsi Meet') {
    const roomName = extractJitsiRoomName(meetingUrl);
    
    if (!roomName) {
      return (
        <FallbackLink 
          url={meetingUrl} 
          platform={platform}
          reason="Invalid Jitsi URL"
          onClose={onClose}
        />
      );
    }

    return (
      <JitsiMeetingEmbed
        roomName={roomName}
        displayName={userName}
        onClose={onClose}
      />
    );
  }

  // Handle Zoom
  if (platform === 'Zoom') {
    const zoomData = parseZoomUrl(meetingUrl);
    
    if (!zoomData) {
      return (
        <FallbackLink 
          url={meetingUrl} 
          platform={platform}
          reason="Invalid Zoom URL"
          onClose={onClose}
        />
      );
    }

    return (
      <ZoomMeetingEmbed
        meetingNumber={zoomData.meetingNumber}
        password={zoomData.password}
        userName={userName}
        userEmail={userEmail}
        onClose={onClose}
      />
    );
  }

  // Handle Google Meet and Other (fallback to external link)
  return (
    <FallbackLink 
      url={meetingUrl} 
      platform={platform}
      reason={platform === 'Google Meet' ? 'Google Meet does not support embedding' : 'Platform not supported for embedding'}
      onClose={onClose}
    />
  );
};

// ============================================================================
// Fallback Component (for non-embeddable platforms)
// ============================================================================

interface FallbackLinkProps {
  url: string;
  platform: MeetingPlatform;
  reason: string;
  onClose: () => void;
}

const FallbackLink: React.FC<FallbackLinkProps> = ({ url, platform, reason, onClose }) => {
  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Open {platform} Meeting
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          {reason}. The meeting will open in a new tab.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleOpenExternal}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} />
            Open Meeting
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedMeeting;
