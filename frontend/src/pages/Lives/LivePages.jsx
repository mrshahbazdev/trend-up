import React, { useState, useEffect, useRef, useCallback, Fragment } from "react";
import {
    Box, Button, Typography, Modal, styled, useTheme, Fade, Zoom, Slide, IconButton, alpha, Card, CardContent, Avatar, Chip, Stack, Grid2, TextField, Popover, Tooltip, useMediaQuery, CircularProgress, Alert
} from "@mui/material";
import {
    Mic as AudioIcon, Close as CloseIcon, Visibility as ViewersIcon, PlayArrow as WatchIcon, Send as SendIcon, Favorite as LikeIcon, Share as ShareIcon, AttachMoney as DonateIcon, EmojiEmotions as EmojiIcon, Chat as ChatIcon, Star as StarIcon, PersonAdd as PersonAddIcon, CardGiftcard as CardGiftcardIcon, PanTool as RaiseHandIcon, MicOff as MicOffIcon
} from "@mui/icons-material";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation, Routes, Route } from "react-router-dom";
import { useSelector } from 'react-redux';
import { useSocket } from '@/context/SocketContext.jsx';
import EmojiPicker from 'emoji-picker-react';

const BACKEND_URL = 'http://localhost:3001/api/v1/live';
const AGORA_APP_ID = '087b6bd261f845b2bca5586c9ca2178a';
const AGORA_SDK_URL = "https://download.agora.io/sdk/release/AgoraRTC_N-4.20.2.js";

let AgoraRTC = null;

const ANIMATION_TYPES = {
    donation: {
        emoji: "💰",
        title: (data) => `$${data.amount} Donation!`,
        subtitle: (data) => `From ${data.fromUser}`,
        background: (theme) => `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
        emojiAnimation: { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
    },
    like: {
        emoji: "❤️",
        title: () => "New Like!",
        subtitle: () => "Someone liked your stream",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
        emojiAnimation: { scale: [1, 1.3, 1] }
    },
    follow: {
        emoji: "⭐",
        title: () => "New Follower!",
        subtitle: () => "Thanks for the follow!",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
        emojiAnimation: { scale: [1, 1.2, 1], y: [0, -10, 0] }
    },
    gift: {
        emoji: "🎁",
        title: () => "Gift Received!",
        subtitle: () => "Thank you for the gift!",
        background: (theme) => `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
        emojiAnimation: { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }
    }
};

const useScript = (url) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;

    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
        if (url === AGORA_SDK_URL && window.AgoraRTC) {
            AgoraRTC = window.AgoraRTC;
            setLoaded(true);
        } else if (!existingScript.onload) {
            existingScript.onload = () => {
                 if (url === AGORA_SDK_URL) AgoraRTC = window.AgoraRTC;
                 setLoaded(true);
             };
             existingScript.onerror = () => { setError(true); };
        } else {
             setTimeout(() => {
                 if (url === AGORA_SDK_URL && window.AgoraRTC) {
                     AgoraRTC = window.AgoraRTC;
                     setLoaded(true);
                 } else if (url === AGORA_SDK_URL && !window.AgoraRTC) {
                        setError(true);
                 }
             }, 1000);
        }
        return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      if (url === AGORA_SDK_URL) AgoraRTC = window.AgoraRTC;
      setLoaded(true);
    };
    script.onerror = () => { setError(true); };
    document.body.appendChild(script);

  }, [url]);

  return [loaded, error];
};

const FullScreenContainer = styled(Box)(() => ({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "40px 0",
    minHeight: "calc(100vh - 64px)",
}));

const GlowButtonContainer = styled("div")({
    position: "relative",
    display: "inline-block",
    margin: "16px",
});

const GlowButton = styled(motion(Button))(({ color }) => ({
    position: "relative",
    zIndex: 1,
    padding: "16px 40px",
    borderRadius: "50px",
    fontWeight: "bold",
    fontSize: "18px",
    textTransform: "none",
    color: "#fff",
    background: `linear-gradient(45deg, ${color}, ${alpha(color, 0.7)})`,
    boxShadow: `0 4px 20px ${alpha(color, 0.5)}`,
    overflow: "hidden",
    "&:before": {
        content: '""',
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: `linear-gradient(45deg, transparent, ${alpha("#fff", 0.2)}, transparent)`,
        transform: "translateX(-100%)",
    },
    "&:hover:before": {
        transform: "translateX(100%)",
        transition: "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
    },
}));

