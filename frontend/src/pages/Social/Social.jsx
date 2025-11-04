import React from 'react';
import { Box, useTheme } from '@mui/material';
import SocialRoutes from './SocialRoutes';

const Social = () => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default }}>
      <SocialRoutes />
    </Box>
  );
};

export default Social;
