import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ForYouFeed from '@/components/Feed/ForYouFeed';
import FollowingFeed from '@/components/Feed/FollowingFeed';
import TrendingFeed from '@/components/Feed/TrendingFeed';
import DiscoverFeed from '@/components/Feed/DiscoverFeed';

const SocialRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/social/foryou" replace />} />
      <Route path="/foryou" element={<ForYouFeed />} />
      <Route path="/following" element={<FollowingFeed />} />
      <Route path="/trending" element={<TrendingFeed />} />
      <Route path="/discover" element={<DiscoverFeed />} />
    </Routes>
  );
};

export default SocialRoutes;
