import { useEffect, useRef } from 'react';
import websocketService from '../services/websocketService';
import { useState } from 'react';

export const useWebSocket = (eventType: string, callback: (data: any) => void) => {
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = websocketService.subscribe(eventType, (data) => {
      callbackRef.current(data);
    });

    return unsubscribe;
  }, [eventType]);

  return {
    isConnected: websocketService.isConnected(),
    send: websocketService.send.bind(websocketService),
    reconnect: websocketService.reconnect.bind(websocketService),
  };
};

export const useWebSocketConnection = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(websocketService.isConnected());
    };

    // Check initial connection
    checkConnection();

    // Set up interval to check connection status
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    reconnect: websocketService.reconnect.bind(websocketService),
  };
}; 