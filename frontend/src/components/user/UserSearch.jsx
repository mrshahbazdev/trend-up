import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  CircularProgress,
  Container,
  useTheme
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useSearchUsersQuery } from '@/api/slices/socialApi';
import { useSelector } from 'react-redux';
import UserCard from './UserCard';
import BoxContainer from '@/components/common/BoxContainer/BoxConatner';
import { useDebounce } from '@/hooks/useDebounce';

const UserSearch = () => {
  const theme = useTheme();
  const { user: currentUser } = useSelector((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading, isFetching } = useSearchUsersQuery(
    { q: debouncedSearch, limit: 20 },
    { skip: !debouncedSearch || debouncedSearch.length < 2 }
  );

  // Backend now filters out current user and includes follow status
  const users = data?.data?.users || [];

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <BoxContainer>
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Find People
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Search by name, @username, or email
          </Typography>

          {/* Search Input */}
          <TextField
            fullWidth
            placeholder="Search users (e.g., @username, name, email)"
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (isFetching || isLoading) && (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          {/* Search Results */}
          {!searchQuery || searchQuery.length < 2 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Type at least 2 characters to search for users
              </Typography>
            </Box>
          ) : isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try searching with a different name or username
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Found {users.length} user{users.length !== 1 ? 's' : ''}
              </Typography>
              {users.map((user) => (
                <UserCard 
                  key={user._id} 
                  user={user} 
                  showFollowButton={true}
                  isFollowing={user.isFollowing || false}
                />
              ))}
            </Box>
          )}
        </Box>
      </BoxContainer>
    </Container>
  );
};

export default UserSearch;

