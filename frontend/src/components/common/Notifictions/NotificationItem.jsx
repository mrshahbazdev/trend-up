import { Box, Avatar, Typography, useTheme, Paper, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { formatDistanceToNow } from 'date-fns';
import { useMarkNotificationAsReadMutation } from "@/api/slices/socialApi";
import { useNavigate } from "react-router-dom";
import { Close as CloseIcon } from '@mui/icons-material';

const MotionBox = motion(Box);

const NotificationItem = ({ notification, onClose }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [markAsRead] = useMarkNotificationAsReadMutation();

    const handleClick = async () => {
        // Mark as read
        if (!notification.read) {
            try {
                await markAsRead(notification.id).unwrap();
            } catch (error) {
                console.error('Failed to mark notification as read:', error);
            }
        }

        // Navigate based on notification type
        if (notification.data?.postId) {
            navigate(`/post/${notification.data.postId}`);
            onClose?.();
        } else if (notification.data?.followerId) {
            navigate(`/user/${notification.data.followerId}`);
            onClose?.();
        }
    };

    const getAvatar = () => {
        if (notification.data?.avatar) return notification.data.avatar;
        if (notification.data?.commenterAvatar) return notification.data.commenterAvatar;
        if (notification.data?.followerAvatar) return notification.data.followerAvatar;
        if (notification.data?.likerAvatar) return notification.data.likerAvatar;
        return null;
    };

    const getTimeAgo = () => {
        try {
            return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
        } catch {
            return notification.createdAt;
        }
    };

    return (
        <MotionBox
            component={Paper}
            elevation={notification.read ? 0 : 2}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            sx={{
                p: 1.5,
                my: 1,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                cursor: "pointer",
                position: 'relative',
                background: notification.read
                    ? theme.palette.mode === "dark"
                        ? "#2a2a2a"
                        : "#f8f8f8"
                    : theme.palette.mode === "dark"
                    ? "#1e1e1e"
                    : "#ffffff",
                boxShadow: notification.read ? "none" : "0px 4px 12px rgba(0,0,0,0.1)",
                borderLeft: notification.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
            }}
            onClick={handleClick}
        >
            <Avatar src={getAvatar()} sx={{ width: 40, height: 40, bgcolor: "primary.main" }} />
            <Box sx={{ flex: 1 }}>
                <Typography fontWeight={notification.read ? 400 : 600} fontSize="0.95rem">
                    {notification.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {getTimeAgo()}
                </Typography>
            </Box>
            {!notification.read && (
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                    }}
                />
            )}
        </MotionBox>
    );
};

export default NotificationItem;
