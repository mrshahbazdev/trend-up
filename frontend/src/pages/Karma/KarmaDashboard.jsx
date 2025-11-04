import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Tabs, 
  Tab, 
  useTheme,
  alpha,
  Container
} from '@mui/material';
import { motion } from 'framer-motion';
import { 
  useGetMyKarmaQuery,
  useGetMyBadgesQuery,
  useGetMyKarmaHistoryQuery,
  useGetKarmaLeaderboardQuery,
  useGetKarmaStatsQuery
} from '@/api/slices/socialApi';
import KarmaDisplay from '@/components/common/KarmaDisplay';
import KarmaLeaderboard from '@/components/common/KarmaLeaderboard';
import BadgeShowcase from '@/components/common/BadgeShowcase';
import KarmaHistory from '@/components/common/KarmaHistory';
import { useSelector } from 'react-redux';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const KarmaDashboard = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useSelector((state) => state.user);

  const { 
    data: karmaData, 
    isLoading: isLoadingKarma 
  } = useGetMyKarmaQuery();

  const { 
    data: badgesData, 
    isLoading: isLoadingBadges 
  } = useGetMyBadgesQuery();

  const { 
    data: historyData, 
    isLoading: isLoadingHistory 
  } = useGetMyKarmaHistoryQuery({ limit: 10 });

  const { 
    data: leaderboardData, 
    isLoading: isLoadingLeaderboard 
  } = useGetKarmaLeaderboardQuery({ timeframe: 'all', limit: 10 });

  const { 
    data: statsData, 
    isLoading: isLoadingStats 
  } = useGetKarmaStatsQuery();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'Overview', value: 0 },
    { label: 'Badges', value: 1 },
    { label: 'History', value: 2 },
    { label: 'Leaderboard', value: 3 }
  ];

  const karma = karmaData?.data?.karma;
  const badges = badgesData?.data?.badges || [];
  const history = historyData?.data?.history || [];
  const leaderboard = leaderboardData?.data?.leaderboard || [];
  const stats = statsData?.data || {};

  const isLoading = isLoadingKarma || isLoadingBadges || isLoadingHistory || isLoadingLeaderboard || isLoadingStats;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            Karma Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your progress, earn badges, and climb the leaderboard
          </Typography>
        </Box>

        {/* Karma Overview Card */}
        {karma && (
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            sx={{
              mb: 4,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <KarmaDisplay
                  karma={karma}
                  size="large"
                  variant="detailed"
                />
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Welcome back, {user?.username}!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Keep engaging with the community to earn more karma and unlock new badges.
                  </Typography>
                  
                  {/* Quick Stats */}
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {badges.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Badges Earned
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {karma.stats?.postsCreated || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Posts Created
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {karma.stats?.commentsCreated || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Comments Made
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          {karma.stats?.reactionsGiven || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Reactions Given
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </CardContent>
          </MotionCard>
        )}

        {/* Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'medium',
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.value} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ minHeight: 400 }}>
          {activeTab === 0 && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Grid container spacing={3}>
                {/* Recent Badges */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Recent Badges
                      </Typography>
                      <BadgeShowcase
                        userId={user?._id}
                        variant="compact"
                        showProgress={false}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Recent Karma History */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Recent Activity
                      </Typography>
                      <KarmaHistory
                        userId={user?._id}
                        limit={5}
                        variant="compact"
                        showLoadMore={false}
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* Global Stats */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Community Stats
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                              {stats.totalUsers?.toLocaleString() || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Users
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                              {stats.totalKarma?.toLocaleString() || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Karma
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                              {stats.totalBadges?.toLocaleString() || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total Badges
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                              {stats.averageKarma?.toLocaleString() || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Avg Karma
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </MotionBox>
          )}

          {activeTab === 1 && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <BadgeShowcase
                userId={user?._id}
                variant="grid"
                showProgress={true}
              />
            </MotionBox>
          )}

          {activeTab === 2 && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <KarmaHistory
                userId={user?._id}
                variant="detailed"
                showLoadMore={true}
              />
            </MotionBox>
          )}

          {activeTab === 3 && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <KarmaLeaderboard
                timeframe="all"
                limit={20}
                showStats={true}
                showTabs={true}
                variant="default"
              />
            </MotionBox>
          )}
        </Box>
      </MotionBox>
    </Container>
  );
};

export default KarmaDashboard;
