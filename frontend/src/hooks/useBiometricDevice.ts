import { useState, useEffect, useCallback, useRef } from 'react';

type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

interface UseBiometricDeviceProps {
  onMatch?: (empId: string, name: string) => void;
  onEnrollSuccess?: () => void;
  onEnrollFail?: (reason?: string) => void;
  onEnrollProgress?: (step: number) => void;
}

export const useBiometricDevice = ({
  onMatch,
  onEnrollSuccess,
  onEnrollFail,
  onEnrollProgress
}: UseBiometricDeviceProps = {}) => {
  const [status, setStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>('');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store callbacks in refs to avoid dependency changes triggering reconnects
  const onMatchRef = useRef(onMatch);
  const onEnrollSuccessRef = useRef(onEnrollSuccess);
  const onEnrollFailRef = useRef(onEnrollFail);
  const onEnrollProgressRef = useRef(onEnrollProgress);

  useEffect(() => {
    onMatchRef.current = onMatch;
    onEnrollSuccessRef.current = onEnrollSuccess;
    onEnrollFailRef.current = onEnrollFail;
    onEnrollProgressRef.current = onEnrollProgress;
  }, [onMatch, onEnrollSuccess, onEnrollFail, onEnrollProgress]);

  const connect = useCallback(() => {
    // If already connected or connecting, don't do anything
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) return;

    setStatus('CONNECTING');
    try {
      const ws = new WebSocket('ws://localhost:4649');

      ws.onopen = () => {
        setStatus('CONNECTED');
        setDeviceConnected(true); // Optimistic: Assume device is ready to avoid UI flicker
        console.log('Biometric WS Connected');
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      };

      ws.onclose = (event) => {
        setStatus('DISCONNECTED');
        // Only log retry message if it wasn't a clean close and not a repetitive refusal
        if (!event.wasClean) {
            // console.log('Biometric WS Disconnected - Retrying in 5s...');
        }
        socketRef.current = null;
        // Auto-reconnect with longer interval
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        // Silently handle connection refusal to avoid console spam
        setStatus('ERROR');
      };

      ws.onmessage = (event) => {
        const msg = event.data as string;
        setLastMessage(msg);
        console.log('WS Message:', msg);

        if (msg === 'DEVICE_CONNECTED') {
          setDeviceConnected(true);
        } else if (msg === 'DEVICE_DISCONNECTED') {
          setDeviceConnected(false);
        } else if (msg.startsWith('SCAN_MATCH:')) {
          const parts = msg.replace('SCAN_MATCH:', '').split('|');
          if (parts.length >= 2) {
            onMatchRef.current?.(parts[0], parts[1]);
          }
        } else if (msg === 'ENROLL_SUCCESS') {
          onEnrollSuccessRef.current?.();
        } else if (msg.startsWith('ENROLL_PROGRESS')) {
          if (msg.includes('STEP_1')) {
             onEnrollProgressRef.current?.(1);
          } else if (msg.includes('STEP_2')) {
             onEnrollProgressRef.current?.(2);
          } else {
             onEnrollProgressRef.current?.(1);
          }
        } else if (msg.startsWith('ENROLL_ERROR') || msg === 'ENROLL_FAIL' || msg === 'ENROLL_CANCELLED') {
          onEnrollFailRef.current?.(msg);
        }
      };

      socketRef.current = ws;
    } catch (err) {
      console.error('WS Setup Error', err);
      setStatus('ERROR');
    }
  }, []); // Empty dependency array - connect never changes now

  useEffect(() => {
    connect();
    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        const socket = socketRef.current;
        // Remove listeners to prevent zombie callbacks
        socket.onclose = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onopen = null;

        if (socket.readyState === WebSocket.CONNECTING) {
            // If connecting, wait for open before closing to avoid "closed before established" error
            socket.onopen = () => socket.close();
        } else {
            socket.close();
        }
        socketRef.current = null;
      }
    };
  }, [connect]);

  const enroll = (id: string | number, name: string, department: string) => {
    console.log(`Sending Enroll Request: ${id}|${name}|${department}`);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(`ENROLL_START:${id}|${name}|${department}`);
    } else {
      console.warn('Cannot enroll: WS not connected');
      // Try reconnecting?
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
          connect();
      }
    }
  };

  const cancel = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send('ENROLL_CANCEL');
    }
  };

  return {
    status,
    deviceConnected,
    lastMessage,
    enroll,
    cancel,
    resetDevice: () => {
        console.log('resetDevice called, socket state:', socketRef.current?.readyState);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            console.log('Sending RESET_DEVICE to middleware');
            socketRef.current.send('RESET_DEVICE');
        } else {
            console.warn('Cannot reset device: WS not connected');
        }
    },
    isConnected: status === 'CONNECTED'
  };
};
