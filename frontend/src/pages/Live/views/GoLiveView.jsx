/**
 * src/pages/live/views/GoLiveView.jsx
 *
 * This is the view for the "Go Live" dashboard, showing
 * options to start a stream and a list of current live spaces.
 */
import React, { useState, useEffect } from "react";
import {
    Box, Button, Typography, styled, useTheme, Fade, Zoom, Slide, IconButton, alpha, CardContent, Avatar, Chip, TextField, CircularProgress, Alert, Grid2
} from "@mui/material";
//import Grid2 from "@mui/material/Grid2";
import {
    Mic as AudioIcon, Close as CloseIcon, Visibility as ViewersIcon, PlayArrow as WatchIcon
} from "@mui/icons-material";
import { motion, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { BACKEND_URL } from "../constants";
import {
    FullScreenContainer,
    GlowButtonContainer,
    GlowButton,
    InstructionModal,
    ModalContent,
    StepItem,
    LiveStreamCard
} from "../styled/GoLiveStyles";

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
    // Consolidate token access from Redux state
    const authToken = useSelector((state) =>
        state.auth?.token ||
        state.user?.token ||
        state.user?.accessToken ||
        state.auth?.accessToken
    );

    // Fetch live spaces on component mount
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
                console.error("Failed to fetch live spaces:", e);
                setError("Could not load live spaces. Please try again.");
                setLiveSpaces([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLiveSpaces();
    }, [authToken]);

    // Define stream options
    const options = [
        { id: "audio", title: "Audio Live", icon: <AudioIcon sx={{ fontSize: 30 }} />, color: "#4A00E0", steps: ["Enable your microphone", "Set your stream topic", "Invite guests or go solo", "Engage with listeners through chat"] },
    ];

    // Background glow animation
    useEffect(() => {
        controls.start({ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8], transition: { duration: 8, ease: "easeInOut" } });
    }, [controls]);

    const handleOpen = (optionId) => setOpenModal(optionId);
    const handleClose = () => { setOpenModal(null); setSpaceTitle(""); };

    // Handle starting a new live space
    const handleGoLive = async () => {
        if (!spaceTitle.trim()) {
            alert("Please enter a title for your space.");
            return;
        }

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
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})); // Try to parse error
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            handleClose();
            // Navigate to the new space, passing details in state
            navigate(`/live/space/${data.channelName}`, { state: { spaceDetails: data } });
        } catch (err) {
            console.error("Error starting space:", err);
            alert(`Error starting space: ${err.message}`);
        }
    };

    // Handle joining an existing stream
    const handleWatchStream = (channelName) => {
        navigate(`/live/space/${channelName}`);
    };

    return (
        <FullScreenContainer>
            <Typography variant="h2" sx={{ mb: 4, fontWeight: 800, background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", zIndex: 1, fontSize: { xs: "2.5rem", md: "3.5rem" } }}>
                Go Live Now
            </Typography>

            {/* "Go Live" Button */}
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

            {/* List of Current Live Spaces */}
            <Box sx={{ width: "100%", maxWidth: 1200, zIndex: 1, px: 2 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, textAlign: "center", color: theme.palette.text.primary }}> 🔥 Currently Live Spaces </Typography>
                
                {isLoading && <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ maxWidth: 600, mx: 'auto' }}>{error}</Alert>}
                
                {!isLoading && !error && liveSpaces.length === 0 && (
                    <Typography textAlign="center" color="text.secondary">No live spaces right now. Start one!</Typography>
                )}

                <Grid2 container spacing={3} justifyContent="center">
                    {liveSpaces.map((space) => {
                        // 🛑 CALCULATE TOTAL USERS
                        const totalUsers = (space.speakers?.length || 0) + (space.listenerCount || 0);

                        return (
                            <Grid2 key={space._id || space.channelName} xs={12} sm={6} md={4} lg={3}>
                                <LiveStreamCard onClick={() => handleWatchStream(space.channelName)}>
                                    <Box sx={{ position: "relative", height: 180, background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                        <Avatar sx={{ width: 60, height: 60, bgcolor: theme.palette.primary.light }}>{space.ownerName ? space.ownerName[0].toUpperCase() : '?'}</Avatar>
                                        
                                        <Chip 
                                            label="LIVE" 
                                            color="error" 
                                            size="small" 
                                            sx={{ position: 'absolute', top: 12, left: 12, zIndex: 3 }} 
                                            icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white', animation: 'pulse 1.5s infinite ease-in-out' }} />} 
                                        />
                                        
                                        {/* 🛑 UPDATED: Show total user count */}
                                        <Chip 
                                            label={`${totalUsers}`} 
                                            icon={<ViewersIcon sx={{ fontSize: '1rem', color: 'white' }} />} 
                                            size="small" 
                                            sx={{ 
                                                position: 'absolute', 
                                                top: 12, 
                                                right: 12, 
                                                zIndex: 3, 
                                                color: 'white', 
                                                backgroundColor: alpha(theme.palette.grey[900], 0.7), 
                                                backdropFilter: 'blur(4px)' 
                                            }} 
                                        />

                                        <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
                                    </Box>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{space.title}</Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
                                            <Avatar sx={{ width: 24, height: 24, fontSize: "0.8rem", bgcolor: theme.palette.primary.main }}>{space.ownerName ? space.ownerName[0].toUpperCase() : '?'}</Avatar>
                                            <Typography variant="body2" color="text.secondary" noWrap>{space.ownerName}</Typography>
                                        </Box>
                                        <Button fullWidth variant="contained" startIcon={<WatchIcon />} sx={{ background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`, "&:hover": { transform: "translateY(-1px)", boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}` } }}> Listen Now </Button>
                                    </CardContent>
                                </LiveStreamCard>
                            </Grid2>
                        )
                    })}
                </Grid2>
            </Box>

            {/* Modal for Starting Stream */}
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

