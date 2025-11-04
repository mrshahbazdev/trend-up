import React, { useState, useEffect, useRef, useCallback, Fragment } from "react"; // Added Fragment
import {
    Box, Button, Typography, Modal, styled, useTheme, Fade, Zoom, Slide, IconButton, alpha, Card, CardContent, Avatar, Chip, Stack, Grid2, TextField, Popover, Tooltip, useMediaQuery, CircularProgress // Added CircularProgress
} from "@mui/material";
import {
    LiveTv as VideoIcon, Mic as AudioIcon, Podcasts as PodcastIcon, Close as CloseIcon, Visibility as ViewersIcon, PlayArrow as WatchIcon, PlayArrow as PlayArrowIcon, Send as SendIcon, Favorite as LikeIcon, Share as ShareIcon, AttachMoney as DonateIcon, EmojiEmotions as EmojiIcon, Chat as ChatIcon, Star as StarIcon, PersonAdd as PersonAddIcon, CardGiftcard as CardGiftcardIcon, VideocamOff as VideocamOffIcon, Videocam as VideocamIcon, ScreenShare as ScreenShareIcon, MoreVert as MoreIcon, PanTool as RaiseHandIcon, MicOff as MicOffIcon // Added MicOffIcon
} from "@mui/icons-material";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useNavigate, BrowserRouter as Router, Routes, Route, useParams, Link, useLocation } from "react-router-dom"; // Using react-router-dom, added useLocation
// Removed direct imports for AgoraRTC and EmojiPicker
import io from 'socket.io-client'; // Import Socket.io client

// --- Configuration ---
const BACKEND_URL = 'http://localhost:3001/api/v1/live'; // Your backend URL
const SOCKET_URL = 'http://localhost:3001'; // Your Socket.io server URL
const AGORA_APP_ID = '087b6bd261f845b2bca5586c9ca2178a'; // Your Agora App ID
const AGORA_SDK_URL = "https://download.agora.io/sdk/release/AgoraRTC_N-4.20.2.js";
const EMOJI_PICKER_URL = "https://cdn.jsdelivr.net/npm/emoji-picker-react@^4.4.7/dist/main.js"; // Example CDN, check for latest/correct

// --- Global variables for dynamically loaded libraries ---
let AgoraRTC = null;
let EmojiPicker = null;

// --- Socket.io Client Initialization ---
const socket = io(SOCKET_URL, { autoConnect: false }); // Don't auto-connect initially

// --- Helper Hook for Dynamic Script Loading ---
const useScript = (url) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;

    // Check if script already exists
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
        // If it exists, assume it's loaded or loading
        // A more robust check might involve checking a global variable
        // For simplicity, we assume it's loaded if the tag is present
        // Check window objects for library presence
        if (url === AGORA_SDK_URL && window.AgoraRTC) {
            AgoraRTC = window.AgoraRTC;
            setLoaded(true);
        } else if (url === EMOJI_PICKER_URL && window.EmojiPickerReact) {
            EmojiPicker = window.EmojiPickerReact.default || window.EmojiPickerReact; // Handle potential default export
             setLoaded(true);
        } else if (!existingScript.onload) {
            // If library not yet on window, attach listeners to existing script
            existingScript.onload = () => {
                 if (url === AGORA_SDK_URL) AgoraRTC = window.AgoraRTC;
                 else if (url === EMOJI_PICKER_URL) EmojiPicker = window.EmojiPickerReact.default || window.EmojiPickerReact;
                 setLoaded(true);
                 console.log(`${url} loaded via existing script.`);
             };
             existingScript.onerror = () => { setError(true); console.error(`Error loading existing script ${url}`); };
        } else {
             // Script exists but library not on window and onload already ran or attached?
             // Might indicate loading issue or library setting a different global var name
             console.warn(`Script ${url} exists but library object not found on window.`);
             // Attempt re-check after delay? For now, mark as loaded to avoid infinite loop
             setTimeout(() => {
                  if (url === AGORA_SDK_URL && window.AgoraRTC) AgoraRTC = window.AgoraRTC;
                  else if (url === EMOJI_PICKER_URL && window.EmojiPickerReact) EmojiPicker = window.EmojiPickerReact.default || window.EmojiPickerReact;
                  if ((url === AGORA_SDK_URL && AgoraRTC) || (url === EMOJI_PICKER_URL && EmojiPicker)) {
                       setLoaded(true);
                  } else {
                       console.error(`Library from ${url} still not found.`);
                        setError(true); // Mark error if still not found
                  }
             }, 1000); // Wait 1 sec
        }
        return; // Don't add another script tag
    }


    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      console.log(`${url} loaded successfully`);
      // Assign to global variable after loading
      if (url === AGORA_SDK_URL) AgoraRTC = window.AgoraRTC;
       else if (url === EMOJI_PICKER_URL) EmojiPicker = window.EmojiPickerReact.default || window.EmojiPickerReact; // Handle potential default export
      setLoaded(true);
    };

    script.onerror = () => {
      console.error(`Error loading script ${url}`);
      setError(true);
    };

    document.body.appendChild(script);

    return () => {
       // Only remove if this instance added it? Risky if multiple components use hook.
       // Better to leave it unless strict cleanup is needed.
       // document.body.removeChild(script);
    };
  }, [url]);

  return [loaded, error];
};


// --- Styled Components (Copied from provided files) ---

