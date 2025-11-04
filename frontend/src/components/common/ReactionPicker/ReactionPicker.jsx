import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  useTheme, 
  Typography,
  Fade,
  ClickAwayListener
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactionButton from '../ReactionButton';
import {
  // Crypto-themed reactions
  TrendingUpIcon,
  TrendingDownIcon,
  LocalFireDepartmentIcon,
  DiamondIcon,
  WbSunnyIcon,
  NightlightIcon,
  SkullIcon,
  FitnessCenterIcon,
  RocketLaunchIcon,
  PsychologyIcon,
  // Social reactions
  HeartBorderIcon,
  HeartIcon,
  LikeBorderIcon,
  LikeIcon,
  SentimentVerySatisfiedIcon,
  SentimentSatisfiedIcon,
  SentimentNeutralIcon,
  SentimentDissatisfiedIcon,
  SentimentVeryDissatisfiedIcon,
  CelebrationIcon,
  PanToolIcon,
  PanToolAltIcon
} from '@/assets/icons';

const REACTION_CONFIG = {
  // Crypto-themed reactions
  BULLISH: {
    icon: TrendingUpIcon,
    filledIcon: TrendingUpIcon,
    emoji: '🚀',
    color: '#00C853',
    hoverColor: '#00E676',
    label: 'Bullish'
  },
  BEARISH: {
    icon: TrendingDownIcon,
    filledIcon: TrendingDownIcon,
    emoji: '📉',
    color: '#FF1744',
    hoverColor: '#FF5252',
    label: 'Bearish'
  },
  FIRE: {
    icon: LocalFireDepartmentIcon,
    filledIcon: LocalFireDepartmentIcon,
    emoji: '🔥',
    color: '#FF6F00',
    hoverColor: '#FF8F00',
    label: 'Fire'
  },
  GEM: {
    icon: DiamondIcon,
    filledIcon: DiamondIcon,
    emoji: '💎',
    color: '#9C27B0',
    hoverColor: '#BA68C8',
    label: 'Gem'
  },
  MOON: {
    icon: NightlightIcon,
    filledIcon: NightlightIcon,
    emoji: '🌙',
    color: '#3F51B5',
    hoverColor: '#5C6BC0',
    label: 'Moon'
  },
  RUGGED: {
    icon: SkullIcon,
    filledIcon: SkullIcon,
    emoji: '💀',
    color: '#424242',
    hoverColor: '#616161',
    label: 'Rugged'
  },
  WAGMI: {
    icon: FitnessCenterIcon,
    filledIcon: FitnessCenterIcon,
    emoji: '💪',
    color: '#FF9800',
    hoverColor: '#FFB74D',
    label: 'WAGMI'
  },
  NGMI: {
    icon: SentimentVeryDissatisfiedIcon,
    filledIcon: SentimentVeryDissatisfiedIcon,
    emoji: '😢',
    color: '#607D8B',
    hoverColor: '#90A4AE',
    label: 'NGMI'
  },
  ROCKET: {
    icon: RocketLaunchIcon,
    filledIcon: RocketLaunchIcon,
    emoji: '🎯',
    color: '#E91E63',
    hoverColor: '#F06292',
    label: 'Rocket'
  },
  DIAMOND: {
    icon: DiamondIcon,
    filledIcon: DiamondIcon,
    emoji: '💎',
    color: '#9C27B0',
    hoverColor: '#BA68C8',
    label: 'Diamond'
  },
  THINKING: {
    icon: PsychologyIcon,
    filledIcon: PsychologyIcon,
    emoji: '🤔',
    color: '#795548',
    hoverColor: '#A1887F',
    label: 'Thinking'
  },
  // Social reactions
  HEART: {
    icon: HeartBorderIcon,
    filledIcon: HeartIcon,
    emoji: '❤️',
    color: '#E91E63',
    hoverColor: '#F06292',
    label: 'Heart'
  },
  LIKE: {
    icon: LikeBorderIcon,
    filledIcon: LikeIcon,
    emoji: '👍',
    color: '#2196F3',
    hoverColor: '#42A5F5',
    label: 'Like'
  },
  LAUGH: {
    icon: SentimentVerySatisfiedIcon,
    filledIcon: SentimentVerySatisfiedIcon,
    emoji: '😂',
    color: '#FFC107',
    hoverColor: '#FFD54F',
    label: 'Laugh'
  },
  SURPRISED: {
    icon: SentimentSatisfiedIcon,
    filledIcon: SentimentSatisfiedIcon,
    emoji: '😮',
    color: '#FF9800',
    hoverColor: '#FFB74D',
    label: 'Surprised'
  },
  ANGRY: {
    icon: SentimentVeryDissatisfiedIcon,
    filledIcon: SentimentVeryDissatisfiedIcon,
    emoji: '😡',
    color: '#F44336',
    hoverColor: '#EF5350',
    label: 'Angry'
  },
  SAD: {
    icon: SentimentDissatisfiedIcon,
    filledIcon: SentimentDissatisfiedIcon,
    emoji: '😢',
    color: '#607D8B',
    hoverColor: '#90A4AE',
    label: 'Sad'
  },
  CELEBRATE: {
    icon: CelebrationIcon,
    filledIcon: CelebrationIcon,
    emoji: '🎉',
    color: '#FF5722',
    hoverColor: '#FF7043',
    label: 'Celebrate'
  },
  CLAP: {
    icon: PanToolIcon,
    filledIcon: PanToolAltIcon,
    emoji: '👏',
    color: '#4CAF50',
    hoverColor: '#66BB6A',
    label: 'Clap'
  },
  HANDS: {
    icon: PanToolIcon,
    filledIcon: PanToolAltIcon,
    emoji: '🙌',
    color: '#FF9800',
    hoverColor: '#FFB74D',
    label: 'Hands'
  }
};

