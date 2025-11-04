import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, Paper, alpha } from '@mui/material';

export const RaisedHandsList = ({ raisedHands = [], onAccept }) => {
    if (raisedHands.length === 0) {
        return null;
    }

    return (
        <Paper
            elevation={8}
            sx={{
                position: 'absolute',
                top: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                width: '90%',
                maxWidth: 400,
                p: 2,
                background: (theme) => alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(10px)',
            }}
        >
            <Typography variant="h6" gutterBottom>Requests to Speak</Typography>
            <List dense>
                {raisedHands.map((user) => (
                    <ListItem
                        key={user.uid}
                        secondaryAction={
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => onAccept(user)}
                            >
                                Accept
                            </Button>
                        }
                    >
                        <ListItemText primary={user.name} />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};