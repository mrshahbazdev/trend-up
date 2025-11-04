/**
 * src/pages/live/components/VideoGridComponent.jsx
 *
 * Component to display the grid of speakers in the audio room.
 * UPDATED: Removed internal useAgoraTracks hook to prevent conflicts.
 * Receives localIsMuted as a prop from the parent.
 * UPDATED: Added logic for 'isSingle' prop to resize tile.
 */
import React from "react";
import { Box, Typography, Avatar, useTheme, useMediaQuery } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import { MicOff as MicOffIcon } from "@mui/icons-material";
// import { useAgoraTracks } from "../hooks/useAgoraTracks"; // Removed this hook

import {
    VideoFeedContainer,
    VideoGrid,
    VideoTile,
    UserInfo,
    ControlsOverlay,
    MuteIconContainer
} from "../styled/StreamViewStyles";

export const VideoGridComponent = ({ 
    speakers = [], 
    localUid, 
    localAudioTrack, 
    localIsMuted, // Receive this as a prop
    onUserClick, 
    remoteUsers = [] 
}) => {
    const theme = useTheme();
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
    
    // const { isAudioMuted: localIsMuted } = useAgoraTracks(); // Removed this line

    const localUserIsSpeaker = speakers.some(s => String(s.uid) === String(localUid));

    // Combine local user (if speaker) and remote speakers
    const allSpeakers = [
        ...(localUserIsSpeaker ? [{
            uid: localUid,
            name: 'You',
            isLocal: true,
            audioTrack: localAudioTrack,
            isMuted: localIsMuted // Use prop
        }] : []),
        ...speakers
            .filter(s => String(s.uid) !== String(localUid)) // Filter out remote entry for local user
            .map(s => {
                const remoteUser = remoteUsers.find(ru => String(ru.uid) === String(s.uid));
                const remoteTrack = remoteUser?.audioTrack;
                const isMuted = s.isMuted ?? !(remoteTrack && remoteTrack.isPlaying);
                const isSpeaking = remoteTrack?.isPlaying && !s.isMuted;
                
                return {
                    ...s,
                    uid: s.uid,
                    audioTrack: remoteTrack,
                    isMuted: isMuted,
                    isSpeaking: isSpeaking,
                    isLocal: false
                };
            })
    ];

    const getGridSize = (count) => {
        count = Math.max(1, count);
        // 🛑 FIX: Change grid size logic
        if (count === 1) return { xs: 12, sm: 8, md: 6 }; // Bada size jab ek ho
        if (count === 2) return { xs: 12, sm: 6 }; // Side by side
        if (count === 3) return { xs: 6, sm: 4 };
        if (count === 4) return { xs: 6, sm: 6 };
        return { xs: 6, sm: 4 }; // Default for 5+
    };

    const isSingle = allSpeakers.length === 1;

    return (
        <VideoFeedContainer>
            <VideoGrid container>
                {allSpeakers.length === 0 && (
                    <Grid2 xs={12} display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">Waiting for speakers...</Typography>
                    </Grid2>
                )}
                {allSpeakers.map((user, i) => {
                    const size = getGridSize(allSpeakers.length);
                    // Use localIsMuted prop for local user's speaking status
                    const isSpeaking = user.isLocal ? !localIsMuted : (user.audioTrack && user.audioTrack.isPlaying && !user.isMuted);

                    return (
                        <Grid2 key={user.uid || `local-${i}`} {...size}>
                            <VideoTile
                                isSpeaking={isSpeaking}
                                isActive={false} 
                                isSingle={isSingle} // 🛑 FIX: Pass isSingle prop
                            >
                                <Avatar
                                    sx={{
                                        // 🛑 FIX: Avatar size badhayein jab single ho
                                        width: isSmallMobile ? 40 : (isSingle ? 100 : 60),
                                        height: isSmallMobile ? 40 : (isSingle ? 100 : 60),
                                        bgcolor: theme.palette.primary.main,
                                        fontSize: isSmallMobile ? "1rem" : (isSingle ? "3rem" : "1.5rem"),
                                    }}
                                >
                                    {user.name ? user.name[0].toUpperCase() : '?'}
                                </Avatar>
                                <UserInfo>
                                    <Avatar sx={{ width: 16, height: 16, fontSize: "0.6rem", bgcolor: isSpeaking ? theme.palette.success.main : theme.palette.grey[500] }}>
                                        {user.name ? user.name[0].toUpperCase() : '?'}
                                    </Avatar>
                                    <Typography variant="caption" noWrap>{user.name}</Typography>
                                </UserInfo>
                                {user.isMuted && (
                                    <ControlsOverlay>
                                        <MuteIconContainer title={`${user.name} is muted`}>
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

