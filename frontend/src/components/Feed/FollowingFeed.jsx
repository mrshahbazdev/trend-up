import React from 'react';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { useGetFollowingFeedQuery } from '@/api/slices/socialApi';
import FeedList from './FeedList';
import CreatePost from '../CreatePost/CreatePost';
import Loading from '../common/loading';

const FollowingFeed = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { data, error, isLoading, refetch } = useGetFollowingFeedQuery({ page: 1, limit: 20 });

  if (isLoading) {
    return <Loading isLoading={true} />;
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <p>Error loading feed: {error.data?.message || 'Something went wrong'}</p>
        <button onClick={() => refetch()}>Retry</button>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {/* Create Post Component */}
        <CreatePost />
        
        {/* Feed List */}
        <Box sx={{ mt: 3 }}>
        <FeedList 
          posts={data?.data?.posts || []} 
          onRefresh={refetch}
          feedType="Following"
          isShowingUserPosts={false}
        />
        </Box>
      </Box>
    </Container>
  );
};

export default FollowingFeed;
