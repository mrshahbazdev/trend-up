import React, { useState } from 'react';
import { Box, Tabs, Tab, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  useGetForYouFeedQuery, 
  useGetFollowingFeedQuery, 
  useGetTrendingFeedQuery,
  useGetDiscoverFeedQuery 
} from '@/api/slices/socialApi';
import FeedList from './FeedList';
import Loading from '../common/loading';

const FeedTabs = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'For You', query: useGetForYouFeedQuery },
    { label: 'Following', query: useGetFollowingFeedQuery },
    { label: 'Trending', query: useGetTrendingFeedQuery },
    { label: 'Discover', query: useGetDiscoverFeedQuery },
  ];

  const currentQuery = tabs[activeTab].query({ page: 1, limit: 20 });
  const { data, error, isLoading, refetch } = currentQuery;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 60,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading ? (
          <Loading isLoading={true} />
        ) : error ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <p>Error loading feed: {error.data?.message || 'Something went wrong'}</p>
            <button onClick={() => refetch()}>Retry</button>
          </Box>
        ) : (
          <FeedList 
            posts={data?.data?.posts || []} 
            onRefresh={refetch}
            feedType={tabs[activeTab].label}
          />
        )}
      </motion.div>
    </Box>
  );
};

export default FeedTabs;
