import Loading from "@/components/common/loading";
import Logo from "@/components/common/Logo/Logo";
import { Box, Container, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { ReplyIcon } from "@/assets/icons";
import { Link } from "react-router-dom";
import RegistrationStepper from "@/components/auth/RegistrationStepper";
import { useSelector } from "react-redux";

const Register = () => {
    const theme = useTheme();
    const { loading } = useSelector((state) => state.user);

    if (loading) return <Loading isLoading={true} />;

    return (
        <Box display="flex" alignItems="center" justifyContent="space-between">
            <Container maxWidth="sm">
                <Box
                    sx={{
                        border: `2px solid ${theme.palette.secondary.main}`,
                        borderRadius: "15px",
                        padding: { md: 4, xs: 1.5 },
                        position: "relative",
                    }}
                >
                    <Box position="absolute" top={0} left="10px">
                        <IconButton component={Link} to="/login" sx={{ display: "flex", gap: 1 }}>
                            <ReplyIcon color={theme.palette.text.primary} />
                            <Typography color="textPrimary">Back</Typography>
                        </IconButton>
                    </Box>

                    <Box display="flex" justifyContent="center">
                        <Logo />
                    </Box>

                    <Typography
                        sx={{
                            textAlign: "center",
                            color: theme.palette.text.secondary,
                            fontWeight: 700,
                            fontSize: { md: "22px", xs: "18px" },
                            mt: { md: 2, xs: 1.5 },
                        }}
                    >
                        Create Your Account
                    </Typography>

                    <Typography textAlign="center" color="textSecondary" mt={1} mb={3}>
                        Join the Trend Up platform today.
                    </Typography>

                    <RegistrationStepper />

                    <Link to="/login" style={{ textDecoration: "none" }}>
                        <Typography color="textPrimary" mt={3} align="center">
                            Already have an account? Log in
                        </Typography>
                    </Link>
                </Box>
            </Container>
        </Box>
    );
};

export default Register;
