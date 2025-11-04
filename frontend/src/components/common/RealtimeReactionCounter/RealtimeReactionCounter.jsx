import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketEvent } from '@/hooks/useSocket';

const RealtimeReactionCounter = ({ 
  postId, 
  initialCount = 0, 
  reactionType = 'like',
  showFlyingReactions = true,
  onReactionUpdate 
}) => {
  const theme = useTheme();
  const [count, setCount] = useState(initialCount);
  const [flyingReactions, setFlyingReactions] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Listen for real-time reaction updates
  useSocketEvent('reaction:added', (data) => {
    if (data.postId === postId && data.reactionType === reactionType) {
      setCount(prev => prev + 1);
      setIsAnimating(true);
      
      if (showFlyingReactions) {
        addFlyingReaction();
      }
      
      onReactionUpdate?.(data);
      
      // Reset animation state
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [postId, reactionType, showFlyingReactions, onReactionUpdate]);

  useSocketEvent('reaction:removed', (data) => {
    if (data.postId === postId && data.reactionType === reactionType) {
      setCount(prev => Math.max(0, prev - 1));
      setIsAnimating(true);
      
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [postId, reactionType]);

  // Add flying reaction animation
  const addFlyingReaction = () => {
    const newReaction = {
      id: Date.now() + Math.random(),
      x: Math.random() * 100,
      y: 100,
      delay: Math.random() * 0.5
    };
    
    setFlyingReactions(prev => [...prev, newReaction]);
    
    // Remove after animation completes
    setTimeout(() => {
      setFlyingReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2000);
  };

  // Get reaction emoji
  const getReactionEmoji = () => {
    const emojis = {
      // Crypto-themed reactions
      BULLISH: '🚀',
      BEARISH: '📉',
      FIRE: '🔥',
      GEM: '💎',
      MOON: '🌙',
      RUGGED: '💀',
      WAGMI: '💪',
      NGMI: '😢',
      ROCKET: '🎯',
      DIAMOND: '💎',
      THINKING: '🤔',
      // Social reactions
      HEART: '❤️',
      LIKE: '👍',
      LAUGH: '😂',
      SURPRISED: '😮',
      ANGRY: '😡',
      SAD: '😢',
      CELEBRATE: '🎉',
      CLAP: '👏',
      HANDS: '🙌'
    };
    return emojis[reactionType] || '👍';
  };

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {/* Main counter */}
      <motion.div
        animate={{
          scale: isAnimating ? [1, 1.2, 1] : 1
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: count > 0 ? theme.palette.primary.main : theme.palette.text.secondary,
            transition: 'color 0.3s ease'
          }}
        >
          {count}
        </Typography>
      </motion.div>

      {/* Flying reactions */}
      <AnimatePresence>
        {flyingReactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            initial={{
              x: `${reaction.x}%`,
              y: `${reaction.y}%`,
              scale: 0,
              opacity: 1
            }}
            animate={{
              x: `${reaction.x}%`,
              y: `${reaction.y - 50}%`,
              scale: [0, 1.2, 1],
              opacity: [1, 1, 0]
            }}
            exit={{
              opacity: 0,
              scale: 0
            }}
            transition={{
              duration: 2,
              delay: reaction.delay,
              ease: "easeOut"
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: 1000,
              fontSize: '20px'
            }}
          >
            {getReactionEmoji()}
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default RealtimeReactionCounter;
