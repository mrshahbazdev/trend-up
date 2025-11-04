import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Stack,
  Typography,
  useTheme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EmojiEmotionsIcon, 
  SendIcon,
  AtSignIcon
} from '@/assets/icons';
import EmojiPicker from '../EmojiPicker/EmojiPicker';
import { useSearchUsersQuery } from '@/api/slices/socialApi';
import { useSelector } from 'react-redux';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const CommentInput = ({
  onSubmit,
  placeholder = "Write a comment...",
  maxLength = 500,
  showEmojiPicker = true,
  showMentions = true,
  postId,
  parentCommentId = null,
  onCancel,
  initialValue = "",
  disabled = false,
  onTypingStart,
  onTypingStop
}) => {
  const theme = useTheme();
  const { user: currentUser } = useSelector((state) => state.user);
  const textFieldRef = useRef(null);
  const [text, setText] = useState(initialValue);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionsDropdown, setShowMentionsDropdown] = useState(false);
  const [mentionStart, setMentionStart] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search users for mentions
  const { data: mentionUsers, isLoading: isSearchingUsers } = useSearchUsersQuery(
    { q: mentionQuery, limit: 5 },
    { skip: !mentionQuery || mentionQuery.length < 2 }
  );

  // Handle text change
  const handleTextChange = useCallback((event) => {
    const value = event.target.value;
    
    if (value.length <= maxLength) {
      setText(value);
      
      // Handle typing indicators
      if (value.length > 0) {
        onTypingStart?.();
      } else {
        onTypingStop?.();
      }
      
      // Check for mentions
      if (showMentions) {
        const cursorPosition = event.target.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPosition);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
        
        if (mentionMatch) {
          setMentionQuery(mentionMatch[1]);
          setMentionStart(cursorPosition - mentionMatch[0].length);
          setShowMentionsDropdown(true);
        } else {
          setShowMentionsDropdown(false);
          setMentionQuery('');
        }
      }
    }
  }, [maxLength, showMentions, onTypingStart, onTypingStop]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji) => {
    const cursorPosition = textFieldRef.current?.selectionStart || text.length;
    const newText = text.slice(0, cursorPosition) + emoji + text.slice(cursorPosition);
    setText(newText);
    setEmojiAnchor(null);
    
    // Focus back to text field
    setTimeout(() => {
      textFieldRef.current?.focus();
      textFieldRef.current?.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
    }, 100);
  }, [text]);

  // Handle mention selection
  const handleMentionSelect = useCallback((user) => {
    const mentionText = `@${user.username}`;
    const beforeMention = text.substring(0, mentionStart);
    const afterMention = text.substring(textFieldRef.current?.selectionStart || text.length);
    const newText = beforeMention + mentionText + ' ' + afterMention;
    
    setText(newText);
    setShowMentionsDropdown(false);
    setMentionQuery('');
    
    // Focus back to text field
    setTimeout(() => {
      textFieldRef.current?.focus();
      const newCursorPosition = beforeMention.length + mentionText.length + 1;
      textFieldRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 100);
  }, [text, mentionStart]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(text.trim(), parentCommentId);
      setText('');
      setShowMentionsDropdown(false);
      setMentionQuery('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, onSubmit, parentCommentId, isSubmitting]);

  // Handle key press
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    } else if (event.key === 'Escape') {
      setShowMentionsDropdown(false);
      setMentionQuery('');
    }
  }, [handleSubmit]);

  // Handle mention key navigation
  const handleMentionKeyDown = useCallback((event) => {
    if (!showMentionsDropdown || !mentionUsers?.data?.users) return;
    
    const users = mentionUsers.data.users;
    const currentIndex = users.findIndex(user => user.username === mentionQuery);
    
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      // Handle arrow down navigation
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      // Handle arrow up navigation
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (users.length > 0) {
        handleMentionSelect(users[0]);
      }
    }
  }, [showMentionsDropdown, mentionUsers, mentionQuery, handleMentionSelect]);

  // Character count
  const characterCount = text.length;
  const isOverLimit = characterCount > maxLength * 0.9;
  const isAtLimit = characterCount >= maxLength;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Main Input Area */}
      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
          transition: 'all 0.2s ease',
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`
          }
        }}
      >
        <Stack direction="row" spacing={1} sx={{ p: 2 }}>
          {/* Avatar */}
          <Box
            component="img"
            src={currentUser?.avatar || '/default-avatar.png'}
            alt={currentUser?.name}
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${theme.palette.primary.main}20`
            }}
          />

          {/* Text Input */}
          <Box sx={{ flex: 1, position: 'relative' }}>
            <TextField
              ref={textFieldRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleMentionKeyDown}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              multiline
              maxRows={4}
              disabled={disabled}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: 'none' }
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.95rem',
                  lineHeight: 1.4,
                  resize: 'none'
                }
              }}
            />

            {/* Character Counter */}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: -20,
                right: 0,
                color: isAtLimit ? 'error.main' : isOverLimit ? 'warning.main' : 'text.secondary',
                fontSize: '0.7rem'
              }}
            >
              {characterCount}/{maxLength}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'flex-end' }}>
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <Tooltip title="Add emoji">
                <IconButton
                  size="small"
                  onClick={(e) => setEmojiAnchor(e.currentTarget)}
                  disabled={disabled}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.primary.main
                    }
                  }}
                >
                  <EmojiEmotionsIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Submit Button */}
            <MotionButton
              variant="contained"
              size="small"
              onClick={handleSubmit}
              disabled={!text.trim() || isSubmitting || isAtLimit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              sx={{
                minWidth: 'auto',
                px: 2,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SendIcon sx={{ fontSize: 16 }} />
              )}
            </MotionButton>
          </Stack>
        </Stack>
      </Box>

      {/* Emoji Picker */}
      <EmojiPicker
        anchorEl={emojiAnchor}
        open={Boolean(emojiAnchor)}
        onClose={() => setEmojiAnchor(null)}
        onEmojiSelect={handleEmojiSelect}
      />

      {/* Mentions Dropdown */}
      <AnimatePresence>
        {showMentionsDropdown && mentionUsers?.data?.users && (
          <MotionBox
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1000,
              mt: 1,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              boxShadow: theme.shadows[8],
              maxHeight: 200,
              overflowY: 'auto'
            }}
          >
            {isSearchingUsers ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <CircularProgress size={20} />
                <Typography variant="caption" sx={{ ml: 1 }}>
                  Searching users...
                </Typography>
              </Box>
            ) : mentionUsers.data.users.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            ) : (
              <Stack>
                {mentionUsers.data.users.map((user, index) => (
                  <Box
                    key={user._id}
                    onClick={() => handleMentionSelect(user)}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover
                      },
                      '&:first-of-type': {
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8
                      },
                      '&:last-of-type': {
                        borderBottomLeftRadius: 8,
                        borderBottomRightRadius: 8
                      }
                    }}
                  >
                    <Box
                      component="img"
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.name}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight="medium" noWrap>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        @{user.username}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default CommentInput;