const FullScreenContainer = styled(Box)(() => ({
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "40px 0",
    minHeight: "calc(100vh - 64px)", // Adjust based on header height
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

// --- LiveStreamView Styled Components ---
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
    paddingBottom: '80px', // Space for controls
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
    bottom: 16 + 80, // Adjusted for controls height
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

// --- VideoGrid Styled Components ---
const VideoFeedContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    position: "relative",
    background: 'transparent', // Make background transparent
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    padding: theme.spacing(1),
    height: "100%", // Take full height of VideoSection
    [theme.breakpoints.up("sm")]: {
        padding: theme.spacing(2),
    },
}));

const VideoGrid = styled(Grid2)(({ theme }) => ({
    width: "100%",
    height: "100%",
    gap: theme.spacing(1),
    overflowY: 'auto', // Allow scrolling if many speakers
    justifyContent: 'center', // Center grid items
    alignContent: 'flex-start', // Align items to the top
    paddingBottom: '20px', // Add padding at bottom
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
    // Removed height: 100% and minHeight
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    aspectRatio: '1 / 1', // Make tiles square-ish
    width: '100%', // Take width from Grid2
    maxWidth: '250px', // Max width for larger screens
    minWidth: '120px', // Min width for smaller screens
    margin: 'auto', // Center tile within grid item
}));


const UserVideo = styled('div')({ // Changed to div
    width: "100%",
    height: "100%",
    position: 'absolute',
    top: 0,
    left: 0,
    '& video': { // Style video element inside
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }
});

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
      zIndex: 3, // Ensure it's above other elements
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


