import { styled } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { alpha } from "@mui/material/styles";

// Animation configurations for different types
const ANIMATION_TYPES = {
    donation: {
        emoji: "🚀",
        background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        emojiAnimation: {
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
        },
        title: (data) => `${data.name} donated!`,
        subtitle: (data) => `$${data.amount}`,
    },
    like: {
        emoji: "❤️",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
        emojiAnimation: {
            scale: [1, 1.2, 1],
        },
        title: (data) => `${data.name} liked your stream!`,
        subtitle: (data) => `❤️ x${data.count || 1}`,
    },
    subscribe: {
        emoji: "⭐",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
        emojiAnimation: {
            rotate: [0, 360],
        },
        title: (data) => `${data.name} subscribed!`,
        subtitle: (data) => `Tier ${data.tier || 1}`,
    },
    follow: {
        emoji: "👥",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.light})`,
        emojiAnimation: {
            y: [0, -5, 0],
        },
        title: (data) => `${data.name} started following!`,
        subtitle: () => `Welcome!`,
    },
    gift: {
        emoji: "🎁",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
        emojiAnimation: {
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0],
        },
        title: (data) => `${data.name} sent a gift!`,
        subtitle: (data) => data.giftName || "Surprise!",
    },
    raid: {
        emoji: "⚔️",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.grey[800]}, ${theme.palette.grey[600]})`,
        emojiAnimation: {
            x: [-10, 10, -10],
        },
        title: (data) => `${data.name} is raiding with ${data.viewers} viewers!`,
        subtitle: () => `Welcome raiders!`,
    },
    cheer: {
        emoji: "🎉",
        background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.purple?.main || "#9c27b0"}, ${
                theme.palette.purple?.light || "#ba68c8"
            })`,
        emojiAnimation: {
            scale: [1, 1.3, 1],
            rotate: [0, 15, -15, 0],
        },
        title: (data) => `${data.name} cheered ${data.bits} bits!`,
        subtitle: () => `Thanks for the support!`,
    },
};

const AnimationContainer = styled(motion.div)(({ theme, type }) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: ANIMATION_TYPES[type]?.background(theme) || ANIMATION_TYPES.donation.background(theme),
    borderRadius: "20px",
    padding: "20px 30px",
    boxShadow: `0 10px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
    border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`,
    backdropFilter: "blur(10px)",
    minWidth: "200px",
    maxWidth: "300px",
    textAlign: "center",
}));

const EmojiContainer = styled(motion.div)(() => ({
    fontSize: "3rem",
    marginBottom: "15px",
    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
}));

const TitleText = styled(motion.div)(({ theme }) => ({
    color: theme.palette.common.white,
    fontWeight: 700,
    fontSize: "1.2rem",
    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
    marginBottom: "8px",
    lineHeight: 1.2,
}));

const SubtitleText = styled(motion.div)(({ theme }) => ({
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: "1.1rem",
    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
    opacity: 0.9,
}));

const CustomMessage = styled(motion.div)(({ theme }) => ({
    color: alpha(theme.palette.common.white, 0.8),
    fontWeight: 500,
    fontSize: "0.9rem",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
    marginTop: "10px",
    fontStyle: "italic",
    maxWidth: "100%",
    wordBreak: "break-word",
}));

const NotificationAnimation = ({ notification }) => {
    if (!notification) return null;

    const { type = "donation", data = {} } = notification;
    const config = ANIMATION_TYPES[type] || ANIMATION_TYPES.donation;

    return (
        <AnimatePresence>
            {notification && (
                <AnimationContainer
                    key={notification.id}
                    type={type}
                    initial={{
                        scale: 0,
                        opacity: 0,
                        y: 50,
                        rotate: -10,
                    }}
                    animate={{
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        rotate: 0,
                    }}
                    exit={{
                        scale: 0.8,
                        opacity: 0,
                        y: -50,
                        rotate: 10,
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        duration: 0.5,
                    }}
                >
                    <EmojiContainer
                        animate={config.emojiAnimation}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        {data.customEmoji || config.emoji}
                    </EmojiContainer>

                    <TitleText
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        {config.title(data)}
                    </TitleText>

                    <SubtitleText
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        {config.subtitle(data)}
                    </SubtitleText>

                    {data.message && (
                        <CustomMessage
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            "{data.message}"
                        </CustomMessage>
                    )}
                </AnimationContainer>
            )}
        </AnimatePresence>
    );
};

export default NotificationAnimation;
