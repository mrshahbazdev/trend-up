import { useState } from "react";
import { Box, IconButton, InputBase, Paper } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

const MotionPaper = motion(Paper);

export default function AnimatedSearchInput({ onSearch }) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const handleToggle = () => {
        if (open) {
            setSearchTerm("");
            onSearch?.("");
        }
        setOpen((prev) => !prev);
    };

    const handleChange = (e) => {
        e.preventDefault()
        setSearchTerm(e.target.value);
        onSearch?.(e.target.value);
    };

    return (
        <Box
            sx={{
                position: "relative",
                height: 48, // fixed height to avoid jump
                width: open ? 240 : 48,
                transition: "width 0.3s ease",
            }}
        >
            <AnimatePresence initial={false} >
                {!open ? (
                    <motion.div
                        key="search-icon"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: 48,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <IconButton onClick={handleToggle}>
                            <SearchIcon />
                        </IconButton>
                    </motion.div>
                ) : (
                    <MotionPaper
                        key="search-bar"
                        component="form"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: 240,
                            height: 48,
                            display: "flex",
                            alignItems: "center",
                            px: 1,
                            borderRadius: 4,
                            background: (theme) => (theme.palette.mode === "dark" ? "#1e1e1e" : "#fafafa"),
                            boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                        }}
                    >
                        <InputBase
                            autoFocus
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleChange}
                            sx={{ ml: 1, flex: 1 }}
                        />
                        <IconButton onClick={handleToggle}>
                            <CloseIcon />
                        </IconButton>
                    </MotionPaper>
                )}
            </AnimatePresence>
        </Box>
    );
}
