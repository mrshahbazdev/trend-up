import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Tabs, 
  Tab, 
  CircularProgress,
  Button,
  Stack,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useGetKarmaLeaderboardQuery,
  useGetKarmaStatsQuery 
} from '@/api/slices/socialApi';
import KarmaDisplay from '../KarmaDisplay';

const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionChip = motion(Chip);

const KarmaLeaderboard = ({ 
  timeframe = 'all', 
  limit = 10, 
  showStats = true,
  showTabs = true,
  variant = 'default' // 'default', 'compact', 'detailed'
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(timeframe);

  // Helper function to safely format numbers
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return Number(value).toLocaleString();
  };

  const { 
    data: leaderboardData, 
    isLoading: isLoadingLeaderboard, 
    error: leaderboardError,
    refetch: refetchLeaderboard
  } = useGetKarmaLeaderboardQuery({ 
    timeframe: activeTab, 
    limit 
  });

  const { 
    data: statsData, 
    isLoading: isLoadingStats 
  } = useGetKarmaStatsQuery();

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const timeframes = [
    { value: 'all', label: 'All Time', icon: '🏆' },
    { value: 'monthly', label: 'This Month', icon: '📅' },
    { value: 'weekly', label: 'This Week', icon: '📊' },
    { value: 'daily', label: 'Today', icon: '⚡' }
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return theme.palette.text.secondary;
    }
  };

  if (variant === 'compact') {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {showTabs && (
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            {timeframes.map((timeframe) => (
              <Tab
                key={timeframe.value}
                label={timeframe.label}
                value={timeframe.value}
                icon={<span>{timeframe.icon}</span>}
                iconPosition="start"
                sx={{ minHeight: 40 }}
              />
            ))}
          </Tabs>
        )}

        {isLoadingLeaderboard ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : leaderboardError ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              Failed to load leaderboard
            </Typography>
            <Button size="small" onClick={refetchLeaderboard}>
              Try Again
            </Button>
          </Box>
        ) : (
          <Stack spacing={1}>
            {leaderboardData?.data?.leaderboard?.slice(0, 5).map((user, index) => (
              <MotionBox
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: index < 3 ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                  border: index < 3 ? `1px solid ${alpha(theme.palette.primary.main, 0.1)}` : 'none',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    minWidth: 24,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: getRankColor(index + 1),
                  }}
                >
                  {getRankIcon(index + 1)}
                </Typography>
                
                <Avatar
                  src={user.avatar}
                  alt={user.username}
                  sx={{ width: 24, height: 24 }}
                />
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: index < 3 ? 'bold' : 'medium',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.username}
                  </Typography>
                </Box>
                
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                  }}
                >
                  {formatNumber(user.totalKarma)}
                </Typography>
              </MotionBox>
            ))}
          </Stack>
        )}
      </MotionBox>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Karma Leaderboard
        </Typography>
        {showStats && statsData && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${formatNumber(statsData.data.totalUsers)} Users`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${formatNumber(statsData.data.totalKarma)} Total Karma`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {showTabs && (
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 3 }}
        >
          {timeframes.map((timeframe) => (
            <Tab
              key={timeframe.value}
              label={timeframe.label}
              value={timeframe.value}
              icon={<span>{timeframe.icon}</span>}
              iconPosition="start"
            />
          ))}
        </Tabs>
      )}

      {isLoadingLeaderboard ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : leaderboardError ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Failed to load leaderboard
          </Typography>
          <Button onClick={refetchLeaderboard}>
            Try Again
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          {leaderboardData?.data?.leaderboard?.map((user, index) => (
            <MotionCard
              key={user.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              sx={{
                background: index < 3 
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`
                  : 'transparent',
                border: index < 3 
                  ? `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  : `1px solid ${theme.palette.divider}`,
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {index < 3 && (
                <MotionChip
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  label={getRankIcon(index + 1)}
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: 16,
                    bgcolor: getRankColor(index + 1),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    height: 24,
                    zIndex: 1,
                  }}
                />
              )}
              
              <CardContent sx={{ pt: index < 3 ? 3 : 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      minWidth: 40,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: getRankColor(index + 1),
                      fontSize: '1.25rem',
                    }}
                  >
                    {index + 1}
                  </Typography>
                  
                  <Avatar
                    src={user.avatar}
                    alt={user.username}
                    sx={{ 
                      width: 48, 
                      height: 48,
                      border: index < 3 ? `3px solid ${getRankColor(index + 1)}` : 'none',
                    }}
                  />
                  
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: index < 3 ? 'bold' : 'medium',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.5,
                      }}
                    >
                      {user.username}
                    </Typography>
                    <KarmaDisplay
                      karma={user}
                      size="small"
                      variant="compact"
                    />
                  </Box>
                  
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 'bold',
                        color: theme.palette.primary.main,
                        mb: 0.5,
                      }}
                    >
                      {formatNumber(user.totalKarma)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.currentLevel}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </MotionCard>
          ))}
        </Stack>
      )}
    </MotionBox>
  );
};

export default KarmaLeaderboard;
