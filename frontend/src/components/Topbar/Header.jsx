import React, { useState } from "react";
import {
    Box,
    SwipeableDrawer,
    IconButton,
    Typography,
    Stack,
    useTheme,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Hidden,
    Button,
    Avatar,
} from "@mui/material";
import { Link } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import { motion } from "framer-motion";

// Replace with your actual logo and wallet hook
import { lightLogo } from "@/assets";
import { useGenrelContext } from "@/context/GenrelContext";

// Replace these with your actual icons if available
import HomeIcon from "@mui/icons-material/Home";
import ChatIcon from "@mui/icons-material/Chat";
import LiveIcon from "@mui/icons-material/LiveTv";
import VoteIcon from "@mui/icons-material/HowToVote";
import SearchIcon from "@mui/icons-material/Search";
import { ForYouIcon, FollowingIcon, TimelineIcon, ExploreIcon, KarmaIcon } from "@/assets/icons";
import { mockNotifications } from "@/constants";
import { useSelector } from "react-redux";
import { ThemeToggle } from "../common/ToggelTheme/ToggelTheme";
import NotificationBell from "../common/Notifictions/Notifications";
import LogoutButton from "../common/LogoutButton/LogoutButton";
import ConnectionStatus from "../common/ConnectionStatus";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast.jsx";
import { getImageUrl } from "@/config/env";

// Drawer route configuration
const drawerLinks = [
    { name: "Home", path: "/home", Icon: HomeIcon },
    { name: "For You", path: "/social/foryou", Icon: ForYouIcon },
    { name: "Following", path: "/social/following", Icon: FollowingIcon },
    { name: "Trending", path: "/social/trending", Icon: TimelineIcon },
    { name: "Discover", path: "/social/discover", Icon: ExploreIcon },
    { name: "Find People", path: "/users/search", Icon: SearchIcon },
    { name: "Vote", path: "/vote", Icon: VoteIcon },
    { name: "Chats", path: "/chat", Icon: ChatIcon },
    { name: "Go Live", path: "/live", Icon: LiveIcon },
    { name: "Karma", path: "/karma", Icon: KarmaIcon },
];

export default function HeaderDrawer() {
    const theme = useTheme();
    const { address } = useGenrelContext();
    const { user } = useSelector((state) => state.user);
    const [isOpen, setIsOpen] = useState(false);
    const { logout } = useAuth();
    const { showToast } = useToast();

    const toggleDrawer = (open) => () => setIsOpen(open);

    const handleLogout = () => {
        logout();
        showToast('Logged out successfully', 'success');
        setIsOpen(false);
    };

    //   const handleSearch = (term) => {
    //     console.log("Search:", term);
    // };

    return (
        <Box display="flex" justifyContent="space-between" alignItems="center" py={1}> 
            <Hidden lgUp>
                <IconButton onClick={toggleDrawer(true)}>
                    <MenuIcon sx={{ fontSize: 28, color: theme.palette.text.primary }} />
                </IconButton>

                <SwipeableDrawer
                    anchor="left"
                    open={isOpen}
                    onClose={toggleDrawer(false)}
                    onOpen={toggleDrawer(true)}
                    PaperProps={{
                        component: motion.div,
                        initial: { x: -300 },
                        animate: { x: 0 },
                        exit: { x: -300 },
                        transition: { duration: 0.3 },
                        sx: {
                            width: 280,
                            background: theme.palette.background.default,
                        },
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        {/* Header */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                            <Stack direction="row" alignItems="center" gap={1}>
                                <img src={lightLogo} alt="logo" width="40px" />
                                <Typography fontWeight="bold" fontSize="20px">
                                    TRENDUP
                                </Typography>
                            </Stack>
                            <IconButton onClick={toggleDrawer(false)}>
                                <MenuIcon />
                            </IconButton>
                        </Stack>

                        <Divider sx={{ mb: 2 }} />

                        {/* Navigation Links */}
                        <List>
                            {drawerLinks.map(({ name, path, Icon }) => (
                                <ListItemButton
                                    key={name}
                                    component={Link}
                                    to={path}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 1,
                                        px: 2,
                                        color: theme.palette.text.primary,
                                        "&:hover": {
                                            background: theme.palette.action.hover,
                                        },
                                    }}
                                    onClick={toggleDrawer(false)}
                                >
                                    <ListItemIcon>
                                        <Icon fontSize="medium" sx={{ color: theme.palette.text.primary }} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={name}
                                        primaryTypographyProps={{
                                            fontWeight: 500,
                                            fontSize: 16,
                                        }}
                                    />
                                </ListItemButton>
                            ))}
                            
                            {user && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <ListItemButton
                                        onClick={handleLogout}
                                        sx={{
                                            borderRadius: 2,
                                            px: 2,
                                            color: theme.palette.text.primary,
                                            "&:hover": {
                                                background: theme.palette.action.hover,
                                            },
                                        }}
                                    >
                                        <ListItemIcon>
                                            <LogoutIcon fontSize="medium" sx={{ color: theme.palette.error.main }} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Logout"
                                            primaryTypographyProps={{
                                                fontWeight: 500,
                                                fontSize: 16,
                                            }}
                                        />
                                    </ListItemButton>
                                </>
                            )}
                        </List>

                        {/* Wallet Button */}
                        <Box mt={4} display="flex" justifyContent="center">
                            {address ? (
                                <Button variant="outlined" sx={{ textTransform: "none", fontSize: 14 }}>
                                    <appkit-button balance="hide" />
                                </Button>
                            ) : (
                                <Button variant="contained" sx={{ textTransform: "none", fontSize: 14 }}>
                                    Connect Wallet
                                </Button>
                            )}
                        </Box>
                    </Box>
                </SwipeableDrawer>
            </Hidden>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "20px",
                }}
            >
                {/* <AnimatedSearchInput onSearch={handleSearch} /> */}
                <ThemeToggle />
                
                {/* Real-time connection status */}
                <ConnectionStatus showInHeader={true} />

                {user && (
                    <>
                        <Link to="/user/profile">
                            <Avatar src={getImageUrl(user.avatar) || 'https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes.png'} />
                        </Link>
                        <LogoutButton variant="icon" />
                    </>
                )}
                <NotificationBell notifications={mockNotifications} />
            </Box>
        </Box>
    );
}
