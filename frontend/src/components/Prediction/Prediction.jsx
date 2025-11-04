import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Stack, useTheme, Chip } from '@mui/material';
import { useStakeOnPredictionMutation } from '@/api/slices/socialApi';
import { useToast } from '@/hooks/useToast';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

const Prediction = ({ predictionData, postId }) => {
  const theme = useTheme();
  const { showToast } = useToast();
  const { user: currentUser } = useSelector((state) => state.user);
  const [stakeAmount, setStakeAmount] = useState(10);
  const [position, setPosition] = useState('agree');
  
  const [stakeOnPrediction, { isLoading: isStaking }] = useStakeOnPredictionMutation();

  const handleStake = async () => {
    if (!stakeAmount || stakeAmount <= 0) {
      showToast('Please enter a valid stake amount', 'error');
      return;
    }

    try {
      await stakeOnPrediction({ 
        postId: predictionData._id, 
        stake: stakeAmount, 
        agree: position === 'agree' 
      }).unwrap();
      showToast('Stake submitted successfully!', 'success');
    } catch (error) {
      showToast(error.data?.message || 'Failed to submit stake', 'error');
    }
  };

  // Check if prediction has expired
  const isExpired = predictionData.predictionData?.targetDate && 
    new Date(predictionData.predictionData.targetDate) < new Date();

  // Check if user has already staked
  const hasStaked = predictionData.predictionData?.participants?.some(participant => 
    participant.userId.toString() === currentUser?._id
  );

  const totalStaked = predictionData.predictionData?.totalStakedKarma || 0;
  const participantsCount = predictionData.predictionData?.participantsCount || 0;

  return (
    <Box sx={{ 
      mt: 2, 
      p: 2, 
      border: 1, 
      borderColor: 'divider', 
      borderRadius: 2,
      background: theme.palette.background.paper,
    }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        🔮 Prediction
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
        "{predictionData.predictionData?.predictionText || predictionData.content}"
      </Typography>
      
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip 
          label={`Target: ${new Date(predictionData.predictionData?.targetDate || predictionData.targetDate).toLocaleDateString()}`}
          size="small"
          color="primary"
          variant="outlined"
        />
        <Chip 
          label={`${totalStaked} Karma staked`}
          size="small"
          color="secondary"
          variant="outlined"
        />
        <Chip 
          label={`${participantsCount} participants`}
          size="small"
          color="default"
          variant="outlined"
        />
      </Stack>
      
      {!isExpired && !hasStaked && (
        <Stack spacing={2}>
          <TextField
            label="Stake Amount (Karma)"
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(Number(e.target.value))}
            size="small"
            inputProps={{ min: 1, max: 1000 }}
            helperText="Minimum 1 Karma, Maximum 1000 Karma"
          />
          
          <Stack direction="row" spacing={2}>
            <Button
              variant={position === 'agree' ? 'contained' : 'outlined'}
              onClick={() => setPosition('agree')}
              fullWidth
              color="success"
            >
              ✅ Agree
            </Button>
            <Button
              variant={position === 'disagree' ? 'contained' : 'outlined'}
              onClick={() => setPosition('disagree')}
              fullWidth
              color="error"
            >
              ❌ Disagree
            </Button>
          </Stack>
          
          <Button
            variant="contained"
            onClick={handleStake}
            disabled={isStaking || !stakeAmount}
            fullWidth
            sx={{ mt: 1 }}
          >
            {isStaking ? 'Staking...' : `Stake ${stakeAmount} Karma`}
          </Button>
        </Stack>
      )}
      
      {hasStaked && (
        <Box sx={{ 
          p: 2, 
          background: theme.palette.primary.light + '20', 
          borderRadius: 1,
          border: `1px solid ${theme.palette.primary.main}`,
        }}>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
            ✓ You have already staked on this prediction
          </Typography>
        </Box>
      )}
      
      {isExpired && (
        <Box sx={{ 
          p: 2, 
          background: theme.palette.grey[100], 
          borderRadius: 1,
          border: `1px solid ${theme.palette.grey[300]}`,
        }}>
          <Typography variant="body2" color="text.secondary">
            ⏰ This prediction has expired. Results will be determined soon.
          </Typography>
        </Box>
      )}
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        {isExpired 
          ? `Prediction ended ${formatDistanceToNow(new Date(predictionData.predictionData?.targetDate || predictionData.targetDate))} ago`
          : `Prediction ends ${formatDistanceToNow(new Date(predictionData.predictionData?.targetDate || predictionData.targetDate))}`
        }
      </Typography>
    </Box>
  );
};

export default Prediction;
