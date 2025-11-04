import React from "react";
import { motion } from "framer-motion";
import { Box, useTheme } from "@mui/material";

const MotionBox = motion(Box);

const VoteContainer = ({ sx, children, ...props }) => {
    const theme = useTheme();
    return (
        <MotionBox
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{
                scale: 1.02,
                boxShadow: theme.palette.mode === "dark" ? "0 8px 24px rgba(0,0,0,0.8)" : "0 8px 24px rgba(0,0,0,0.15)",
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            sx={{
                display: "block",
                textDecoration: "none",
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: 2.5,
                background:
                    theme.palette.mode === "dark"
                        ? "linear-gradient(145deg, rgba(25,25,25,1) 0%, rgba(40,40,40,1) 100%)"
                        : "linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(248,249,250,1) 100%)",
                boxShadow: theme.palette.mode === "dark" ? "0 0 12px rgba(0,0,0,0.7)" : "0 0 8px rgba(0,0,0,0.05)",
                ...sx,
            }}
            {...props}
        >
            {children}
        </MotionBox>
    );
};

export default VoteContainer;
