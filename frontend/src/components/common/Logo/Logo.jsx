import { lightLogo } from "@/assets";
import { useGenrelContext } from "@/context/GenrelContext";
import { Stack, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import React from "react";

const MotionBox = motion.div;

const Logo = () => {
    const theme = useTheme();
    const { isDarkMode } = useGenrelContext();
    const transition = {
        duration: theme.transitions.duration.standard / 1000, // 300ms -> 0.3s
        ease: [0.25, 0.1, 0.25, 1],
    };
    return (
        <MotionBox
            whileHover={{
                scale: 1.04,
                y: -3,
                boxShadow: isDarkMode ? "0 4px 16px rgba(255, 255, 255, 0.12)" : "0 4px 16px rgba(0, 0, 0, 0.1)",
                transition,
            }}
            style={{ display: "inline-block", cursor: "pointer", borderRadius: 8 }}
        >
            <Stack direction="row" alignItems="center" gap="8px">
                <img src={lightLogo} alt="logo" width="60px" />
                <Typography fontWeight={700} fontSize={{ md: "24px", xs: "20px" }} color={theme.palette.text.secondary}>
                    TRENDUP
                </Typography>
            </Stack>
        </MotionBox>
    );
};

export default Logo;
