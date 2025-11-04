import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useKarmaUpdates } from '@/hooks/useSocket';
import { useSelector } from 'react-redux';

const KarmaGainToast = ({ userId, onKarmaUpdate }) => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);

  // Listen for karma updates
  useKarmaUpdates(userId, (data) => {
    const notification = {
      id: Date.now() + Math.random(),
      type: data.type,
      amount: data.amount,
      reason: data.reason,
      timestamp: new Date().toISOString(),
      ...data
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep max 5 notifications

    onKarmaUpdate?.(data);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, [userId, onKarmaUpdate]);

  // Animation variants
  const notificationVariants = {
    hidden: { 
      opacity: 0, 
      x: 300, 
      scale: 0.8 
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      x: 300, 
      scale: 0.8,
      transition: {
        duration: 0.3
      }
    }
  };

  const confettiVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  // Get notification content
  const getNotificationContent = (notification) => {
    switch (notification.type) {
      case 'earned':
        return {
          title: `+${notification.amount} Karma`,
          message: notification.reason || 'Karma earned!',
          color: theme.palette.success.main,
          emoji: '🎉',
          showConfetti: notification.amount >= 10
        };
      case 'deducted':
        return {
          title: `-${Math.abs(notification.amount)} Karma`,
          message: notification.reason || 'Karma deducted',
          color: theme.palette.error.main,
          emoji: '😔',
          showConfetti: false
        };
      case 'level_up':
        return {
          title: `Level Up!`,
          message: `You reached level ${notification.newLevel}!`,
          color: theme.palette.primary.main,
          emoji: '🚀',
          showConfetti: true
        };
      case 'badge_earned':
        return {
          title: `Badge Earned!`,
          message: notification.badgeName || 'New badge unlocked!',
          color: theme.palette.warning.main,
          emoji: '🏆',
          showConfetti: true
        };
      default:
        return {
          title: 'Karma Update',
          message: notification.reason || 'Karma changed',
          color: theme.palette.info.main,
          emoji: '⭐',
          showConfetti: false
        };
    }
  };

  // Confetti particles
  const ConfettiParticle = ({ delay = 0 }) => (
    <motion.div
      initial={{ 
        x: 0, 
        y: 0, 
        rotate: 0,
        opacity: 1 
      }}
      animate={{ 
        x: [0, Math.random() * 200 - 100],
        y: [0, -100],
        rotate: [0, 360],
        opacity: [1, 0]
      }}
      transition={{ 
        duration: 2,
        delay,
        ease: "easeOut"
      }}
      style={{
        position: 'absolute',
        width: '8px',
        height: '8px',
        backgroundColor: theme.palette.primary.main,
        borderRadius: '50%',
        pointerEvents: 'none'
      }}
    />
  );

  if (!user || user._id !== userId) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <AnimatePresence>
        {notifications.map((notification, index) => {
          const content = getNotificationContent(notification);
          
          return (
            <motion.div
              key={notification.id}
              variants={notificationVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                marginBottom: theme.spacing(1),
                position: 'relative'
              }}
            >
              <Box
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  border: `2px solid ${content.color}`,
                  borderRadius: 2,
                  padding: 2,
                  boxShadow: theme.shadows[4],
                  minWidth: '250px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Confetti overlay */}
                {content.showConfetti && (
                  <motion.div
                    variants={confettiVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      pointerEvents: 'none'
                    }}
                  >
                    {[...Array(12)].map((_, i) => (
                      <ConfettiParticle key={i} delay={i * 0.1} />
                    ))}
                  </motion.div>
                )}

                {/* Notification content */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '1.5rem',
                      filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.3))'
                    }}
                  >
                    {content.emoji}
                  </Typography>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ color: content.color }}
                    >
                      {content.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.8rem' }}
                    >
                      {content.message}
                    </Typography>
                  </Box>
                </Box>

                {/* Progress bar */}
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 5, ease: "linear" }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '3px',
                    backgroundColor: content.color,
                    opacity: 0.7
                  }}
                />
              </Box>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Box>
  );
};

export default KarmaGainToast;
