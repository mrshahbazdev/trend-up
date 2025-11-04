import { PostIcon } from "@/assets/icons";
import { Box, Button, Typography, useTheme, Stack } from "@mui/material";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import BoxConatner from "@components/common/BoxContainer/BoxConatner";
import CreatePostModal from "./CreatePostModal";
import { useGenrelContext } from "@/context/GenrelContext";
import LiveTvIcon from "@mui/icons-material/LiveTv";

const MotionButton = motion(Button);

const CreatePost = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isDarkMode } = useGenrelContext();
    const [modalOpen, setModalOpen] = useState(false);

    // Color palettes
    const darkColors = { c1: "#e12e24", c2: "#a61d66" };
    const lightColors = { c1: "#16b48e", c2: "#616161" };
    const { c1, c2 } = isDarkMode ? darkColors : lightColors;

    const gradient = `linear-gradient(45deg, ${c1}, ${c2})`;
    const reverseGradient = `linear-gradient(45deg, ${c2}, ${c1})`;

    const handleCreatePost = () => {
        setModalOpen(true);
    };

    const handleGoLive = () => {
        navigate('/live');
    };

    const AnimatedButton = ({ onClick, icon, text, gradient, reverseGradient, c1 }) => (
        <div style={{ position: "relative", display: "inline-block" }}>
            {/* Outer animated glow */}
            <motion.div
                initial={{ opacity: 0.4, scale: 1 }}
                animate={{
                    opacity: [0.3, 0.75, 0.3],
                    scale: [1, 1.25, 1],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "9999px",
                    padding: "3px",
                    background: gradient,
                    filter: "blur(10px)",
                    zIndex: 0,
                }}
            />

            {/* Button */}
            <MotionButton
                onClick={onClick}
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
                        {icon}
                    </motion.div>
                }
                whileHover={{
                    scale: 1.08,
                    background: reverseGradient,
                    boxShadow: `0 0 30px 8px ${c1}`,
                }}
                whileTap={{ scale: 0.95 }}
                sx={{
                    zIndex: 1,
                    position: "relative",
                    padding: "12px 30px",
                    borderRadius: "999px",
                    fontWeight: "bold",
                    fontSize: { md: "16px", xs: "14px" },
                    textTransform: "none",
                    color: "#fff",
                    background: gradient,
                    boxShadow: `0 4px 20px ${c1}88`,
                    transition: "all 0.3s ease",
                    minWidth: "140px",
                }}
            >
                {text}
            </MotionButton>
        </div>
    );

    return (
        <>
            <BoxConatner>
                <Stack 
                    direction={{ xs: "column", sm: "row" }} 
                    spacing={2} 
                    sx={{ width: "100%" }}
                    alignItems="center"
                    justifyContent="center"
                >
                    <AnimatedButton
                        onClick={handleCreatePost}
                        icon={<PostIcon />}
                        text="Create Post"
                        gradient={gradient}
                        reverseGradient={reverseGradient}
                        c1={c1}
                    />
                    
                    <AnimatedButton
                        onClick={handleGoLive}
                        icon={<LiveTvIcon />}
                        text="Go Live"
                        gradient={gradient}
                        reverseGradient={reverseGradient}
                        c1={c1}
                    />
                </Stack>
            </BoxConatner>

            <CreatePostModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
            />
        </>
    );
};

export default CreatePost;
