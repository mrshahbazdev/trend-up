/**
 * src/pages/live/styled/NotificationStyles.js
 *
 * Styled-components and config for the NotificationAnimation.
 */
import { styled, alpha } from "@mui/material";
import { motion } from "framer-motion";

// The animation configuration object is tightly coupled
// to the styles, so it lives here.
export const ANIMATION_TYPES = {
    donation: {
        emoji: "💰",
        title: (data) => `$${data.amount} Donation!`,
        subtitle: (data) => `From ${data.fromUser}`,
        background: (theme) => `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
        emojiAnimation: { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
    },
    like: {
        emoji: "❤️",
        title: () => "New Like!",
        subtitle: () => "Someone liked your stream",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
        emojiAnimation: { scale: [1, 1.3, 1] }
    },
    follow: {
        emoji: "⭐",
        title: () => "New Follower!",
        subtitle: () => "Thanks for the follow!",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
        emojiAnimation: { scale: [1, 1.2, 1], y: [0, -10, 0] }
    },
    gift: {
        emoji: "🎁",
        title: () => "Gift Received!",
        subtitle: () => "Thank you for the gift!",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
        emojiAnimation: { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }
    }
};

// Styled Components
export const AnimationContainer = styled(motion.div)(({ theme, type }) => ({
    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 9999,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    background: ANIMATION_TYPES[type]?.background(theme) || ANIMATION_TYPES.donation.background(theme),
    borderRadius: "20px", padding: "20px 30px", boxShadow: `0 10px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
    border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`, backdropFilter: "blur(10px)",
    minWidth: "200px", maxWidth: "300px", textAlign: "center",
}));

export const EmojiContainer = styled(motion.div)(() => ({
    fontSize: "3rem", marginBottom: "15px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
}));

export const TitleText = styled(motion.div)(({ theme }) => ({
    color: theme.palette.common.white, fontWeight: 700, fontSize: "1.2rem",
    textShadow: "0 2px 4px rgba(0,0,0,0.5)", marginBottom: "8px", lineHeight: 1.2
}));

export const SubtitleText = styled(motion.div)(({ theme }) => ({
    color: theme.palette.common.white, fontWeight: 600, fontSize: "1.1rem",
    textShadow: "0 2px 4px rgba(0,0,0,0.5)", opacity: 0.9
}));

export const CustomMessage = styled(motion.div)(({ theme }) => ({
    color: alpha(theme.palette.common.white, 0.8), fontWeight: 500, fontSize: "0.9rem",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)", marginTop: "10px", fontStyle: "italic",
    maxWidth: "100%", wordBreak: "break-word"
}));