import React from 'react';
import { Box, Typography, Chip, Avatar, Tooltip, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme, alpha } from '@mui/material';
import { TrendingUpIcon, StarIcon, EmojiEventsIcon } from '@/assets/icons';

const MotionBox = motion(Box);
const MotionChip = motion(Chip);

const KarmaDisplay = ({ 
  karma, 
  showLevel = true, 
  showProgress = true, 
  showBadges = true,
  size = 'medium',
  variant = 'default' // 'default', 'compact', 'detailed'
}) => {
  const theme = useTheme();

  if (!karma) return null;

  const { totalKarma, currentLevel, levelProgress, badges = [] } = karma;

  // Size configurations
  const sizeConfig = {
    small: {
      avatarSize: 24,
      fontSize: '0.75rem',
      chipSize: 'small',
      spacing: 0.5
    },
    medium: {
      avatarSize: 32,
      fontSize: '0.875rem',
      chipSize: 'small',
      spacing: 1
    },
    large: {
      avatarSize: 40,
      fontSize: '1rem',
      chipSize: 'medium',
      spacing: 1.5
    }
  };

  const config = sizeConfig[size];

  // Level colors and icons
  const levelConfig = {
    NEWBIE: { color: '#6B7280', icon: '🌱', name: 'Newbie' },
    EXPLORER: { color: '#10B981', icon: '🚀', name: 'Explorer' },
    CONTRIBUTOR: { color: '#3B82F6', icon: '⭐', name: 'Contributor' },
    INFLUENCER: { color: '#8B5CF6', icon: '👑', name: 'Influencer' },
    EXPERT: { color: '#F59E0B', icon: '🧠', name: 'Expert' },
    LEGEND: { color: '#EF4444', icon: '🏆', name: 'Legend' },
    TITAN: { color: '#7C3AED', icon: '⚡', name: 'Titan' }
  };

  const currentLevelConfig = levelConfig[currentLevel] || levelConfig.NEWBIE;

  // Get next level
  const levels = Object.keys(levelConfig);
  const currentIndex = levels.indexOf(currentLevel);
  const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  const nextLevelConfig = nextLevel ? levelConfig[nextLevel] : null;

  // Calculate progress percentage
  const progressPercentage = levelProgress?.percentage || 0;

  if (variant === 'compact') {
    return (
      <MotionBox
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        sx={{ display: 'flex', alignItems: 'center', gap: config.spacing }}
      >
        <Tooltip title={`${currentLevelConfig.name} - ${totalKarma} karma`}>
          <Avatar
            sx={{
              width: config.avatarSize,
              height: config.avatarSize,
              bgcolor: currentLevelConfig.color,
              fontSize: config.avatarSize * 0.4,
            }}
          >
            {currentLevelConfig.icon}
          </Avatar>
        </Tooltip>
        <Typography
          variant="body2"
          sx={{
            fontSize: config.fontSize,
            fontWeight: 'bold',
            color: theme.palette.text.primary,
          }}
        >
          {totalKarma.toLocaleString()}
        </Typography>
      </MotionBox>
    );
  }

  if (variant === 'detailed') {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: config.avatarSize * 1.5,
              height: config.avatarSize * 1.5,
              bgcolor: currentLevelConfig.color,
              fontSize: config.avatarSize * 0.6,
            }}
          >
            {currentLevelConfig.icon}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {totalKarma.toLocaleString()} Karma
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentLevelConfig.name}
            </Typography>
          </Box>
        </Box>

        {showProgress && nextLevel && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Progress to {nextLevelConfig.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progressPercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: currentLevelConfig.color,
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        )}

        {showBadges && badges.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Recent Badges ({badges.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {badges.slice(0, 5).map((badge, index) => (
                <Tooltip key={badge.badgeId} title={badge.description}>
                  <MotionChip
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    label={badge.icon}
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      height: 24,
                      bgcolor: alpha(badge.color || theme.palette.primary.main, 0.1),
                      color: badge.color || theme.palette.primary.main,
                      border: `1px solid ${alpha(badge.color || theme.palette.primary.main, 0.2)}`,
                    }}
                  />
                </Tooltip>
              ))}
              {badges.length > 5 && (
                <Chip
                  label={`+${badges.length - 5}`}
                  size="small"
                  sx={{
                    fontSize: '0.75rem',
                    height: 24,
                    bgcolor: alpha(theme.palette.text.secondary, 0.1),
                    color: theme.palette.text.secondary,
                  }}
                />
              )}
            </Box>
          </Box>
        )}
      </MotionBox>
    );
  }

  // Default variant
  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      sx={{ display: 'flex', alignItems: 'center', gap: config.spacing }}
    >
      <Tooltip title={`${currentLevelConfig.name} - ${totalKarma} karma`}>
        <Avatar
          sx={{
            width: config.avatarSize,
            height: config.avatarSize,
            bgcolor: currentLevelConfig.color,
            fontSize: config.avatarSize * 0.4,
          }}
        >
          {currentLevelConfig.icon}
        </Avatar>
      </Tooltip>
      
      <Box>
        <Typography
          variant="body2"
          sx={{
            fontSize: config.fontSize,
            fontWeight: 'bold',
            color: theme.palette.text.primary,
            lineHeight: 1.2,
          }}
        >
          {totalKarma.toLocaleString()}
        </Typography>
        {showLevel && (
          <Typography
            variant="caption"
            sx={{
              fontSize: config.fontSize * 0.8,
              color: currentLevelConfig.color,
              fontWeight: 'medium',
            }}
          >
            {currentLevelConfig.name}
          </Typography>
        )}
      </Box>

      {showProgress && nextLevel && (
        <Box sx={{ ml: 1, minWidth: 60 }}>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: currentLevelConfig.color,
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}
    </MotionBox>
  );
};

export default KarmaDisplay;
