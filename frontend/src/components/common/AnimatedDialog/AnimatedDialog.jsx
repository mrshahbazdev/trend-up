import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import { CloseIcon } from '@/assets/icons';

const AnimatedDialog = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  headerColor = 'primary',
  showCloseButton = true,
  titleIcon,
  ...dialogProps
}) => {
  const theme = useTheme();

  // Get header color based on prop
  const getHeaderColor = () => {
    switch (headerColor) {
      case 'error':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'success':
        return theme.palette.success.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getHeaderLightColor = () => {
    switch (headerColor) {
      case 'error':
        return theme.palette.error.light;
      case 'warning':
        return theme.palette.warning.light;
      case 'success':
        return theme.palette.success.light;
      case 'info':
        return theme.palette.info.light;
      default:
        return theme.palette.primary.light;
    }
  };

  const headerBgColor = getHeaderColor();
  const headerLightColor = getHeaderLightColor();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.25)',
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
      {...dialogProps}
    >
      {/* Animated Header */}
      <DialogTitle sx={{ 
        background: headerBgColor,
        borderBottom: `1px solid ${headerLightColor}`,
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, ${headerBgColor}, ${headerLightColor})`,
          opacity: 0.1,
          animation: 'shimmer 3s ease-in-out infinite',
        },
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: 'relative', zIndex: 1, width: '100%' }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {titleIcon && (
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                >
                  {titleIcon}
                </motion.div>
              )}
              <Typography variant="h6" fontWeight={600} color="inherit">
                {title}
              </Typography>
            </motion.div>
            
            {showCloseButton && (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <IconButton onClick={onClose} sx={{ color: '#ffffff' }}>
                  <CloseIcon />
                </IconButton>
              </motion.div>
            )}
          </Box>
        </motion.div>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ 
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}>
        {children}
      </DialogContent>

      {/* Animated Footer */}
      {actions && (
        <DialogActions sx={{ 
          p: 3,
          background: headerBgColor,
          borderTop: `1px solid ${headerLightColor}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(45deg, ${headerBgColor}, ${headerLightColor})`,
            opacity: 0.1,
            animation: 'shimmer 3s ease-in-out infinite',
          },
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '50%': { transform: 'translateX(100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              position: 'relative', 
              zIndex: 1, 
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {actions}
          </motion.div>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default AnimatedDialog;
