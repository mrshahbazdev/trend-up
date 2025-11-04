import { Avatar, Box, Container, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";

import { useGenrelContext } from "@/context/GenrelContext";
import { darkLogo, lightLogo } from "@/assets";
import ButtonBorder from "@components/common/ButtonBorder";
import { ThemeToggle } from "../common/ToggelTheme/ToggelTheme";
import ConnectButton from "../common/ConnectButton/ConnectButton";
import { useSelector } from "react-redux";
import { MenuIcon } from "@/assets/icons";
import LogoutButton from "../common/LogoutButton/LogoutButton";
import { getImageUrl } from "@/config/env";

// const array = [
//     {
//         name: "Home",
//         link1: "/",
//     },
//     {
//         name: "Vote",
//         link1: "/vote",
//     },
//     {
//         name: "Chats",
//         link1: "/chat",
//     },
// ];

const Navbar = () => {
    const { isDarkMode } = useGenrelContext();
    const theme = useTheme();
    const { user } = useSelector((state) => state.user);

    return (
        <Container sx={{ position: "relative" }} maxWidth={"xl"}>
            <Box
                py={5}
                sx={{
                    width: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "transparent",
                }}
            >
                <Stack direction="row" alignItems="center" gap={"0px"}>
                    <img width="60px" src={isDarkMode ? darkLogo : lightLogo} alt="logo" srcSet="" />
                    <Typography
                        color={theme.palette.text.secondary}
                        fontWeight="700"
                        fontSize={{ md: "24px", xs: "20px" }}
                    >
                        TRENDUP
                    </Typography>
                </Stack>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: "20px",
                    }}
                >
                    <ThemeToggle />

                    {user && (
                        <>
                            <Link to="/user/profile">
                                <Avatar src={getImageUrl(user.avatar) || 'https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes.png'} />
                            </Link>
                            <LogoutButton variant="icon" />
                        </>
                    )}
                </Box>
            </Box>
        </Container>
    );
};

export default Navbar;
