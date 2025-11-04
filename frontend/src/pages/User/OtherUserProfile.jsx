import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Container,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  LocationOn as LocationIcon,
  Link as LinkIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import {
  useGetUserProfileQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetUserPostsQuery
} from '@/api/slices/socialApi';
import { useToast } from '@/hooks/useToast';
import { useSelector } from 'react-redux';
import Loading from '@/components/common/loading';
import BoxContainer from '@/components/common/BoxContainer/BoxConatner';
import FeedList from '@/components/Feed/FeedList';
import { getImageUrl } from '@/config/env';
import { formatDistanceToNow } from 'date-fns';

const OtherUserProfile = () => {
  const { userId } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { showToast } = useToast();
  const { user: currentUser } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState(0);
  const [localFollowStatus, setLocalFollowStatus] = useState(null);

  const { data: profileData, isLoading, error, refetch: refetchProfile } = useGetUserProfileQuery(userId);
  const { data: postsData, refetch: refetchPosts } = useGetUserPostsQuery({ userId, page: 1, limit: 20 });
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowing }] = useUnfollowUserMutation();

  const profile = profileData?.data?.profile;
  const posts = postsData?.data?.posts || [];
  const isOwnProfile = currentUser?._id === userId;

  // Initialize local follow status from profile data
  React.useEffect(() => {
    if (profile?.followStatus) {
      setLocalFollowStatus(profile.followStatus.isFollowing);
    }
  }, [profile?.followStatus]);

  // Get current follow status (local state takes precedence)
  const isFollowingUser = localFollowStatus !== null 
    ? localFollowStatus 
    : profile?.followStatus?.isFollowing || false;

  const handleFollowToggle = async () => {
    try {
      if (isFollowingUser) {
        await unfollowUser(userId).unwrap();
        setLocalFollowStatus(false);
        showToast(`Unfollowed ${profile.username || profile.name}`, 'success');
      } else {
        await followUser(userId).unwrap();
        setLocalFollowStatus(true);
        showToast(`Following ${profile.username || profile.name}`, 'success');
      }
      // Refetch profile to get updated stats
      refetchProfile();
    } catch (error) {
      showToast(error.data?.message || 'Failed to update follow status', 'error');
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isLoading) {
    return <Loading isLoading={true} />;
  }

  if (error || !profile) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>User Not Found</Typography>
        <Typography variant="body2" color="text.secondary">
          The user you're looking for doesn't exist or has been removed.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <BoxContainer sx={{ p: 0 }}>
        {/* Cover Image */}
        <Box
          sx={{
            height: 200,
            backgroundImage: `url(${getImageUrl(profile.coverImage) || 'https://images.pexels.com/photos/158826/structure-light-led-movement-158826.jpeg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            borderRadius: '3px 3px 0 0'
          }}
        />

        {/* Profile Header */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1 }}>
            <Avatar
              src={getImageUrl(profile.avatar)}
              sx={{
                width: 120,
                height: 120,
                mt: -8,
                border: '4px solid var(--color-card)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                borderRadius: '50%'
              }}
            />
            {!isOwnProfile && (
              <Button
                variant={isFollowingUser ? 'outlined' : 'contained'}
                color={isFollowingUser ? 'inherit' : 'primary'}
                startIcon={isFollowingUser ? <PersonRemoveIcon /> : <PersonAddIcon />}
                onClick={handleFollowToggle}
                disabled={isFollowing || isUnfollowing}
                sx={{ width: '150px' }}
              >
                {isFollowingUser ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </Box>

          {/* User Info */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '2rem', color: 'text.secondary' }}>
                {profile.name}
              </Typography>
              {profile.isEmailVerified && (
                <Chip label="Verified" color="primary" size="small" />
              )}
              {profile.followStatus?.isFollowedBy && (
                <Chip label="Follows you" variant="outlined" size="small" />
              )}
            </Box>

            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              @{profile.username || profile.name.toLowerCase().replace(/\s+/g, '')}
            </Typography>

            {profile.bio && (
              <Typography variant="body1" sx={{ my: 2 }}>
                {profile.bio}
              </Typography>
            )}

            {/* Meta Info */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
              {profile.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {profile.location}
                  </Typography>
                </Box>
              )}
              {profile.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LinkIcon fontSize="small" color="action" />
                  <Typography
                    variant="body2"
                    color="primary"
                    component="a"
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {profile.website}
                  </Typography>
                </Box>
              )}
              {profile.createdAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 3, my: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {formatNumber(profile.stats?.followers || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Followers
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {formatNumber(profile.stats?.following || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Following
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {formatNumber(profile.stats?.karma || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Karma
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600
              }
            }}
          >
            <Tab label="Posts" />
            <Tab label="Followers" disabled />
            <Tab label="Following" disabled />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: isMobile ? 1 : 2 }}>
          {activeTab === 0 && (
            <Box>
              {posts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No posts yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isOwnProfile ? "You haven't posted anything yet" : "This user hasn't posted anything yet"}
                  </Typography>
                </Box>
              ) : (
                <FeedList
                  posts={posts}
                  onRefresh={refetchPosts}
                  feedType="user"
                  isShowingUserPosts={true}
                />
              )}
            </Box>
          )}
        </Box>
      </BoxContainer>
    </Container>
  );
};

export default OtherUserProfile;

