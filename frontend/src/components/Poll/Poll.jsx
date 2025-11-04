import React, { useState } from 'react';
import { Box, Typography, LinearProgress, Stack, Button, useTheme } from '@mui/material';
import { useVoteOnPollMutation, useGetPollResultsQuery } from '@/api/slices/socialApi';
import { useToast } from '@/hooks/useToast';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';

const Poll = ({ pollData, postId }) => {
  const theme = useTheme();
  const { showToast } = useToast();
  const { user: currentUser } = useSelector((state) => state.user);
  const [selectedOption, setSelectedOption] = useState(null);
  
  const [voteOnPoll, { isLoading: isVoting }] = useVoteOnPollMutation();
  const { data: pollResults } = useGetPollResultsQuery(pollData._id);

  const handleVote = async (optionIndex) => {
    try {
      await voteOnPoll({ postId: pollData._id, optionIndex }).unwrap();
      showToast('Vote submitted successfully!', 'success');
      setSelectedOption(optionIndex);
    } catch (error) {
      showToast(error.data?.message || 'Failed to submit vote', 'error');
    }
  };

  // Calculate total votes and check if user has voted
  const totalVotes = pollData.pollOptions?.reduce((sum, option) => sum + (option.votes || 0), 0) || 0;
  const hasVoted = pollData.pollOptions?.some(option => 
    option.voters?.some(voter => voter.toString() === currentUser?._id)
  );

  // Check if poll has expired
  const isExpired = pollData.pollSettings?.expiresAt && 
    new Date(pollData.pollSettings.expiresAt) < new Date();

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
        {pollData.content || 'Poll Question'}
      </Typography>
      
      {pollData.pollOptions?.map((option, index) => {
        const percentage = totalVotes > 0 ? ((option.votes || 0) / totalVotes) * 100 : 0;
        const isSelected = selectedOption === index || 
          option.voters?.some(voter => voter.toString() === currentUser?._id);
        
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
                {option.text}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.votes || 0} votes ({percentage.toFixed(1)}%)
              </Typography>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={percentage} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: theme.palette.grey[300],
                '& .MuiLinearProgress-bar': {
                  backgroundColor: isSelected ? theme.palette.primary.main : theme.palette.secondary.main,
                },
              }}
            />
            {!hasVoted && !isExpired && (
              <Button 
                size="small" 
                onClick={() => handleVote(index)}
                disabled={isVoting}
                sx={{ mt: 1 }}
                variant={isSelected ? "contained" : "outlined"}
              >
                {isVoting ? 'Voting...' : 'Vote'}
              </Button>
            )}
          </Box>
        );
      })}
      
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Total votes: {totalVotes}
        </Typography>
        {pollData.pollSettings?.expiresAt && (
          <Typography variant="caption" color="text.secondary">
            {isExpired ? 'Voting ended' : `Ends ${formatDistanceToNow(new Date(pollData.pollSettings.expiresAt))}`}
          </Typography>
        )}
      </Stack>
      
      {hasVoted && (
        <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
          ✓ You have voted on this poll
        </Typography>
      )}
    </Box>
  );
};

export default Poll;
