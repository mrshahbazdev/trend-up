import { useState, useEffect } from "react";
import { Box, Typography, Stack, Container, useTheme, Divider, Fade, Chip } from "@mui/material";
import Loading from "@/components/common/loading";
import MainButton from "@/components/common/MainButton/MainButton";
import { useToast } from "@/hooks/useToast.jsx";
import { 
    useTokenWriteFunction, 
    useTokenBalance, 
    useVoteCooldown,
    useHodlActivationTimestamp,
    useIsSaleRestricted 
} from "@/connectivityAssets/hooks";
import { useGenrelContext } from "@/context/GenrelContext";
import { useAppKit } from "@reown/appkit/react";
import VoteContainer from "@/components/common/VoteContainer/VoteContainer";
import { formatUnits } from "viem";

export default function HodlVoting() {
    const theme = useTheme();
    const { address } = useGenrelContext();
    const { open } = useAppKit();
    const { handleWriteContract } = useTokenWriteFunction();
    const { balance } = useTokenBalance(address);
    const { expiryTimestamp } = useVoteCooldown(address);
    const { hodlTimestamp } = useHodlActivationTimestamp();
    const { isSaleRestricted } = useIsSaleRestricted();
    
    const [isLoading, setIsLoading] = useState(false);
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const { showToast } = useToast();

    // Calculate cooldown
    useEffect(() => {
        if (!expiryTimestamp) return;
        
        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = Number(expiryTimestamp) - now;
            setCooldownRemaining(remaining > 0 ? remaining : 0);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [expiryTimestamp]);

    const formatCooldown = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    const voteForHODL = async () => {
        if (cooldownRemaining > 0) {
            showToast(`Please wait ${formatCooldown(cooldownRemaining)} before voting again`, "error");
            return;
        }
        
        try {
            setIsLoading(true);
            const receipt = await handleWriteContract("voteForHODL", [], address);
            
            showToast("Successfully voted for HODL!", "success");
        } catch (error) {
            const errMsg = error?.data?.message || error?.reason || error?.message || "Voting failed";
            showToast(errMsg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const hodlActive = hodlTimestamp && Number(hodlTimestamp) > 0;
    const daysUntilActivation = hodlTimestamp ? 
        Math.ceil((Number(hodlTimestamp) - Date.now() / 1000) / 86400) : 0;

    return (
        <>
            <Loading isLoading={isLoading} />
            <Container maxWidth="md">
                <VoteContainer>
                    <Fade in timeout={300}>
                        <Stack spacing={2}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="h4" fontWeight={600} color="text.primary">
                                    🏦 HODL Voting
                                </Typography>
                                {isSaleRestricted && (
                                    <Chip 
                                        label="Restrictions Active" 
                                        color="success" 
                                        size="small" 
                                    />
                                )}
                            </Stack>

                            <Typography variant="body1" color="text.secondary" fontWeight={500}>
                                {hodlActive ? 
                                    `HODL mode activates in ${daysUntilActivation} days` :
                                    "Vote to activate HODL mode and protect token holders"
                                }
                            </Typography>

                            <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />

                            <Typography variant="h6" fontWeight={500} color="text.secondary">
                                Reduce the maximum sell limit to protect long-term holders
                            </Typography>

                            {address && (
                                <Box sx={{ 
                                    p: 2, 
                                    borderRadius: 2, 
                                    bgcolor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`
                                }}>
                                    <Stack spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            Your Balance: {balance ? formatUnits(balance, 18) : '0'} TUP
                                        </Typography>
                                        {cooldownRemaining > 0 && (
                                            <Typography variant="body2" color="warning.main">
                                                Cooldown: {formatCooldown(cooldownRemaining)}
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                            )}

                            <Stack spacing={1} mt={2}>
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    Vote with your TUP tokens to activate HODL protection
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    textAlign="center"
                                    sx={{ wordBreak: "break-word" }}
                                >
                                    Token address: 0x52c06a62d9495bee1dadf2ba0f5c0588a4f3c14c
                                </Typography>
                            </Stack>

                            <MainButton
                                onClick={address ? voteForHODL : open}
                                fullWidth
                                disabled={address && cooldownRemaining > 0}
                                sx={{
                                    mt: 3,
                                    fontWeight: 600,
                                    background: theme.palette.primary.main,
                                    ":hover": {
                                        background: theme.palette.primary.dark,
                                    },
                                }}
                            >
                                {address ? 
                                    (cooldownRemaining > 0 ? 
                                        `Wait ${formatCooldown(cooldownRemaining)}` : 
                                        "Vote for HODL") : 
                                    "Connect Wallet"}
                            </MainButton>
                        </Stack>
                    </Fade>
                </VoteContainer>
            </Container>
        </>
    );
}
