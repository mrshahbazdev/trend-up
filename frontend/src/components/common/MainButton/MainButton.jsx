import { Button } from "@mui/material";
import { motion } from "framer-motion";
import { styled } from "@mui/system";

const MotionButton = motion(
    styled(Button)(({ theme }) => ({
        borderRadius: 15,
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
        fontWeight: 600,
        padding: "10px 24px",
        textTransform: "none",
        transition: "color 0.5s ease, background-color 0.5s ease",
        boxShadow: theme.palette.mode === "light" ? "0 2px 5px rgba(0,0,0,0.15)" : "0 2px 5px rgba(0,0,0,0.35)",

        backgroundColor: theme.palette.mode === "light" ? "#f5f5f5" : "#111",
        color: theme.palette.mode === "light" ? "#111" : "#fff",

        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: theme.palette.mode === "light" ? "#16b48e" : "#16b48e",
            transform: "scaleX(0)",
            transformOrigin: "0 50%",
            transition: "transform 0.5s cubic-bezier(0.52, 1.64, 0.37, 0.66)",
            borderRadius: 15,
            zIndex: -1,
        },

        "&:hover::before": {
            transform: "scaleX(1)",
        },

        "&:hover": {
            color: "#000",
        },
    }))
);

const MainButton = ({ onClick, children, startIcon, ...props }) => {
    return (
        <MotionButton
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            sx={{ px: 4 }}
            startIcon={startIcon}
            {...props}
        >
            {children}
        </MotionButton>
    );
};

export default MainButton;
