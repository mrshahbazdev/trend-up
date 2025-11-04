import React, { useState, useCallback, useMemo } from 'react';
import { Box, Typography, Avatar, IconButton, Button, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@mui/material';
import { 
  ReplyIcon, 
  HeartBorderIcon, 
  HeartIcon, 
  LikeBorderIcon, 
  LikeIcon,
  LocalFireDepartmentIcon,
  TrendingUpIcon
} from '@/assets/icons';
import CommentInput from '../CommentInput';

const CommentThread = React.memo(({ 
  comment, 
  level = 0, 
  onReply, 
  onReact,
  currentUserId,
  maxLevel = 2 // Reddit-style: only show 3 levels (0, 1, 2)
}) => {
  const theme = useTheme();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [userReactions, setUserReactions] = useState({});

  const handleReaction = useCallback(async (reactionType) => {
    setUserReactions(prev => {
      const isActive = prev[reactionType];
      return {
        ...prev,
        [reactionType]: !isActive
      };
    });
    
    if (onReact) {
      await onReact(comment._id, reactionType);
    }
  }, [onReact, comment._id]);

  const getReactionCount = useCallback((type) => {
    const baseCount = comment.reactions?.[type] || 0;
    const adjustment = userReactions[type] ? 1 : 0;
    return baseCount + adjustment;
  }, [comment.reactions, userReactions]);

  // Reddit-style color scheme
  const borderColor = level === 0 
    ? 'transparent' 
    : level === 1 
      ? theme.palette.primary.main + '40'
      : level === 2 
        ? theme.palette.secondary.main + '40'
        : theme.palette.info.main + '40';

  const bgColor = level === 0
    ? theme.palette.action.hover
    : 'transparent';

  return (
    <Box 
      className="custom-scrollbar"
      sx={{ 
        ml: level > 0 ? 3 : 0,
        mb: level === 0 ? 2 : 0.5,
        borderLeft: level > 0 ? `3px solid ${borderColor}` : 'none',
        pl: level > 0 ? 2 : 0,
        position: 'relative',
        maxHeight: level === 0 ? '400px' : 'none',
        overflowY: level === 0 ? 'auto' : 'visible'
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: level * 0.05 }}
      >
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          backgroundColor: bgColor,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: theme.palette.action.selected,
            '& .comment-actions': {
              opacity: 1
            }
          }
        }}>
          {/* Comment Header */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Avatar
              src={comment.userId?.avatar}
              sx={{ 
                width: level === 0 ? 40 : 32, 
                height: level === 0 ? 40 : 32,
                border: `2px solid ${theme.palette.divider}`
              }}
            >
              {comment.userId?.username?.[0]?.toUpperCase()}
            </Avatar>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Author & Timestamp */}
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography 
                  variant="subtitle2" 
                  fontWeight={700}
                  sx={{ color: theme.palette.text.primary }}
                >
                  {comment.userId?.username}
                </Typography>
                
                {comment.userId?._id === currentUserId && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: '0.65rem',
                      fontWeight: 600
                    }}
                  >
                    YOU
                  </Typography>
                )}
                
                <Typography 
                  variant="caption" 
                  sx={{ color: theme.palette.text.secondary }}
                >
                  •
                </Typography>
                
                <Typography 
                  variant="caption" 
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </Typography>

                {comment.level > 0 && (
                  <>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      •
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: theme.palette.primary.main,
                        fontSize: '0.65rem'
                      }}
                    >
                      Level {comment.level}
                    </Typography>
                  </>
                )}
              </Stack>

              {/* Comment Content */}
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 1, 
                  wordBreak: 'break-word',
                  lineHeight: 1.6,
                  color: theme.palette.text.primary
                }}
              >
                {comment.content}
              </Typography>

              {/* Actions Row - Reddit Style */}
              <Stack 
                direction="row" 
                spacing={0.5} 
                alignItems="center"
                className="comment-actions"
                sx={{ 
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease'
                }}
              >
                {/* Heart Reaction */}
                <IconButton 
                  size="small" 
                  onClick={() => handleReaction('HEART')}
                  sx={{ 
                    color: userReactions.HEART 
                      ? '#E91E63' 
                      : theme.palette.text.secondary,
                    '&:hover': { backgroundColor: '#E91E6320' }
                  }}
                >
                  {userReactions.HEART ? (
                    <HeartIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <HeartBorderIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
                {getReactionCount('HEART') > 0 && (
                  <Typography variant="caption" sx={{ color: '#E91E63', fontWeight: 600 }}>
                    {getReactionCount('HEART')}
                  </Typography>
                )}

                {/* Like Reaction */}
                <IconButton 
                  size="small" 
                  onClick={() => handleReaction('LIKE')}
                  sx={{ 
                    color: userReactions.LIKE 
                      ? '#2196F3' 
                      : theme.palette.text.secondary,
                    '&:hover': { backgroundColor: '#2196F320' }
                  }}
                >
                  {userReactions.LIKE ? (
                    <LikeIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <LikeBorderIcon sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
                {getReactionCount('LIKE') > 0 && (
                  <Typography variant="caption" sx={{ color: '#2196F3', fontWeight: 600 }}>
                    {getReactionCount('LIKE')}
                  </Typography>
                )}

                {/* Fire Reaction */}
                <IconButton 
                  size="small" 
                  onClick={() => handleReaction('FIRE')}
                  sx={{ 
                    color: userReactions.FIRE 
                      ? '#FF6F00' 
                      : theme.palette.text.secondary,
                    '&:hover': { backgroundColor: '#FF6F0020' }
                  }}
                >
                  <LocalFireDepartmentIcon sx={{ fontSize: 16 }} />
                </IconButton>
                {getReactionCount('FIRE') > 0 && (
                  <Typography variant="caption" sx={{ color: '#FF6F00', fontWeight: 600 }}>
                    {getReactionCount('FIRE')}
                  </Typography>
                )}

                {/* Bullish Reaction */}
                <IconButton 
                  size="small" 
                  onClick={() => handleReaction('BULLISH')}
                  sx={{ 
                    color: userReactions.BULLISH 
                      ? '#00C853' 
                      : theme.palette.text.secondary,
                    '&:hover': { backgroundColor: '#00C85320' }
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 16 }} />
                </IconButton>
                {getReactionCount('BULLISH') > 0 && (
                  <Typography variant="caption" sx={{ color: '#00C853', fontWeight: 600 }}>
                    {getReactionCount('BULLISH')}
                  </Typography>
                )}

                <Box sx={{ width: 8 }} />

                {/* Reply Button */}
                {level < maxLevel && (
                  <Button
                    size="small"
                    startIcon={<ReplyIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    sx={{
                      textTransform: 'none',
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                      px: 1,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    Reply
                  </Button>
                )}

                {/* Reply Count */}
                {comment.replyCount > 0 && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500
                    }}
                  >
                    • {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
                  </Typography>
                )}
              </Stack>

              {/* Reply Input Box */}
              <AnimatePresence>
                {showReplyBox && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Box sx={{ mt: 2, pl: 1, borderLeft: `2px solid ${theme.palette.primary.main}` }}>
                      <CommentInput
                        onSubmit={(content) => {
                          onReply(content, comment._id);
                          setShowReplyBox(false);
                        }}
                        placeholder={`Reply to ${comment.userId?.username}...`}
                        maxLength={500}
                        showEmojiPicker={true}
                        showMentions={true}
                        parentCommentId={comment._id}
                        onCancel={() => setShowReplyBox(false)}
                        initialValue=""
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Box>
        </Box>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            <AnimatePresence>
              {comment.replies.map((reply, index) => (
                <CommentThread
                  key={reply._id}
                  comment={reply}
                  level={level + 1}
                  onReply={onReply}
                  onReact={onReact}
                  currentUserId={currentUserId}
                  maxLevel={maxLevel}
                />
              ))}
            </AnimatePresence>
            
            {/* Reddit-style "Continue thread" indicator for level 2 with many replies */}
            {level === 2 && comment.replies && comment.replies.length > 3 && (
              <Box sx={{ 
                ml: 2, 
                mt: 1, 
                p: 1, 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: 1,
                borderLeft: `3px solid ${theme.palette.primary.main}`,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {comment.replies.length - 3} more replies in this thread
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </motion.div>
    </Box>
  );
});

export default CommentThread;

