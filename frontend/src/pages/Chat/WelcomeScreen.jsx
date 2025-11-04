import { Box, Typography, IconButton, Stack, useTheme, styled, alpha } from "@mui/material";
import { Menu as MenuIcon, Chat, Search, PhoneIphone, Bolt, Groups, AutoAwesome } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useGenrelContext } from "@/context/GenrelContext";
import { lightLogo } from "@/assets";

// Styled components with modern Web3 aesthetics
const WelcomeContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
        theme.palette.mode === "dark"
            ? `radial-gradient(circle at 75% 30%, ${alpha(theme.palette.primary.dark, 0.2)} 0%, ${
                  theme.palette.background.default
              } 70%)`
            : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(
                  theme.palette.primary.light,
                  0.05
              )} 100%)`,
    position: "relative",
    overflow: "hidden",
    "&::before": {
        content: '""',
        position: "absolute",
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: alpha(theme.palette.secondary.main, 0.1),
        filter: "blur(60px)",
    },
    "&::after": {
        content: '""',
        position: "absolute",
        bottom: -150,
        left: -150,
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: alpha(theme.palette.primary.main, 0.1),
        filter: "blur(80px)",
    },
}));

const FeatureItem = styled(Stack)(({ theme }) => ({
    color: theme.palette.text.secondary,
    transition: "all 0.3s ease",
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    background: alpha(theme.palette.background.paper, 0.7),
    backdropFilter: "blur(8px)",
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    "&:hover": {
        color: theme.palette.primary.main,
        transform: "translateY(-2px)",
        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.9),
        "& .MuiSvgIcon-root": {
            transform: "scale(1.2)",
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
    },
    "& .MuiSvgIcon-root": {
        transition: "all 0.3s ease",
        fontSize: "1.2rem",
    },
}));

const GlowCard = styled(Box)(({ theme }) => ({
    position: "relative",
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 2,
    textAlign: "center",
    maxWidth: 520,
    width: "100%",
    background: alpha(theme.palette.background.paper, 0.85),
    backdropFilter: "blur(16px)",
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    boxShadow: `0 0 32px ${alpha(theme.palette.primary.main, 0.1)}`,
    overflow: "hidden",
    "&::before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    },
    "&:hover": {
        boxShadow: `0 0 48px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
}));

export default function WelcomeScreen({ isMobile, onOpenDrawer }) {
    const theme = useTheme();
    const { isDarkMode } = useGenrelContext();

    return (
        <WelcomeContainer>
            <AnimatePresence>
                {isMobile && (
                    <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 10 }}>
                        <IconButton
                            onClick={onOpenDrawer}
                            component={motion.button}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            sx={{
                                color: theme.palette.text.primary,
                                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                                backdropFilter: "blur(12px)",
                                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Box>
                )}
            </AnimatePresence>

            <GlowCard
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                    duration: 0.5,
                    ease: [0.33, 1, 0.68, 1],
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        delay: 0.2,
                        duration: 0.4,
                        ease: [0.33, 1, 0.68, 1],
                    }}
                    style={{ display: "inline-block" }}
                >
                    <Box component={motion.div} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Box
                            component="img"
                            src={lightLogo}
                            alt="Trendup Logo"
                            sx={{
                                width: 120,
                                height: 120,
                                borderRadius: "50%",
                                mb: 2.5,
                                filter: isDarkMode
                                    ? "drop-shadow(0 4px 12px rgba(100, 80, 255, 0.3))"
                                    : "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1)) brightness(0.8)",
                                transition: "all 0.3s ease",
                            }}
                        />
                    </Box>
                </motion.div>

                <Typography
                    variant="h3"
                    component={motion.div}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    sx={{
                        fontWeight: 800,
                        mb: 1.5,
                        letterSpacing: "-0.5px",
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        display: "inline-block",
                        fontSize: { xs: "2rem", sm: "2.5rem" },
                    }}
                >
                    Welcome to TrendUp Chat
                </Typography>

                <Typography
                    variant="body1"
                    component={motion.p}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    sx={{
                        mb: 4,
                        color: theme.palette.text.secondary,
                        lineHeight: 1.7,
                        maxWidth: "80%",
                        mx: "auto",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                    }}
                >
                    Connect with friends, join communities, and experience decentralized messaging with end-to-end
                    encryption.
                </Typography>

                <Stack
                    spacing={2}
                    alignItems="flex-start"
                    component={motion.div}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    sx={{
                        width: "100%",
                        maxWidth: 400,
                        mx: "auto",
                        textAlign: "left",
                    }}
                >
                    <FeatureItem direction="row" spacing={2} alignItems="center">
                        <Bolt fontSize="inherit" />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                                Instant Messaging
                            </Typography>
                            <Typography variant="body2">Real-time encrypted conversations</Typography>
                        </Box>
                    </FeatureItem>
                    <FeatureItem direction="row" spacing={2} alignItems="center">
                        <Groups fontSize="inherit" />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                                Communities
                            </Typography>
                            <Typography variant="body2">Join or create interest groups</Typography>
                        </Box>
                    </FeatureItem>
                    <FeatureItem direction="row" spacing={2} alignItems="center">
                        <AutoAwesome fontSize="inherit" />
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                                Web3 Features
                            </Typography>
                            <Typography variant="body2">NFTs, tokens, and decentralized identity</Typography>
                        </Box>
                    </FeatureItem>
                </Stack>
            </GlowCard>
        </WelcomeContainer>
    );
}
