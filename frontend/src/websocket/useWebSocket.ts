import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { RootState } from '../store/store';

const WS_URL = import.meta.env.VITE_WS_URL || '';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useSelector((state: RootState) => state.auth);
  const { currentCompany } = useSelector((state: RootState) => state.company);

  useEffect(() => {
    if (!token || !currentCompany) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: {
        token,
        companyId: currentCompany.id,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentCompany]);

  const subscribe = useCallback((event: string, handler: (data: any) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on(event, handler);
    return () => {
      socket.off(event, handler);
    };
  }, []);

  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { subscribe, emit, socket: socketRef.current };
}