const InstructionModal = styled(Modal)({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

const ModalContent = styled(Box)(({ theme }) => ({
    backgroundColor: alpha(theme.palette.background.paper, 0.95),
    backdropFilter: "blur(16px)",
    borderRadius: theme.shape.borderRadius * 2,
    padding: theme.spacing(4),
    maxWidth: 500,
    width: "90%",
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    boxShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.2)}`,
    position: "relative",
}));

const StepItem = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
}));

const LiveStreamCard = styled(Card)(({ theme }) => ({
    background: alpha(theme.palette.background.paper, 0.8),
    backdropFilter: "blur(10px)",
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    borderRadius: theme.shape.borderRadius * 2,
    transition: "all 0.3s ease",
    cursor: "pointer",
    "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
        borderColor: alpha(theme.palette.primary.main, 0.4),
    },
}));

const LiveContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    height: "100vh",
    flexDirection: "column",
    background: theme.palette.mode === "dark"
        ? `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${alpha(theme.palette.primary.dark, 0.7)} 100%)`
        : `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${alpha(theme.palette.primary.light, 0.3)} 100%)`,
    position: "relative",
    overflow: "hidden",
}));

const VideoSection = styled(Box)(({ theme }) => ({
    flex: 1,
    position: "relative",
    overflow: "hidden",
    background: theme.palette.grey[900],
    paddingBottom: '80px',
}));

const ChatSection = styled(motion.div)(({ theme }) => ({
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: alpha(theme.palette.background.paper, 0.95),
    backdropFilter: "blur(20px)",
    borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    maxHeight: "50vh",
    display: "flex",
    flexDirection: "column",
}));

const ChatToggleButton = styled(motion.button)(({ theme }) => ({
    position: "absolute",
    bottom: 16 + 80,
    right: 16,
    backgroundColor: alpha(theme.palette.primary.main, 0.9),
    color: theme.palette.common.white,
    border: "none",
    borderRadius: "20px",
    padding: "10px 20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.875rem",
    fontWeight: 600,
    zIndex: 101,
    backdropFilter: "blur(10px)",
    boxShadow: theme.shadows[4],
    "&:hover": {
        backgroundColor: theme.palette.primary.main,
        transform: "scale(1.05)",
    },
}));

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

const VideoTile = styled(motion.div)(({ theme, isActive, isSpeaking }) => ({
    position: "relative",
    borderRadius: theme.shape.borderRadius * 2,
    overflow: "hidden",
    background: `linear-gradient(45deg, ${theme.palette.grey[800]}, ${theme.palette.grey[700]})`,
    border: isSpeaking ? `3px solid ${theme.palette.success.main}` : (isActive ? `3px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.grey[600], 0.5)}`),
    boxShadow: isSpeaking ? `0 0 15px ${alpha(theme.palette.success.main, 0.6)}` : (isActive ? `0 0 15px ${alpha(theme.palette.primary.main, 0.5)}` : "none"),
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
    [theme.breakpoints.up("sm")]: {
        bottom: 8, left: 8, gap: 8, padding: "4px 8px", borderRadius: 16, fontSize: "inherit",
    },
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
    [theme.breakpoints.up("sm")]: {
        bottom: 8, right: 8, gap: 4, padding: "4px", borderRadius: 8,
    },
}));

const MuteIconContainer = styled(Box)(({ theme }) => ({
     width: 14, height: 14, borderRadius: "50%",
     backgroundColor: theme.palette.error.main,
     display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 3,
}));

const LiveBadge = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 4, left: 4,
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    padding: "2px 6px", borderRadius: 8, fontSize: "0.6rem", fontWeight: 700,
    display: "flex", alignItems: "center", gap: 4, zIndex: 2,
    [theme.breakpoints.up("sm")]: {
        top: 8, left: 8, fontSize: "0.7rem", padding: "4px 8px", borderRadius: 12,
    },
}));

const ViewerCount = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: 8, right: 8,
    backgroundColor: alpha(theme.palette.grey[900], 0.7),
    color: theme.palette.common.white,
    padding: "4px 8px", borderRadius: 16, display: "flex", alignItems: "center",
    fontSize: 12, fontWeight: 600, zIndex: 2,
    [theme.breakpoints.up("sm")]: {
        top: 16, right: 16, fontSize: 14, padding: "6px 12px",
    },
}));

const ChatContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isCompact",
})(({ theme, isCompact }) => ({
    width: isCompact ? "100%" : 350,
    height: isCompact ? "100%" : "100%",
    backgroundColor: alpha(theme.palette.background.paper, 0.97),
    backdropFilter: "blur(16px)",
    borderLeft: isCompact ? "none" : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: isCompact ? "16px 16px 0 0" : "0",
    transition: "all 0.3s ease-in-out",
    boxShadow: isCompact ? theme.shadows[8] : "none",
    [theme.breakpoints.down("md")]: {
        ...(!isCompact && {
            position: "absolute", right: 0, top: 0, bottom: 0,
            transform: "translateX(100%)", zIndex: 1000,
            "&.chat-open": { transform: "translateX(0)" },
        }),
    },
    [theme.breakpoints.down("sm")]: {
        width: "100%", borderRadius: isCompact ? "16px 16px 0 0" : "0",
    },
}));

const MessageItem = styled(motion.div)(({ theme, type }) => ({
    display: "flex", alignItems: "flex-start", padding: "8px 12px",
    backgroundColor: type === "donation" ? alpha(theme.palette.success.main, 0.15) : "transparent",
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    transition: "all 0.2s ease",
    "&:hover": { backgroundColor: alpha(theme.palette.action.hover, 0.08) },
}));

const EmojiPickerContainer = styled(Box)(({ theme }) => ({
    position: "absolute", bottom: "100%", right: 0, marginBottom: 8, zIndex: 1000,
    "& .EmojiPickerReact": {
        backgroundColor: `${theme.palette.background.paper} !important`,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)} !important`,
        borderRadius: `${theme.shape.borderRadius * 2}px !important`,
        boxShadow: `${theme.shadows[8]} !important`,
        width: "100% !important", maxWidth: 350,
    },
    [theme.breakpoints.down("sm")]: {
        right: "auto", left: 0,
        "& .EmojiPickerReact": { maxWidth: "100%", width: "100vw !important", marginLeft: "-16px" },
    },
}));

const CompactHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.5), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(12px)",
}));

const ActionButtonsContainer = styled(Stack)(({ theme, isCompact }) => ({
    flexDirection: "row", gap: theme.spacing(0.5),
    ...(isCompact && {
        overflowX: "auto", padding: theme.spacing(0.5),
        "&::-webkit-scrollbar": { display: "none" },
        msOverflowStyle: "none", scrollbarWidth: "none",
    }),
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
    flex: 1, overflowY: "auto", padding: theme.spacing(0.5),
}));