// --- LiveChat Styled Components ---
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
    "& .EmojiPickerReact": { // Use the actual class name
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

// --- NotificationAnimation Styled Components ---
// ... (Keep ANIMATION_TYPES and styled components for NotificationAnimation) ...
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


// --- Components Implementation (Copied and adapted) ---

// useAgoraTracks Hook
const useAgoraTracks = () => {
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [error, setError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const createTracks = useCallback(async () => {
        if (!AgoraRTC) {
             console.error("Agora SDK not loaded yet.");
             setError("Agora SDK failed to load. Please refresh.");
             return null; // Return null if SDK not ready
         }
        setIsInitializing(true);
        setError(null);
        try {
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            setLocalAudioTrack(audioTrack);
            setIsAudioMuted(false); // Initially unmuted when created
            console.log("Audio track created successfully.");
            return audioTrack; // Return the created track
        } catch (err) {
            console.error("Error creating Agora audio track:", err);
            setError("Could not access microphone. Please check permissions.");
            setLocalAudioTrack(null);
            return null; // Return null on error
        } finally {
            setIsInitializing(false);
        }
    }, []);

    const toggleAudio = useCallback(async () => {
        if (!localAudioTrack) {
             console.log("No local audio track to toggle.");
             return; // Do nothing if track doesn't exist
        }
        try {
            const muted = !isAudioMuted;
            await localAudioTrack.setMuted(muted);
            setIsAudioMuted(muted);
            console.log(`Audio track ${muted ? 'muted' : 'unmuted'}.`);
        } catch (err) {
             console.error("Error toggling audio mute state:", err);
             // Optionally set an error state
        }
    }, [localAudioTrack, isAudioMuted]);


     const closeTracks = useCallback(() => {
        if(localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
            setLocalAudioTrack(null);
            console.log("Local audio track closed.");
        }
    }, [localAudioTrack]);

    // Added useEffect for cleanup
     useEffect(() => {
         return () => {
             closeTracks();
         };
     }, [closeTracks]);

    return {
        localAudioTrack,
        isAudioMuted,
        error, isInitializing,
        createTracks, toggleAudio, closeTracks
    };
};


// VideoGrid Component
const VideoGridComponent = ({ speakers = [], localUid, localAudioTrack, onUserClick, remoteUsers = [] }) => {
    const theme = useTheme();
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Combine local user (if speaker) + remote speakers
    const localUserIsSpeaker = speakers.some(s => String(s.uid) === String(localUid));
    const allSpeakers = [
        ...(localUserIsSpeaker ? [{
            uid: localUid,
            name: 'You',
            isLocal: true,
            audioTrack: localAudioTrack,
            isMuted: localAudioTrack?.muted ?? true // Reflect actual mute state
        }] : []),
        ...speakers
            .filter(s => String(s.uid) !== String(localUid)) // Ensure comparison works (string vs number)
            .map(s => {
                const remoteUser = remoteUsers.find(ru => String(ru.uid) === String(s.uid));
                 // Determine mute status: prioritize DB state, fallback to track state (less reliable for remote)
                 const isMuted = s.isMuted ?? !(remoteUser?.audioTrack && remoteUser.audioTrack.isPlaying);
                return {
                     ...s,
                     uid: s.uid, // Ensure uid is consistent
                     audioTrack: remoteUser?.audioTrack,
                     isMuted: isMuted, // Use determined mute status
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
        // Add more complex logic if > 4 speakers needed in grid
        return { xs: 6, sm: 4 }; // Fallback for more
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
                     // Check if audio track exists and is potentially playing (remote only)
                     // For local, rely on isAudioMuted state from hook
                     const isSpeaking = user.isLocal ? !isAudioMuted : (user.audioTrack && user.audioTrack.isPlaying);


                    return (
                        <Grid2 key={user.uid || `local-${i}`} {...size}>
                            <VideoTile
                                isSpeaking={isSpeaking} // Use isSpeaking for border/glow
                                isActive={false}
                                // onClick={() => onUserClick(user.uid)}
                            >
                                {/* Only Avatar for Audio Spaces */}
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

                                {/* Mute Icon */}
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


// VideoControls Component
const VideoControls = ({
    isMuted,
    onToggleAudio,
    onLeave,
    isOwner,
    onStopSpace,
    onRaiseHand, // Func for audience to raise/lower hand
    isHandRaised, // State if hand is currently raised
    canSpeak // Is the current user allowed to speak (owner or promoted speaker)?
}) => {
    const theme = useTheme();
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ position: "absolute", bottom: 16, left: 0, right: 0, zIndex: 10 }}>
            {/* Mute/Unmute Button (Only for Speakers/Owner) */}
             {canSpeak && (
                <Tooltip title={isMuted ? "Unmute Microphone" : "Mute Microphone"} placement="top">
                    <IconButton
                        onClick={onToggleAudio}
                        sx={{
                            backgroundColor: isMuted ? alpha(theme.palette.error.main, 0.8) : alpha(theme.palette.grey[700], 0.8), // Grey when unmuted
                            color: theme.palette.common.white,
                            "&:hover": { backgroundColor: isMuted ? theme.palette.error.main : alpha(theme.palette.grey[600], 0.8) },
                            fontSize: isSmallMobile ? "small" : "medium",
                        }}
                    >
                         {/* Toggle icon based on mute state */}
                        {isMuted ? <MicOffIcon fontSize={isSmallMobile ? "small" : "medium"} /> : <AudioIcon fontSize={isSmallMobile ? "small" : "medium"} />}
                    </IconButton>
                </Tooltip>
            )}

             {/* Raise/Lower Hand Button (Only for Audience) */}
             {!canSpeak && (
                <Tooltip title={isHandRaised ? "Lower Hand" : "Raise Hand to Speak"} placement="top">
                    <IconButton
                        onClick={onRaiseHand} // This function should handle both raise/lower logic
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


            {/* Leave Button */}
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

             {/* End Space Button (Only for Owner) */}
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


// LiveChat Component
const LiveChat = ({ messages, onSendMessage, onDonate, onLike, onSubscribe, onFollow, onGift, onShare, chatOpen, onToggleChat, isCompact = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const emojiButtonRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [message, setMessage] = useState("");
    const [emojiAnchor, setEmojiAnchor] = useState(null);

    // Dynamic import for EmojiPicker
    const [emojiPickerLoaded, emojiPickerError] = useScript(EMOJI_PICKER_URL);


    const handleSendMessageInternal = () => {
        if (message.trim()) { onSendMessage(message); setMessage(""); }
    };
    const handleKeyPress = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessageInternal(); } };
    const handleEmojiClick = (emojiData) => { setMessage((prev) => prev + emojiData.emoji); setEmojiAnchor(null); };
    const handleEmojiButtonClick = (event) => { setEmojiAnchor(event.currentTarget); };
    const handleEmojiClose = () => { setEmojiAnchor(null); };
    const emojiOpen = Boolean(emojiAnchor);
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(scrollToBottom, [messages]);

    return (
        <ChatContainer isCompact={isCompact} sx={{ ...(isCompact && { maxHeight: "50vh", border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, boxShadow: theme.shadows[6] }) }}>
            {/* Header */}
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
             {/* Action Buttons */}
            <Box sx={{ p: theme.spacing(1), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, background: alpha(theme.palette.background.default, 0.6), backdropFilter: "blur(8px)" }}>
                <ActionButtonsContainer isCompact={isCompact}>
                    {/* Placeholder action buttons */}
                    <IconButton size="small" onClick={onLike} title="Send Like" sx={{ color: theme.palette.error.main, backgroundColor: alpha(theme.palette.error.main, 0.1), "&:hover": { backgroundColor: alpha(theme.palette.error.main, 0.2) } }}> <LikeIcon fontSize="small" /> </IconButton>
                    <IconButton size="small" onClick={onGift} title="Send Gift" sx={{ color: theme.palette.success.main, backgroundColor: alpha(theme.palette.success.main, 0.1), "&:hover": { backgroundColor: alpha(theme.palette.success.main, 0.2) } }}> <CardGiftcardIcon fontSize="small" /> </IconButton>
                    <IconButton size="small" onClick={onShare} title="Share" sx={{ color: theme.palette.text.secondary, backgroundColor: alpha(theme.palette.action.hover, 0.1), "&:hover": { backgroundColor: alpha(theme.palette.action.hover, 0.2), color: theme.palette.text.primary } }}> <ShareIcon fontSize="small" /> </IconButton>
                </ActionButtonsContainer>
            </Box>
            {/* Messages */}
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
             {/* Input */}
            <Box sx={{ p: theme.spacing(1.5), borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`, position: "relative", background: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(12px)" }}>
                <TextField fullWidth placeholder="Send a message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={handleKeyPress} size="small" multiline maxRows={3}
                    InputProps={{
                        startAdornment: (
                             <IconButton ref={emojiButtonRef} onClick={handleEmojiButtonClick} size="small" disabled={!emojiPickerLoaded} sx={{ mr: 1, color: theme.palette.text.secondary, "&:hover": { color: theme.palette.primary.main, backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}>
                                 <EmojiIcon />
                             </IconButton>
                         ),
                        endAdornment: (<IconButton onClick={handleSendMessageInternal} disabled={!message.trim()} size="small" sx={{ color: message.trim() ? theme.palette.primary.main : theme.palette.text.disabled, "&:hover:not(:disabled)": { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}><SendIcon /></IconButton>),
                        sx: { borderRadius: 2, backgroundColor: alpha(theme.palette.background.default, 0.7), "&:hover": { backgroundColor: alpha(theme.palette.background.default, 0.8) }, "&.Mui-focused": { backgroundColor: alpha(theme.palette.background.default, 0.9), boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}` }, fontSize: "0.9rem", padding: theme.spacing(0.5) }
                    }}
                />
                 <Popover open={emojiOpen && emojiPickerLoaded} anchorEl={emojiAnchor} onClose={handleEmojiClose} anchorOrigin={{ vertical: "top", horizontal: "right" }} transformOrigin={{ vertical: "bottom", horizontal: "right" }} sx={{ "& .MuiPopover-paper": { backgroundColor: "transparent", boxShadow: "none", overflow: "visible" } }}>
                     <EmojiPickerContainer>
                          {/* Render EmojiPicker only when loaded */}
                          {EmojiPicker && <EmojiPicker onEmojiClick={handleEmojiClick} autoFocusSearch={false} theme={theme.palette.mode} />}
                     </EmojiPickerContainer>
                 </Popover>
                  {!emojiPickerLoaded && emojiOpen && <Typography variant="caption">Loading emojis...</Typography>}
             </Box>
        </ChatContainer>
    );
};

// NotificationAnimation Component
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

// --- Main Components ---

// GoLiveView Component (Dashboard)
const GoLiveView = () => {
    const theme = useTheme();
    const [openModal, setOpenModal] = useState(null);
    const controls = useAnimation();
    const navigate = useNavigate();
    const [liveSpaces, setLiveSpaces] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [spaceTitle, setSpaceTitle] = useState("");

    useEffect(() => {
        const fetchLiveSpaces = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`${BACKEND_URL}/space/live`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setLiveSpaces(data.spaces || []); // Ensure data.spaces exists
            } catch (e) {
                console.error("Failed to fetch live spaces:", e);
                setError("Could not load live spaces.");
                setLiveSpaces([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLiveSpaces();
    }, []);

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
        console.log(`Starting space with title: ${spaceTitle}`);
        try {
            const response = await fetch(`${BACKEND_URL}/space/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' /* TODO: Add Auth */ },
                body: JSON.stringify({ title: spaceTitle, ownerName: "Host" /* TODO: Dynamic Name */ })
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `HTTP error! status: ${response.status}`); }
            const data = await response.json();
            handleClose();
            navigate(`/live/space/${data.channelName}`, { state: { spaceDetails: data } });
        } catch (err) {
            console.error("Failed to start space:", err);
            alert(`Error starting space: ${err.message}`);
        }
    };

    const handleWatchStream = (channelName) => {
        console.log("Watching stream:", channelName);
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

// LiveStreamView Component (Actual Space)
const LiveStreamView = () => {
    const { channelName } = useParams();
    const navigate = useNavigate();
     const location = useLocation(); // Use location hook
     const theme = useTheme();

     // Agora Client Ref
     const agoraClientRef = useRef(AgoraRTC.createClient({ mode: "live", codec: "opus" })); // Use opus for audio

    // State
     const [spaceDetails, setSpaceDetails] = useState(location.state?.spaceDetails?.space || null);
     const [agoraToken, setAgoraToken] = useState(location.state?.spaceDetails?.token || null);
     // Agora UID must be number or numeric string for token generation, number for SDK join
     const [agoraUid, setAgoraUid] = useState(() => {
          const initialUid = location.state?.spaceDetails?.ownerUid || location.state?.spaceDetails?.uid;
          // Ensure it's a number if it exists
          return initialUid ? Number(initialUid) : null;
      });
     const [isOwner, setIsOwner] = useState(() => {
         // Check if ownerAgoraUid from passed state matches the initial agoraUid
         const initialOwnerAgoraUid = location.state?.spaceDetails?.space?.ownerAgoraUid;
         const initialUid = location.state?.spaceDetails?.ownerUid || location.state?.spaceDetails?.uid;
         return !!initialOwnerAgoraUid && String(initialOwnerAgoraUid) === String(initialUid);
     });
     const [role, setRole] = useState(isOwner ? 'publisher' : 'audience');
     const [isConnected, setIsConnected] = useState(false);
     const [remoteUsers, setRemoteUsers] = useState([]);
     const [speakers, setSpeakers] = useState(location.state?.spaceDetails?.space?.speakers || []);
     const [raisedHands, setRaisedHands] = useState(location.state?.spaceDetails?.space?.raisedHands || []);
     const [isHandRaisedState, setIsHandRaisedState] = useState(false);
     const [isInitializing, setIsInitializing] = useState(true); // Combined initializing state
     const [error, setError] = useState(null);

    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Agora Tracks Hook
    const { localAudioTrack, isAudioMuted, error: trackError, isInitializing: trackInitializingHook, createTracks, toggleAudio, closeTracks } = useAgoraTracks();

     // --- Agora Event Handlers ---
     const handleUserPublished = useCallback(async (user, mediaType) => {
         console.log(`[Agora] User published: ${user.uid}, Type: ${mediaType}`);
          try {
             await agoraClientRef.current.subscribe(user, mediaType);
             if (mediaType === "audio") {
                 setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, audioTrack: user.audioTrack } : u));
                 user.audioTrack?.play(); // Play the received audio track
                 console.log(`[Agora] Subscribed and playing audio from: ${user.uid}`);
             }
         } catch (err) {
              console.error(`[Agora] Failed to subscribe to user ${user.uid}:`, err);
         }
     }, []);

     const handleUserUnpublished = useCallback((user, mediaType) => {
         console.log(`[Agora] User unpublished: ${user.uid}, Type: ${mediaType}`);
         if (mediaType === "audio") {
             setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, audioTrack: null } : u));
         }
     }, []);

      const handleUserJoined = useCallback((user) => {
          console.log(`[Agora] User joined channel: ${user.uid}`);
          setRemoteUsers(prev => {
               // Avoid duplicates
               if (prev.some(u => u.uid === user.uid)) return prev;
               return [...prev, { uid: user.uid, audioTrack: null, videoTrack: null }];
           });
      }, []);

      const handleUserLeft = useCallback((user, reason) => {
          console.log(`[Agora] User left channel: ${user.uid}, Reason: ${reason}`);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
           // Remove from speakers list if they were a speaker (handled by socket update ideally)
           // setSpeakers(prev => prev.filter(s => s.uid !== user.uid));
      }, []);

     // --- Socket.io Event Handlers ---
     const handleRoomStateUpdate = useCallback((updatedSpaceData) => {
         console.log("[Socket] Received roomStateUpdate:", updatedSpaceData);
         if (updatedSpaceData?.channelName === channelName) { // Ensure update is for this room
             setSpaceDetails(updatedSpaceData);
             setSpeakers(updatedSpaceData.speakers || []);
             setRaisedHands(updatedSpaceData.raisedHands || []);
             const meRaisedHand = updatedSpaceData.raisedHands?.some(u => String(u.uid) === String(agoraUid));
             setIsHandRaisedState(!!meRaisedHand);

              // Update isOwner status if needed (e.g., if owner leaves/rejoins?)
               if (agoraUid && updatedSpaceData.ownerAgoraUid) {
                   setIsOwner(String(agoraUid) === String(updatedSpaceData.ownerAgoraUid));
               }
         }
     }, [agoraUid, channelName]); // Add dependencies

     // ... (Keep handleHandAccepted, handleYouWereRemoved, handleSpaceEnded from previous version) ...
     const handleHandAccepted = useCallback(async ({ channelName: acceptedChannel }) => {
            if (acceptedChannel === channelName && role === 'audience') {
               console.log("[Socket] Your request to speak was accepted!");
               try {
                    const response = await fetch(`${BACKEND_URL}/token/join`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' /* TODO: Add Auth */ },
                        body: JSON.stringify({ channelName, uid: agoraUid, role: 'publisher' }) // Use current agoraUid
                    });
                    if (!response.ok) throw new Error('Failed to get publisher token');
                    const data = await response.json();

                    // Leave, create track, rejoin as publisher
                     setIsInitializing(true); // Show loading
                     await agoraClientRef.current.leave();
                     const newAudioTrack = await createTracks(); // Create new audio track

                    if (newAudioTrack) {
                         setAgoraToken(data.token);
                         setRole('publisher');
                         await agoraClientRef.current.join(AGORA_APP_ID, channelName, data.token, agoraUid); // Join with same UID
                         await agoraClientRef.current.publish([newAudioTrack]); // Publish the new track
                         setIsConnected(true);
                          setIsHandRaisedState(false);
                         console.log("Successfully rejoined as speaker and published audio.");
                    } else {
                         console.error("Failed to create local audio track after hand accepted.");
                         setRole('audience'); // Revert role
                          // Try rejoining as audience again?
                          // await agoraClientRef.current.join(AGORA_APP_ID, channelName, agoraToken, agoraUid); // Use old token? Or get new one?
                    }
               } catch (err) {
                    console.error("Error rejoining as speaker:", err);
                    setError(`Failed to become speaker: ${err.message}`);
               } finally {
                    setIsInitializing(false);
               }
           }
       }, [channelName, role, agoraUid, createTracks]); // Added dependencies

        const handleYouWereRemoved = useCallback(async ({ channelName: removedChannel }) => {
             if (removedChannel === channelName && role === 'publisher' && !isOwner) {
                 console.log("[Socket] You were removed as a speaker.");
                 try {
                      setIsInitializing(true);
                      // Unpublish and close track first
                      if (localAudioTrack) {
                          await agoraClientRef.current.unpublish([localAudioTrack]);
                      }
                      closeTracks();

                      // Get new audience token
                      const response = await fetch(`${BACKEND_URL}/token/join`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' /* TODO: Add Auth */ },
                          body: JSON.stringify({ channelName, uid: agoraUid, role: 'audience' }) // Use current agoraUid
                      });
                      if (!response.ok) throw new Error('Failed to get audience token');
                      const data = await response.json();

                      // Leave and rejoin as audience
                      await agoraClientRef.current.leave();
                       setAgoraToken(data.token);
                       setRole('audience');
                       await agoraClientRef.current.join(AGORA_APP_ID, channelName, data.token, agoraUid); // Rejoin with same UID
                       setIsConnected(true);
                       console.log("Successfully rejoined as audience after being removed.");

                 } catch (err) {
                      console.error("Error rejoining as audience:", err);
                      setError(`Error returning to audience: ${err.message}`);
                      // Consider navigating away if rejoin fails
                 } finally {
                      setIsInitializing(false);
                 }
             }
        }, [channelName, role, agoraUid, isOwner, localAudioTrack, closeTracks]); // Added dependencies

         const handleSpaceEnded = useCallback(({ channelName: endedChannel }) => {
             if (endedChannel === channelName) {
                 console.log("[Socket] The space has ended.");
                  alert("The space has ended."); // Simple alert for now
                  handleLeave(); // Trigger leave logic
             }
         }, [channelName]); // Added dependency


    // --- Effects ---
    useEffect(() => {
         const agoraLoaded = !!AgoraRTC; // Check if loaded
         if (!agoraLoaded) {
             console.warn("Agora SDK not loaded yet in LiveStreamView");
             setIsInitializing(true); // Keep showing loading
             return; // Wait for SDK
         } else {
             agoraClientRef.current = AgoraRTC.createClient({ mode: "live", codec: "opus" }); // Re-init ref once loaded
              console.log("Agora SDK is loaded, proceeding with setup.");
         }


        // Fetch initial space details if not passed via state
        const fetchDetails = async () => {
             // Fetch only if needed (e.g., joining directly via URL)
            if (!spaceDetails && channelName) {
                console.log("Fetching initial space details...");
                setIsInitializing(true); // Ensure loading state is active
                setError(null);
                try {
                    const response = await fetch(`${BACKEND_URL}/space/details/${channelName}`);
                     if (response.status === 404) throw new Error("Space not found or has ended.");
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const data = await response.json();
                    setSpaceDetails(data.space);
                     setSpeakers(data.space.speakers || []);
                     setRaisedHands(data.space.raisedHands || []);
                      // Set isOwner based on fetched data - requires knowing logged-in user's DB ID
                      // For now, we rely on the initial state or assume audience if joined directly
                     console.log("Fetched space details:", data.space);
                } catch (e) {
                    console.error("Failed to fetch space details:", e);
                     setError(`Could not load space details: ${e.message}`);
                     // Don't navigate immediately, let the error state render
                } finally {
                     // Defer setting initializing false until join attempt
                }
            } else {
                 // Already have details from state
                 setIsInitializing(false); // Can proceed if we have initial details
            }
        };

         fetchDetails();

        // Setup Agora Event Listeners
         const client = agoraClientRef.current;
        client.on("user-published", handleUserPublished);
        client.on("user-unpublished", handleUserUnpublished);
        client.on("user-joined", handleUserJoined);
        client.on("user-left", handleUserLeft);
         // Add more listeners as needed (e.g., connection-state-change)

         // Setup Socket.io Listeners
         socket.connect(); // Connect socket when component mounts
         socket.on('connect', () => console.log('[Socket] Connected to server'));
         socket.on('disconnect', () => console.log('[Socket] Disconnected from server'));
         socket.on('roomStateUpdate', handleRoomStateUpdate);
         socket.on('handAccepted', handleHandAccepted);
         socket.on('youWereRemoved', handleYouWereRemoved);
         socket.on('spaceEnded', handleSpaceEnded);


        // Join Agora channel (logic moved inside useEffect)
        const joinChannel = async () => {
             if (!AgoraRTC) return; // Don't run if SDK not loaded
             if (isConnected) return; // Don't rejoin if already connected
             if (!channelName) { setError("Channel name missing."); setIsInitializing(false); return; }

             let currentToken = agoraToken;
             let currentUid = agoraUid;
             let currentRole = role;

             // If joining directly (no token/uid from state), fetch audience token first
             if (!currentToken && !isOwner) {
                 console.log("Audience joining, fetching token...");
                 setIsInitializing(true);
                 try {
                     const response = await fetch(`${BACKEND_URL}/token/join`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' /* TODO: Add Auth */ },
                         body: JSON.stringify({
                             channelName,
                             // TODO: Replace with actual username from auth state
                             userName: `User_${Math.floor(Math.random() * 1000)}`,
                             role: 'audience'
                         })
                     });
                     if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Failed to get join token'); }
                     const data = await response.json();
                     currentToken = data.token;
                     currentUid = Number(data.uid); // Ensure UID is number for Agora join
                     setAgoraToken(currentToken); // Update state for potential future use
                     setAgoraUid(currentUid);     // Update state
                     setRole('audience'); // Explicitly set role
                     currentRole = 'audience';
                     console.log("Audience token fetched:", { token: currentToken, uid: currentUid });
                 } catch (err) {
                     console.error("Failed to fetch audience token:", err);
                     setError(`Could not get token: ${err.message}`);
                     setIsInitializing(false);
                     return; // Stop execution if token fetch fails
                 }
             }

             // Proceed to join if we have channel, token, and UID
             if (channelName && currentToken && currentUid) {
                 console.log(`Attempting to join channel ${channelName} as ${currentRole} with UID ${currentUid}`);
                 setIsInitializing(true);
                 setError(null);
                 try {
                      let tracksToPublish = [];
                      if (currentRole === 'publisher') {
                           const newAudioTrack = await createTracks(); // Create audio track
                           if (newAudioTrack) {
                               tracksToPublish.push(newAudioTrack);
                           } else {
                                throw new Error("Failed to create audio track for publisher.");
                           }
                      }

                      // Set role before joining for 'live' mode
                       await client.setClientRole(currentRole);
                       console.log(`[Agora] Client role set to ${currentRole}`);

                     await client.join(AGORA_APP_ID, channelName, currentToken, currentUid); // Use number UID
                     setIsConnected(true);
                     console.log(`[Agora] Joined channel ${channelName} successfully.`);

                     if (tracksToPublish.length > 0) {
                         await client.publish(tracksToPublish);
                         console.log("[Agora] Published local audio track.");
                     }

                     // Register user with socket after successful join
                     socket.emit('registerUser', { uid: currentUid, channelName });
                     console.log(`[Socket] Emitted registerUser for UID ${currentUid}`);

                 } catch (err) {
                     console.error("[Agora] Failed to join or publish:", err);
                     setError(`Connection failed: ${err.message}`);
                     setIsConnected(false);
                     closeTracks(); // Clean up tracks on join failure
                 } finally {
                     setIsInitializing(false);
                 }
             } else {
                 console.warn("Join prerequisites not met:", { channelName, currentToken, currentUid });
                 // If token/uid were expected but missing (e.g., owner flow error)
                 if (!error && isOwner && (!currentToken || !currentUid)) {
                     setError("Failed to initialize owner session.");
                 }
                 setIsInitializing(false); // Ensure loading stops if prerequisites fail
             }
        };

         joinChannel();


        // Cleanup function
        return () => {
            console.log("LiveStreamView unmounting: Leaving space and cleaning up...");
            const uidToLeave = agoraUid; // Capture current UID for socket event
             const channelToLeave = channelName; // Capture current channel

             client.leave().then(() => console.log("[Agora] Left channel.")).catch(e => console.error("Error leaving Agora channel:", e));
            closeTracks();
            setIsConnected(false);
            setRemoteUsers([]);
            setSpeakers([]);
            setRaisedHands([]);

            client.removeAllListeners(); // Remove all Agora listeners
            console.log("[Agora] Listeners removed.");

             // Emit leave event and remove socket listeners
             if (socket.connected && uidToLeave && channelToLeave) {
                 socket.emit('leaveRoom', { uid: uidToLeave, channelName: channelToLeave });
                 console.log(`[Socket] Emitted leaveRoom for UID ${uidToLeave}`);
             }
             socket.off('connect');
             socket.off('disconnect');
             socket.off('roomStateUpdate', handleRoomStateUpdate);
             socket.off('handAccepted', handleHandAccepted);
             socket.off('youWereRemoved', handleYouWereRemoved);
             socket.off('spaceEnded', handleSpaceEnded);
             // Optionally disconnect socket if it's specific to this view
             // socket.disconnect();
            console.log("Cleanup complete.");
        };
    }, [channelName, agoraToken, agoraUid, role, isOwner, state, handleUserPublished, handleUserUnpublished, handleUserJoined, handleUserLeft, handleRoomStateUpdate, handleHandAccepted, handleYouWereRemoved, handleSpaceEnded, createTracks, closeTracks, navigate]); // Added hook functions and navigate


    // --- Event Handlers ---
    const handleLeave = useCallback(async () => {
        console.log("Leave button clicked");
        await agoraClientRef.current.leave();
        closeTracks();
        setIsConnected(false);
        socket.emit('leaveRoom', { uid: agoraUid, channelName });
        navigate('/live'); // Navigate back to dashboard
    }, [agoraUid, channelName, closeTracks, navigate]);

    const handleStopSpace = useCallback(async () => {
         if (!isOwner) return;
         console.log("Stop space button clicked");
          try {
              const response = await fetch(`${BACKEND_URL}/space/stop`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' /* TODO: Add Auth */ },
                  body: JSON.stringify({ channelName })
              });
              if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Failed to stop space'); }
              // Backend emits 'spaceEnded', which triggers handleLeave via handleSpaceEnded
          } catch (err) {
               console.error("Error stopping space:", err);
               alert(`Error stopping space: ${err.message}`);
          }
    }, [isOwner, channelName]);

     const handleRaiseHandToggle = useCallback(async () => {
         if (role !== 'audience' || !agoraUid) return;
         const endpoint = isHandRaisedState ? '/space/lower-hand' : '/space/raise-hand';
         // Find user's name (ideally from auth state, fallback needed)
          const myName = spaceDetails?.speakers?.find(s => String(s.uid) === String(agoraUid))?.name || `User_${agoraUid}`; // Placeholder logic
         const body = isHandRaisedState
             ? { channelName, userUid: agoraUid }
             : { channelName, userUid: agoraUid, userName: myName };

          console.log(`Calling ${endpoint} with body:`, body);
          try {
              const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' /* TODO: Add Auth */ },
                  body: JSON.stringify(body)
              });
              if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Failed to ${isHandRaisedState ? 'lower' : 'raise'} hand`); }
              const data = await response.json();
              console.log(`${isHandRaisedState ? 'Lower' : 'Raise'} hand successful:`, data);
              // State update happens via Socket 'roomStateUpdate'
          } catch (err) {
               console.error(`Error ${isHandRaisedState ? 'lowering' : 'raising'} hand:`, err);
               alert(`Error: ${err.message}`);
          }
     }, [role, agoraUid, isHandRaisedState, channelName, spaceDetails]);


    // --- Placeholder handlers for chat ---
    const handleSendMessage = (msg) => { console.log("Send msg:", msg); /* TODO: Implement via Socket.io */ };
    const handleDonate = () => console.log("Donate clicked");
    const handleLike = () => console.log("Like clicked");
    const handleSubscribe = () => console.log("Sub clicked");
    const handleFollow = () => console.log("Follow clicked");
    const handleGift = () => console.log("Gift clicked");
    const handleShare = () => console.log("Share clicked");
    const toggleChat = () => setChatOpen(!chatOpen);
    const addNotification = (n) => setNotifications((p) => [...p.slice(-5), { ...n, id: Date.now() }]); // Keep last 5

     // Determine if current user can speak
     const canSpeak = role === 'publisher';

     // Show loading or error states
     if (isInitializing || (!isConnected && !error && AgoraRTC)) { // Check AgoraRTC loaded too
         return (
             <LiveContainer sx={{ justifyContent: 'center', alignItems: 'center' }}>
                 <CircularProgress sx={{ mb: 2 }} />
                 <Typography variant="h6">Connecting to {spaceDetails?.title || 'space'}...</Typography>
                 {!AgoraRTC && <Typography variant="caption" color="text.secondary" sx={{mt: 1}}>Loading audio library...</Typography>}
                 {trackInitializingHook && <Typography variant="caption" color="text.secondary" sx={{mt: 1}}>Accessing microphone...</Typography>}
             </LiveContainer>
         );
     }
      if (error) {
           return (
               <LiveContainer sx={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                   <Typography variant="h5" color="error">Connection Error</Typography>
                   <Typography sx={{ mt: 1 }}>{error}</Typography>
                   <Button variant="contained" onClick={() => navigate('/live')} sx={{ mt: 2 }}>Back to Dashboard</Button>
               </LiveContainer>
           );
       }
        // Handle case where SDK failed to load
        if (!AgoraRTC) {
             return (
                 <LiveContainer sx={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                     <Typography variant="h5" color="error">Error Loading Library</Typography>
                     <Typography sx={{ mt: 1 }}>Could not load the required audio library. Please check your connection and refresh.</Typography>
                     <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>Refresh</Button>
                 </LiveContainer>
             );
         }


    return (
        <LiveContainer>
            <VideoSection>
                <VideoGridComponent
                    speakers={speakers}
                    localUid={agoraUid} // Pass local Agora UID
                    localAudioTrack={localAudioTrack} // Pass local audio track
                    remoteUsers={remoteUsers} // Pass remote users with tracks
                    onUserClick={() => {}} // Placeholder
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
                {/* Chat Toggle Button */}
                <ChatToggleButton onClick={toggleChat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    💬 {chatOpen ? "Hide Chat" : "Show Chat"}
                </ChatToggleButton>
                 {/* Chat Section */}
                 <AnimatePresence>
                     {chatOpen && (
                         <ChatSection initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
                             <LiveChat
                                 messages={messages} // Pass actual messages
                                 onSendMessage={handleSendMessage}
                                 onDonate={handleDonate} onLike={handleLike} onSubscribe={handleSubscribe} onFollow={handleFollow} onGift={handleGift} onShare={handleShare}
                                 chatOpen={chatOpen}
                                 onToggleChat={toggleChat}
                                 isCompact={true} // Always compact in this layout
                             />
                         </ChatSection>
                     )}
                 </AnimatePresence>
            </VideoSection>
            {/* Notifications */}
            {/* Position notifications */}
             <Box sx={{ position: 'absolute', top: 80, left: 20, right: 20, zIndex: 1000, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 {notifications.map((n) => <NotificationAnimation key={n.id} notification={n} />)}
             </Box>
        </LiveContainer>
    );
};


// --- App Structure ---
const App = () => {
     // Basic theme setup (can be customized)
     const theme = useTheme();

      // Load Agora SDK globally here
      const [agoraLoaded, agoraError] = useScript(AGORA_SDK_URL);
      // Load Emoji Picker too if used globally (LiveChat uses it)
       const [emojiPickerLoaded, emojiPickerError] = useScript(EMOJI_PICKER_URL);

     if (!agoraLoaded && !agoraError) {
         return <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><CircularProgress /><Typography sx={{ml: 2}}>Loading Audio Library...</Typography></Box>; // Show loading indicator
     }
      if (agoraError) {
           return <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column'}}><Typography color="error">Failed to load essential audio library.</Typography><Button onClick={()=>window.location.reload()}>Refresh</Button></Box>; // Show error
      }

     return (
         <Router>
              {/* Basic Navbar Placeholder */}
              <Box sx={{ p: 2, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)', borderBottom: `1px solid ${theme.palette.divider}` }}>
                   <Link to="/live" style={{ textDecoration: 'none' }}>
                        <Typography variant="h6" color="primary" fontWeight="bold">Live Spaces</Typography>
                   </Link>
              </Box>

             <Routes>
                 <Route path="/live" element={<GoLiveView />} />
                 <Route path="/live/space/:channelName" element={<LiveStreamView />} />
                  <Route path="*" element={<GoLiveView />} /> {/* Default route */}
             </Routes>
         </Router>
     );
 };

export default App;

