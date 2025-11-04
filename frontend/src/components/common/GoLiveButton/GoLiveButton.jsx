import React from "react";
import { Button } from "@mui/material";
import { motion } from "framer-motion";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import { useGenrelContext } from "@/context/GenrelContext";

const MotionButton = motion(Button);

const GoLiveButton = ({ onClick }) => {
    const { isDarkMode } = useGenrelContext();

    // Color palettes
    const darkColors = { c1: "#e12e24", c2: "#a61d66" };
    const lightColors = { c1: "#16b48e", c2: "#616161" };

    const { c1, c2 } = isDarkMode ? darkColors : lightColors;

    const gradient = `linear-gradient(45deg, ${c1}, ${c2})`;
    const reverseGradient = `linear-gradient(45deg, ${c2}, ${c1})`;
    return (
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
                        <LiveTvIcon />
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
                }}
            >
                Go Live
            </MotionButton>
        </div>
    );
};

export default GoLiveButton;
