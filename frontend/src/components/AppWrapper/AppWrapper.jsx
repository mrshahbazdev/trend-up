import { useGenrelContext } from "@/context/GenrelContext";
import { darkTheme, lightTheme } from "@/utils/theme";
import { ThemeProvider } from "@emotion/react";
import { Box, Container, CssBaseline } from "@mui/material";
import Topbar from "@components/Topbar/Topbar";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@components/Topbar/Sidebar";

const MotionDiv = motion.div;

const AppWrapper = ({ children }) => {
    const { isDarkMode } = useGenrelContext();

    const duration = 0.3; // match 300ms from theme
    return (
        <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            {/* <Topbar /> */}
            <Sidebar>
                <Box sx={{ overflowX: "hidden", position: "relative" }}>
                    <AnimatePresence mode="wait">
                        <MotionDiv
                            // key={isDarkMode}
                            initial={{
                                opacity: 0,
                                scale: 0.98,
                                y: 10,
                                filter: "blur(4px)",
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                filter: "blur(0px)",
                                transition: {
                                    duration,
                                    ease: "easeInOut",
                                },
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.98,
                                y: -10,
                                filter: "blur(4px)",
                                transition: {
                                    duration,
                                    ease: "easeInOut",
                                },
                            }}
                        >
                            <Container maxWidth="xl">{children}</Container>
                        </MotionDiv>
                    </AnimatePresence>
                </Box>
            </Sidebar>
        </ThemeProvider>
    );
};

export default AppWrapper;
