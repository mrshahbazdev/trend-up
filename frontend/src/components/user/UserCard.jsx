import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Box,
  Chip,
  useTheme
} from '@mui/material';
import { PersonAdd as PersonAddIcon, PersonRemove as PersonRemoveIcon } from '@mui/icons-material';
import { useFollowUserMutation, useUnfollowUserMutation } from '@/api/slices/socialApi';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/config/env';

const MotionCard = motion(Card);

const UserCard = ({ user, showFollowButton = true, isFollowing: initialFollowing = false, onFollowChange }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: isUnfollowing }] = useUnfollowUserMutation();
  const [following, setFollowing] = useState(initialFollowing);

  // Update local state when prop changes
  React.useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    
    try {
      if (following) {
        await unfollowUser(user._id).unwrap();
        setFollowing(false);
        showToast(`Unfollowed ${user.username || user.name}`, 'success');
      } else {
        await followUser(user._id).unwrap();
        setFollowing(true);
        showToast(`Following ${user.username || user.name}`, 'success');
      }
      onFollowChange?.(!following);
    } catch (error) {
      showToast(error.data?.message || 'Failed to update follow status', 'error');
    }
  };

  const handleCardClick = () => {
    navigate(`/user/${user._id}`);
  };

  return (
    <MotionCard
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300 }}
      sx={{
        cursor: 'pointer',
        mb: 2,
        background: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
        border: `1px solid ${theme.palette.divider}`,
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Avatar */}
          <Avatar
            src={getImageUrl(user.avatar)}
            sx={{ width: 56, height: 56 }}
          />

          {/* User Info */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {user.name}
              </Typography>
              {user.isEmailVerified && (
                <Chip label="Verified" color="primary" size="small" />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              @{user.username || user.name.toLowerCase().replace(/\s+/g, '')}
            </Typography>
            {user.bio && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {user.bio.length > 100 ? `${user.bio.substring(0, 100)}...` : user.bio}
              </Typography>
            )}
          </Box>

          {/* Follow Button */}
          {showFollowButton && (
            <Button
              variant={following ? 'outlined' : 'contained'}
              color={following ? 'inherit' : 'primary'}
              startIcon={following ? <PersonRemoveIcon /> : <PersonAddIcon />}
              onClick={handleFollowToggle}
              disabled={isFollowing || isUnfollowing}
              sx={{ minWidth: 120 }}
            >
              {following ? 'Unfollow' : 'Follow'}
            </Button>
          )}
        </Box>
      </CardContent>
    </MotionCard>
  );
};

export default UserCard;

