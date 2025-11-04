import { useEffect } from "react";
import { Box, Typography, Avatar, styled, alpha, useTheme, Grid2, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";
import useCamera from "../hooks/useCamera";

// Styled components
const VideoFeedContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    position: "relative",
    background: theme.palette.grey[900],
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    padding: theme.spacing(1),
    height: "100vh", // Adjust height to accommodate chat
    [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(2),
    },
}));

const VideoGrid = styled(Grid2)(({ theme }) => ({
    width: "100%",
    height: "100%",
    gap: theme.spacing(1),
    [theme.breakpoints.up("sm")]: {
        gap: theme.spacing(2),
    },
}));

const VideoTile = styled(motion.div)(({ theme, isActive }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius * 2,
    overflow: "hidden",
    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
    border: isActive ? `2px solid ${theme.palette.primary.main}` : "none",
    boxShadow: isActive ? `0 0 15px ${alpha(theme.palette.primary.main, 0.5)}` : "none",
    height: "100%",
    minHeight: 150,
    [theme.breakpoints.up("sm")]: {
        border: isActive ? `3px solid ${theme.palette.primary.main}` : "none",
        boxShadow: isActive ? `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}` : "none",
    },
}));

const UserVideo = styled(Box)({
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
});

const UserInfo = styled(Box)(({ theme }) => ({
    position: "absolute",
    bottom: 4,
    left: 4,
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: alpha(theme.palette.grey[900], 0.7),
    padding: "2px 6px",
    borderRadius: 12,
    color: theme.palette.common.white,
    fontSize: "0.75rem",
    [theme.breakpoints.up("sm")]: {
        bottom: 8,
        left: 8,
        gap: 8,
        padding: "4px 8px",
        borderRadius: 16,
        fontSize: "inherit",
    },
}));

const ControlsOverlay = styled(Box)(({ theme }) => ({
    position: "absolute",
    bottom: 4,
    right: 4,
    display: "flex",
    gap: 2,
    backgroundColor: alpha(theme.palette.grey[900], 0.7),
    padding: "2px",
    borderRadius: 6,
    [theme.breakpoints.up("sm")]: {
        bottom: 8,
        right: 8,
        gap: 4,
        padding: "4px",
        borderRadius: 8,
    },
}));

const LiveBadge = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    padding: "2px 6px",
    borderRadius: 8,
    fontSize: "0.6rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 4,
    [theme.breakpoints.up("sm")]: {
        top: 8,
        left: 8,
        fontSize: "0.7rem",
        padding: "4px 8px",
        borderRadius: 12,
    },
}));

const ViewerCount = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: alpha(theme.palette.grey[900], 0.7),
    color: theme.palette.common.white,
    padding: "4px 8px",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    fontWeight: 600,
    [theme.breakpoints.up("sm")]: {
        top: 16,
        right: 16,
        fontSize: 14,
        padding: "6px 12px",
    },
}));

const VideoGridComponent = ({ liveUsers, onUserClick, viewers }) => {
    const theme = useTheme();
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
    // Camera hook
    const { cameraActive, cameraError, isInitializing, videoRef } = useCamera();

    const getGridSize = (count) => {
        if (count === 1) return { xs: 12, sm: 12, md: 12 };
        if (count === 2) return { xs: 12, sm: 6, md: 6 };
        if (count <= 4) return { xs: 12, sm: 6, md: 6 };
        if (count <= 6) return { xs: 12, sm: 6, md: 4 };
        if (count <= 9) return { xs: 12, sm: 6, md: 4 };
        if (count <= 16) return { xs: 12, sm: 6, md: 3 };
        return { xs: 12, sm: 6, md: 3, lg: 2 };
    };

    // Handle video element updates when camera state changes
    useEffect(() => {
        if (cameraActive && videoRef.current && videoRef.current.srcObject) {
            videoRef.current.play().catch((err) => console.warn("Video play failed:", err));
        }
    }, [cameraActive]);

    return (
        <VideoFeedContainer>
            <VideoGrid container spacing={isSmallMobile ? 1 : 2}>
                {liveUsers.map((user, i) => {
                    const size = getGridSize(liveUsers.length);

                    return (
                        <Grid2 key={i} size={size} justifyContent="center">
                            <VideoTile
                                isActive={user.isActive}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onUserClick(user.id)}
                            >
                                {/* Camera feed with fallback */}
                                {cameraActive && i === 0 ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            transform: "scaleX(-1)", // mirror for front camera
                                        }}
                                    />
                                ) : (
                                    <UserVideo>
                                        {isInitializing && i === 0 ? (
                                            <Box sx={{ textAlign: "center" }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    Initializing camera...
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <>
                                                <Avatar
                                                    sx={{
                                                        width: isSmallMobile ? 60 : 80,
                                                        height: isSmallMobile ? 60 : 80,
                                                        bgcolor: theme.palette.primary.main,
                                                        fontSize: isSmallMobile ? "1.5rem" : "2rem",
                                                    }}
                                                >
                                                    You
                                                </Avatar>
                                                {cameraError && i === 0 && (
                                                    <Typography
                                                        variant="caption"
                                                        color="error"
                                                        sx={{
                                                            mt: 1,
                                                            textAlign: "center",
                                                            maxWidth: "80%",
                                                        }}
                                                    >
                                                        {cameraError}
                                                    </Typography>
                                                )}
                                                {!cameraActive && i === 0 && !isInitializing && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{
                                                            mt: 1,
                                                            textAlign: "center",
                                                            maxWidth: "80%",
                                                        }}
                                                    >
                                                        Camera off
                                                    </Typography>
                                                )}
                                            </>
                                        )}
                                    </UserVideo>
                                )}

                                <UserInfo>
                                    <Avatar
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            fontSize: "0.7rem",
                                            bgcolor: user.isSpeaking
                                                ? theme.palette.success.main
                                                : theme.palette.grey[500],
                                        }}
                                    >
                                        {user.name[0]}
                                    </Avatar>
                                    <Typography variant="caption">{user.name}</Typography>
                                </UserInfo>

                                <LiveBadge>
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                    >
                                        <Box
                                            sx={{
                                                width: 4,
                                                height: 4,
                                                borderRadius: "50%",
                                                backgroundColor: theme.palette.error.contrastText,
                                            }}
                                        />
                                    </motion.div>
                                    LIVE
                                </LiveBadge>

                                <ControlsOverlay>
                                    {!user.hasVideo && (
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: "50%",
                                                backgroundColor: theme.palette.error.main,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 8,
                                                color: theme.palette.common.white,
                                            }}
                                        >
                                            📹
                                        </Box>
                                    )}
                                    {!user.hasAudio && (
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: "50%",
                                                backgroundColor: theme.palette.error.main,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 8,
                                                color: theme.palette.common.white,
                                            }}
                                        >
                                            🎤
                                        </Box>
                                    )}
                                </ControlsOverlay>
                            </VideoTile>
                        </Grid2>
                    );
                })}
            </VideoGrid>

            <ViewerCount>
                <Box
                    sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: theme.palette.error.main,
                        mr: 1,
                    }}
                />
                {viewers.toLocaleString()} watching
            </ViewerCount>
        </VideoFeedContainer>
    );
};

export default VideoGridComponent;
