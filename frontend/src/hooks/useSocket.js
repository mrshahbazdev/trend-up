import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';

/**
 * Hook to subscribe to specific socket events
 * @param {string} eventName - The event name to listen for
 * @param {function} callback - The callback function to execute when event is received
 * @param {array} dependencies - Dependencies array for the callback
 */
export const useSocketEvent = (eventName, callback, dependencies = []) => {
  const { socket, isConnected } = useSocket();
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, dependencies);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const eventHandler = (data) => {
      callbackRef.current(data);
    };

    socket.on(eventName, eventHandler);

    return () => {
      socket.off(eventName, eventHandler);
    };
  }, [socket, isConnected, eventName]);
};

/**
 * Hook to automatically join/leave post rooms
 * @param {string} postId - The post ID to join/leave room for
 * @param {boolean} shouldJoin - Whether to join the room
 */
export const usePostRoom = (postId, shouldJoin = true) => {
  const { joinRoom, leaveRoom, isConnected } = useSocket();

  useEffect(() => {
    if (!postId || !isConnected) return;

    const roomName = `post:${postId}`;

    if (shouldJoin) {
      joinRoom(roomName);
    }

    return () => {
      if (shouldJoin) {
        leaveRoom(roomName);
      }
    };
  }, [postId, shouldJoin, joinRoom, leaveRoom, isConnected]);
};

/**
 * Hook to handle typing indicators
 * @param {string} postId - The post ID for the typing indicator
 * @param {string} userId - The current user ID
 * @param {function} onTypingStart - Callback when typing starts
 * @param {function} onTypingStop - Callback when typing stops
 */
export const useTypingIndicator = (postId, userId, onTypingStart, onTypingStop) => {
  const { socket, isConnected } = useSocket();
  const typingTimeoutRef = useRef(null);

  // Listen for typing events
  useSocketEvent('typing:start', (data) => {
    if (data.postId === postId && data.userId !== userId) {
      onTypingStart?.(data);
    }
  }, [postId, userId, onTypingStart]);

  useSocketEvent('typing:stop', (data) => {
    if (data.postId === postId && data.userId !== userId) {
      onTypingStop?.(data);
    }
  }, [postId, userId, onTypingStop]);

  // Emit typing start
  const startTyping = useCallback(() => {
    if (!socket || !isConnected || !postId || !userId) return;

    socket.emit('typing:start', { postId, userId });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000); // Stop typing after 3 seconds of inactivity
  }, [socket, isConnected, postId, userId]);

  // Emit typing stop
  const stopTyping = useCallback(() => {
    if (!socket || !isConnected || !postId || !userId) return;

    socket.emit('typing:stop', { postId, userId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, isConnected, postId, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { startTyping, stopTyping };
};

/**
 * Hook to handle real-time post updates
 * @param {string} postId - The post ID to listen for updates
 * @param {function} onUpdate - Callback when post is updated
 */
export const useRealtimeUpdates = (postId, onUpdate) => {
  const { socket, isConnected } = useSocket();

  // Listen for post updates
  useSocketEvent('post:updated', (data) => {
    if (data.postId === postId) {
      onUpdate?.(data);
    }
  }, [postId, onUpdate]);

  // Listen for post deletion
  useSocketEvent('post:deleted', (data) => {
    if (data.postId === postId) {
      onUpdate?.({ type: 'deleted', postId });
    }
  }, [postId, onUpdate]);

  // Listen for reaction updates
  useSocketEvent('reaction:added', (data) => {
    if (data.postId === postId) {
      onUpdate?.({ type: 'reaction_added', postId, reaction: data });
    }
  }, [postId, onUpdate]);

  useSocketEvent('reaction:removed', (data) => {
    if (data.postId === postId) {
      onUpdate?.({ type: 'reaction_removed', postId, reaction: data });
    }
  }, [postId, onUpdate]);

  // Listen for comment updates
  useSocketEvent('comment:created', (data) => {
    if (data.postId === postId) {
      onUpdate?.({ type: 'comment_added', postId, comment: data });
    }
  }, [postId, onUpdate]);

  // Listen for poll updates
  useSocketEvent('poll:voted', (data) => {
    if (data.postId === postId) {
      onUpdate?.({ type: 'poll_voted', postId, poll: data });
    }
  }, [postId, onUpdate]);

  // Listen for prediction updates
  useSocketEvent('prediction:staked', (data) => {
    if (data.postId === postId) {
      onUpdate?.({ type: 'prediction_staked', postId, prediction: data });
    }
  }, [postId, onUpdate]);
};

/**
 * Hook to handle real-time notifications
 * @param {function} onNotification - Callback when notification is received
 */
export const useRealtimeNotifications = (onNotification) => {
  useSocketEvent('notification', onNotification, [onNotification]);
};

/**
 * Hook to handle karma updates
 * @param {string} userId - The user ID to listen for karma updates
 * @param {function} onKarmaUpdate - Callback when karma is updated
 */
export const useKarmaUpdates = (userId, onKarmaUpdate) => {
  useSocketEvent('karma:earned', (data) => {
    if (data.userId === userId) {
      onKarmaUpdate?.({ type: 'earned', ...data });
    }
  }, [userId, onKarmaUpdate]);

  useSocketEvent('karma:deducted', (data) => {
    if (data.userId === userId) {
      onKarmaUpdate?.({ type: 'deducted', ...data });
    }
  }, [userId, onKarmaUpdate]);

  useSocketEvent('level:up', (data) => {
    if (data.userId === userId) {
      onKarmaUpdate?.({ type: 'level_up', ...data });
    }
  }, [userId, onKarmaUpdate]);

  useSocketEvent('badge:earned', (data) => {
    if (data.userId === userId) {
      onKarmaUpdate?.({ type: 'badge_earned', ...data });
    }
  }, [userId, onKarmaUpdate]);
};

/**
 * Hook to handle follow updates
 * @param {string} userId - The user ID to listen for follow updates
 * @param {function} onFollowUpdate - Callback when follow status changes
 */
export const useFollowUpdates = (userId, onFollowUpdate) => {
  useSocketEvent('user:followed', (data) => {
    if (data.followingId === userId || data.followerId === userId) {
      onFollowUpdate?.({ type: 'followed', ...data });
    }
  }, [userId, onFollowUpdate]);

  useSocketEvent('user:unfollowed', (data) => {
    if (data.followingId === userId || data.followerId === userId) {
      onFollowUpdate?.({ type: 'unfollowed', ...data });
    }
  }, [userId, onFollowUpdate]);
};

export default {
  useSocketEvent,
  usePostRoom,
  useTypingIndicator,
  useRealtimeUpdates,
  useRealtimeNotifications,
  useKarmaUpdates,
  useFollowUpdates
};
