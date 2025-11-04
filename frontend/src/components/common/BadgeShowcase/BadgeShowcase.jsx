import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Tabs, 
  Tab, 
  CircularProgress,
  Button,
  Grid,
  Tooltip,
  useTheme,
  alpha,
  Badge
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useGetAllBadgesQuery,
  useGetBadgesByCategoryQuery,
  useGetBadgesByRarityQuery,
  useGetMyBadgesQuery,
  useGetMyBadgeProgressQuery
} from '@/api/slices/socialApi';

const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionChip = motion(Chip);

const BadgeShowcase = ({ 
  userId = null, // If provided, shows user's badges and progress
  category = null, // If provided, filters by category
  rarity = null, // If provided, filters by rarity
  showProgress = true,
  showTabs = true,
  variant = 'default' // 'default', 'compact', 'grid'
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('all');

  // Determine which query to use
  const { 
    data: allBadgesData, 
    isLoading: isLoadingAll,
    error: allBadgesError
  } = useGetAllBadgesQuery(
    { active: true },
    { skip: category || rarity || userId }
  );

  const { 
    data: categoryBadgesData, 
    isLoading: isLoadingCategory,
    error: categoryBadgesError
  } = useGetBadgesByCategoryQuery(
    { category, active: true },
    { skip: !category || rarity || userId }
  );

  const { 
    data: rarityBadgesData, 
    isLoading: isLoadingRarity,
    error: rarityBadgesError
  } = useGetBadgesByRarityQuery(
    { rarity, active: true },
    { skip: !rarity || category || userId }
  );

  const { 
    data: myBadgesData, 
    isLoading: isLoadingMyBadges
  } = useGetMyBadgesQuery(
    undefined,
    { skip: !userId }
  );

  const { 
    data: myProgressData, 
    isLoading: isLoadingMyProgress
  } = useGetMyBadgeProgressQuery(
    undefined,
    { skip: !userId || !showProgress }
  );

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  // Get the appropriate data based on filters
  const getCurrentData = () => {
    if (userId) {
      return {
        badges: Array.isArray(myBadgesData?.data?.badges) ? myBadgesData.data.badges : [],
        progress: Array.isArray(myProgressData?.data?.progress) ? myProgressData.data.progress : [],
        isLoading: isLoadingMyBadges || isLoadingMyProgress,
        error: null
      };
    }
    
    if (category) {
      return {
        badges: Array.isArray(categoryBadgesData?.data?.badges) ? categoryBadgesData.data.badges : [],
        progress: [],
        isLoading: isLoadingCategory,
        error: categoryBadgesError
      };
    }
    
    if (rarity) {
      return {
        badges: Array.isArray(rarityBadgesData?.data?.badges) ? rarityBadgesData.data.badges : [],
        progress: [],
        isLoading: isLoadingRarity,
        error: rarityBadgesError
      };
    }
    
    return {
      badges: Array.isArray(allBadgesData?.data?.badges) ? allBadgesData.data.badges : [],
      progress: [],
      isLoading: isLoadingAll,
      error: allBadgesError
    };
  };

  const { badges, progress, isLoading, error } = getCurrentData();

  // Get user's earned badge IDs
  const earnedBadgeIds = userId ? 
    (Array.isArray(myBadgesData?.data?.badges) ? myBadgesData.data.badges : []).map(badge => badge.badgeId) : [];

  // Get progress map
  const progressMap = userId && showProgress ? 
    (Array.isArray(myProgressData?.data?.progress) ? myProgressData.data.progress : []).reduce((acc, item) => {
      acc[item.badgeId] = item;
      return acc;
    }, {}) : {};

  const categories = [
    { value: 'all', label: 'All Badges', icon: '🏆' },
    { value: 'POSTING', label: 'Posting', icon: '📝' },
    { value: 'ENGAGEMENT', label: 'Engagement', icon: '💬' },
    { value: 'PREDICTION', label: 'Prediction', icon: '🔮' },
    { value: 'MODERATION', label: 'Moderation', icon: '🛡️' },
    { value: 'SPECIAL', label: 'Special', icon: '⭐' }
  ];

  const rarities = [
    { value: 'all', label: 'All Rarities', color: theme.palette.text.secondary },
    { value: 'COMMON', label: 'Common', color: '#6B7280' },
    { value: 'UNCOMMON', label: 'Uncommon', color: '#10B981' },
    { value: 'RARE', label: 'Rare', color: '#3B82F6' },
    { value: 'EPIC', label: 'Epic', color: '#8B5CF6' },
    { value: 'LEGENDARY', label: 'Legendary', color: '#F59E0B' }
  ];

  const getRarityColor = (rarity) => {
    const rarityConfig = rarities.find(r => r.value === rarity);
    return rarityConfig?.color || theme.palette.text.secondary;
  };

  const getRarityLabel = (rarity) => {
    const rarityConfig = rarities.find(r => r.value === rarity);
    return rarityConfig?.label || rarity;
  };

  if (variant === 'compact') {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error" sx={{ textAlign: 'center', py: 2 }}>
            Failed to load badges
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {badges.slice(0, 10).map((badge, index) => {
              const isEarned = earnedBadgeIds.includes(badge.badgeId);
              const badgeProgress = progressMap[badge.badgeId];
              
              return (
                <Tooltip
                  key={badge.badgeId}
                  title={
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {badge.name}
                      </Typography>
                      <Typography variant="caption">
                        {badge.description}
                      </Typography>
                      {userId && badgeProgress && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                          Progress: {badgeProgress.progressPercentage}%
                        </Typography>
                      )}
                    </Box>
                  }
                >
                  <MotionChip
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    label={badge.icon}
                    size="small"
                    sx={{
                      fontSize: '0.875rem',
                      height: 28,
                      bgcolor: isEarned 
                        ? alpha(badge.color || theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.text.secondary, 0.1),
                      color: isEarned 
                        ? badge.color || theme.palette.primary.main
                        : theme.palette.text.secondary,
                      border: `1px solid ${isEarned 
                        ? alpha(badge.color || theme.palette.primary.main, 0.3)
                        : alpha(theme.palette.text.secondary, 0.2)}`,
                      opacity: isEarned ? 1 : 0.6,
                    }}
                  />
                </Tooltip>
              );
            })}
            {badges.length > 10 && (
              <Chip
                label={`+${badges.length - 10}`}
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  height: 28,
                  bgcolor: alpha(theme.palette.text.secondary, 0.1),
                  color: theme.palette.text.secondary,
                }}
              />
            )}
          </Box>
        )}
      </MotionBox>
    );
  }

  if (variant === 'grid') {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {showTabs && !category && !rarity && (
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 3 }}
          >
            {categories.map((cat) => (
              <Tab
                key={cat.value}
                label={cat.label}
                value={cat.value}
                icon={<span>{cat.icon}</span>}
                iconPosition="start"
              />
            ))}
          </Tabs>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              Failed to load badges
            </Typography>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {badges.map((badge, index) => {
              const isEarned = earnedBadgeIds.includes(badge.badgeId);
              const badgeProgress = progressMap[badge.badgeId];
              
              return (
                <Grid item xs={12} sm={6} md={4} key={badge.badgeId}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    sx={{
                      height: '100%',
                      position: 'relative',
                      bgcolor: isEarned 
                        ? alpha(badge.color || theme.palette.primary.main, 0.05)
                        : alpha(theme.palette.text.secondary, 0.02),
                      border: `2px solid ${isEarned 
                        ? alpha(badge.color || theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.text.secondary, 0.1)}`,
                      opacity: isEarned ? 1 : 0.7,
                    }}
                  >
                    {isEarned && (
                      <Chip
                        label="Earned"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: badge.color || theme.palette.primary.main,
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                    
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          fontSize: '2.5rem',
                          mb: 1,
                          filter: isEarned ? 'none' : 'grayscale(100%)',
                        }}
                      >
                        {badge.icon}
                      </Typography>
                      
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ mb: 1 }}
                      >
                        {badge.name}
                      </Typography>
                      
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, minHeight: 40 }}
                      >
                        {badge.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                        <Chip
                          label={getRarityLabel(badge.rarity)}
                          size="small"
                          sx={{
                            bgcolor: alpha(getRarityColor(badge.rarity), 0.1),
                            color: getRarityColor(badge.rarity),
                            border: `1px solid ${alpha(getRarityColor(badge.rarity), 0.2)}`,
                          }}
                        />
                        <Chip
                          label={badge.category}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      
                      {userId && badgeProgress && showProgress && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Progress: {badgeProgress.progressPercentage}%
                          </Typography>
                          <Box
                            sx={{
                              width: '100%',
                              height: 4,
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                width: `${badgeProgress.progressPercentage}%`,
                                height: '100%',
                                bgcolor: badge.color || theme.palette.primary.main,
                                borderRadius: 2,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </MotionCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </MotionBox>
    );
  }

  // Default variant
  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          {userId ? 'My Badges' : 'Badge Collection'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {badges.length} badges
        </Typography>
      </Box>

      {showTabs && !category && !rarity && (
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {categories.map((cat) => (
            <Tab
              key={cat.value}
              label={cat.label}
              value={cat.value}
              icon={<span>{cat.icon}</span>}
              iconPosition="start"
            />
          ))}
        </Tabs>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Failed to load badges
          </Typography>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          {badges.map((badge, index) => {
            const isEarned = earnedBadgeIds.includes(badge.badgeId);
            const badgeProgress = progressMap[badge.badgeId];
            
            return (
              <MotionCard
                key={badge.badgeId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{
                  bgcolor: isEarned 
                    ? alpha(badge.color || theme.palette.primary.main, 0.05)
                    : alpha(theme.palette.text.secondary, 0.02),
                  border: `1px solid ${isEarned 
                    ? alpha(badge.color || theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.text.secondary, 0.1)}`,
                  opacity: isEarned ? 1 : 0.7,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '2rem',
                        filter: isEarned ? 'none' : 'grayscale(100%)',
                      }}
                    >
                      {badge.icon}
                    </Typography>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {badge.name}
                        </Typography>
                        {isEarned && (
                          <Chip
                            label="Earned"
                            size="small"
                            sx={{
                              bgcolor: badge.color || theme.palette.primary.main,
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                            }}
                          />
                        )}
                      </Box>
                      
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {badge.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={getRarityLabel(badge.rarity)}
                          size="small"
                          sx={{
                            bgcolor: alpha(getRarityColor(badge.rarity), 0.1),
                            color: getRarityColor(badge.rarity),
                            border: `1px solid ${alpha(getRarityColor(badge.rarity), 0.2)}`,
                          }}
                        />
                        <Chip
                          label={badge.category}
                          size="small"
                          variant="outlined"
                        />
                        {badge.karmaReward > 0 && (
                          <Chip
                            label={`+${badge.karmaReward} karma`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {userId && badgeProgress && showProgress && (
                      <Box sx={{ minWidth: 120, textAlign: 'right' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {badgeProgress.progressPercentage}%
                        </Typography>
                        <Box
                          sx={{
                            width: '100%',
                            height: 6,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${badgeProgress.progressPercentage}%`,
                              height: '100%',
                              bgcolor: badge.color || theme.palette.primary.main,
                              borderRadius: 3,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </MotionCard>
            );
          })}
        </Stack>
      )}
    </MotionBox>
  );
};

export default BadgeShowcase;
