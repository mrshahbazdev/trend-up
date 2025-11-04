import { Link as RouterLink } from "react-router-dom";
import { Box, Typography, Stack, LinearProgress, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const MotionBox = motion(Box);

const MiniVotingCard = ({ title, yesPercent, noPercent, endsIn, to }) => {
    const theme = useTheme();

    return (
        <MotionBox
            component={RouterLink}
            to={to}
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
            }}
        >
            <Stack spacing={1.5}>
                {/* Title */}
                <Typography
                    variant="h6"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                    🗳 {title}
                </Typography>

                {/* Ends in */}
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <AccessTimeIcon fontSize="small" color="primary" />
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        Ends in {endsIn}
                    </Typography>
                </Stack>

                {/* Progress bar */}
                <LinearProgress
                    variant="determinate"
                    value={yesPercent}
                    sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: theme.palette.background.default,
                        "& .MuiLinearProgress-bar": {
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                            boxShadow: `0 0 8px ${theme.palette.primary.main}`,
                        },
                    }}
                />

                {/* Percentages */}
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" fontWeight={600} color="success.main">
                        ✅ {yesPercent}%
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="error.main">
                        ❌ {noPercent}%
                    </Typography>
                </Stack>
            </Stack>
        </MotionBox>
    );
};

export default MiniVotingCard;
