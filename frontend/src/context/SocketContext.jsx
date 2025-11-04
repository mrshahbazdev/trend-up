import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useToast } from '@/hooks/useToast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastError, setLastError] = useState(null);
  
  const { user } = useSelector((state) => state.user);
  const { showToast } = useToast();

  // Socket configuration
  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000; // Start with 1 second

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!user?.token) {
      console.log('[SocketContext] No user token available, skipping socket initialization');
      return;
    }

    console.log('[SocketContext] Initializing socket connection...');
    setConnectionStatus('connecting');
    setLastError(null);

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: user.token,
        userId: user._id
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('[SocketContext] Connected to server:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setLastError(null);
      
      // Join user-specific room
      newSocket.emit('join_user_room', { userId: user._id });
      
      showToast('Connected to real-time updates', 'success');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[SocketContext] Disconnected from server:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        showToast('Disconnected from server', 'warning');
      } else {
        showToast('Connection lost, attempting to reconnect...', 'warning');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('[SocketContext] Connection error:', error);
      setConnectionStatus('error');
      setLastError(error.message);
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setReconnectAttempts(prev => prev + 1);
        showToast(`Connection failed (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}), retrying...`, 'error');
      } else {
        showToast('Failed to connect to real-time updates', 'error');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('[SocketContext] Reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      setLastError(null);
      showToast('Reconnected to real-time updates', 'success');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[SocketContext] Reconnection attempt:', attemptNumber);
      setConnectionStatus('connecting');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('[SocketContext] Reconnection error:', error);
      setConnectionStatus('error');
      setLastError(error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[SocketContext] Reconnection failed after maximum attempts');
      setConnectionStatus('error');
      setLastError('Failed to reconnect after maximum attempts');
      showToast('Failed to reconnect to real-time updates', 'error');
    });

    // Real-time event handlers
    newSocket.on('post:created', (data) => {
      console.log('[SocketContext] Post created:', data);
      // This will be handled by components using useSocketEvent
    });

    newSocket.on('post:updated', (data) => {
      console.log('[SocketContext] Post updated:', data);
    });

    newSocket.on('post:deleted', (data) => {
      console.log('[SocketContext] Post deleted:', data);
    });

    newSocket.on('reaction:added', (data) => {
      console.log('[SocketContext] Reaction added:', data);
    });

    newSocket.on('reaction:removed', (data) => {
      console.log('[SocketContext] Reaction removed:', data);
    });

    newSocket.on('comment:created', (data) => {
      console.log('[SocketContext] Comment created:', data);
    });

    newSocket.on('karma:earned', (data) => {
      console.log('[SocketContext] Karma earned:', data);
    });

    newSocket.on('user:followed', (data) => {
      console.log('[SocketContext] User followed:', data);
    });

    newSocket.on('poll:voted', (data) => {
      console.log('[SocketContext] Poll voted:', data);
    });

    newSocket.on('prediction:staked', (data) => {
      console.log('[SocketContext] Prediction staked:', data);
    });

    newSocket.on('notification:received', (data) => {
      console.log('[SocketContext] Notification received:', data);
      // Don't show toast here - let useNotifications handle it
    });

    setSocket(newSocket);
  }, [user, showToast, reconnectAttempts]);

  // Cleanup socket connection
  const disconnectSocket = useCallback(() => {
    if (socket) {
      console.log('[SocketContext] Disconnecting socket...');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setReconnectAttempts(0);
      setLastError(null);
    }
  }, [socket]);

  // Initialize socket when user is available
  useEffect(() => {
    if (user?.token && !socket) {
      initializeSocket();
    } else if (!user?.token && socket) {
      disconnectSocket();
    }
  }, [user?.token, socket, initializeSocket, disconnectSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socket) {
      disconnectSocket();
    }
    setTimeout(() => {
      initializeSocket();
    }, 1000);
  }, [socket, disconnectSocket, initializeSocket]);

  // Join room function
  const joinRoom = useCallback((roomName) => {
    if (socket && isConnected) {
      socket.emit('join_room', { roomName });
      console.log('[SocketContext] Joined room:', roomName);
    }
  }, [socket, isConnected]);

  // Leave room function
  const leaveRoom = useCallback((roomName) => {
    if (socket && isConnected) {
      socket.emit('leave_room', { roomName });
      console.log('[SocketContext] Left room:', roomName);
    }
  }, [socket, isConnected]);

  // Emit event function
  const emitEvent = useCallback((eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
      console.log('[SocketContext] Emitted event:', eventName, data);
    } else {
      console.warn('[SocketContext] Cannot emit event, socket not connected');
    }
  }, [socket, isConnected]);

  const value = {
    socket,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    lastError,
    reconnect,
    joinRoom,
    leaveRoom,
    emitEvent
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
