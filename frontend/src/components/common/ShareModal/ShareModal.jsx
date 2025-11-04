import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Stack,
  Divider,
  useTheme,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShareIcon,
  ContentCopyIcon,
  TwitterIcon,
  TelegramIcon,
  LinkIcon,
  CloseIcon
} from '@/assets/icons';
import AnimatedDialog from '../AnimatedDialog/AnimatedDialog';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const ShareModal = ({ 
  open, 
  onClose, 
  postData,
  onShare = () => {} 
}) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Generate share URL
  const shareUrl = `${window.location.origin}/post/${postData?._id}`;
  const postTitle = postData?.content?.substring(0, 100) || 'Check out this post';
  const hashtags = postData?.hashtags?.map(tag => `#${tag}`).join(' ') || '';

  // Copy to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShare('copy', { url: shareUrl });
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [shareUrl, onShare]);

  // Share to Twitter
  const handleTwitterShare = useCallback(() => {
    const message = customMessage || `Check out this post on TrendUp! ${hashtags}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    onShare('twitter', { url: shareUrl, message });
  }, [customMessage, shareUrl, hashtags, onShare]);

  // Share to Telegram
  const handleTelegramShare = useCallback(() => {
    const message = customMessage || `Check out this post on TrendUp! ${hashtags}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank', 'width=600,height=400');
    onShare('telegram', { url: shareUrl, message });
  }, [customMessage, shareUrl, hashtags, onShare]);

  // Share to other platforms
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TrendUp Post',
          text: customMessage || postTitle,
          url: shareUrl
        });
        onShare('native', { url: shareUrl, message: customMessage });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  }, [customMessage, postTitle, shareUrl, onShare, handleCopyLink]);

  // Share options
  const shareOptions = [
    {
      id: 'copy',
      label: 'Copy Link',
      icon: <ContentCopyIcon sx={{ fontSize: 20 }} />,
      color: 'primary',
      onClick: handleCopyLink
    },
    {
      id: 'twitter',
      label: 'Twitter',
      icon: <TwitterIcon sx={{ fontSize: 20 }} />,
      color: 'info',
      onClick: handleTwitterShare
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: <TelegramIcon sx={{ fontSize: 20 }} />,
      color: 'info',
      onClick: handleTelegramShare
    },
    {
      id: 'native',
      label: 'More',
      icon: <ShareIcon sx={{ fontSize: 20 }} />,
      color: 'secondary',
      onClick: handleNativeShare
    }
  ];

  return (
    <>
      <AnimatedDialog
        open={open}
        onClose={onClose}
        title="Share Post"
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          {/* Post Preview */}
          {postData && (
            <Box
              sx={{
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                mb: 3,
                backgroundColor: theme.palette.background.default
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  component="img"
                  src={postData.userId?.avatar || '/default-avatar.png'}
                  alt={postData.userId?.name}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight="bold" noWrap>
                    {postData.userId?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    @{postData.userId?.username}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mt: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {postData.content}
                  </Typography>
                  {postData.hashtags && postData.hashtags.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {postData.hashtags.slice(0, 3).map((tag, index) => (
                        <Chip
                          key={index}
                          label={`#${tag}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Stack>
            </Box>
          )}

          {/* Custom Message */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Add a message (optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add your thoughts about this post..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>

          {/* Share URL */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Share URL
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: theme.palette.background.default
              }}
            >
              <LinkIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  wordBreak: 'break-all',
                  color: 'text.secondary'
                }}
              >
                {shareUrl}
              </Typography>
              <IconButton
                size="small"
                onClick={handleCopyLink}
                sx={{ color: 'primary.main' }}
              >
                <ContentCopyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Share Options */}
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
            Share to
          </Typography>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {shareOptions.map((option) => (
              <MotionButton
                key={option.id}
                variant="outlined"
                startIcon={option.icon}
                onClick={option.onClick}
                disabled={isSharing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                sx={{
                  flex: 1,
                  minWidth: 120,
                  textTransform: 'none',
                  borderRadius: 2,
                  py: 1.5,
                  borderColor: `${option.color}.main`,
                  color: `${option.color}.main`,
                  '&:hover': {
                    borderColor: `${option.color}.dark`,
                    backgroundColor: `${option.color}.main`,
                    color: 'white'
                  }
                }}
              >
                {option.label}
              </MotionButton>
            ))}
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ flex: 1, textTransform: 'none' }}
            >
              Close
            </Button>
          </Stack>
        </Box>
      </AnimatedDialog>

      {/* Success Snackbar */}
      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setCopied(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareModal;
