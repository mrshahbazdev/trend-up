import React, { useState, useEffect } from "react";
import {
    Box, Button, Typography, Modal, styled, useTheme, Fade, Zoom, Slide, IconButton, alpha, Card, CardContent, Avatar, Chip, Grid2, TextField, CircularProgress
} from "@mui/material";
import { Mic as AudioIcon, Close as CloseIcon, PlayArrow as WatchIcon } from "@mui/icons-material";
import { motion, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';

const BACKEND_URL = 'http://localhost:3001/api/v1/live';

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
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
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