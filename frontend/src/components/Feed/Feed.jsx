import React from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import FeedTabs from './FeedTabs';
import MobileFeed from './MobileFeed';
import CreatePost from '../CreatePost/CreatePost';

const Feed = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Use mobile-optimized feed for mobile devices
  if (isMobile) {
    return <MobileFeed />;
  }

  // Desktop layout
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {/* Create Post Component */}
        <CreatePost />
        
        {/* Feed Tabs */}
        <Box sx={{ mt: 3 }}>
          <FeedTabs />
        </Box>
      </Box>
    </Container>
  );
};

export default Feed;
