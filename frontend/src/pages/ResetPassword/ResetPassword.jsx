import InputFeild from "@/components/common/InputFeild/InputFeild";
import MainButton from "@/components/common/MainButton/MainButton";
import Loading from "@/components/common/loading";
import Logo from "@/components/common/Logo/Logo";
import { Box, Container, Stack, Typography, useTheme, IconButton, InputAdornment } from "@mui/material";
import { ReplyIcon, Visibility, VisibilityOff } from "@/assets/icons";
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useResetPasswordMutation, useValidateResetTokenQuery } from "@/api/slices/authApi";
import { useToast } from "@/hooks/useToast";

const ResetPassword = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState({ value: "", error: "" });
    const [confirmPassword, setConfirmPassword] = useState({ value: "", error: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    // Validate token on mount
    const { data: tokenValidation, isLoading: validating, error: tokenError } = useValidateResetTokenQuery(token, {
        skip: !token,
    });

    const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

    useEffect(() => {
        if (tokenError) {
            showToast(tokenError.data?.message || "Invalid or expired reset link", "error");
        }
    }, [tokenError, showToast]);

    const validatePassword = (pwd) => {
        const minLength = pwd.length >= 8;
        const hasNumber = /\d/.test(pwd);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        const hasUppercase = /[A-Z]/.test(pwd);
        const hasLowercase = /[a-z]/.test(pwd);

        if (!minLength) return "Password must be at least 8 characters";
        if (!hasNumber) return "Password must include at least one number";
        if (!hasSpecialChar) return "Password must include at least one special character";
        if (!hasUppercase) return "Password must include at least one uppercase letter";
        if (!hasLowercase) return "Password must include at least one lowercase letter";
        return "";
    };

    const handlePasswordChange = (e) => {
        const pwd = e.target.value;
        const error = validatePassword(pwd);
        setPassword({ value: pwd, error });
    };

    const handleConfirmPasswordChange = (e) => {
        const confirmPwd = e.target.value;
        const error = confirmPwd !== password.value ? "Passwords do not match" : "";
        setConfirmPassword({ value: confirmPwd, error });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (resetting) return;

        // Validate
        const pwdError = validatePassword(password.value);
        if (pwdError) {
            setPassword((prev) => ({ ...prev, error: pwdError }));
            showToast(pwdError, "error");
            return;
        }

        if (password.value !== confirmPassword.value) {
            setConfirmPassword((prev) => ({ ...prev, error: "Passwords do not match" }));
            showToast("Passwords do not match", "error");
            return;
        }

        try {
            await resetPassword({
                token,
                password: password.value,
                passwordConfirm: confirmPassword.value,
            }).unwrap();
            setResetSuccess(true);
            showToast("Password reset successful! Redirecting to login...", "success", 3000);
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (error) {
            showToast(error.data?.message || "Failed to reset password. Please try again.", "error");
        }
    };

    const handleTogglePassword = () => setShowPassword((prev) => !prev);
    const handleToggleConfirmPassword = () => setShowConfirmPassword((prev) => !prev);

    const passwordAdornment = (
        <InputAdornment position="end">
            <IconButton onClick={handleTogglePassword} edge="end">
                {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
        </InputAdornment>
    );

    const confirmPasswordAdornment = (
        <InputAdornment position="end">
            <IconButton onClick={handleToggleConfirmPassword} edge="end">
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
        </InputAdornment>
    );

    if (validating || resetting) return <Loading isLoading={true} />;

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
                        {resetSuccess ? "Password Reset Successful!" : "Reset Your Password"}
                    </Typography>

                    <Typography
                        sx={(theme) => ({
                            textAlign: "center",
                            color: theme.palette.text.secondary,
                            mt: 1,
                            mb: 3,
                        })}
                    >
                        {resetSuccess
                            ? "Your password has been reset. Redirecting to login..."
                            : "Enter your new password below."}
                    </Typography>

                    {resetSuccess ? (
                        <Stack direction="column" alignItems="center" justifyContent="center" spacing={2}>
                            <Box
                                sx={{
                                    bgcolor: "success.main",
                                    color: "white",
                                    p: 3,
                                    borderRadius: 1,
                                    textAlign: "center",
                                    width: "100%",
                                }}
                            >
                                <Typography variant="h6" gutterBottom>
                                    ✓ Success!
                                </Typography>
                                <Typography variant="body2">
                                    You can now login with your new password
                                </Typography>
                            </Box>
                            <MainButton sx={{ width: "230px" }} onClick={() => navigate("/login")}>
                                Go to Login
                            </MainButton>
                        </Stack>
                    ) : tokenError ? (
                        <Stack direction="column" alignItems="center" justifyContent="center" spacing={2}>
                            <Typography color="error" textAlign="center">
                                This reset link is invalid or has expired.
                            </Typography>
                            <MainButton sx={{ width: "230px" }} onClick={() => navigate("/forgot-password")}>
                                Request New Link
                            </MainButton>
                        </Stack>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <InputFeild
                                placeholder="Enter new password"
                                lable="New Password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                onChange={handlePasswordChange}
                                value={password.value}
                                error={password.error}
                                endAdornment={passwordAdornment}
                            />

                            <InputFeild
                                placeholder="Confirm new password"
                                lable="Confirm Password"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                onChange={handleConfirmPasswordChange}
                                value={confirmPassword.value}
                                error={confirmPassword.error}
                                endAdornment={confirmPasswordAdornment}
                            />

                            <Stack direction="column" alignItems="center" justifyContent="center" mt={3}>
                                <MainButton sx={{ width: "230px" }} type="submit">
                                    Reset Password
                                </MainButton>
                            </Stack>
                        </form>
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default ResetPassword;

