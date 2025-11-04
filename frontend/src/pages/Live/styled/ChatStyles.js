/**
 * src/pages/live/styled/ChatStyles.js
 *
 * Styled-components for the LiveChat component.
 */
import { Box, styled, alpha, Stack } from "@mui/material";
import { motion } from "framer-motion";

export const ChatContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isCompact",
})(({ theme, isCompact }) => ({
    width: isCompact ? "100%" : 350,
    height: isCompact ? "100%" : "100%",
    backgroundColor: alpha(theme.palette.background.paper, 0.97),
    backdropFilter: "blur(16px)",
    borderLeft: isCompact ? "none" : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: isCompact ? "16px 16px 0 0" : "0",
    transition: "all 0.3s ease-in-out",
    boxShadow: isCompact ? theme.shadows[8] : "none",
    [theme.breakpoints.down("md")]: {
        ...(!isCompact && {
            position: "absolute", right: 0, top: 0, bottom: 0,
            transform: "translateX(100%)", zIndex: 1000,
            "&.chat-open": { transform: "translateX(0)" },
        }),
    },
    [theme.breakpoints.down("sm")]: {
        width: "100%", borderRadius: isCompact ? "16px 16px 0 0" : "0",
    },
}));

export const MessageItem = styled(motion.div)(({ theme, type }) => ({
    display: "flex", alignItems: "flex-start", padding: "8px 12px",
    backgroundColor: type === "donation" ? alpha(theme.palette.success.main, 0.15) : "transparent",
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    transition: "all 0.2s ease",
    "&:hover": { backgroundColor: alpha(theme.palette.action.hover, 0.08) },
}));

export const EmojiPickerContainer = styled(Box)(({ theme }) => ({
    position: "absolute", bottom: "100%", right: 0, marginBottom: 8, zIndex: 1000,
    "& .EmojiPickerReact": {
        backgroundColor: `${theme.palette.background.paper} !important`,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)} !important`,
        borderRadius: `${theme.shape.borderRadius * 2}px !important`,
        boxShadow: `${theme.shadows[8]} !important`,
        width: "100% !important", maxWidth: 350,
    },
    [theme.breakpoints.down("sm")]: {
        right: "auto", left: 0,
        "& .EmojiPickerReact": { maxWidth: "100%", width: "100vw !important", marginLeft: "-16px" },
    },
}));

export const CompactHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.5), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(12px)",
}));

export const ActionButtonsContainer = styled(Stack)(({ theme, isCompact }) => ({
    flexDirection: "row", gap: theme.spacing(0.5),
    ...(isCompact && {
        overflowX: "auto", padding: theme.spacing(0.5),
        "&::-webkit-scrollbar": { display: "none" },
        msOverflowStyle: "none", scrollbarWidth: "none",
    }),
}));

export const MessagesContainer = styled(Box)(({ theme }) => ({
    flex: 1, overflowY: "auto", padding: theme.spacing(0.5),
}));