import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import { useGetNotificationsQuery, useMarkAllNotificationsAsReadMutation } from '@/api/slices/socialApi';
import NotificationItem from '@/components/common/Notifictions/NotificationItem';
import Loading from '@/components/common/loading';
import BoxContainer from '@/components/common/BoxContainer/BoxConatner';

const NotificationCenter = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  
  const { data, isLoading, refetch } = useGetNotificationsQuery({
    limit: 50,
    unreadOnly: activeTab === 1
  });
  
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notif) => {
    const date = new Date(notif.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let dateKey;
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      dateKey = 'This Week';
    } else {
      dateKey = 'Older';
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(notif);
    return groups;
  }, {});

  const dateOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <BoxContainer sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllRead} size="small">
                Mark all as read
              </Button>
            )}
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab label="All" />
            <Tab label={`Unread (${unreadCount})`} />
          </Tabs>
        </Box>

        {/* Content */}
        <Box sx={{ p: isMobile ? 1 : 2 }}>
          {isLoading ? (
            <Loading isLoading={true} />
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeTab === 1
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </Typography>
            </Box>
          ) : (
            <Box>
              {dateOrder.map(
                (dateKey) =>
                  groupedNotifications[dateKey] && (
                    <Box key={dateKey} sx={{ mb: 3 }}>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="text.secondary"
                        sx={{ px: 1, mb: 1, display: 'block' }}
                      >
                        {dateKey}
                      </Typography>
                      {groupedNotifications[dateKey].map((notif) => (
                        <NotificationItem key={notif.id} notification={notif} />
                      ))}
                    </Box>
                  )
              )}
            </Box>
          )}
        </Box>
      </BoxContainer>
    </Container>
  );
};

export default NotificationCenter;

