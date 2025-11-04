import { useState } from "react";
import { Box, Stack, Typography, Stepper, Step, StepLabel, useTheme } from "@mui/material";
import InputFeild from "@/components/common/InputFeild/InputFeild";
import MainButton from "@/components/common/MainButton/MainButton";
import VerificationCodeInput from "./VerificationCodeInput";
import { 
    useRequestVerificationMutation, 
    useVerifyEmailMutation 
} from "@/api/slices/authApi";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

const steps = ['Verify Email', 'Enter Code', 'Complete Registration'];

const RegistrationStepper = () => {
    const theme = useTheme();
    const { register, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    
    const [activeStep, setActiveStep] = useState(0);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});

    const [requestVerification, { isLoading: requestingVerification }] = useRequestVerificationMutation();
    const [verifyEmail, { isLoading: verifyingEmail }] = useVerifyEmailMutation();

    const validateEmail = (email) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    };

    const validatePassword = (password) => {
        const minLength = password.length >= 8;
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        
        return minLength && hasNumber && hasSpecialChar && hasUppercase && hasLowercase;
    };

    const handleStep1Submit = async () => {
        if (!validateEmail(email)) {
            setErrors({ email: "Please enter a valid email address" });
            showToast("Please enter a valid email address", "error");
            return;
        }

        try {
            setErrors({});
            await requestVerification({ email }).unwrap();
            setActiveStep(1);
            showToast("Verification code sent to your email", "success");
        } catch (error) {
            showToast(error.data?.message || "Failed to send verification code. Please try again.", "error");
        }
    };

    const handleStep2Submit = async () => {
        if (code.length !== 6) {
            setErrors({ code: "Please enter the 6-digit code" });
            showToast("Please enter the 6-digit code", "error");
            return;
        }

        try {
            setErrors({});
            await verifyEmail({ email, code }).unwrap();
            setActiveStep(2);
            showToast("Email verified successfully", "success");
        } catch (error) {
            showToast(error.data?.message || "Invalid verification code. Please try again.", "error");
        }
    };

    const handleStep3Submit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.name.trim() || formData.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        if (formData.username && (formData.username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(formData.username))) {
            newErrors.username = "Username must be 3+ characters (letters, numbers, underscore only)";
        }

        if (!validatePassword(formData.password)) {
            newErrors.password = "Password must be 8+ chars with uppercase, lowercase, number, and special character";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const firstError = Object.values(newErrors)[0];
            showToast(firstError, "error");
            return;
        }

        try {
            setErrors({});
            await register({
                email,
                name: formData.name,
                username: formData.username || undefined,
                password: formData.password,
                passwordConfirm: formData.confirmPassword,
            });
            showToast("Account created successfully! Welcome to TrendUp", "success");
        } catch (error) {
            showToast(error.data?.message || "Registration failed. Please try again.", "error");
        }
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    const isLoading = requestingVerification || verifyingEmail || authLoading;

    return (
        <Box>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {activeStep === 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom color="text.primary">
                        Enter Your Email
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        We'll send you a verification code
                    </Typography>
                    
                    <InputFeild
                        placeholder="Enter your email"
                        lable="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email}
                    />

                    <Stack mt={3} alignItems="center">
                        <MainButton 
                            sx={{ width: "230px" }}
                            onClick={handleStep1Submit}
                            disabled={isLoading}
                        >
                            {requestingVerification ? "Sending..." : "Continue"}
                        </MainButton>
                    </Stack>
                </Box>
            )}

            {activeStep === 1 && (
                <Box>
                    <Typography variant="h6" gutterBottom color="text.primary">
                        Verify Your Email
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Enter the 6-digit code sent to {email}
                    </Typography>
                    
                    <VerificationCodeInput
                        value={code}
                        onChange={setCode}
                        error={errors.code}
                    />

                    <Stack mt={4} spacing={2} alignItems="center">
                        <MainButton 
                            sx={{ width: "230px" }}
                            onClick={handleStep2Submit}
                            disabled={isLoading || code.length !== 6}
                        >
                            {verifyingEmail ? "Verifying..." : "Verify Code"}
                        </MainButton>
                        
                        <Typography 
                            variant="body2" 
                            color="primary"
                            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => setActiveStep(0)}
                        >
                            Change email
                        </Typography>
                    </Stack>
                </Box>
            )}

            {activeStep === 2 && (
                <Box>
                    <Typography variant="h6" gutterBottom color="text.primary">
                        Complete Your Profile
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Email: {email} (verified)
                    </Typography>
                    
                    <form onSubmit={handleStep3Submit}>
                        <InputFeild
                            placeholder="Enter your name"
                            lable="Full Name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            error={errors.name}
                        />
                        
                        <InputFeild
                            placeholder="Choose a username (optional)"
                            lable="Username"
                            type="text"
                            value={formData.username}
                            onChange={(e) => handleFormChange('username', e.target.value)}
                            error={errors.username}
                        />
                        
                        <InputFeild
                            placeholder="Create a password"
                            lable="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleFormChange('password', e.target.value)}
                            error={errors.password}
                        />
                        
                        <InputFeild
                            placeholder="Confirm your password"
                            lable="Confirm Password"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                            error={errors.confirmPassword}
                        />

                        <Stack mt={3} alignItems="center">
                            <MainButton 
                                sx={{ width: "230px" }}
                                type="submit"
                                disabled={isLoading}
                            >
                                {authLoading ? "Creating Account..." : "Create Account"}
                            </MainButton>
                        </Stack>
                    </form>
                </Box>
            )}
        </Box>
    );
};

export default RegistrationStepper;

