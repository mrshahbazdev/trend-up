import { useEffect, useCallback } from 'react';
import { useSocketEvent } from './useSocket';
import { useGetUnreadCountQuery } from '@/api/slices/socialApi';
import { useToast } from './useToast';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { baseApi } from '@/api/baseApi';

/**
 * Hook to handle real-time notifications
 * Listens for socket events and manages unread count
 */
export const useNotifications = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { showToast } = useToast();
  const { data, refetch } = useGetUnreadCountQuery(undefined, {
    // Poll every 30 seconds as backup
    pollingInterval: 30000,
  });

  // Handle new notification received via socket
  const handleNotificationReceived = useCallback((notification) => {
    console.log('[useNotifications] Received notification:', notification);
    console.log('[useNotifications] Current user ID:', user?._id);
    
    // Don't show notification from yourself
    const actorId = notification.data?.userId || 
                    notification.data?.commenterId || 
                    notification.data?.followerId ||
                    notification.data?.likerId;
                    
    if (actorId === user?._id || actorId?.toString() === user?._id?.toString()) {
      console.log('[useNotifications] Ignoring self-notification (actor:', actorId, ')');
      return;
    }

    console.log('[useNotifications] Processing notification from:', actorId);

    // Show toast notification
    showToast(notification.message, 'info');

    // Invalidate notifications cache to trigger refetch
    dispatch(
      baseApi.util.invalidateTags(['Notifications', 'NotificationCount'])
    );
    
    console.log('[useNotifications] Invalidated notifications cache');
  }, [user?._id, showToast, dispatch]);

  // Listen for new notifications via Socket.io
  useSocketEvent('notification:received', handleNotificationReceived, [handleNotificationReceived]);

  return {
    unreadCount: data?.data?.unreadCount || 0,
    refetch
  };
};

export default useNotifications;

