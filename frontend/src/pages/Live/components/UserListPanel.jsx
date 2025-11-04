import React, { useMemo, useState, useCallback } from 'react';
import {
    Box, Button, Typography, IconButton, Avatar, List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction, Tabs, Tab, Badge, alpha, styled, useTheme
} from "@mui/material";
import {
    Close as CloseIcon, Mic as MicIcon, MicOff as MicOffIcon, PanTool as RaiseHandIcon, PersonRemove as PersonRemoveIcon, Check as CheckIcon, Visibility as ViewersIcon
} from "@mui/icons-material";

// Styled Components
const PanelContainer = styled(Box)(({ theme }) => ({
    width: 320,
    height: '100%',
    backgroundColor: alpha(theme.palette.background.paper, 0.95),
    backdropFilter: "blur(10px)",
    borderLeft: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    [theme.breakpoints.down("sm")]: {
        width: '100vw',
    },
}));

const Header = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1, 2),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    '& .MuiTabs-indicator': {
        backgroundColor: theme.palette.primary.main,
    },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
    minWidth: 'auto',
    flex: 1,
    '&.Mui-selected': {
        color: theme.palette.primary.main,
    },
}));

const UserListItem = styled(ListItem)(({ theme }) => ({
    padding: theme.spacing(1, 2),
    '&:hover': {
        backgroundColor: alpha(theme.palette.action.hover, 0.05),
    },
}));

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`user-list-tabpanel-${index}`}
            aria-labelledby={`user-list-tab-${index}`}
            sx={{ flex: 1, overflowY: 'auto' }}
            {...other}
        >
            {value === index && (
                <List dense>{children}</List>
            )}
        </Box>
    );
};

export const UserListPanel = ({
    isOpen,
    onClose,
    spaceDetails,
    isOwner,
    localUid,
    onAcceptRequest,
    onRemoveSpeaker,
    remoteUsers 
}) => {
    const theme = useTheme(); 
    const [tabValue, setTabValue] = useState(0);

    const { owner, speakers, requests, listeners } = useMemo(() => {
        let owner = null;
        const speakers = [];
        const requests = spaceDetails?.raisedHands || [];
        const rawListeners = spaceDetails?.listeners || []; 
        const processedListeners = [];
        const seenUids = new Set(); // 🛑 FIX: UID tracking set

        if (spaceDetails?.speakers) {
            for (const speaker of spaceDetails.speakers) {
                const uidKey = String(speaker.uid);
                seenUids.add(uidKey); // Owner/Speaker UID ko track karo
                if (uidKey === String(spaceDetails.ownerAgoraUid)) {
                    owner = { ...speaker, isOwner: true };
                } else {
                    speakers.push(speaker);
                }
            }
        }
        
        // 🛑 FIX: Listener list ko unique banane ke liye filter/Map istemal karein
        for (const listener of rawListeners) {
            const uidKey = String(listener.uid);
            
            // Local user ko bhi duplicate hone se bachao
            if (uidKey === String(localUid)) {
                // Agar local user listener hai (speaker nahi), toh usay list mein daal do
                if (!seenUids.has(uidKey)) {
                     processedListeners.push(listener);
                     seenUids.add(uidKey);
                }
                continue;
            }

            if (!seenUids.has(uidKey)) {
                processedListeners.push(listener);
                seenUids.add(uidKey);
            }
        }
        
        return { owner, speakers, requests, listeners: processedListeners };

    }, [spaceDetails, localUid]);


    if (!isOpen) return null; 

    const handleTabChange = useCallback((event, newValue) => { 
        setTabValue(newValue);
    }, []);

    const renderUser = (user, type) => {
        const isLocal = String(user.uid) === String(localUid);
        return (
            <UserListItem key={user.uid}>
                <ListItemAvatar>
                    <Avatar sx={{ bgcolor: user.isOwner ? 'secondary.main' : (type === 'speaker' ? 'primary.main' : 'grey.600') }}>
                        {user.name ? user.name[0].toUpperCase() : '?'}
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary={user.name + (isLocal ? " (You)" : "")}
                    secondary={user.isOwner ? 'Owner' : (type === 'speaker' ? 'Speaker' : (type === 'request' ? 'Requesting...' : 'Listener'))}
                />
                {isOwner && type === 'speaker' && !user.isOwner && (
                    <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="remove speaker" onClick={() => onRemoveSpeaker(user.uid)} sx={{ color: 'error.main' }}>
                            <PersonRemoveIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                )}
                {isOwner && type === 'request' && (
                    <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="accept request" onClick={() => onAcceptRequest(user.uid)} sx={{ color: 'success.main' }}>
                            <CheckIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                )}
            </UserListItem>
        );
    };

    if (!spaceDetails) {
        return (
            <PanelContainer sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 102 }}>
                <Header>
                    <Typography variant="h6">Participants</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Header>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography>Loading user list...</Typography>
                </Box>
            </PanelContainer>
        );
    }

    return (
        <PanelContainer sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 102 }}>
            <Header>
                <Typography variant="h6">Participants</Typography>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Header>
            
            {/* Total Users (Speakers + Listeners) */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: alpha(theme.palette.grey[800], 0.1) }}>
                 <ViewersIcon sx={{ color: 'text.secondary' }} />
                 <Typography variant="body1" fontWeight="bold">
                    {listeners.length + speakers.length + (owner ? 1 : 0)} 
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        Total Users
                    </Typography>
                 </Typography>
            </Box>

            <Box>
                <StyledTabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
                    <StyledTab label={`Speakers (${speakers.length + (owner ? 1 : 0)})`} id="user-list-tab-0" />
                    <StyledTab label={`Listeners (${listeners.length})`} id="user-list-tab-1" /> {/* LISTENER TAB */}
                    {isOwner && (
                        <StyledTab 
                            label={
                                <Badge badgeContent={requests.length} color="primary" sx={{ paddingRight: requests.length > 0 ? '10px' : '0' }}>
                                    Requests
                                </Badge>
                            } 
                            id="user-list-tab-2" // Index 2
                        />
                    )}
                </StyledTabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                {owner && renderUser(owner, 'speaker')}
                {speakers.map(user => renderUser(user, 'speaker'))}
                {speakers.length === 0 && !owner && (
                     <ListItemText primary="No speakers yet." sx={{ textAlign: 'center', mt: 2 }} />
                )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}> {/* LISTENERS TAB CONTENT */}
                {listeners.length === 0 && (
                     <ListItemText primary="No other listeners yet." sx={{ textAlign: 'center', mt: 2 }} />
                )}
                {listeners.map(user => renderUser(user, 'listener'))}
            </TabPanel>

            {isOwner && (
                <TabPanel value={tabValue} index={2}>
                    {requests.length === 0 && (
                         <ListItemText primary="No pending requests." sx={{ textAlign: 'center', mt: 2 }} />
                    )}
                    {requests.map(user => renderUser(user, 'request'))}
                </TabPanel>
            )}
        </PanelContainer>
    );
};