const AnimationContainer = styled(motion.div)(({ theme, type }) => ({
    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 9999,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    background: ANIMATION_TYPES[type]?.background(theme) || ANIMATION_TYPES.donation.background(theme),
    borderRadius: "20px", padding: "20px 30px", boxShadow: `0 10px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
    border: `2px solid ${alpha(theme.palette.common.white, 0.3)}`, backdropFilter: "blur(10px)",
    minWidth: "200px", maxWidth: "300px", textAlign: "center",
}));

const EmojiContainer = styled(motion.div)(() => ({ fontSize: "3rem", marginBottom: "15px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }));
const TitleText = styled(motion.div)(({ theme }) => ({ color: theme.palette.common.white, fontWeight: 700, fontSize: "1.2rem", textShadow: "0 2px 4px rgba(0,0,0,0.5)", marginBottom: "8px", lineHeight: 1.2 }));
const SubtitleText = styled(motion.div)(({ theme }) => ({ color: theme.palette.common.white, fontWeight: 600, fontSize: "1.1rem", textShadow: "0 2px 4px rgba(0,0,0,0.5)", opacity: 0.9 }));
const CustomMessage = styled(motion.div)(({ theme }) => ({ color: alpha(theme.palette.common.white, 0.8), fontWeight: 500, fontSize: "0.9rem", textShadow: "0 1px 2px rgba(0,0,0,0.5)", marginTop: "10px", fontStyle: "italic", maxWidth: "100%", wordBreak: "break-word" }));

const useAgoraTracks = () => {
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [error, setError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const createTracks = useCallback(async () => {
        if (!AgoraRTC) {
             setError("Agora SDK failed to load. Please refresh.");
             return null;
         }
        setIsInitializing(true);
        setError(null);
        try {
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            setLocalAudioTrack(audioTrack);
            setIsAudioMuted(false);
            return audioTrack;
        } catch (err) {
            setError("Could not access microphone. Please check permissions.");
            setLocalAudioTrack(null);
            return null;
        } finally {
            setIsInitializing(false);
        }
    }, []);

    const toggleAudio = useCallback(async () => {
        if (!localAudioTrack) return;
        try {
            const muted = !isAudioMuted;
            await localAudioTrack.setMuted(muted);
            setIsAudioMuted(muted);
        } catch (err) {}
    }, [localAudioTrack, isAudioMuted]);

     const closeTracks = useCallback(() => {
        if(localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
            setLocalAudioTrack(null);
        }
    }, [localAudioTrack]);

     useEffect(() => {
         return () => {
             closeTracks();
         };
     }, [closeTracks]);

    return {
        localAudioTrack, isAudioMuted,
        error, isInitializing,
        createTracks, toggleAudio, closeTracks
    };
};

const VideoGridComponent = ({ speakers = [], localUid, localAudioTrack, onUserClick, remoteUsers = [] }) => {
    const theme = useTheme();
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const { isAudioMuted: localIsMuted } = useAgoraTracks();

    const localUserIsSpeaker = speakers.some(s => String(s.uid) === String(localUid));

    const allSpeakers = [
        ...(localUserIsSpeaker ? [{
            uid: localUid,
            name: 'You',
            isLocal: true,
            audioTrack: localAudioTrack,
            isMuted: localIsMuted
        }] : []),
        ...speakers
            .filter(s => String(s.uid) !== String(localUid))
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
        if (count === 1) return { xs: 12 };
        if (count === 2) return { xs: 6 };
        if (count === 3) return { xs: 6, sm: 4 };
        if (count === 4) return { xs: 6, sm: 6 };
        return { xs: 6, sm: 4 };
    };

    return (
        <VideoFeedContainer>
            <VideoGrid container>
                {allSpeakers.length === 0 && (
                    <Grid2 size={12} display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="text.secondary">Waiting for speakers...</Typography>
                    </Grid2>
                )}
                {allSpeakers.map((user, i) => {
                    const size = getGridSize(allSpeakers.length);
                    const isSpeaking = user.isLocal ? !localIsMuted : (user.audioTrack && user.audioTrack.isPlaying && !user.isMuted);

                    return (
                        <Grid2 key={user.uid || `local-${i}`} {...size}>
                            <VideoTile
                                isSpeaking={isSpeaking}
                                isActive={false}
                            >
                                 <Avatar
                                     sx={{
                                         width: isSmallMobile ? 40 : 60,
                                         height: isSmallMobile ? 40 : 60,
                                         bgcolor: theme.palette.primary.main,
                                         fontSize: isSmallMobile ? "1rem" : "1.5rem",
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
                                             <MicOffIcon sx={{ fontSize: '10px', color: 'white' }}/>
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

const VideoControls = ({
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
                            fontSize: isSmallMobile ? "small" : "medium",
                        }}
                    >
                        {isMuted ? <MicOffIcon fontSize={isSmallMobile ? "small" : "medium"} /> : <AudioIcon fontSize={isSmallMobile ? "small" : "medium"} />}
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
                            fontSize: isSmallMobile ? "small" : "medium",
                        }}
                    >
                        <RaiseHandIcon fontSize={isSmallMobile ? "small" : "medium"} />
                    </IconButton>
                </Tooltip>
            )}
            <Tooltip title="Leave Space" placement="top">
                <IconButton
                    onClick={onLeave}
                    sx={{
                        backgroundColor: alpha(theme.palette.error.dark, 0.8),
                        color: theme.palette.common.white,
                        fontSize: isSmallMobile ? "small" : "medium",
                        "&:hover": { backgroundColor: theme.palette.error.dark },
                    }}
                >
                    <CloseIcon fontSize={isSmallMobile ? "small" : "medium"} />
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

const LiveChat = ({ messages, onSendMessage, onDonate, onLike, onSubscribe, onFollow, onGift, onShare, chatOpen, onToggleChat, isCompact = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const emojiButtonRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [message, setMessage] = useState("");
    const [emojiAnchor, setEmojiAnchor] = useState(null);

    const handleSendMessageInternal = () => { if (message.trim()) { onSendMessage(message); setMessage(""); } };
    const handleKeyPress = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessageInternal(); } };
    const handleEmojiClick = (emojiData) => { setMessage((prev) => prev + emojiData.emoji); setEmojiAnchor(null); };
    const handleEmojiButtonClick = (event) => { setEmojiAnchor(event.currentTarget); };
    const handleEmojiClose = () => { setEmojiAnchor(null); };
    const emojiOpen = Boolean(emojiAnchor);
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(scrollToBottom, [messages]);

    return (
        <ChatContainer isCompact={isCompact} sx={{ ...(isCompact && { maxHeight: "50vh", border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, boxShadow: theme.shadows[6] }) }}>
            {isCompact ? (
                 <CompactHeader>
                     <Typography variant="h6" fontWeight={600} sx={{ fontSize: "1.1rem" }}>💬 Live Chat ({messages.length})</Typography>
                     <IconButton size="small" onClick={onToggleChat} sx={{ color: theme.palette.text.secondary, "&:hover": { color: theme.palette.text.primary, backgroundColor: alpha(theme.palette.action.hover, 0.1) } }}> <CloseIcon fontSize="small" /> </IconButton>
                 </CompactHeader>
            ) : (
                <Box sx={{ p: theme.spacing(1.5), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(12px)" }}>
                    <Typography variant="h6" fontWeight={600}> Live Chat ({messages.length})</Typography>
                    {isMobile && <IconButton size="small" onClick={onToggleChat} sx={{ color: theme.palette.text.secondary, "&:hover": { color: theme.palette.text.primary, backgroundColor: alpha(theme.palette.action.hover, 0.1) } }}> <CloseIcon fontSize="small" /> </IconButton>}
                </Box>
            )}
             <Box sx={{ p: theme.spacing(1), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, background: alpha(theme.palette.background.default, 0.6), backdropFilter: "blur(8px)" }}>
                <ActionButtonsContainer isCompact={isCompact}>
                    <IconButton size="small" onClick={onLike} title="Send Like" sx={{ color: theme.palette.error.main, backgroundColor: alpha(theme.palette.error.main, 0.1), "&:hover": { backgroundColor: alpha(theme.palette.error.main, 0.2) } }}> <LikeIcon fontSize="small" /> </IconButton>
                    <IconButton size="small" onClick={onGift} title="Send Gift" sx={{ color: theme.palette.success.main, backgroundColor: alpha(theme.palette.success.main, 0.1), "&:hover": { backgroundColor: alpha(theme.palette.success.main, 0.2) } }}> <CardGiftcardIcon fontSize="small" /> </IconButton>
                    <IconButton size="small" onClick={onShare} title="Share" sx={{ color: theme.palette.text.secondary, backgroundColor: alpha(theme.palette.action.hover, 0.1), "&:hover": { backgroundColor: alpha(theme.palette.action.hover, 0.2), color: theme.palette.text.primary } }}> <ShareIcon fontSize="small" /> </IconButton>
                </ActionButtonsContainer>
            </Box>
            <MessagesContainer className="custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <MessageItem key={msg.id} type={msg.type} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} layout>
                            <Avatar sx={{ width: 36, height: 36, mr: 1.5, fontSize: "1rem", fontWeight: 600, bgcolor: msg.type === "donation" ? theme.palette.success.main : theme.palette.primary.main }}>{msg.user[0]?.toUpperCase() || '?'}</Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: msg.type === "donation" ? theme.palette.success.main : theme.palette.text.primary }}>{msg.user}</Typography>
                                    {msg.type === "donation" && <Chip label="DONATION" size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, backgroundColor: alpha(theme.palette.success.main, 0.2), color: theme.palette.success.main }} />}
                                </Box>
                                <Typography variant="body2" sx={{ wordBreak: "break-word", lineHeight: 1.4 }}>{msg.text}</Typography>
                            </Box>
                        </MessageItem>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </MessagesContainer>
             <Box sx={{ p: theme.spacing(1.5), borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`, position: "relative", background: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(12px)" }}>
                <TextField fullWidth placeholder="Send a message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={handleKeyPress} size="small" multiline maxRows={3}
                    InputProps={{
                        startAdornment: (
                             <IconButton 
                                 ref={emojiButtonRef} 
                                 onClick={handleEmojiButtonClick} 
                                 size="small" 
                                 sx={{ mr: 1, color: theme.palette.text.secondary, "&:hover": { color: theme.palette.primary.main, backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}
                             >
                                 <EmojiIcon />
                             </IconButton>
                         ),
                        endAdornment: (<IconButton onClick={handleSendMessageInternal} disabled={!message.trim()} size="small" sx={{ color: message.trim() ? theme.palette.primary.main : theme.palette.text.disabled, "&:hover:not(:disabled)": { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}><SendIcon /></IconButton>),
                        sx: { borderRadius: 2, backgroundColor: alpha(theme.palette.background.default, 0.7), "&:hover": { backgroundColor: alpha(theme.palette.background.default, 0.8) }, "&.Mui-focused": { backgroundColor: alpha(theme.palette.background.default, 0.9), boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}` }, fontSize: "0.9rem", padding: theme.spacing(0.5) }
                    }}
                />
                 <Popover 
                    open={emojiOpen}
                    anchorEl={emojiAnchor} 
                    onClose={handleEmojiClose} 
                    anchorOrigin={{ vertical: "top", horizontal: "right" }} 
                    transformOrigin={{ vertical: "bottom", horizontal: "right" }} 
                    sx={{ "& .MuiPopover-paper": { backgroundColor: "transparent", boxShadow: "none", overflow: "visible" } }}
                 >
                     <EmojiPickerContainer>
                          <EmojiPicker onEmojiClick={handleEmojiClick} autoFocusSearch={false} theme={theme.palette.mode} />
                     </EmojiPickerContainer>
                 </Popover>
             </Box>
        </ChatContainer>
    );
};

const NotificationAnimation = ({ notification }) => {
    if (!notification) return null;
    const { type = "donation", data = {} } = notification;
    const config = ANIMATION_TYPES[type] || ANIMATION_TYPES.donation;

    return (
        <AnimatePresence>
            {notification && (
                <AnimationContainer key={notification.id} type={type}
                    initial={{ scale: 0, opacity: 0, y: 50, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: -50, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.5 }}
                >
                    <EmojiContainer animate={config.emojiAnimation} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>{data.customEmoji || config.emoji}</EmojiContainer>
                    <TitleText initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>{config.title(data)}</TitleText>
                    <SubtitleText initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>{config.subtitle(data)}</SubtitleText>
                    {data.message && <CustomMessage initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>"{data.message}"</CustomMessage>}
                </AnimationContainer>
            )}
        </AnimatePresence>
    );
};

export const GoLiveView = () => {
    const theme = useTheme();
    const [openModal, setOpenModal] = useState(null);
    const controls = useAnimation();
    const navigate = useNavigate();
    const [liveSpaces, setLiveSpaces] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [spaceTitle, setSpaceTitle] = useState("");
    
    const { user } = useSelector((state) => state.user || {});
    const authToken = useSelector((state) => 
        state.auth?.token || 
        state.user?.token || 
        state.user?.accessToken || 
        state.auth?.accessToken
    );

    useEffect(() => {
        const fetchLiveSpaces = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${BACKEND_URL}/space/live`, {
                     headers: {
                         'Authorization': `Bearer ${authToken}`
                     }
                 });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setLiveSpaces(data.spaces || []);
            } catch (e) {
                setError("Could not load live spaces.");
                setLiveSpaces([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLiveSpaces();
    }, [authToken]);

    const options = [
         { id: "audio", title: "Audio Live", icon: <AudioIcon sx={{ fontSize: 30 }} />, color: "#4A00E0", steps: ["Enable your microphone", "Set your stream topic", "Invite guests or go solo", "Engage with listeners through chat"] },
    ];

    useEffect(() => {
        controls.start({ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8], transition: { duration: 8, ease: "easeInOut" } });
    }, [controls]);

    const handleOpen = (optionId) => setOpenModal(optionId);
    const handleClose = () => { setOpenModal(null); setSpaceTitle(""); };

    const handleGoLive = async () => {
        if (!spaceTitle.trim()) { alert("Please enter a title for your space."); return; }
        
        try {
            const response = await fetch(`${BACKEND_URL}/space/start`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ 
                    title: spaceTitle, 
                    ownerName: user?.name || "Anonymous Host"
                })
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
            const data = await response.json();
            handleClose();
            navigate(`/live/space/${data.channelName}`, { state: { spaceDetails: data } }); 
        } catch (err) {
            alert(`Error starting space: ${err.message}`);
        }
    };

    const handleWatchStream = (channelName) => {
        navigate(`/live/space/${channelName}`);
    };

    return (
        <FullScreenContainer>
            <Typography variant="h2" sx={{ mb: 4, fontWeight: 800, background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", zIndex: 1, fontSize: { xs: "2.5rem", md: "3.5rem" } }}>
                Go Live Now
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", zIndex: 1, gap: 4, mb: 6 }}>
                {options.map((option) => (
                    <GlowButtonContainer key={option.id}>
                        <motion.div style={{ position: "absolute", inset: 0, borderRadius: "50px", padding: "3px", background: `linear-gradient(45deg, ${option.color}, ${alpha(option.color, 0.5)})`, filter: "blur(12px)", zIndex: 0 }} animate={{ opacity: [0.3, 0.75, 0.3], scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} />
                        <GlowButton color={option.color} onClick={() => handleOpen(option.id)} whileHover={{ scale: 1.05, boxShadow: `0 0 30px 8px ${alpha(option.color, 0.4)}` }} whileTap={{ scale: 0.95 }} startIcon={<motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 6, -6, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>{option.icon}</motion.div>}>
                            {option.title}
                        </GlowButton>
                    </GlowButtonContainer>
                ))}
            </Box>
            <Box sx={{ width: "100%", maxWidth: 1200, zIndex: 1, px: 2 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, textAlign: "center", color: theme.palette.text.primary }}> 🔥 Currently Live Spaces </Typography>
                {isLoading && <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>}
                {error && <Typography textAlign="center" color="error">{error}</Typography>}
                {!isLoading && !error && liveSpaces.length === 0 && <Typography textAlign="center" color="text.secondary">No live spaces right now. Start one!</Typography>}
                <Grid2 container spacing={3} justifyContent="center">
                    {liveSpaces.map((space) => (
                        <Grid2 key={space._id || space.channelName} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <LiveStreamCard onClick={() => handleWatchStream(space.channelName)}>
                                <Box sx={{ position: "relative", height: 180, background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`, borderRadius: `${theme.shape.borderRadius * 2}px ${theme.shape.borderRadius * 2}px 0 0`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                    <Avatar sx={{ width: 60, height: 60, bgcolor: theme.palette.primary.light }}>{space.ownerName ? space.ownerName[0] : '?'}</Avatar>
                                    <Chip label="LIVE" color="error" size="small" sx={{ position: 'absolute', top: 12, left: 12 }} icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white', animation: 'pulse 1.5s infinite ease-in-out' }} />} />
                                    <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
                                </Box>
                                <CardContent>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{space.title}</Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, fontSize: "0.8rem", bgcolor: theme.palette.primary.main }}>{space.ownerName ? space.ownerName[0] : '?'}</Avatar>
                                        <Typography variant="body2" color="text.secondary" noWrap>{space.ownerName}</Typography>
                                    </Box>
                                    <Button fullWidth variant="contained" startIcon={<WatchIcon />} sx={{ background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, "&:hover": { transform: "translateY(-1px)", boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` } }}> Listen Now </Button>
                                </CardContent>
                            </LiveStreamCard>
                        </Grid2>
                    ))}
                </Grid2>
            </Box>
            {options.map((option) => (
                <InstructionModal key={option.id} open={openModal === option.id} onClose={handleClose} closeAfterTransition>
                    <Fade in={openModal === option.id}>
                        <ModalContent>
                            <IconButton onClick={handleClose} sx={{ position: "absolute", right: 16, top: 16, color: theme.palette.text.secondary }}> <CloseIcon /> </IconButton>
                            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{option.title}</Typography>
                            <TextField fullWidth label="Space Title" variant="outlined" value={spaceTitle} onChange={(e) => setSpaceTitle(e.target.value)} sx={{ mb: 3 }} autoFocus />
                            <Typography variant="body1" sx={{ mb: 3 }}>How it works:</Typography>
                            <Box sx={{ mb: 4 }}>
                                {option.steps.map((step, index) => (
                                    <Slide key={index} in={openModal === option.id} direction="right" timeout={(index + 1) * 300}>
                                        <StepItem>
                                            <Box sx={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: alpha(option.color, 0.2), display: "flex", alignItems: "center", justifyContent: "center", mr: 2, flexShrink: 0 }}><Typography variant="body1" fontWeight={700}>{index + 1}</Typography></Box>
                                            <Typography variant="body1">{step}</Typography>
                                        </StepItem>
                                    </Slide>
                                ))}
                            </Box>
                            <Zoom in={openModal === option.id} style={{ transitionDelay: openModal === option.id ? "600ms" : "0ms" }}>
                                <Button fullWidth variant="contained" size="large" onClick={handleGoLive} disabled={!spaceTitle.trim()} sx={{ py: 1.5, borderRadius: 2, background: `linear-gradient(45deg, ${option.color}, ${alpha(option.color, 0.7)})`, fontWeight: 700, fontSize: "1.1rem", "&:hover": { transform: "translateY(-2px)", boxShadow: `0 8px 20px ${alpha(option.color, 0.4)}` } }}> Start Space Now </Button>
                            </Zoom>
                        </ModalContent>
                    </Fade>
                </InstructionModal>
            ))}
        </FullScreenContainer>
    );
};

export const LiveStreamView = () => {
    const { channelName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { socket, isConnected: socketConnected, emitEvent } = useSocket();
    
    const { user } = useSelector((state) => state.user || {});
    const authToken = useSelector((state) => 
        state.auth?.token || 
        state.user?.token || 
        state.user?.accessToken || 
        state.auth?.accessToken
    );

    const agoraClientRef = useRef(null);

    const [spaceDetails, setSpaceDetails] = useState(location.state?.spaceDetails?.space || null);
    const [agoraToken, setAgoraToken] = useState(location.state?.spaceDetails?.token || null);
    
    const [agoraUid, setAgoraUid] = useState(() => {
        const initialState = location.state?.spaceDetails;
        if (initialState?.ownerUid) return Number(initialState.ownerUid);
        if (initialState?.uid) return Number(initialState.uid);
        if (user?._id) {
             try {
                const numericId = Number(parseInt(user._id.slice(-6), 16));
                if (!isNaN(numericId) && numericId > 0) return numericId;
             } catch(e) {}
        }
        return Math.floor(Math.random() * 1000000) + 1;
    });

    const [isOwner, setIsOwner] = useState(() => {
        const initialState = location.state?.spaceDetails;
        if (user?._id && initialState?.space?.ownerUid) {
            return String(user._id) === String(initialState.space.ownerUid);
        }
        if (initialState?.ownerUid && agoraUid) {
             return String(initialState.ownerUid) === String(agoraUid);
        }
        return false;
    });
    
    const [role, setRole] = useState(isOwner ? 'publisher' : 'audience');
    const [isConnected, setIsConnected] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [speakers, setSpeakers] = useState(location.state?.spaceDetails?.space?.speakers || []);
    const [raisedHands, setRaisedHands] = useState(location.state?.spaceDetails?.space?.raisedHands || []);
    const [isHandRaisedState, setIsHandRaisedState] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("Initializing...");

    const { localAudioTrack, isAudioMuted, error: trackError, isInitializing: trackInitializingHook, createTracks, toggleAudio, closeTracks } = useAgoraTracks();
    const [agoraLoaded, agoraError] = useScript(AGORA_SDK_URL);

    useEffect(() => {
        if (!AGORA_APP_ID || AGORA_APP_ID === 'YOUR_ACTUAL_AGORA_APP_ID') {
            setError("Invalid Agora App ID. Please configure a valid App ID.");
        }
    }, []);

    const handleLeave = useCallback(async (spaceHasEnded = false) => {
        try {
            await agoraClientRef.current?.leave();
        } catch (e) {}
        closeTracks();
        setIsConnected(false);
        if (socketConnected && !spaceHasEnded) {
             emitEvent('leaveRoom', { uid: agoraUid, channelName });
         }
        navigate('/live');
    }, [agoraUid, channelName, closeTracks, navigate, socketConnected, emitEvent]);

     const handleUserPublished = useCallback(async (user, mediaType) => {
        if (!agoraClientRef.current) return;
         try {
            await agoraClientRef.current.subscribe(user, mediaType);
            if (mediaType === "audio") {
                setRemoteUsers(prev => {
                    const exists = prev.some(u => u.uid === user.uid);
                    if (exists) {
                        return prev.map(u => u.uid === user.uid ? { ...u, audioTrack: user.audioTrack } : u);
                    }
                    return [...prev, { uid: user.uid, audioTrack: user.audioTrack, videoTrack: null }];
                });
                user.audioTrack?.play();
            }
        } catch (err) {}
    }, []);

    const handleUserUnpublished = useCallback((user, mediaType) => {
        if (mediaType === "audio") {
            setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, audioTrack: null } : u));
        }
    }, []);

     const handleUserJoined = useCallback((user) => {
         setRemoteUsers(prev => {
              if (prev.some(u => u.uid === user.uid)) return prev;
              return [...prev, { uid: user.uid, audioTrack: null, videoTrack: null }];
          });
     }, []);

     const handleUserLeft = useCallback((user, reason) => {
         setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
     }, []);

    const handleRoomStateUpdate = useCallback((updatedSpaceData) => {
        if (updatedSpaceData?.channelName === channelName) {
            setSpaceDetails(updatedSpaceData);
            setSpeakers(updatedSpaceData.speakers || []);
            setRaisedHands(updatedSpaceData.raisedHands || []);
            const meRaisedHand = updatedSpaceData.raisedHands?.some(u => String(u.uid) === String(agoraUid));
            setIsHandRaisedState(!!meRaisedHand);
            if (user?._id && updatedSpaceData.ownerUid) {
                setIsOwner(String(user._id) === String(updatedSpaceData.ownerUid));
            }
        }
    }, [agoraUid, channelName, user?._id]);

    const handleHandAccepted = useCallback(async ({ channelName: acceptedChannel }) => {
           if (acceptedChannel === channelName && role === 'audience' && agoraUid) {
              try {
                   const response = await fetch(`${BACKEND_URL}/token/join`, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                       body: JSON.stringify({ channelName, uid: agoraUid, role: 'publisher' })
                   });
                   if (!response.ok) throw new Error('Failed to get publisher token');
                   const data = await response.json();

                   setIsInitializing(true);
                   await agoraClientRef.current.leave();
                   const newAudioTrack = await createTracks();

                  if (newAudioTrack) {
                       setAgoraToken(data.token);
                       setRole('publisher');
                       await agoraClientRef.current.join(AGORA_APP_ID, channelName, data.token, agoraUid);
                       await agoraClientRef.current.publish([newAudioTrack]);
                       setIsConnected(true);
                        setIsHandRaisedState(false);
                  } else {
                       setRole('audience');
                  }
             } catch (err) {
                  setError(`Failed to become speaker: ${err.message}`);
             } finally {
                  setIsInitializing(false);
             }
          }
      }, [channelName, role, agoraUid, createTracks, authToken]);

       const handleYouWereRemoved = useCallback(async ({ channelName: removedChannel }) => {
            if (removedChannel === channelName && role === 'publisher' && String(agoraUid) !== String(spaceDetails?.ownerAgoraUid)) {
                try {
                     setIsInitializing(true);
                     if (localAudioTrack) {
                         await agoraClientRef.current.unpublish([localAudioTrack]);
                     }
                     closeTracks();

                     const response = await fetch(`${BACKEND_URL}/token/join`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                         body: JSON.stringify({ channelName, uid: agoraUid, role: 'audience' })
                     });
                     if (!response.ok) throw new Error('Failed to get audience token');
                     const data = await response.json();

                     await agoraClientRef.current.leave();
                      setAgoraToken(data.token);
                      setRole('audience');
                      await agoraClientRef.current.join(AGORA_APP_ID, channelName, data.token, agoraUid);
                      setIsConnected(true);
                } catch (err) {
                     setError(`Error returning to audience: ${err.message}`);
                } finally {
                     setIsInitializing(false);
                }
            }
       }, [channelName, role, agoraUid, spaceDetails, localAudioTrack, closeTracks, authToken]);

        const handleSpaceEnded = useCallback(({ channelName: endedChannel }) => {
            if (endedChannel === channelName) {
                 alert("The space has ended.");
                 handleLeave(true);
            }
        }, [channelName, handleLeave]);

    useEffect(() => {
        if (!AGORA_APP_ID || AGORA_APP_ID === 'YOUR_ACTUAL_AGORA_APP_ID') {
            setError("Agora App ID is not configured. Please set a valid App ID.");
            setIsInitializing(false);
            return;
        }

        if (!agoraLoaded) {
            setConnectionStatus("Loading audio library...");
            return;
        }

        if (!agoraClientRef.current) {
             agoraClientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
         }
         const client = agoraClientRef.current;

        const fetchSpaceDetails = async () => {
           if (!spaceDetails && channelName) {
               setConnectionStatus("Fetching space information...");
               try {
                   const response = await fetch(`${BACKEND_URL}/space/details/${channelName}`, {
                       headers: { 
                           'Authorization': `Bearer ${authToken}`,
                           'Content-Type': 'application/json'
                       }
                   });
                   
                   if (response.status === 404) {
                       setError("Space not found or has ended.");
                       return;
                   }
                   
                   if (!response.ok) {
                       throw new Error(`HTTP error! status: ${response.status}`);
                   }
                   
                   const data = await response.json();
                   setSpaceDetails(data.space);
                    setSpeakers(data.space?.speakers || []);
                    setRaisedHands(data.space?.raisedHands || []);
                    
                    if (user?._id && data.space?.ownerUid) {
                        setIsOwner(String(user._id) === String(data.space.ownerUid));
                    }
               } catch (e) {
                    setError(`Could not load space details: ${e.message}`);
               }
           }
        };

        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-joined", handleUserJoined);
        client.on("user-left", handleUserLeft);

        if (socket && typeof socket.on === 'function') {
            socket.on('connect', () => {
                setConnectionStatus("Socket connected");
            });
            socket.on('disconnect', () => {
                setConnectionStatus("Socket disconnected");
            });
            socket.on('roomStateUpdate', handleRoomStateUpdate);
            socket.on('handAccepted', handleHandAccepted);
            socket.on('youWereRemoved', handleYouWereRemoved);
            socket.on('spaceEnded', handleSpaceEnded);
        }

        const joinChannel = async () => {
            if (isConnected) return;
            if (!channelName) { 
                setError("Channel name missing."); 
                setIsInitializing(false); 
                return; 
            }

            let currentToken = agoraToken;
            let currentUid = agoraUid;
            let currentRole = role;
            let currentUserName = user?.name || "Anonymous";

            setConnectionStatus("Getting access token...");

            try {
                if (!currentUid) {
                    if (user?.agoraUid) {
                        currentUid = Number(user.agoraUid);
                    } else if (user?._id) {
                        currentUid = Number(parseInt(user._id.slice(-6), 16)) || Math.floor(Math.random() * 1000000);
                    } else {
                         currentUid = Math.floor(Math.random() * 1000000) + 1;
                    }
                    setAgoraUid(currentUid);
                }

                const response = await fetch(`${BACKEND_URL}/token/join`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${authToken}` 
                    },
                    body: JSON.stringify({
                        channelName,
                        userName: currentUserName,
                        role: 'audience',
                        uid: currentUid
                    })
                });
                
                if (!response.ok) { 
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || `Failed to get token: ${response.status}`); 
                }
                
                const data = await response.json();
                currentToken = data.token;
                currentUid = Number(data.uid); 
                setAgoraToken(currentToken);
                setAgoraUid(currentUid);
                setRole('audience');
                currentRole = 'audience';
            } catch (err) {
                setError(`Could not get access token: ${err.message}`);
                setIsInitializing(false);
                return;
            }

            if (channelName && currentToken && currentUid) {
                setConnectionStatus("Connecting to audio channel...");
                setIsInitializing(true);
                setError(null);
                
                try {
                    await client.setClientRole(currentRole);

                    setConnectionStatus("Joining space...");
                    await client.join(AGORA_APP_ID, channelName, currentToken, currentUid);
                    setIsConnected(true);
                    setConnectionStatus("Connected successfully!");

                    if (socketConnected && socket) {
                        emitEvent('registerUser', { uid: currentUid, channelName });
                    }

                } catch (err) {
                    setError(`Connection failed: ${err.message}`);
                    setIsConnected(false);
                    closeTracks();
                } finally {
                    setIsInitializing(false);
                }
            } else {
                setError("Missing required connection parameters");
                setIsInitializing(false);
            }
        };

        const initializeConnection = async () => {
            await fetchSpaceDetails();
            await joinChannel();
        };

        initializeConnection();

        return () => {
            const uidToLeave = agoraUid;
            const channelToLeave = channelName;

            client.leave().catch(e => {});
            closeTracks();
            setIsConnected(false);

            client.removeAllListeners();

            if (socketConnected && uidToLeave && channelToLeave && socket) {
                emitEvent('leaveRoom', { uid: uidToLeave, channelName: channelToLeave });
            }

            if (socket && typeof socket.off === 'function') {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('roomStateUpdate', handleRoomStateUpdate);
                socket.off('handAccepted', handleHandAccepted);
                socket.off('youWereRemoved', handleYouWereRemoved);
                socket.off('spaceEnded', handleSpaceEnded);
            }
        };
    }, [agoraLoaded, channelName, authToken, user]);

    const handleStopSpace = useCallback(async () => {
         if (!isOwner) return;
          try {
              const response = await fetch(`${BACKEND_URL}/space/stop`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                  body: JSON.stringify({ channelName })
              });
              if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to stop space'); }
          } catch (err) {
               alert(`Error stopping space: ${err.message}`);
          }
    }, [isOwner, channelName, authToken]);

     const handleRaiseHandToggle = useCallback(async () => {
         if (role !== 'audience' || !agoraUid || !user) return;
         const endpoint = isHandRaisedState ? '/space/lower-hand' : '/space/raise-hand';
         const body = {
             channelName,
             userUid: agoraUid,
             userName: user.name || "Anonymous"
         };

          try {
              const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                  body: JSON.stringify(body)
              });
              if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Failed to ${isHandRaisedState ? 'lower' : 'raise'} hand`); }
          } catch (err) {
               alert(`Error: ${err.message}`);
          }
     }, [role, agoraUid, isHandRaisedState, channelName, user, authToken]);

    const handleSendMessage = (msg) => {
         if (socketConnected && socket) {
             emitEvent('chatMessage', { channelName, message: msg, userName: user?.name || "Anonymous" });
         } else {
             setMessages(prev => [...prev, { id: Date.now(), user: "You", text: msg, type: "message" }]);
         }
     };
     const handleDonate = () => {};
     const handleLike = () => {};
     const handleSubscribe = () => {};
     const handleFollow = () => {};
     const handleGift = () => {};
     const handleShare = () => {};
    const toggleChat = () => setChatOpen(!chatOpen);
    const addNotification = (n) => setNotifications((p) => [...p.slice(-5), { ...n, id: Date.now() }]);

     const canSpeak = role === 'publisher';

     if (isInitializing || (!isConnected && !error && agoraLoaded)) {
         return (
             <LiveContainer sx={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', p: 3 }}>
                 <CircularProgress sx={{ mb: 2 }} />
                 <Typography variant="h6" gutterBottom>
                     Connecting to {spaceDetails?.title || 'space'}...
                 </Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                     {connectionStatus}
                 </Typography>
                 <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
                     <Typography variant="caption" color="text.secondary">
                         • Agora SDK: {agoraLoaded ? "✅ Loaded" : "⏳ Loading"}
                     </Typography>
                     <br />
                     <Typography variant="caption" color="text.secondary">
                         • Socket: {socketConnected ? "✅ Connected" : "❌ Disconnected"}
                     </Typography>
                     <br />
                     <Typography variant="caption" color="text.secondary">
                         • Space Details: {spaceDetails ? "✅ Loaded" : "⏳ Fetching"}
                     </Typography>
                 </Box>
                 {!agoraLoaded && (
                     <Alert severity="info" sx={{ mt: 2, maxWidth: 400 }}>
                         Loading audio library... This may take a few seconds.
                     </Alert>
                 )}
             </LiveContainer>
         );
     }

     if (error) {
         return (
             <LiveContainer sx={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', p: 3 }}>
                 <Typography variant="h5" color="error" gutterBottom>Connection Error</Typography>
                 <Typography sx={{ mt: 1, mb: 3 }}>{error}</Typography>
                 {error.includes("Agora App ID") && (
                     <Alert severity="warning" sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>
                         Please configure a valid Agora App ID in the code.
                     </Alert>
                 )}
                 <Button variant="contained" onClick={() => navigate('/live')} sx={{ mt: 2 }}>
                     Back to Dashboard
                 </Button>
                 <Button variant="outlined" onClick={() => window.location.reload()} sx={{ mt: 2, ml: 2 }}>
                     Try Again
                 </Button>
             </LiveContainer>
         );
     }

     if (!agoraLoaded || agoraError) {
         return (
             <LiveContainer sx={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', p: 3 }}>
                 <Typography variant="h5" color="error" gutterBottom>Error Loading Library</Typography>
                 <Typography sx={{ mt: 1, mb: 3 }}>
                     {agoraError ? "Failed to load audio library." : "Loading audio library..."}
                 </Typography>
                 <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>
                     Refresh Page
                 </Button>
             </LiveContainer>
         );
     }

    return (
        <LiveContainer>
            <VideoSection>
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
                    <Chip 
                        label={connectionStatus} 
                        color={isConnected ? "success" : "warning"}
                        size="small"
                    />
                </Box>
                
                <VideoGridComponent
                    speakers={speakers}
                    localUid={agoraUid}
                    localAudioTrack={localAudioTrack}
                    remoteUsers={remoteUsers}
                    onUserClick={() => {}}
                />
                
                 <VideoControls
                     isMuted={isAudioMuted}
                     onToggleAudio={toggleAudio}
                     onLeave={handleLeave}
                     isOwner={isOwner}
                     onStopSpace={handleStopSpace}
                     onRaiseHand={handleRaiseHandToggle}
                     isHandRaised={isHandRaisedState}
                     canSpeak={canSpeak}
                 />
                 
                <ChatToggleButton onClick={toggleChat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    💬 {chatOpen ? "Hide Chat" : "Show Chat"}
                </ChatToggleButton>
                 
                 <AnimatePresence>
                     {chatOpen && (
                         <ChatSection initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
                             <LiveChat
                                 messages={messages}
                                 onSendMessage={handleSendMessage}
                                 onDonate={handleDonate} onLike={handleLike} onSubscribe={handleSubscribe} onFollow={handleFollow} onGift={handleGift} onShare={handleShare}
                                 chatOpen={chatOpen}
                                 onToggleChat={toggleChat}
                                 isCompact={true}
                             />
                         </ChatSection>
                     )}
                 </AnimatePresence>
            </VideoSection>
             
             <Box sx={{ position: 'absolute', top: 80, left: 20, right: 20, zIndex: 1000, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 {notifications.map((n) => <NotificationAnimation key={n.id} notification={n} />)}
             </Box>
        </LiveContainer>
    );
};

const LiveAppWrapper = () => {
     const theme = useTheme();
      const [agoraLoaded, agoraError] = useScript(AGORA_SDK_URL);

     if (!agoraLoaded && !agoraError) {
         return <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><CircularProgress /><Typography sx={{ml: 2}}>Loading Audio Library...</Typography></Box>;
     }
      if (agoraError) {
           return <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column'}}><Typography color="error">Failed to load essential audio library.</Typography><Button onClick={()=>window.location.reload()}>Refresh</Button></Box>;
      }

     return (
         <Fragment>
             <Routes>
                 <Route path="/" element={<GoLiveView />} /> 
                 <Route path="/space/:channelName" element={<LiveStreamView />} />
             </Routes>
         </Fragment>
     );
  };

export default LiveAppWrapper;