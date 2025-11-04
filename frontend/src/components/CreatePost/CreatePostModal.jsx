import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Stack,
  Typography,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import MediaPreview from './MediaPreview';
import {
  CloseIcon,
  ImageIcon,
  VideoIcon,
  AudioIcon,
  PollIcon,
  PredictionIcon,
  EmojiIcon,
  HashtagIcon,
  CategoryIcon,
} from '@/assets/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreatePostMutation, useGetCategoriesQuery } from '@/api/slices/socialApi';
import { useSelector } from 'react-redux';
import { useToast } from '@/hooks/useToast';
import { DEFAULT_CATEGORIES } from '@/constants'; // Added default categories

const CreatePostModal = ({ open, onClose }) => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.user);
  const { showToast } = useToast();
  const [createPost, { isLoading }] = useCreatePostMutation();
  const { data: categoriesData } = useGetCategoriesQuery();
  
  // Use API categories if available, otherwise fallback to default categories
  const categories = Array.isArray(categoriesData?.data) 
    ? categoriesData.data 
    : Array.isArray(categoriesData) 
    ? categoriesData 
    : DEFAULT_CATEGORIES; // Fallback to default categories
  

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Common post state
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [category, setCategory] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);

  // Poll state
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpiry, setPollExpiry] = useState(24);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);

  // Prediction state
  const [predictionText, setPredictionText] = useState('');
  const [predictionDate, setPredictionDate] = useState(() => {
    // Set default date to 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    return defaultDate.toISOString().slice(0, 16);
  });
  const [karmaStake, setKarmaStake] = useState(10);

  const fileInputRef = useRef(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleHashtagInput = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const hashtag = event.target.value.trim();
      if (hashtag && !hashtags.includes(hashtag)) {
        setHashtags([...hashtags, hashtag]);
        event.target.value = '';
      }
    }
  };

  const removeHashtag = (hashtagToRemove) => {
    setHashtags(hashtags.filter(tag => tag !== hashtagToRemove));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file sizes
    const validFiles = [];
    const maxImageSize = 10 * 1024 * 1024; // 10MB for images
    const maxVideoSize = 50 * 1024 * 1024; // 50MB for short videos
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        if (file.size > maxImageSize) {
          showToast(`Image ${file.name} is too large. Maximum size is 10MB.`, 'error');
          return;
        }
      } else if (file.type.startsWith('video/')) {
        if (file.size > maxVideoSize) {
          showToast(`Video ${file.name} is too large. Maximum size is 50MB for short videos.`, 'error');
          return;
        }
      } else if (file.type.startsWith('audio/')) {
        if (file.size > maxVideoSize) { // Use same limit as videos for audio
          showToast(`Audio ${file.name} is too large. Maximum size is 50MB.`, 'error');
          return;
        }
      }
      validFiles.push(file);
    });
    
    setMediaFiles([...mediaFiles, ...validFiles]);
  };

  const removeMediaFile = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const updatePollOption = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    // Validate form before submission
    if (!canSubmit()) {
      // Provide specific validation messages based on post type
      let validationMessage = 'Please fill in all required fields.';
      
      switch (activeTab) {
        case 0: // Text
          validationMessage = 'Please enter some content for your post.';
          break;
        case 1: // Image
          validationMessage = 'Please enter content and select at least one image.';
          break;
        case 2: // Video
          validationMessage = 'Please enter content and select a video file.';
          break;
        case 3: // Audio
          validationMessage = 'Please enter content and select an audio file.';
          break;
        case 4: // Poll
          validationMessage = 'Please enter a question and add at least 2 poll options.';
          break;
            case 5: // Prediction
              if (!predictionText.trim()) {
                validationMessage = 'Please enter your prediction text.';
              } else if (!predictionDate) {
                validationMessage = 'Please select a target date for your prediction.';
              } else {
                validationMessage = 'Please fill in all required fields for your prediction.';
              }
              break;
      }
      
      showToast(validationMessage, 'error');
      return;
    }

    try {
      let postData = {
        content,
        category,
        hashtags,
      };

      // Add media files if any
      if (mediaFiles.length > 0) {
        postData.mediaFiles = mediaFiles;
      }

      // Handle different post types
      switch (activeTab) {
        case 0: // Text post
          postData.postType = 'text';
          break;
        case 1: // Image post
          postData.postType = 'image';
          break;
        case 2: // Video post
          postData.postType = 'video';
          break;
        case 3: // Audio post
          postData.postType = 'audio';
          break;
        case 4: // Poll post
          postData.postType = 'poll';
          postData.pollOptions = pollOptions.filter(opt => opt.trim()).map(text => ({ text }));
          postData.pollSettings = {
            expiresAt: new Date(Date.now() + pollExpiry * 60 * 60 * 1000),
            allowMultipleVotes,
          };
          break;
        case 5: // Prediction post
          postData.postType = 'prediction';
          postData.predictionData = {
            predictionText,
            targetDate: new Date(predictionDate),
            karmaStake,
          };
          break;
      }

      await createPost(postData).unwrap();
      showToast('Post created successfully!', 'success');
      handleClose();
    } catch (error) {
      console.error('Post creation error:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to create post.';
      
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.status === 400) {
        errorMessage = 'Invalid post data. Please check your input and try again.';
      } else if (error.status === 401) {
        errorMessage = 'You must be logged in to create posts.';
      } else if (error.status === 413) {
        errorMessage = 'File too large. Please reduce file size and try again.';
      } else if (error.status === 415) {
        errorMessage = 'Unsupported file type. Please use supported formats.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 'FETCH_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const handleClose = () => {
    // Reset all state
    setContent('');
    setHashtags([]);
    setCategory('');
    setMediaFiles([]);
    setPollOptions(['', '']);
    setPollExpiry(24);
    setAllowMultipleVotes(false);
    setPredictionText('');
    setPredictionDate('');
    setKarmaStake(10);
    setActiveTab(0);
    onClose();
  };

  const canSubmit = () => {
    switch (activeTab) {
      case 0: // Text
        return content.trim().length > 0;
      case 1: // Image
        return content.trim().length > 0 && mediaFiles.length > 0;
      case 2: // Video
        return content.trim().length > 0 && mediaFiles.length > 0;
      case 3: // Audio
        return content.trim().length > 0 && mediaFiles.length > 0;
      case 4: // Poll
        return content.trim().length > 0 && pollOptions.filter(opt => opt.trim()).length >= 2;
      case 5: // Prediction
        return predictionText.trim().length > 0 && predictionDate;
      default:
        return false;
    }
  };

  const tabLabels = ['Text', 'Image', 'Video', 'Audio', 'Poll', 'Prediction'];
  const tabIcons = [null, <ImageIcon />, <VideoIcon />, <AudioIcon />, <PollIcon />, <PredictionIcon />];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: theme.palette.background.paper,
          backdropFilter: 'blur(20px)',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.25)',
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogTitle sx={{ 
        background: theme.palette.primary.main,
        borderBottom: `1px solid ${theme.palette.primary.light}`,
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          opacity: 0.1,
          animation: 'shimmer 3s ease-in-out infinite',
        },
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'relative', zIndex: 1, width: '100%' }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
              }}
            >
              <Typography variant="h6" fontWeight={600} color="inherit">
                Create Post
              </Typography>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <IconButton onClick={handleClose} sx={{ color: '#ffffff' }}>
                <CloseIcon />
              </IconButton>
            </motion.div>
          </Stack>
        </motion.div>
      </DialogTitle>

      <DialogContent sx={{ 
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: theme.palette.divider, 
          mb: 3,
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.main,
          },
        }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            {Array.isArray(tabLabels) && tabLabels.map((label, index) => (
              <Tab
                key={index}
                label={label}
                icon={tabIcons[index]}
                iconPosition="start"
                sx={{ 
                  minHeight: 60,
                  color: theme.palette.text.secondary,
                  '&.Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Common Fields */}
            <Stack spacing={3}>
              {/* Content */}
              <TextField
                multiline
                rows={4}
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                variant="outlined"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {/* Hashtags */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Hashtags
                </Typography>
                <TextField
                  placeholder="Add hashtags (press Enter or Space)"
                  onKeyDown={handleHashtagInput}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <HashtagIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                  {Array.isArray(hashtags) && hashtags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={`#${tag}`}
                      onDelete={() => removeHashtag(tag)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>

              {/* Category */}
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                  startAdornment={<CategoryIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  {Array.isArray(categories) && categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Tab-specific content */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Images
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<ImageIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                  >
                    Choose Images
                  </Button>
                  {mediaFiles.length > 0 && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {Array.isArray(mediaFiles) && mediaFiles.map((file, index) => (
                        <MediaPreview
                          key={index}
                          file={file}
                          index={index}
                          onRemove={removeMediaFile}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Video
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<VideoIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                  >
                    Choose Video
                  </Button>
                  {mediaFiles.length > 0 && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {Array.isArray(mediaFiles) && mediaFiles.map((file, index) => (
                        <MediaPreview
                          key={index}
                          file={file}
                          index={index}
                          onRemove={removeMediaFile}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Upload Audio
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mp3,audio/wav,audio/ogg,audio/m4a"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AudioIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    fullWidth
                  >
                    Choose Audio
                  </Button>
                  {mediaFiles.length > 0 && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {Array.isArray(mediaFiles) && mediaFiles.map((file, index) => (
                        <MediaPreview
                          key={index}
                          file={file}
                          index={index}
                          onRemove={removeMediaFile}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {activeTab === 4 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Poll Options
                  </Typography>
                  <Stack spacing={2}>
                    {Array.isArray(pollOptions) && pollOptions.map((option, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          size="small"
                          fullWidth
                        />
                        {pollOptions.length > 2 && (
                          <IconButton size="small" onClick={() => removePollOption(index)}>
                            <CloseIcon />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    {pollOptions.length < 6 && (
                      <Button variant="outlined" onClick={addPollOption}>
                        Add Option
                      </Button>
                    )}
                  </Stack>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Poll Duration: {pollExpiry} hours
                    </Typography>
                    <Slider
                      value={pollExpiry}
                      onChange={(e, value) => setPollExpiry(value)}
                      min={1}
                      max={168}
                      step={1}
                      marks={[
                        { value: 1, label: '1h' },
                        { value: 24, label: '1d' },
                        { value: 72, label: '3d' },
                        { value: 168, label: '7d' },
                      ]}
                    />
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={allowMultipleVotes}
                        onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                      />
                    }
                    label="Allow multiple votes"
                  />
                </Box>
              )}

              {activeTab === 5 && (
                <Box>
                  <TextField
                    label="Prediction Text"
                    value={predictionText}
                    onChange={(e) => setPredictionText(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="What do you predict will happen?"
                  />

                  <TextField
                    label="Target Date"
                    type="datetime-local"
                    value={predictionDate}
                    onChange={(e) => setPredictionDate(e.target.value)}
                    fullWidth
                    sx={{ 
                      mt: 2,
                      '& .MuiInputBase-input': {
                        fontSize: '16px', // Prevent zoom on mobile
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    helperText="Select when this prediction should be resolved"
                    required
                    variant="outlined"
                  />

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Karma Stake: {karmaStake}
                    </Typography>
                    <Slider
                      value={karmaStake}
                      onChange={(e, value) => setKarmaStake(value)}
                      min={1}
                      max={100}
                      step={1}
                      marks={[
                        { value: 1, label: '1' },
                        { value: 25, label: '25' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' },
                      ]}
                    />
                  </Box>
                </Box>
              )}
            </Stack>
          </motion.div>
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3,
        background: theme.palette.primary.main,
        borderTop: `1px solid ${theme.palette.primary.light}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          opacity: 0.1,
          animation: 'shimmer 3s ease-in-out infinite',
        },
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ 
            position: 'relative', 
            zIndex: 1, 
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              onClick={handleClose} 
              disabled={isLoading}
              sx={{
                color: '#ffffff',
                borderRadius: '20px',
                px: 3,
                py: 1,
                '&:hover': {
                  background: theme.palette.primary.dark,
                  boxShadow: `0 4px 12px ${theme.palette.primary.dark}88`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              Cancel
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!canSubmit() || isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
              sx={{
                background: theme.palette.primary.dark,
                color: '#ffffff',
                borderRadius: '20px',
                px: 3,
                py: 1,
                boxShadow: `0 4px 12px ${theme.palette.primary.dark}88`,
                '&:hover': {
                  background: theme.palette.primary.light,
                  boxShadow: `0 6px 16px ${theme.palette.primary.light}88`,
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: theme.palette.action.disabled,
                  color: theme.palette.action.disabled,
                  boxShadow: 'none',
                  transform: 'none',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {isLoading ? 'Creating...' : 'Create Post'}
            </Button>
          </motion.div>
        </motion.div>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostModal;
