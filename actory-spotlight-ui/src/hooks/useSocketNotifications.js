import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '@/lib/api';

const getSocketBaseUrl = () => {
  const apiBase = API.defaults.baseURL || '';
  return apiBase.replace(/\/api\/v1$/, '') || 'http://localhost:5000';
};

export function useSocketNotifications({ onNotification }) {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(`${getSocketBaseUrl()}/notifications`, {
      auth: { token },
      transports: ['websocket']
    });

    socketRef.current = socket;

    if (onNotification) {
      socket.on('notification:new', (payload) => {
        onNotification(payload);
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [onNotification]);

  return socketRef;
}
