import InputFeild from "@/components/common/InputFeild/InputFeild";
import MainButton from "@/components/common/MainButton/MainButton";
import Loading from "@/components/common/loading";
import Logo from "@/components/common/Logo/Logo";
import { Box, Container, Stack, Typography, useTheme } from "@mui/material";
import { ReplyIcon } from "@/assets/icons";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForgotPasswordMutation } from "@/api/slices/authApi";
import { useToast } from "@/hooks/useToast";

const ForgotPassword = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { showToast } = useToast();

    const [email, setEmail] = useState({ email: "", error: "" });
    const [isEmailSent, setIsEmailSent] = useState(false);

    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

    const handleEmailChange = (e) => {
        const _email = e.target.value.trim();
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(_email);
        setEmail((prev) => ({
            ...prev,
            email: _email,
            error: isValidEmail || _email === "" ? "" : "Invalid email address",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.email.trim());
        if (!isValidEmail) {
            setEmail((prev) => ({
                ...prev,
                error: "Please enter a valid email address",
            }));
            showToast("Please enter a valid email address", "error");
            return;
        }

        try {
            await forgotPassword({ email: email.email }).unwrap();
            setIsEmailSent(true);
            showToast("Password reset link sent to your email", "success", 5000);
        } catch (error) {
            showToast(error.data?.message || "Failed to send reset email. Please try again.", "error");
        }
    };

    if (isLoading) return <Loading isLoading={true} />;

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}
        >
            <Container maxWidth="sm">
                <Box
                    sx={(theme) => ({
                        border: `2px solid ${theme.palette.secondary.main}`,
                        borderRadius: "15px",
                        padding: { md: 4, xs: 1.5 },
                        position: "relative",
                    })}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: "10px",
                        }}
                    >
                        <Link to="/login" style={{ textDecoration: "none" }}>
                            <Stack direction="row" alignItems="center" gap="5px">
                                <ReplyIcon color={theme.palette.text.primary} />
                                <Typography color="textPrimary">Back to Login</Typography>
                            </Stack>
                        </Link>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Logo />
                    </Box>

                    <Typography
                        sx={(theme) => ({
                            fontSize: {
                                md: "22px",
                                xs: "18px",
                            },
                            textAlign: "center",
                            color: theme.palette.text.secondary,
                            fontWeight: 700,
                            mt: { md: 2, xs: 1.5 },
                        })}
                    >
                        {isEmailSent ? "Check Your Email" : "Forgot Password"}
                    </Typography>

                    <Typography
                        sx={(theme) => ({
                            textAlign: "center",
                            color: theme.palette.text.secondary,
                            mt: 1,
                            mb: 3,
                        })}
                    >
                        {isEmailSent
                            ? "We've sent a password reset link to your email address. Check your inbox (or Mailtrap if testing)."
                            : "Enter your email address and we'll send you a link to reset your password."}
                    </Typography>

                    {!isEmailSent ? (
                        <form onSubmit={handleSubmit}>
                            <InputFeild
                                placeholder="Enter your email"
                                lable="Email Address"
                                name="email"
                                type="email"
                                onChange={handleEmailChange}
                                value={email.email}
                                error={email.error}
                            />

                            <Stack direction="column" alignItems="center" justifyContent="center" mt={3}>
                                <MainButton sx={{ width: "230px" }} type="submit">
                                    Send Reset Link
                                </MainButton>
                            </Stack>
                        </form>
                    ) : (
                        <Stack direction="column" alignItems="center" justifyContent="center" mt={3}>
                            <MainButton
                                sx={{ width: "230px" }}
                                onClick={() => navigate("/login")}
                            >
                                Back to Login
                            </MainButton>
                        </Stack>
                    )}

                    {!isEmailSent && (
                        <Link to="/login" style={{ textDecoration: "none" }}>
                            <Typography color="textPrimary" mt={2} align="center">
                                Remember your password? Log in
                            </Typography>
                        </Link>
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default ForgotPassword;
