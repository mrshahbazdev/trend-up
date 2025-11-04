import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Avatar, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketEvent } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';

const LiveCommentFeed = ({ 
  postId, 
  initialComments = [], 
  maxComments = 10,
  onNewComment 
}) => {
  const theme = useTheme();
  const [comments, setComments] = useState(initialComments);
  const [typingUsers, setTypingUsers] = useState([]);
  const commentsEndRef = useRef(null);

  // Sync with API data when initialComments change
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Listen for new comments
  useSocketEvent('comment:created', (data) => {
    if (data.postId === postId) {
      const newComment = {
        id: data.commentId || `comment_${Date.now()}`,
        content: data.content,
        author: data.author,
        createdAt: new Date().toISOString(),
        isNew: true
      };

      setComments(prev => {
        const updated = [newComment, ...prev].slice(0, maxComments);
        return updated;
      });

      onNewComment?.(newComment);

      // Auto-scroll to bottom
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Remove "new" flag after animation
      setTimeout(() => {
        setComments(prev => 
          prev.map(comment => 
            comment.id === newComment.id 
              ? { ...comment, isNew: false }
              : comment
          )
        );
      }, 2000);
    }
  }, [postId, maxComments, onNewComment]);

  // Listen for typing indicators
  useSocketEvent('typing:start', (data) => {
    if (data.postId === postId) {
      setTypingUsers(prev => {
        if (!prev.find(user => user.id === data.userId)) {
          return [...prev, { id: data.userId, username: data.username }];
        }
        return prev;
      });
    }
  }, [postId]);

  useSocketEvent('typing:stop', (data) => {
    if (data.postId === postId) {
      setTypingUsers(prev => prev.filter(user => user.id !== data.userId));
    }
  }, [postId]);

  // Animation variants
  const commentVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  const typingVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.2
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Comments */}
      <Box className="custom-scrollbar" sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
        <AnimatePresence mode="popLayout">
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              variants={commentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              style={{
                marginBottom: theme.spacing(1),
                padding: theme.spacing(1),
                borderRadius: theme.spacing(1),
                backgroundColor: comment.isNew 
                  ? theme.palette.primary.light + '20' 
                  : theme.palette.action.hover,
                border: comment.isNew 
                  ? `2px solid ${theme.palette.primary.main}` 
                  : 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Avatar
                  src={comment.author?.avatar}
                  sx={{ width: 32, height: 32 }}
                >
                  {comment.author?.username?.[0]?.toUpperCase()}
                </Avatar>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {comment.author?.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </Typography>
                    {comment.isNew && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        >
                          NEW
                        </Typography>
                      </motion.div>
                    )}
                  </Box>
                  
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {comment.content}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicators */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              variants={typingVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                padding: theme.spacing(1),
                backgroundColor: theme.palette.action.hover,
                borderRadius: theme.spacing(1),
                marginBottom: theme.spacing(1)
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                  ...
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0].username} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </Typography>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Typography variant="caption" color="text.secondary">
                    ●●●
                  </Typography>
                </motion.div>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={commentsEndRef} />
      </Box>
    </Box>
  );
};

export default LiveCommentFeed;
