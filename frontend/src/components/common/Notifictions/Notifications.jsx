import { useState } from "react";
import { Badge, IconButton, Popover, Typography, Box, Button } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { motion } from "framer-motion";
import NotificationItem from "./NotificationItem";
import { useGetNotificationsQuery, useMarkAllNotificationsAsReadMutation } from "@/api/slices/socialApi";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import Loading from "../loading";

const MotionIconButton = motion(IconButton);

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    
    const { unreadCount } = useNotifications();
    const { data, isLoading, error } = useGetNotificationsQuery({ limit: 10, unreadOnly: false });
    const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

    const notifications = data?.data?.notifications || [];
    
    // Debug logging
    console.log('[NotificationBell] Query data:', data);
    console.log('[NotificationBell] Notifications array:', notifications);
    console.log('[NotificationBell] Unread count:', unreadCount);
    console.log('[NotificationBell] Error:', error);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        setIsOpen((prev) => !prev);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setIsOpen(false);
    };

    const handleViewAll = () => {
        navigate('/notifications');
        handleClose();
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead().unwrap();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <>
            <MotionIconButton
                onClick={handleClick}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                sx={{ position: "relative", color: "text.primary" }}
            >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsNoneIcon />
                </Badge>
            </MotionIconButton>

            <Popover
                open={isOpen}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        p: 1,
                        borderRadius: 2,
                        minWidth: 350,
                        maxWidth: 400,
                        backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#1e1e1e" : "#fff"),
                        boxShadow: "0px 8px 24px rgba(0,0,0,0.2)",
                    },
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, pb: 1 }}>
                    <Typography variant="h6" fontWeight="bold">
                        Notifications{" "}
                        {unreadCount > 0 && (
                            <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>
                                ({unreadCount} new)
                            </Box>
                        )}
                    </Typography>
                    {notifications.length > 0 && unreadCount > 0 && (
                        <Button size="small" onClick={handleMarkAllRead}>
                            Mark all read
                        </Button>
                    )}
                </Box>

                <Box className="custom-scrollbar" sx={{ maxHeight: 400, overflowY: "auto" }}>
                    {isLoading ? (
                        <Loading isLoading={true} />
                    ) : notifications.length === 0 ? (
                        <Typography variant="body2" sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                            No notifications yet.
                        </Typography>
                    ) : (
                        notifications.map((notif) => (
                            <NotificationItem
                                key={notif.id}
                                notification={notif}
                                onClose={handleClose}
                            />
                        ))
                    )}
                </Box>

                {notifications.length > 0 && (
                    <Box sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
                        <Button fullWidth onClick={handleViewAll}>
                            View All Notifications
                        </Button>
                    </Box>
                )}
            </Popover>
        </>
    );
};

export default NotificationBell;
