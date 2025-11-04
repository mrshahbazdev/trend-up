import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Tooltip, 
  useTheme,
  Chip,
  LinearProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WifiIcon, 
  WifiOffIcon, 
  RefreshIcon,
  ErrorIcon,
  CheckCircleIcon
} from '@/assets/icons';
import { useSocket } from '@/context/SocketContext';

const ConnectionStatus = ({ 
  showInHeader = true, 
  showDetailedStatus = false,
  onStatusChange 
}) => {
  const theme = useTheme();
  
  // Safe socket hook usage with error handling
  let socketData;
  try {
    socketData = useSocket();
  } catch (error) {
    console.warn('[ConnectionStatus] Socket context not available yet:', error.message);
    // Return null if socket context isn't ready yet
    return null;
  }
  
  const { 
    isConnected, 
    connectionStatus, 
    reconnectAttempts, 
    lastError, 
    reconnect 
  } = socketData;
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Handle status changes
  useEffect(() => {
    onStatusChange?.({
      isConnected,
      connectionStatus,
      reconnectAttempts,
      lastError
    });
  }, [isConnected, connectionStatus, reconnectAttempts, lastError, onStatusChange]);

  // Handle manual reconnect
  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await reconnect();
    } finally {
      setTimeout(() => setIsReconnecting(false), 2000);
    }
  };

  // Get status configuration
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: theme.palette.success.main,
          icon: <CheckCircleIcon />,
          text: 'Connected',
          tooltip: 'Real-time updates active'
        };
      case 'connecting':
        return {
          color: theme.palette.warning.main,
          icon: <WifiIcon />,
          text: 'Connecting...',
          tooltip: 'Establishing connection...'
        };
      case 'error':
        return {
          color: theme.palette.error.main,
          icon: <ErrorIcon />,
          text: 'Error',
          tooltip: lastError || 'Connection failed'
        };
      default:
        return {
          color: theme.palette.text.secondary,
          icon: <WifiOffIcon />,
          text: 'Disconnected',
          tooltip: 'Real-time updates unavailable'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Compact header version
  if (showInHeader && !showDetailedStatus) {
    return (
      <Tooltip 
        title={statusConfig.tooltip}
        open={showTooltip}
        onOpen={() => setShowTooltip(true)}
        onClose={() => setShowTooltip(false)}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconButton
            size="small"
            onClick={handleReconnect}
            disabled={isReconnecting || connectionStatus === 'connected'}
            sx={{
              color: statusConfig.color,
              '&:hover': {
                backgroundColor: statusConfig.color + '20'
              }
            }}
          >
            <motion.div
              animate={{
                rotate: connectionStatus === 'connecting' || isReconnecting ? 360 : 0
              }}
              transition={{
                duration: 1,
                repeat: connectionStatus === 'connecting' || isReconnecting ? Infinity : 0,
                ease: "linear"
              }}
            >
              {statusConfig.icon}
            </motion.div>
          </IconButton>
        </motion.div>
      </Tooltip>
    );
  }

  // Detailed status version
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 1000,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        padding: 2,
        boxShadow: theme.shadows[4],
        border: `1px solid ${statusConfig.color}`,
        minWidth: '200px'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={connectionStatus}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <motion.div
              animate={{
                rotate: connectionStatus === 'connecting' || isReconnecting ? 360 : 0
              }}
              transition={{
                duration: 1,
                repeat: connectionStatus === 'connecting' || isReconnecting ? Infinity : 0,
                ease: "linear"
              }}
            >
              {statusConfig.icon}
            </motion.div>
            
            <Typography variant="subtitle2" fontWeight={600} color={statusConfig.color}>
              {statusConfig.text}
            </Typography>
          </Box>

          {/* Connection details */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Status: {connectionStatus}
            </Typography>
            {reconnectAttempts > 0 && (
              <Typography variant="caption" color="text.secondary" display="block">
                Attempts: {reconnectAttempts}
              </Typography>
            )}
            {lastError && (
              <Typography variant="caption" color="error.main" display="block">
                Error: {lastError}
              </Typography>
            )}
          </Box>

          {/* Progress bar for connecting state */}
          {connectionStatus === 'connecting' && (
            <LinearProgress
              sx={{
                mb: 1,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: statusConfig.color
                }
              }}
            />
          )}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label="Reconnect"
              size="small"
              onClick={handleReconnect}
              disabled={isReconnecting || connectionStatus === 'connected'}
              sx={{
                backgroundColor: statusConfig.color + '20',
                color: statusConfig.color,
                '&:hover': {
                  backgroundColor: statusConfig.color + '30'
                }
              }}
            />
            
            {connectionStatus === 'error' && (
              <Chip
                label="Retry"
                size="small"
                variant="outlined"
                onClick={handleReconnect}
                disabled={isReconnecting}
                sx={{
                  borderColor: statusConfig.color,
                  color: statusConfig.color
                }}
              />
            )}
          </Box>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

export default ConnectionStatus;