const ReactionPicker = ({ 
  postId, 
  isOpen, 
  onClose, 
  onReaction, 
  userReactions = {},
  reactionCounts = {},
  anchorEl = null 
}) => {
  const theme = useTheme();
  const [hoveredReaction, setHoveredReaction] = useState(null);

  const handleReaction = (reactionType) => {
    onReaction?.(reactionType);
    onClose?.();
  };

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        staggerChildren: 0.05
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  if (!isOpen) return null;

  return (
    <ClickAwayListener onClickAway={onClose}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={containerVariants}
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          marginBottom: 8
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 2,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
            border: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(10px)',
            minWidth: 320,
            maxWidth: 400
          }}
        >
          {/* Header */}
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'center', 
              mb: 2,
              color: theme.palette.text.secondary,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            React to this post
          </Typography>

          {/* Reactions Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
              gap: 1,
              maxHeight: 200,
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: 4,
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.divider,
                borderRadius: 2,
              },
            }}
          >
            {Object.entries(REACTION_CONFIG).map(([reactionType, config]) => (
              <motion.div
                key={reactionType}
                variants={itemVariants}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ReactionButton
                  postId={postId}
                  reactionType={reactionType}
                  icon={config.icon}
                  filledIcon={config.filledIcon}
                  emoji={config.emoji}
                  color={config.color}
                  hoverColor={config.hoverColor}
                  isActive={userReactions[reactionType] || false}
                  count={reactionCounts[reactionType] || 0}
                  onReaction={handleReaction}
                  showCount={false}
                  showFlyingEmoji={false}
                  enableRealtimeUpdates={false}
                  size="medium"
                />
              </motion.div>
            ))}
          </Box>

          {/* Footer */}
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'center', 
              mt: 2,
              color: theme.palette.text.disabled,
              fontSize: '0.7rem'
            }}
          >
            Click to react • Real-time updates
          </Typography>
        </Paper>
      </motion.div>
    </ClickAwayListener>
  );
};

export default ReactionPicker;
