import React, { useState, useEffect } from 'react';
import { Box, Stack, Typography, Button, useTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Post from '../Post/Post';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';

const FeedList = ({ posts, onRefresh, feedType, isShowingUserPosts = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [displayedPosts, setDisplayedPosts] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Debug logging
  console.log('FeedList - Posts data:', { posts, feedType, isShowingUserPosts });

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    setDisplayedPosts(posts);
  }, [posts]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    // In a real implementation, you'd fetch more posts here
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 1000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (!displayedPosts || displayedPosts.length === 0) {
    const getEmptyStateContent = () => {
      switch (feedType) {
        case 'For You':
          return {
            title: isShowingUserPosts ? "No posts yet" : "Welcome to your feed!",
            subtitle: isShowingUserPosts 
              ? "You haven't created any posts yet. Share your first thought!"
              : "Be the first to share something! Create a post to get started.",
            primaryAction: "Create Your First Post",
            secondaryAction: "Explore Topics",
            showSecondary: !isShowingUserPosts
          };
        case 'Following':
          return {
            title: "No posts from people you follow",
            subtitle: "Follow some interesting users to see their posts here, or create your own content!",
            primaryAction: "Find People to Follow",
            secondaryAction: "Create Post",
            showSecondary: true
          };
        case 'Trending':
          return {
            title: "No trending posts yet",
            subtitle: "Posts will appear here as they gain traction. Create engaging content to get started!",
            primaryAction: "Create Post",
            secondaryAction: "Browse All Posts",
            showSecondary: true
          };
        case 'Discover':
          return {
            title: "Discover new content",
            subtitle: "Explore trending topics, find new users to follow, and discover what's happening in crypto!",
            primaryAction: "Explore Topics",
            secondaryAction: "Find Users",
            showSecondary: true
          };
        default:
          return {
            title: "No posts yet",
            subtitle: "Check back soon for new content!",
            primaryAction: "Refresh",
            secondaryAction: null,
            showSecondary: false
          };
      }
    };

    const emptyState = getEmptyStateContent();

    const handlePrimaryAction = () => {
      if (emptyState.primaryAction === "Create Your First Post" || emptyState.primaryAction === "Create Post") {
        // Trigger create post modal - you might need to implement this
        console.log('Open create post modal');
      } else if (emptyState.primaryAction === "Find People to Follow") {
        navigate('/social/discover');
      } else if (emptyState.primaryAction === "Explore Topics") {
        navigate('/social/trending');
      } else {
        onRefresh();
      }
    };

    const handleSecondaryAction = () => {
      if (emptyState.secondaryAction === "Create Post") {
        console.log('Open create post modal');
      } else if (emptyState.secondaryAction === "Browse All Posts") {
        navigate('/social/foryou');
      } else if (emptyState.secondaryAction === "Find Users") {
        navigate('/social/discover');
      } else if (emptyState.secondaryAction === "Explore Topics") {
        navigate('/social/trending');
      }
    };

    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
          {emptyState.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
          {emptyState.subtitle}
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
          sx={{ mb: 3 }}
        >
          <Button 
            variant="contained" 
            size="large"
            onClick={handlePrimaryAction}
            sx={{ minWidth: 160 }}
          >
            {emptyState.primaryAction}
          </Button>
          
          {emptyState.showSecondary && emptyState.secondaryAction && (
            <Button 
              variant="outlined" 
              size="large"
              onClick={handleSecondaryAction}
              sx={{ minWidth: 160 }}
            >
              {emptyState.secondaryAction}
            </Button>
          )}
        </Stack>

        <Button variant="text" onClick={onRefresh} sx={{ color: 'text.secondary' }}>
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {displayedPosts.map((post, index) => (
            <motion.div
              key={post._id || index}
              variants={itemVariants}
              layout
            >
              <Post 
                data={post} 
                sx={{ mb: 2 }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More Trigger */}
      <Box ref={ref} sx={{ py: 4, textAlign: 'center' }}>
        {inView && displayedPosts.length > 0 && (
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            sx={{ minWidth: 120 }}
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </Box>

      {/* Feed Stats */}
      <Box sx={{ mt: 4, p: 2, background: theme.palette.background.paper, borderRadius: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Showing {displayedPosts.length} posts in {feedType} feed
        </Typography>
      </Box>
    </Box>
  );
};

export default FeedList;
