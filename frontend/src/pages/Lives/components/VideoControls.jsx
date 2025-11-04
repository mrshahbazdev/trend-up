import React from 'react';
import { Stack, Tooltip, IconButton, Button, useTheme, useMediaQuery, alpha } from '@mui/material';
import { MicOff as MicOffIcon, Mic as AudioIcon, PanTool as RaiseHandIcon, Close as CloseIcon } from '@mui/icons-material';

export const VideoControls = ({
    isMuted,
    onToggleAudio,
    onLeave,
    isOwner,
    onStopSpace,
    onRaiseHand,
    isHandRaised,
    canSpeak
}) => {
    const theme = useTheme();
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ position: "absolute", bottom: 16, left: 0, right: 0, zIndex: 10 }}>
            {canSpeak && (
                <Tooltip title={isMuted ? "Unmute Microphone" : "Mute Microphone"} placement="top">
                    <IconButton
                        onClick={onToggleAudio}
                        sx={{
                            backgroundColor: isMuted ? alpha(theme.palette.error.main, 0.8) : alpha(theme.palette.grey[700], 0.8),
                            color: theme.palette.common.white,
                            "&:hover": { backgroundColor: isMuted ? theme.palette.error.main : alpha(theme.palette.grey[600], 0.8) },
                        }}
                    >
                        {isMuted ? <MicOffIcon /> : <AudioIcon />}
                    </IconButton>
                </Tooltip>
            )}
            {!canSpeak && (
                <Tooltip title={isHandRaised ? "Lower Hand" : "Raise Hand to Speak"} placement="top">
                    <IconButton
                        onClick={onRaiseHand}
                        sx={{
                            backgroundColor: isHandRaised ? alpha(theme.palette.warning.main, 0.8) : alpha(theme.palette.grey[700], 0.8),
                            color: theme.palette.common.white,
                            "&:hover": { backgroundColor: isHandRaised ? theme.palette.warning.main : alpha(theme.palette.grey[600], 0.8) },
                        }}
                    >
                        <RaiseHandIcon />
                    </IconButton>
                </Tooltip>
            )}
            <Tooltip title="Leave Space" placement="top">
                <IconButton
                    onClick={onLeave}
                    sx={{
                        backgroundColor: alpha(theme.palette.error.dark, 0.8),
                        color: theme.palette.common.white,
                        "&:hover": { backgroundColor: theme.palette.error.dark },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Tooltip>
            {isOwner && (
                <Tooltip title="End Space for Everyone" placement="top">
                    <Button
                        onClick={onStopSpace}
                        variant="contained"
                        color="error"
                        size={isSmallMobile ? "small" : "medium"}
                        sx={{ borderRadius: '20px', fontWeight: 600 }}
                    >
                        End Space
                    </Button>
                </Tooltip>
            )}
        </Stack>
    );
};