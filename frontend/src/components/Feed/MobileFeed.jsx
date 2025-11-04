import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery, Fab, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import FeedTabs from './FeedTabs';
import CreatePostModal from '../CreatePost/CreatePostModal';
import { PostIcon, ImageIcon, VideoIcon, PollIcon, PredictionIcon } from '@/assets/icons';

const MobileFeed = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [modalOpen, setModalOpen] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const actions = [
    { icon: <PostIcon />, name: 'Text Post', action: () => setModalOpen(true) },
    { icon: <ImageIcon />, name: 'Image Post', action: () => setModalOpen(true) },
    { icon: <VideoIcon />, name: 'Video Post', action: () => setModalOpen(true) },
    { icon: <PollIcon />, name: 'Poll Post', action: () => setModalOpen(true) },
    { icon: <PredictionIcon />, name: 'Prediction Post', action: () => setModalOpen(true) },
  ];

  if (!isMobile) {
    return <FeedTabs />;
  }

  return (
    <Box sx={{ pb: 8 }}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <FeedTabs />
        </motion.div>
      </AnimatePresence>

      {/* Floating Action Button for Mobile */}
      <SpeedDial
        ariaLabel="Create Post"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          '& .MuiFab-primary': {
            background: theme.palette.primary.main,
            '&:hover': {
              background: theme.palette.primary.dark,
            }
          }
        }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(false)}
        open={speedDialOpen}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.action();
              setSpeedDialOpen(false);
            }}
            sx={{
              '& .MuiFab-primary': {
                background: theme.palette.secondary.main,
                '&:hover': {
                  background: theme.palette.secondary.dark,
                }
              }
            }}
          />
        ))}
      </SpeedDial>

      <CreatePostModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </Box>
  );
};

export default MobileFeed;
