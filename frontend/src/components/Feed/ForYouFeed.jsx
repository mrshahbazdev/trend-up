import React from 'react';
import { Box, Container, useTheme, useMediaQuery, Typography } from '@mui/material';
import { useGetForYouFeedQuery, useGetUserPostsQuery } from '@/api/slices/socialApi';
import { useSelector } from 'react-redux';
import FeedList from './FeedList';
import CreatePost from '../CreatePost/CreatePost';
import Loading from '../common/loading';

const ForYouFeed = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.user);
  
  // Get main feed data
  const { data, error, isLoading, refetch } = useGetForYouFeedQuery({ page: 1, limit: 20 });
  
  // Get user's own posts as fallback
  const { data: userPosts, isLoading: userPostsLoading } = useGetUserPostsQuery(
    { userId: user?._id, page: 1, limit: 20 },
    { skip: !user?._id || (data?.data?.posts?.length > 0) }
  );

  // Debug logging
  console.log('ForYouFeed - API Response:', { data, error, isLoading });
  console.log('ForYouFeed - User Posts:', { userPosts, userPostsLoading });

  if (isLoading || userPostsLoading) {
    return <Loading isLoading={true} />;
  }

  if (error) {
    console.error('ForYouFeed - Error:', error);
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <p>Error loading feed: {error.data?.message || 'Something went wrong'}</p>
        <button onClick={() => refetch()}>Retry</button>
      </Box>
    );
  }

  // Determine which posts to show: main feed posts or user's own posts as fallback
  const postsToShow = data?.data?.posts?.length > 0 
    ? data.data.posts 
    : userPosts?.data?.posts || [];
  
  const isShowingUserPosts = data?.data?.posts?.length === 0 && userPosts?.data?.posts?.length > 0;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {/* Create Post Component */}
        <CreatePost />
        
        {/* Show indicator when displaying user's own posts */}
        {isShowingUserPosts && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 2, 
            px: 3, 
            mb: 2, 
            background: theme.palette.background.paper,
            borderRadius: 2,
            border: `1px solid ${theme.palette.primary.main}`,
          }}>
            <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
              📝 Showing your posts while we build your personalized feed
            </Typography>
          </Box>
        )}

        {/* Feed List */}
        <Box sx={{ mt: 3 }}>
          <FeedList 
            posts={postsToShow} 
            onRefresh={refetch}
            feedType="For You"
            isShowingUserPosts={isShowingUserPosts}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default ForYouFeed;
