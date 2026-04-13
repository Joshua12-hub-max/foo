import { Request, Response } from 'express';
import axios from 'axios';



// ============================================================================
// Type Definitions (100% Type-Safe)
// ============================================================================

interface ZoomConfig {
  accountId: string;
  clientId: string;
  clientSecret: string;
}

 
interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}
 

interface ZoomMeetingRequest {
  topic: string;
  type: number;
  startTime: string;
  duration: number;
  timezone: string;
  settings: {
    hostVideo: boolean;
    participantVideo: boolean;
    joinBeforeHost: boolean;
    waitingRoom: boolean;
    autoRecording: string;
  };
}

 
interface ZoomMeetingResponse {
  id: number;
  host_id: string;
  topic: string;
  start_time: string;
  duration: number;
  timezone: string;
  join_url: string;
  password?: string;
}
 

interface CreateMeetingRequestBody {
  topic: string;
  startTime: string;
  duration?: number;
  applicantName?: string;
}

// ============================================================================
// Token Cache (In-Memory)
// ============================================================================

let cachedToken: { token: string; expiresAt: number } | null = null;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type-safe error message extractor
 */
const getErrorMessage = (error: Error | { response?: { data?: { message?: string } }; message?: string } | string | null | undefined): string => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

/**
 * Validate Zoom environment variables
 */
const validateZoomConfig = (): ZoomConfig | null => {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!accountId || !clientId || !clientSecret) {
    return null;
  }

  return { accountId, clientId, clientSecret };
};

/**
 * Get Zoom access token using Server-to-Server OAuth
 */
const getZoomAccessToken = async (): Promise<string> => {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const config = validateZoomConfig();
  if (!config) {
    throw new Error('Zoom credentials not configured. Please add ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET to .env');
  }

  try {
    // Create Base64 encoded credentials
    const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

    const response = await axios.post<ZoomTokenResponse>(
      'https://zoom.us/oauth/token',
      null,
      {
        params: {
           
          grant_type: 'account_credentials',
          account_id: config.accountId,
           
        },
        headers: {
           
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
           
        },
      }
    );

    // Cache the token (subtract 5 minutes for safety margin)
    cachedToken = {
      token: response.data.access_token,
      expiresAt: Date.now() + (response.data.expires_in - 300) * 1000,
    };

    return response.data.access_token;
  } catch (_error) {
    // const _err = error as Error;

    throw new Error('Failed to authenticate with Zoom. Please check your credentials.');
  }
};

// ============================================================================
// Controller Functions
// ============================================================================

/**
 * Check if Zoom is configured
 */
export const getZoomStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = validateZoomConfig();
    
    if (!config) {
      res.json({ 
        configured: false, 
        message: 'Zoom credentials not configured in .env' 
      });
      return;
    }

    // Optionally verify credentials by getting a token
    try {
      await getZoomAccessToken();
      res.json({ 
        configured: true, 
        message: 'Zoom is configured and ready' 
      });
    } catch (error) {
      const err = error as Error;
      res.json({ 
        configured: false, 
        message: 'Zoom credentials are invalid: ' + getErrorMessage(err) 
      });
    }
  } catch (_error) {
    // const _err = error as Error;

    res.status(500).json({ message: 'Failed to check Zoom status' });
  }
};

/**
 * Create a Zoom meeting
 */
export const createZoomMeeting = async (req: Request, res: Response): Promise<void> => {
  const { topic, startTime, duration = 60, applicantName } = req.body as CreateMeetingRequestBody;

  if (!topic || !startTime) {
    res.status(400).json({ message: 'Topic and startTime are required' });
    return;
  }

  try {
    const accessToken = await getZoomAccessToken();

    // Format the meeting topic
    const meetingTopic = applicantName 
      ? `Interview with ${applicantName} - ${topic}`
      : topic;

    const meetingRequest: ZoomMeetingRequest = {
      topic: meetingTopic,
      type: 2, // Scheduled meeting
      startTime: startTime,
      duration: duration,
      timezone: 'Asia/Manila',
      settings: {
        hostVideo: true,
        participantVideo: true,
        joinBeforeHost: true,
        waitingRoom: false,
        autoRecording: 'none',
      },
    };

    const response = await axios.post<ZoomMeetingResponse>(
      'https://api.zoom.us/v2/users/me/meetings',
      meetingRequest,
      {
        headers: {
           
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
           
        },
      }
    );

    /* eslint-disable @typescript-eslint/naming-convention */
    const { id, join_url, password, topic: resTopic, start_time, duration: resDuration } = response.data;
    /* eslint-enable @typescript-eslint/naming-convention */

    res.json({
      success: true,
      meetingId: id,
      meetingLink: join_url,
      password: password,
      topic: resTopic,
      startTime: start_time,
      duration: resDuration,
    });
  } catch (error) {
    const err = error as Error;

    // Check for specific Zoom API errors
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      if (status === 401) {
        // Clear cached token and retry message
        cachedToken = null;
        res.status(401).json({ 
          message: 'Zoom authentication failed. Please check your credentials.' 
        });
        return;
      }
      if (status === 429) {
        res.status(429).json({ 
          message: 'Zoom rate limit exceeded. Please try again later.' 
        });
        return;
      }
    }

    res.status(500).json({ 
      message: 'Failed to create Zoom meeting',
      error: getErrorMessage(err),
    });
  }
};

/**
 * Generate Zoom Web SDK signature for embedding meetings
 */
export const generateZoomSignature = async (req: Request, res: Response): Promise<void> => {
  const { meetingNumber, role } = req.body as { meetingNumber: string; role: number };

  if (!meetingNumber) {
    res.status(400).json({ message: 'Meeting number is required' });
    return;
  }

  try {
    const config = validateZoomConfig();
    if (!config) {
      res.status(400).json({ message: 'Zoom credentials not configured' });
      return;
    }

    // For Meeting SDK, we use the SDK Key (Client ID) and SDK Secret (Client Secret)
    const sdkKey = config.clientId;
    const sdkSecret = config.clientSecret;

    // Generate signature using HMAC-SHA256
    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hour expiry
    const tokenRole = role === 1 ? 1 : 0; // 1 = host, 0 = participant

    // Create the JWT header and payload
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sdkKey,
      mn: meetingNumber,
      role: tokenRole,
      iat,
      exp,
      tokenExp: exp,
    })).toString('base64url');

    // Create signature using crypto
    const crypto = await import('crypto');
    const signature = crypto
      .createHmac('sha256', sdkSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const jwtSignature = `${header}.${payload}.${signature}`;

    res.json({
      signature: jwtSignature,
      sdkKey,
    });
  } catch (_error) {
    // const _err = error as Error;

    res.status(500).json({ message: 'Failed to generate Zoom signature' });
  }
};

