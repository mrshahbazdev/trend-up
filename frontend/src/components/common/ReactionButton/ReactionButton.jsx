import React, { useState, useCallback, useMemo } from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketEvent } from '@/hooks/useSocket';

const ReactionButton = React.memo(({ 
  postId, 
  reactionType, 
  icon: Icon, 
  filledIcon: FilledIcon, 
  emoji, 
  color, 
  hoverColor,
  isActive = false,
  count = 0,
  onReaction,
  showCount = true,
  showFlyingEmoji = true,
  enableRealtimeUpdates = true,
  size = 'medium'
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [flyingEmojis, setFlyingEmojis] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Memoize icon sizes
  const iconSize = useMemo(() => {
    switch (size) {
      case 'small': return 18;
      case 'large': return 28;
      default: return 24;
    }
  }, [size]);

  const buttonSize = useMemo(() => {
    switch (size) {
      case 'small': return 'small';
      case 'large': return 'large';
      default: return 'medium';
    }
  }, [size]);

  // Add flying emoji animation
  const addFlyingEmoji = useCallback(() => {
    const newEmoji = {
      id: Date.now() + Math.random(),
      x: Math.random() * 100,
      y: 100,
      delay: Math.random() * 0.3
    };
    
    setFlyingEmojis(prev => [...prev, newEmoji]);
    
    // Remove after animation completes
    setTimeout(() => {
      setFlyingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 2000);
  }, []);

  // Listen for real-time reaction updates (only if enabled)
  useSocketEvent('reaction:added', (data) => {
    if (!enableRealtimeUpdates) return;
    if (data.postId === postId && data.reactionType === reactionType) {
      setIsAnimating(true);
      
      if (showFlyingEmoji) {
        addFlyingEmoji();
      }
      
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [postId, reactionType, showFlyingEmoji, addFlyingEmoji, enableRealtimeUpdates]);

  const handleClick = useCallback(() => {
    onReaction?.(reactionType);
    
    if (showFlyingEmoji) {
      addFlyingEmoji();
    }
  }, [onReaction, reactionType, showFlyingEmoji, addFlyingEmoji]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Tooltip title={`${reactionType} (${count})`} arrow>
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <IconButton
            size={buttonSize}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
              color: isActive ? color : theme.palette.text.secondary,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                color: hoverColor || color,
                backgroundColor: `${color}15`,
                transform: 'scale(1.1)',
              },
              position: 'relative',
              overflow: 'visible'
            }}
          >
            <motion.div
              animate={{
                scale: isAnimating ? [1, 1.3, 1] : 1,
                rotate: isAnimating ? [0, -10, 10, 0] : 0
              }}
              transition={{
                duration: 0.4,
                ease: "easeInOut"
              }}
            >
              {isActive ? <FilledIcon sx={{ fontSize: iconSize }} /> : <Icon sx={{ fontSize: iconSize }} />}
            </motion.div>

            {/* Glow effect for active reactions */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.3, scale: 1.2 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: color,
                  filter: 'blur(8px)',
                  zIndex: -1
                }}
              />
            )}
          </IconButton>
        </motion.div>
      </Tooltip>

      {/* Count display */}
      {showCount && count > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: '50%',
            minWidth: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: `2px solid ${theme.palette.background.default}`,
            boxShadow: theme.shadows[2]
          }}
        >
          {count}
        </motion.div>
      )}

      {/* Flying emojis */}
      <AnimatePresence>
        {flyingEmojis.map((emojiData) => (
          <motion.div
            key={emojiData.id}
            initial={{
              x: `${emojiData.x}%`,
              y: `${emojiData.y}%`,
              scale: 0,
              opacity: 1
            }}
            animate={{
              x: `${emojiData.x}%`,
              y: `${emojiData.y - 60}%`,
              scale: [0, 1.5, 1],
              opacity: [1, 1, 0],
              rotate: [0, 360]
            }}
            exit={{
              opacity: 0,
              scale: 0
            }}
            transition={{
              duration: 2,
              delay: emojiData.delay,
              ease: "easeOut"
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              zIndex: 1000,
              fontSize: '24px',
              userSelect: 'none'
            }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

export default ReactionButton;
