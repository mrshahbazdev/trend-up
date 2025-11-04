/**
 * src/pages/live/styled/StreamViewStyles.js
 *
 * Styled-components for the LiveStreamView (the active space).
 */
import { Box, styled, alpha } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import { motion } from "framer-motion";

export const LiveContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    height: "100vh",
    flexDirection: "column",
    background: theme.palette.mode === "dark"
        ? `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${alpha(theme.palette.primary.dark, 0.7)} 100%)`
        : `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${alpha(theme.palette.primary.light, 0.3)} 100%)`,
    position: "relative",
    overflow: "hidden",
}));

export const VideoSection = styled(Box)(({ theme }) => ({
    flex: 1,
    position: "relative",
    overflow: "hidden",
    background: theme.palette.grey[900],
    paddingBottom: '80px', // Space for controls
    // 🛑 FIX: Add flex properties to fill space
    display: 'flex',
    flexDirection: 'column',
}));

export const ChatSection = styled(motion.div)(({ theme }) => ({
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: alpha(theme.palette.background.paper, 0.95),
    backdropFilter: "blur(20px)",
    borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    maxHeight: "50vh",
    display: "flex",
    flexDirection: "column",
}));

export const UserListToggleButton = styled(motion.button)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.secondary.main, 0.9),
    color: theme.palette.common.white,
    border: "none",
    borderRadius: "20px",
    padding: "10px 20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.875rem",
    fontWeight: 600,
    zIndex: 101,
    backdropFilter: "blur(10px)",
    boxShadow: theme.shadows[4],
    "&:hover": {
        backgroundColor: theme.palette.secondary.main,
        transform: "scale(1.05)",
    },
}));


export const ChatToggleButton = styled(motion.button)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.primary.main, 0.9),
    color: theme.palette.common.white,
    border: "none",
    borderRadius: "20px",
    padding: "10px 20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.875rem",
    fontWeight: 600,
    zIndex: 101,
    backdropFilter: "blur(10px)",
    boxShadow: theme.shadows[4],
    "&:hover": {
        backgroundColor: theme.palette.primary.main,
        transform: "scale(1.05)",
    },
}));

export const VideoFeedContainer = styled(Box)(({ theme }) => ({
    flex: 1, // 🛑 FIX: Make container take full height
    position: "relative",
    background: 'transparent',
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    padding: theme.spacing(1),
    height: "100%", // 🛑 FIX: Ensure height is 100% of VideoSection
    [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(2),
    },
}));

export const VideoGrid = styled(Grid2)(({ theme }) => ({
    width: "100%",
    height: "100%", // 🛑 FIX: Make grid fill container
    gap: theme.spacing(1),
    overflowY: 'auto',
    justifyContent: 'center',
    alignContent: 'center', // 🛑 FIX: Center items vertically
    paddingBottom: '20px',
    [theme.breakpoints.up("sm")]: {
        gap: theme.spacing(2),
    },
}));

export const VideoTile = styled(motion.div, {
    shouldForwardProp: (prop) => prop !== 'isActive' && prop !== 'isSpeaking' && prop !== 'isSingle'
})(({ theme, isActive, isSpeaking, isSingle }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius * 2,
    overflow: "hidden",
    background: `linear-gradient(45deg, ${theme.palette.grey[800]}, ${theme.palette.grey[700]})`,
    border: isSpeaking ? `3px solid ${theme.palette.success.main}` : (isActive ? `3px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.grey[600], 0.5)}`),
    boxShadow: isSpeaking ? `0 0 15px ${alpha(theme.palette.success.main, 0.6)}` : (isActive ? `0 0 15px ${alpha(theme.palette.primary.main, 0.5)}` : "none"),
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    width: '100%',
    margin: 'auto',
    
    // 🛑 FIX: Change aspect ratio and size based on count
    aspectRatio: isSingle ? '16 / 9' : '1 / 1', // Wide if single, square if multiple
    maxWidth: isSingle ? '800px' : '400px', // Allow larger size if single
    minWidth: '120px',

    [theme.breakpoints.down("sm")]: {
        aspectRatio: '1 / 1', // Force square on mobile
        maxWidth: '400px', // Max width on mobile
    },
}));

export const UserInfo = styled(Box)(({ theme }) => ({
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
    zIndex: 2,
    [theme.breakpoints.up("sm")]: {
        bottom: 8, left: 8, gap: 8, padding: "4px 8px", borderRadius: 16, fontSize: "inherit",
    },
}));

export const ControlsOverlay = styled(Box)(({ theme }) => ({
    position: "absolute",
    bottom: 4,
    right: 4,
    display: "flex",
    gap: 2,
    backgroundColor: alpha(theme.palette.grey[900], 0.7),
    padding: "2px",
    borderRadius: 6,
    zIndex: 2,
    [theme.breakpoints.up("sm")]: {
        bottom: 8, right: 8, gap: 4, padding: "4px", borderRadius: 8,
    },
}));

export const MuteIconContainer = styled(Box)(({ theme }) => ({
    width: 14, height: 14, borderRadius: "50%",
    backgroundColor: theme.palette.error.main,
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 3,
}));

export const LiveBadge = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 4, left: 4,
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    padding: "2px 6px", borderRadius: 8, fontSize: "0.6rem", fontWeight: 700,
    display: "flex", alignItems: "center", gap: 4, zIndex: 2,
    [theme.breakpoints.up("sm")]: {
        top: 8, left: 8, fontSize: "0.7rem", padding: "4px 8px", borderRadius: 12,
    },
}));

export const ViewerCount = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 8, right: 8,
    backgroundColor: alpha(theme.palette.grey[900], 0.7),
    color: theme.palette.common.white,
    padding: "4px 8px", borderRadius: 16, display: "flex", alignItems: "center",
    fontSize: 12, fontWeight: 600, zIndex: 2,
    [theme.breakpoints.up("sm")]: {
        top: 16, right: 16, fontSize: 14, padding: "6px 12px",
    },
}));

