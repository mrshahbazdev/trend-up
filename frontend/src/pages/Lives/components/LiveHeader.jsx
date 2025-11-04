import React from 'react';
import { Box, Typography } from '@mui/material';

export const LiveHeader = ({ title, ownerName }) => {
    return (
        <Box sx={{ p: 2, textAlign: 'center', zIndex: 10 }}>
            <Typography variant="h4" fontWeight={700}>
                {title || 'Live Space'}
            </Typography>
            <Typography color="text.secondary">
                Hosted by {ownerName || '...'}
            </Typography>
        </Box>
    );
};