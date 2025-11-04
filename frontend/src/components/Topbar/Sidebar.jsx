import {
    AppBar as MuiAppBar,
    Avatar,
    Box,
    Stack,
    styled,
    Typography,
    useTheme,
    Toolbar,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    Divider,
    List,
    Drawer as MuiDrawer,
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";

import { useGenrelContext } from "@/context/GenrelContext";
import { ThemeToggle } from "../common/ToggelTheme/ToggelTheme";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@mui/material";
import Header from "./Header";
import Navbar from "./Navbar";
import { ChatIcon, ChevronLeftIcon, HomeIcon, LiveIcon, MenuIcon, VoteIcon , StreamIcon, ExploreIcon, FollowingIcon, ForYouIcon, AccountBoxIcon, TimelineIcon, KarmaIcon} from "@/assets/icons";
import SearchIcon from "@mui/icons-material/Search";
import { motion } from "framer-motion";
import Logo from "../common/Logo/Logo";
import AnimatedSearchInput from "../common/SearchInput/SearchInput";
import NotificationBell from "../common/Notifictions/Notifications";
import LogoutButton from "../common/LogoutButton/LogoutButton";
import { getImageUrl } from "@/config/env";
import { mockNotifications } from "@/constants";
import MiniVotingCard from "../common/MiniVoting/MiniVoting";

const drawerWidth = 240;

const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    // backgroundColor: theme.palette.text.secondary,
    boxShadow: "none",
    variants: [
        {
            props: ({ open }) => open,
            style: {
                marginLeft: drawerWidth,
                width: `calc(100% - ${drawerWidth}px)`,
                transition: theme.transitions.create(["width", "margin"], {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            },
        },
    ],
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== "open" })(({ theme }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    variants: [
        {
            props: ({ open }) => open,
            style: {
                ...openedMixin(theme),
                "& .MuiDrawer-paper": openedMixin(theme),
            },
        },
        {
            props: ({ open }) => !open,
            style: {
                ...closedMixin(theme),
                "& .MuiDrawer-paper": closedMixin(theme),
            },
        },
    ],
    anchor: "left",
}));

const array = [
    {
        name: "Home",
        link1: "/home",
        Icon: HomeIcon,
        id: 1,
    },
    {
        name: "For You",
        link1: "/social/foryou",
        Icon: ForYouIcon,
        id: 2,
    },
    {
        name: "Following",
        link1: "/social/following",
        Icon: FollowingIcon,
        id: 3,
    },
    {
        name: "Trending",
        link1: "/social/trending",
        Icon: TimelineIcon,
        id: 4,
    },
    {
        name: "Discover",
        link1: "/social/discover",
        Icon: ExploreIcon,
        id: 5,
    },
    {
        name: "Find People",
        link1: "/users/search",
        Icon: SearchIcon,
        id: 6,
    },
    {
        name: "Vote",
        link1: "/vote",
        Icon: VoteIcon,
        id: 7,
    },
    {
        name: "Chats",
        link1: "/chat",
        Icon: ChatIcon,
        id: 8,
    },
    {
        name: "Live Forum",
        link1: "/live",
        Icon: LiveIcon,
        id: 9,
    },
    {
        name: "Karma",
        link1: "/karma",
        Icon: KarmaIcon,
        id: 10,
    },
    {
        name: "Profile",
        link1: "/user/profile",
        Icon: AccountBoxIcon,
        id: 11,
    },
];

const MotionListItemButton = motion(ListItemButton);
const MotionIcon = motion.div;
const MotionTypography = motion(Typography);

