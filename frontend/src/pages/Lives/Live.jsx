import { useState, useEffect } from "react";
import {
    Box,
    Button,
    Typography,
    Modal,
    styled,
    useTheme,
    Fade,
    Zoom,
    Slide,
    IconButton,
    alpha,
    Card,
    CardContent,
    Avatar,
    Chip,
    Stack,
    Grid2,
} from "@mui/material";
import {
    LiveTv as VideoIcon,
    Mic as AudioIcon,
    Podcasts as PodcastIcon,
    Close as CloseIcon,
    Visibility as ViewersIcon,
    PlayArrow as WatchIcon,
    PlayArrow as PlayArrowIcon,
    
} from "@mui/icons-material";
import { motion, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Styled components
const FullScreenContainer = styled(Box)(() => ({
    // height: "calc(100vh - 120px)",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "20px 0",
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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

const GoLiveView = () => {
    const theme = useTheme();
    const [openModal, setOpenModal] = useState(null);
    const controls = useAnimation();
    const navigate = useNavigate();

    // Sample live streams data
    const [liveStreams, setLiveStreams] = useState([
        {
            id: 1,
            title: "Tech Talk Live",
            host: "Sarah Johnson",
            viewers: 1247,
            category: "Technology",
            isLive: true,
            thumbnail: "/tech-stream.jpg",
        },
        {
            id: 2,
            title: "Music Production Session",
            host: "Mike Chen",
            viewers: 892,
            category: "Music",
            isLive: true,
            thumbnail: "/music-stream.jpg",
        },
        {
            id: 3,
            title: "Gaming Marathon",
            host: "Alex Rodriguez",
            viewers: 2156,
            category: "Gaming",
            isLive: true,
            thumbnail: "/gaming-stream.jpg",
        },
        {
            id: 4,
            title: "Cooking Show Live",
            host: "Emma Wilson",
            viewers: 567,
            category: "Food",
            isLive: true,
            thumbnail: "/cooking-stream.jpg",
        },
    ]);

    const options = [
        {
            id: "video",
            title: "Video Live",
            icon: <VideoIcon sx={{ fontSize: 30 }} />,
            color: "#FF416C",
            steps: [
                "Enable your camera and microphone",
                "Set your stream title and privacy",
                "Invite guests or go solo",
                "Interact with your audience in real-time",
            ],
        },
        {
            id: "audio",
            title: "Audio Live",
            icon: <AudioIcon sx={{ fontSize: 30 }} />,
            color: "#4A00E0",
            steps: [
                "Enable your microphone",
                "Choose your audio quality",
                "Set your stream topic",
                "Engage with listeners through chat",
            ],
        },
        {
            id: "podcast",
            title: "Start Podcast",
            icon: <PodcastIcon sx={{ fontSize: 30 }} />,
            color: "#00B09B",
            steps: [
                "Schedule your podcast session",
                "Invite co-hosts if needed",
                "Prepare your episode notes",
                "Record and publish to your channel",
            ],
        },
    ];

    useEffect(() => {
        // One-time background animation
        controls.start({
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
            transition: { duration: 8, ease: "easeInOut" },
        });

        // Simulate viewer count changes
        const interval = setInterval(() => {
            setLiveStreams((prev) =>
                prev.map((stream) => ({
                    ...stream,
                    viewers: stream.viewers + Math.floor(Math.random() * 20) - 10,
                }))
            );
        }, 10000);

        return () => clearInterval(interval);
    }, [controls]);

    const handleOpen = (optionId) => {
        setOpenModal(optionId);
    };

    const handleClose = () => {
        setOpenModal(null);
    };

    const handleGoLive = () => {
        navigate("/live/stream");
    };

    const handleWatchStream = (streamId) => {
        navigate(`/live/stream`);
    };

    return (
        <FullScreenContainer>
            {/* Animated background elements */}
            <motion.div
                animate={controls}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                        theme.palette.mode === "dark"
                            ? `radial-gradient(circle at 70% 20%, ${alpha(
                                  theme.palette.primary.main,
                                  0.15
                              )} 0%, transparent 70%)`
                            : `radial-gradient(circle at 30% 80%, ${alpha(
                                  theme.palette.primary.light,
                                  0.1
                              )} 0%, transparent 70%)`,
                    zIndex: 0,
                }}
            />

            {/* Floating particles */}
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * 100 - 50,
                        y: Math.random() * 100 - 50,
                        opacity: 0,
                    }}
                    animate={{
                        x: [0, Math.random() * 200 - 100],
                        y: [0, Math.random() * 200 - 100],
                        opacity: [0, 0.3, 0],
                    }}
                    transition={{
                        duration: 10 + i * 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                    }}
                    style={{
                        position: "absolute",
                        width: 10 + i * 5,
                        height: 10 + i * 5,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.4)}, transparent)`,
                        zIndex: 0,
                    }}
                />
            ))}

            <Typography
                variant="h2"
                sx={{
                    mb: 4,
                    fontWeight: 800,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    zIndex: 1,
                    fontSize: { xs: "2.5rem", md: "3.5rem" },
                }}
            >
                Go Live Now
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    zIndex: 1,
                    gap: 4,
                    mb: 6,
                }}
            >
                {options.map((option) => (
                    <GlowButtonContainer key={option.id}>
                        <motion.div
                            initial={{ opacity: 0.4, scale: 1 }}
                            animate={{
                                opacity: [0.3, 0.75, 0.3],
                                scale: [1, 1.15, 1],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 2.5,
                                ease: "easeInOut",
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: "50px",
                                padding: "3px",
                                background: `linear-gradient(45deg, ${option.color}, ${alpha(option.color, 0.5)})`,
                                filter: "blur(12px)",
                                zIndex: 0,
                            }}
                        />

                        <GlowButton
                            color={option.color}
                            onClick={() => handleOpen(option.id)}
                            whileHover={{
                                scale: 1.05,
                                boxShadow: `0 0 30px 8px ${alpha(option.color, 0.4)}`,
                            }}
                            whileTap={{ scale: 0.95 }}
                            startIcon={
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 6, -6, 0],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.5,
                                        ease: "easeInOut",
                                    }}
                                >
                                    {option.icon}
                                </motion.div>
                            }
                        >
                            {option.title}
                        </GlowButton>
                    </GlowButtonContainer>
                ))}
            </Box>

            {/* Currently Live Streams Section */}
            <Box sx={{ width: "100%", maxWidth: 1200, zIndex: 1, px: 2 }}>
                <Typography
                    variant="h4"
                    sx={{
                        mb: 3,
                        fontWeight: 700,
                        textAlign: "center",
                        color: theme.palette.text.primary,
                    }}
                >
                    🔥 Currently Live Streams
                </Typography>

                <Grid2 container spacing={3} justifyContent="center">
                    {liveStreams.map((stream) => (
                        <Grid2 key={stream.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <LiveStreamCard onClick={() => handleWatchStream(stream.id)}>
                                <Box
                                    sx={{
                                        position: "relative",
                                        height: 200,
                                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                                        borderRadius: `${theme.shape.borderRadius * 2}px ${
                                            theme.shape.borderRadius * 2
                                        }px 0 0`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                    }}
                                >
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{
                                            position: "absolute",
                                            top: 12,
                                            left: 12,
                                        }}
                                    >
                                        <Chip
                                            label="LIVE"
                                            color="error"
                                            size="small"
                                            icon={
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 6,
                                                            height: 6,
                                                            borderRadius: "50%",
                                                            backgroundColor: theme.palette.error.contrastText,
                                                        }}
                                                    />
                                                </motion.div>
                                            }
                                        />
                                    </motion.div>

                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 12,
                                            right: 12,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            backgroundColor: alpha(theme.palette.grey[900], 0.7),
                                            padding: "4px 8px",
                                            borderRadius: 12,
                                            color: theme.palette.common.white,
                                            fontSize: 12,
                                        }}
                                    >
                                        <ViewersIcon fontSize="small" />
                                        {stream.viewers.toLocaleString()}
                                    </Box>

                                    <PlayArrowIcon
                                        sx={{
                                            fontSize: 48,
                                            color: theme.palette.common.white,
                                            opacity: 0.8,
                                        }}
                                    />
                                </Box>

                                <CardContent>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 600,
                                            mb: 1,
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {stream.title}
                                    </Typography>

                                    <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
                                        <Avatar
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                fontSize: "0.8rem",
                                                bgcolor: theme.palette.primary.main,
                                            }}
                                        >
                                            {stream.host[0]}
                                        </Avatar>
                                        <Typography variant="body2" color="text.secondary">
                                            {stream.host}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                        <Chip
                                            label={stream.category}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                fontSize: "0.7rem",
                                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                                color: theme.palette.primary.main,
                                            }}
                                        />
                                    </Stack>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<WatchIcon />}
                                        sx={{
                                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                            "&:hover": {
                                                transform: "translateY(-1px)",
                                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                                            },
                                        }}
                                    >
                                        Watch Now
                                    </Button>
                                </CardContent>
                            </LiveStreamCard>
                        </Grid2>
                    ))}
                </Grid2>
            </Box>

            {options.map((option) => (
                <InstructionModal
                    key={option.id}
                    open={openModal === option.id}
                    onClose={handleClose}
                    closeAfterTransition
                >
                    <Fade in={openModal === option.id}>
                        <ModalContent>
                            <IconButton
                                onClick={handleClose}
                                sx={{
                                    position: "absolute",
                                    right: 16,
                                    top: 16,
                                    color: theme.palette.text.secondary,
                                }}
                            >
                                <CloseIcon />
                            </IconButton>

                            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
                                {option.title}
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 3 }}>
                                Here's how your {option.id === "podcast" ? "podcast" : "live stream"} will work:
                            </Typography>

                            <Box sx={{ mb: 4 }}>
                                {option.steps.map((step, index) => (
                                    <Slide
                                        key={index}
                                        in={openModal === option.id}
                                        direction="right"
                                        timeout={(index + 1) * 300}
                                    >
                                        <StepItem>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: "50%",
                                                    backgroundColor: alpha(option.color, 0.2),
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    mr: 2,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Typography variant="body1" fontWeight={700}>
                                                    {index + 1}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body1">{step}</Typography>
                                        </StepItem>
                                    </Slide>
                                ))}
                            </Box>

                            <Zoom
                                in={openModal === option.id}
                                style={{ transitionDelay: openModal === option.id ? "600ms" : "0ms" }}
                            >
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={handleGoLive}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2,
                                        background: `linear-gradient(45deg, ${option.color}, ${alpha(
                                            option.color,
                                            0.7
                                        )})`,
                                        fontWeight: 700,
                                        fontSize: "1.1rem",
                                        "&:hover": {
                                            transform: "translateY(-2px)",
                                            boxShadow: `0 8px 20px ${alpha(option.color, 0.4)}`,
                                        },
                                    }}
                                >
                                    Go Live Now
                                </Button>
                            </Zoom>
                        </ModalContent>
                    </Fade>
                </InstructionModal>
            ))}
        </FullScreenContainer>
    );
};

export default GoLiveView;
