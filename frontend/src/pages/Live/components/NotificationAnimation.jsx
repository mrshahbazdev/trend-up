/**
 * src/pages/live/components/NotificationAnimation.jsx
 *
 * Reusable component for displaying on-screen alerts (donations, likes, etc.)
 */
import React from "react";
import { AnimatePresence } from "framer-motion";
import {
    ANIMATION_TYPES,
    AnimationContainer,
    EmojiContainer,
    TitleText,
    SubtitleText,
    CustomMessage
} from "../styled/NotificationStyles";

export const NotificationAnimation = ({ notification }) => {
    if (!notification) return null;

    const { type = "donation", data = {} } = notification;
    const config = ANIMATION_TYPES[type] || ANIMATION_TYPES.donation;

    return (
        <AnimatePresence>
            {notification && (
                <AnimationContainer 
                    key={notification.id} 
                    type={type}
                    initial={{ scale: 0, opacity: 0, y: 50, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -50, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.5 }}
                >
                    <EmojiContainer animate={config.emojiAnimation} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                        {data.customEmoji || config.emoji}
                    </EmojiContainer>
                    <TitleText initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
                        {config.title(data)}
                    </TitleText>
                    <SubtitleText initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
                        {config.subtitle(data)}
                    </SubtitleText>
                    {data.message && (
                        <CustomMessage initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
                            "{data.message}"
                        </CustomMessage>
                    )}
                </AnimationContainer>
            )}
        </AnimatePresence>
    );
};