const CustomDrawer = ({ handleDrawerClose, open }) => {
    const [selectedIndex, setSelectedIndex] = useState(array[0].id);
    const location = useLocation();

    const theme = useTheme();
    const { isDarkMode } = useGenrelContext();
    // Color palettes
    const darkColors = { c1: "#e12e24", c2: "#a61d66" };
    const lightColors = { c1: "#16b48e", c2: "#fff" };

    const { c1, c2 } = isDarkMode ? darkColors : lightColors;

    const gradient = `linear-gradient(45deg, ${c1}, ${c2})`;

    useEffect(() => {
        const matchedRoute = array.find((item) => item.link1 === location.pathname);
        if (matchedRoute) {
            setSelectedIndex(matchedRoute.id);
        }
    }, [location.pathname]);

    return (
        <Drawer
            variant="permanent"
            open={open}
            anchor="left"
            sx={{
                backgroundColor: isDarkMode ? "#010507" : "#fff",
                "& .MuiDrawer-paper": {
                    backgroundColor: isDarkMode ? "#010507" : "#fff",
                    boxSizing: "border-box",
                },
            }}
        >
            <DrawerHeader>
                <IconButton onClick={handleDrawerClose}>
                    {theme.direction === "rtl" ? <></> : <ChevronLeftIcon />}
                </IconButton>
            </DrawerHeader>
            <Divider />

            <Stack gap={2} justifyContent={"space-between"} height={"100%"}>
                <List>
                    {array.map(({ name, link1, Icon: ImageIcon, id }, index) => (
                        <ListItem key={index} disablePadding sx={{ display: "block" }}>
                            <Link to={link1} style={{ textDecoration: "none", color: "inherit" }}>
                                <MotionListItemButton
                                    onClick={() => setSelectedIndex(id)}
                                    whileHover={{
                                        scale: 1.05,
                                        transition: { type: "spring", stiffness: 300 },
                                    }}
                                    initial={false}
                                    animate={{
                                        background: selectedIndex === id ? gradient : "transparent",
                                    }}
                                    transition={{ duration: 0.3 }}
                                    sx={[
                                        {
                                            minHeight: 48,
                                            px: open ? 2.5 : 1.5,
                                            display: "flex",
                                            gap: 5,
                                            // mx: 0,
                                            borderRadius: 5,
                                            mx: open ? 3 : 1,
                                        },
                                        open
                                            ? {
                                                  justifyContent: "initial",
                                              }
                                            : {
                                                  justifyContent: "center",
                                              },
                                    ]}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            justifyContent: "center",
                                        }}
                                    >
                                        <MotionIcon
                                            key={selectedIndex === id ? "active" : "inactive"}
                                            initial={{ scale: 1 }}
                                            animate={{
                                                scale: selectedIndex === id ? [1, 1.3, 1] : 1,
                                            }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <ImageIcon
                                                sx={{
                                                    color:
                                                        selectedIndex === id
                                                            ? !isDarkMode
                                                                ? "#fff"
                                                                : theme.palette.primary.main
                                                            : theme.palette.text.secondary,
                                                }}
                                            />
                                        </MotionIcon>
                                    </ListItemIcon>

                                    {open && (
                                        <MotionTypography
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: 0.1 }}
                                            color={theme.palette.text.secondary}
                                        >
                                            {name}
                                        </MotionTypography>
                                    )}
                                </MotionListItemButton>
                            </Link>
                        </ListItem>
                    ))}
                </List>
                <Box p={2}>
                    <MiniVotingCard
                        title={"HOLD Voting"}
                        yesPercent={30}
                        noPercent={70}
                        endsIn={"10 days"}
                        to={"/vote"}
                    />
                </Box>
            </Stack>
        </Drawer>
    );
};

const Sidebar = ({ children }) => {
    // const { isDarkMode } = useGenrelContext();
    const theme = useTheme();
    const { user } = useSelector((state) => state.user);
    const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
    const [open, setOpen] = useState(true);


    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };
    const handleSearch = (term) => {
        // Handle search functionality
    };
    return (
        <Box sx={{ display: isMdUp && user ? "flex" : "block" }}>
            {user ? (
                <>
                    {" "}
                    {isMdUp ? (
                        <>
                            {" "}
                            <AppBar position="fixed" open={open}>
                                <Toolbar
                                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <IconButton
                                            aria-label="open drawer"
                                            onClick={handleDrawerOpen}
                                            edge="start"
                                            sx={[
                                                {
                                                    marginRight: 5,
                                                },
                                                open && { display: "none" },
                                            ]}
                                            color={theme.palette.text.secondary}
                                        >
                                            <MenuIcon />
                                        </IconButton>
                                        <Logo />
                                    </Box>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            alignItems: "center",
                                            gap: "20px",
                                        }}
                                    >
                                        <AnimatedSearchInput onSearch={handleSearch} />
                                        <ThemeToggle />

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
                                </Toolbar>
                            </AppBar>{" "}
                            <CustomDrawer handleDrawerClose={handleDrawerClose} theme={theme} open={open} />{" "}
                        </>
                    ) : (
                        <Header />
                    )}{" "}
                </>
            ) : (
                <Navbar />
            )}

            <Box
                sx={{
                    flexGrow: 1,
                }}
                p={{ md: 3, xs: 0 }} // padding for medium screens and up
            >
                {isMdUp && <DrawerHeader />}

                {children}
            </Box>
        </Box>
    );
};

export default Sidebar;
