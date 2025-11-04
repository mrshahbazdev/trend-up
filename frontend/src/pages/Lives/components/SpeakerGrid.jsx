import React from 'react';
import { Grid2, Box, Avatar, Typography, Tooltip, styled, alpha } from '@mui/material';
import { Star as StarIcon, MicOff as MicOffIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const VideoFeedContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    position: "relative",
    background: 'transparent',
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    padding: theme.spacing(1),
    height: "100%",
    [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(2),
    },
}));

const VideoGrid = styled(Grid2)(({ theme }) => ({
    width: "100%",
    height: "100%",
    gap: theme.spacing(1),
    overflowY: 'auto',
    justifyContent: 'center',
    alignContent: 'flex-start',
    paddingBottom: '20px',
    [theme.breakpoints.up("sm")]: {
        gap: theme.spacing(2),
    },
}));

const VideoTile = styled(motion.div)(({ theme, isSpeaking }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius * 2,
    overflow: "hidden",
    background: `linear-gradient(45deg, ${theme.palette.grey[800]}, ${theme.palette.grey[700]})`,
    border: isSpeaking ? `3px solid ${theme.palette.success.main}` : `1px solid ${alpha(theme.palette.grey[600], 0.5)}`,
    boxShadow: isSpeaking ? `0 0 15px ${alpha(theme.palette.success.main, 0.6)}` : "none",
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    aspectRatio: '1 / 1',
    width: '100%',
    maxWidth: '250px',
    minWidth: '120px',
    margin: 'auto',
}));

const UserInfo = styled(Box)(({ theme }) => ({
    position: "absolute",
    bottom: 4,
    left: 4,
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: alpha(theme.palette.grey[900], 0.7),
    padding: "2px 6px",
    borderRadius: 12,
    color: theme.palette.common.white,
    fontSize: "0.75rem",
    zIndex: 2,
}));

const ControlsOverlay = styled(Box)(({ theme }) => ({
    position: "absolute",
    bottom: 4,
    right: 4,
    display: "flex",
    gap: 2,
    backgroundColor: alpha(theme.palette.grey[900], 0.7),
    padding: "2px",
    borderRadius: 6,
    zIndex: 2,
}));

const MuteIconContainer = styled(Box)(({ theme }) => ({
    width: 14, height: 14, borderRadius: "50%",
    backgroundColor: theme.palette.error.main,
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 3,
}));

export const SpeakerGrid = ({ speakers = [], remoteUsers = [], localUid, ownerUid }) => {

    const allDisplaySpeakers = speakers.map(speaker => {
        const isLocal = String(speaker.uid) === String(localUid);
        const remoteUser = remoteUsers.find(ru => String(ru.uid) === String(speaker.uid));
        const isSpeaking = remoteUser?.audioTrack?.isPlaying() && !speaker.isMuted;

        return {
            ...speaker,
            isLocal,
            isSpeaking,
        };
    });

    return (
        <VideoFeedContainer>
            <VideoGrid container>
                {allDisplaySpeakers.length === 0 && (
                    <Typography color="text.secondary">Waiting for speakers...</Typography>
                )}
                {allDisplaySpeakers.map((user) => {
                    const isHost = String(user.uid) === String(ownerUid);

                    return (
                        <Grid2 key={user.uid} size={{ xs: 6, sm: 4 }}>
                            <VideoTile isSpeaking={user.isSpeaking}>
                                {isHost && (
                                    <Tooltip title="Host">
                                        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}>
                                            <StarIcon sx={{ color: 'gold' }} />
                                        </Box>
                                    </Tooltip>
                                )}
                                <Avatar sx={{ width: 60, height: 60 }}>
                                    {user.name ? user.name[0].toUpperCase() : '?'}
                                </Avatar>
                                <UserInfo>
                                    <Typography variant="caption" noWrap>{user.name}</Typography>
                                </UserInfo>
                                {user.isMuted && (
                                    <ControlsOverlay>
                                        <MuteIconContainer>
                                            <MicOffIcon sx={{ fontSize: '10px', color: 'white' }} />
                                        </MuteIconContainer>
                                    </ControlsOverlay>
                                )}
                            </VideoTile>
                        </Grid2>
                    );
                })}
            </VideoGrid>
        </VideoFeedContainer>
    );
};