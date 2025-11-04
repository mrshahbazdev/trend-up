import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  CircularProgress,
  Button,
  Stack,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { 
  useGetMyKarmaHistoryQuery,
  useGetUserKarmaHistoryQuery
} from '@/api/slices/socialApi';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const KarmaHistory = ({ 
  userId = null, // If null, shows current user's history
  limit = 20,
  showLoadMore = true,
  variant = 'default' // 'default', 'compact', 'detailed'
}) => {
  const theme = useTheme();
  const [currentLimit, setCurrentLimit] = useState(limit);

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    try {
      // Try to parse as ISO string first
      let date = parseISO(dateString);
      
      // If that fails, try as regular Date
      if (!isValid(date)) {
        date = new Date(dateString);
      }
      
      // If still invalid, return fallback
      if (!isValid(date)) {
        return 'Unknown time';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn('Failed to format date:', dateString, error);
      return 'Unknown time';
    }
  };

  const { 
    data: myHistoryData, 
    isLoading: isLoadingMyHistory,
    error: myHistoryError,
    refetch: refetchMyHistory
  } = useGetMyKarmaHistoryQuery(
    { limit: currentLimit, offset: 0 },
    { skip: !!userId }
  );

  const { 
    data: userHistoryData, 
    isLoading: isLoadingUserHistory,
    error: userHistoryError,
    refetch: refetchUserHistory
  } = useGetUserKarmaHistoryQuery(
    { userId, limit: currentLimit, offset: 0 },
    { skip: !userId }
  );

  const handleLoadMore = useCallback(() => {
    setCurrentLimit(prev => prev + limit);
  }, [limit]);

  const getCurrentData = () => {
    if (userId) {
      return {
        history: userHistoryData?.data?.history || [],
        pagination: userHistoryData?.data?.pagination || {},
        isLoading: isLoadingUserHistory,
        error: userHistoryError,
        refetch: refetchUserHistory
      };
    }
    
    return {
      history: myHistoryData?.data?.history || [],
      pagination: myHistoryData?.data?.pagination || {},
      isLoading: isLoadingMyHistory,
      error: myHistoryError,
      refetch: refetchMyHistory
    };
  };

  const { history, pagination, isLoading, error, refetch } = getCurrentData();

  const getSourceIcon = (source) => {
    switch (source) {
      case 'POST': return '📝';
      case 'COMMENT': return '💬';
      case 'REACTION': return '👍';
      case 'PREDICTION': return '🔮';
      case 'POLL': return '📊';
      case 'MODERATION': return '🛡️';
      case 'BADGE': return '🏆';
      case 'BONUS': return '🎁';
      case 'PENALTY': return '⚠️';
      default: return '⭐';
    }
  };

  const getSourceColor = (source) => {
    switch (source) {
      case 'POST': return theme.palette.primary.main;
      case 'COMMENT': return theme.palette.info.main;
      case 'REACTION': return theme.palette.success.main;
      case 'PREDICTION': return theme.palette.secondary.main;
      case 'POLL': return theme.palette.warning.main;
      case 'MODERATION': return theme.palette.error.main;
      case 'BADGE': return '#FFD700';
      case 'BONUS': return '#4CAF50';
      case 'PENALTY': return '#F44336';
      default: return theme.palette.text.secondary;
    }
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'POST': return 'Post Created';
      case 'COMMENT': return 'Comment Added';
      case 'REACTION': return 'Reaction Given';
      case 'PREDICTION': return 'Prediction Made';
      case 'POLL': return 'Poll Created';
      case 'MODERATION': return 'Moderation Action';
      case 'BADGE': return 'Badge Earned';
      case 'BONUS': return 'Bonus Karma';
      case 'PENALTY': return 'Karma Penalty';
      default: return source;
    }
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
            Failed to load karma history
          </Typography>
        ) : (
          <Stack spacing={1}>
            {history.slice(0, 5).map((item, index) => (
              <MotionBox
                key={item._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.875rem',
                    color: item.amount > 0 ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 'bold',
                    minWidth: 40,
                    textAlign: 'right',
                  }}
                >
                  {item.amount > 0 ? '+' : ''}{item.amount}
                </Typography>
                
                <Typography
                  variant="body2"
                  sx={{ fontSize: '0.875rem' }}
                >
                  {getSourceIcon(item.source)}
                </Typography>
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
                
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  {formatDate(item.timestamp)}
                </Typography>
              </MotionBox>
            ))}
            {history.length > 5 && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                +{history.length - 5} more entries
              </Typography>
            )}
          </Stack>
        )}
      </MotionBox>
    );
  }

  if (variant === 'detailed') {
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Karma History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pagination.total || 0} total entries
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              Failed to load karma history
            </Typography>
            <Button onClick={refetch}>
              Try Again
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {history.map((item, index) => (
              <MotionCard
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                sx={{
                  bgcolor: alpha(
                    item.amount > 0 ? theme.palette.success.main : theme.palette.error.main,
                    0.05
                  ),
                  border: `1px solid ${alpha(
                    item.amount > 0 ? theme.palette.success.main : theme.palette.error.main,
                    0.1
                  )}`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: alpha(getSourceColor(item.source), 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                      }}
                    >
                      {getSourceIcon(item.source)}
                    </Box>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {getSourceLabel(item.source)}
                        </Typography>
                        <Chip
                          label={item.source}
                          size="small"
                          sx={{
                            bgcolor: alpha(getSourceColor(item.source), 0.1),
                            color: getSourceColor(item.source),
                            border: `1px solid ${alpha(getSourceColor(item.source), 0.2)}`,
                          }}
                        />
                      </Box>
                      
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {item.description}
                      </Typography>
                      
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatDate(item.timestamp)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 'bold',
                          color: item.amount > 0 ? theme.palette.success.main : theme.palette.error.main,
                        }}
                      >
                        {item.amount > 0 ? '+' : ''}{item.amount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        karma
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </MotionCard>
            ))}
            
            {showLoadMore && pagination.hasMore && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={20} /> : 'Load More'}
                </Button>
              </Box>
            )}
          </Stack>
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
          Karma History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {pagination.total || 0} entries
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Failed to load karma history
          </Typography>
          <Button onClick={refetch}>
            Try Again
          </Button>
        </Box>
      ) : (
        <Stack spacing={1}>
          {history.map((item, index) => (
            <MotionBox
              key={item._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: '1.25rem',
                  color: item.amount > 0 ? theme.palette.success.main : theme.palette.error.main,
                  fontWeight: 'bold',
                  minWidth: 60,
                  textAlign: 'right',
                }}
              >
                {item.amount > 0 ? '+' : ''}{item.amount}
              </Typography>
              
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(getSourceColor(item.source), 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}
              >
                {getSourceIcon(item.source)}
              </Box>
              
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  sx={{ mb: 0.5 }}
                >
                  {getSourceLabel(item.source)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.description}
                </Typography>
              </Box>
              
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ minWidth: 80, textAlign: 'right' }}
              >
                        {formatDate(item.timestamp)}
              </Typography>
            </MotionBox>
          ))}
          
          {showLoadMore && pagination.hasMore && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </MotionBox>
  );
};

export default KarmaHistory;
