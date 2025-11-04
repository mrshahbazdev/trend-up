import React, { useState, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Menu, 
  MenuItem, 
  Chip, 
  Stack,
  CircularProgress,
  useTheme,
  Divider
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SortIcon, 
  TrendingUpIcon, 
  ScheduleIcon, 
  AccessTimeIcon 
} from '@/assets/icons';
import CommentThread from '../CommentThread/CommentThread';
import CommentInput from '../CommentInput/CommentInput';
import { useGetPostCommentsQuery } from '@/api/slices/socialApi';
import { useSelector } from 'react-redux';

const MotionBox = motion(Box);

const CommentSection = ({ 
  postId, 
  onCommentSubmit, 
  onCommentReact,
  showInput = true,
  maxHeight = '600px',
  autoLoad = false,
  onTypingStart,
  onTypingStop
}) => {
  const theme = useTheme();
  const { user: currentUser } = useSelector((state) => state.user);
  
  // State management
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [showComments, setShowComments] = useState(autoLoad);
  const [page, setPage] = useState(1);
  const [hasLoaded, setHasLoaded] = useState(false);

  // API query
  const { 
    data: commentsData, 
    isLoading, 
    error, 
    refetch 
  } = useGetPostCommentsQuery(
    { 
      postId, 
      page, 
      limit: 20, 
      sortBy, 
      sortOrder 
    },
    { 
      skip: !showComments || !postId 
    }
  );

  // Memoized data
  const comments = useMemo(() => commentsData?.data?.comments || [], [commentsData]);
  const totalComments = useMemo(() => commentsData?.data?.pagination?.total || 0, [commentsData]);
  const hasMore = useMemo(() => commentsData?.data?.pagination?.hasMore || false, [commentsData]);

  // Sort options
  const sortOptions = [
    { 
      value: 'createdAt', 
      order: 'desc', 
      label: 'Newest', 
      icon: <ScheduleIcon sx={{ fontSize: 16 }} /> 
    },
    { 
      value: 'createdAt', 
      order: 'asc', 
      label: 'Oldest', 
      icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> 
    },
    { 
      value: 'likesCount', 
      order: 'desc', 
      label: 'Top', 
      icon: <TrendingUpIcon sx={{ fontSize: 16 }} /> 
    }
  ];

  // Event handlers
  const handleSortChange = useCallback((option) => {
    setSortBy(option.value);
    setSortOrder(option.order);
    setSortMenuAnchor(null);
    setPage(1); // Reset to first page when sorting changes
  }, []);

  const handleLoadComments = useCallback(() => {
    setShowComments(true);
    setHasLoaded(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const handleCommentSubmit = useCallback((content, parentCommentId) => {
    onCommentSubmit?.(content, parentCommentId);
    // Refetch comments after new comment is added
    setTimeout(() => refetch(), 500);
  }, [onCommentSubmit, refetch]);

  const handleCommentReact = useCallback((commentId, reactionType) => {
    onCommentReact?.(commentId, reactionType);
  }, [onCommentReact]);

  // Get current sort option
  const currentSortOption = sortOptions.find(
    option => option.value === sortBy && option.order === sortOrder
  ) || sortOptions[0];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, staggerChildren: 0.1 }
    }
  };

  const commentVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <MotionBox
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ 
        width: '100%',
        borderTop: `1px solid ${theme.palette.divider}`,
        pt: 2
      }}
    >
      {/* Comments Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        px: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Comments
          </Typography>
          {totalComments > 0 && (
            <Chip 
              label={totalComments} 
              size="small" 
              color="primary"
              sx={{ 
                height: 20,
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            />
          )}
        </Box>

        {showComments && totalComments > 0 && (
          <Button
            startIcon={<SortIcon sx={{ fontSize: 16 }} />}
            onClick={(e) => setSortMenuAnchor(e.currentTarget)}
            sx={{ 
              textTransform: 'none',
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            {currentSortOption.label}
          </Button>
        )}
      </Box>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
        PaperProps={{
          sx: {
            minWidth: 150,
            borderRadius: 2,
            boxShadow: theme.shadows[8]
          }
        }}
      >
        {sortOptions.map((option) => (
          <MenuItem
            key={`${option.value}-${option.order}`}
            onClick={() => handleSortChange(option)}
            selected={option.value === sortBy && option.order === sortOrder}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1
            }}
          >
            {option.icon}
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Comment Input */}
      {showInput && currentUser && (
        <Box sx={{ mb: 3 }}>
          <CommentInput
            onSubmit={handleCommentSubmit}
            placeholder="Share your thoughts..."
            maxLength={500}
            showEmojiPicker={true}
            showMentions={true}
            postId={postId}
            onTypingStart={onTypingStart}
            onTypingStop={onTypingStop}
          />
        </Box>
      )}

      {/* Load Comments Button */}
      {!showComments && totalComments > 0 && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Button
            variant="outlined"
            onClick={handleLoadComments}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              px: 3,
              py: 1
            }}
          >
            View {totalComments} comment{totalComments !== 1 ? 's' : ''}
          </Button>
        </Box>
      )}

      {/* Comments List */}
      <AnimatePresence>
        {showComments && (
          <MotionBox
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="custom-scrollbar"
            sx={{ 
              maxHeight,
              overflowY: 'auto',
              pr: 1
            }}
          >
            {isLoading && !hasLoaded ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                py: 4
              }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                  Loading comments...
                </Typography>
              </Box>
            ) : error ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: 'error.main'
              }}>
                <Typography variant="body2">
                  Failed to load comments
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => refetch()}
                  sx={{ mt: 1 }}
                >
                  Try again
                </Button>
              </Box>
            ) : comments.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 4,
                color: 'text.secondary'
              }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  No comments yet
                </Typography>
                <Typography variant="caption">
                  Be the first to share your thoughts!
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {comments.map((comment, index) => (
                  <MotionBox
                    key={comment._id}
                    variants={commentVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                  >
                    <CommentThread
                      comment={comment}
                      level={0}
                      onReply={handleCommentSubmit}
                      onReact={handleCommentReact}
                      currentUserId={currentUser?._id}
                      maxLevel={2}
                    />
                  </MotionBox>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Button
                      variant="text"
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      sx={{
                        textTransform: 'none',
                        color: 'primary.main'
                      }}
                    >
                      {isLoading ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          Loading more...
                        </>
                      ) : (
                        'Load more comments'
                      )}
                    </Button>
                  </Box>
                )}
              </Stack>
            )}
          </MotionBox>
        )}
      </AnimatePresence>
    </MotionBox>
  );
};

export default CommentSection;
