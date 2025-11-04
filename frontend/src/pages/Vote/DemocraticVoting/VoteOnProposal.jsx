import { useState } from "react";
import {
    Box, Typography, Stack, Container, useTheme,
    TextField, Button, ButtonGroup, Fade
} from "@mui/material";
import Loading from "@/components/common/loading";
import MainButton from "@/components/common/MainButton/MainButton";
import { useToast } from "@/hooks/useToast.jsx";
import { useTokenWriteFunction, useTokenBalance, useDemocraticVote } from "@/connectivityAssets/hooks";
import { useGenrelContext } from "@/context/GenrelContext";
import { useAppKit } from "@reown/appkit/react";
import VoteContainer from "@/components/common/VoteContainer/VoteContainer";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { formatUnits } from "viem";

export default function VoteOnProposal() {
    const theme = useTheme();
    const { address } = useGenrelContext();
    const { open } = useAppKit();
    const { handleWriteContract } = useTokenWriteFunction();
    const { balance } = useTokenBalance(address);

    const [voteId, setVoteId] = useState("");
    const [voteChoice, setVoteChoice] = useState(null); // true = yes, false = no
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const { voteData } = useDemocraticVote(voteId !== "" ? Number(voteId) : null);

    const submitVote = async () => {
        if (!voteId || voteId === "") {
            showToast("Please enter a vote ID", "error");
            return;
        }
        if (voteChoice === null) {
            showToast("Please select Yes or No", "error");
            return;
        }

        try {
            setIsLoading(true);
            const receipt = await handleWriteContract(
                "voteOnDemocraticVote", 
                [Number(voteId), voteChoice], 
                address
            );

            showToast("Vote submitted successfully!", "success");
            setVoteId("");
            setVoteChoice(null);
        } catch (error) {
            const errMsg = error?.data?.message || error?.reason || error?.message || "Voting failed";
            showToast(errMsg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const [title, totalVotes, votedYes, expiryTimestamp] = voteData || [];
    const now = Math.floor(Date.now() / 1000);
    const expired = expiryTimestamp && Number(expiryTimestamp) < now;

    return (
        <>
            <Loading isLoading={isLoading} />
            <Container maxWidth="md">
                <VoteContainer>
                    <Fade in timeout={300}>
                        <Stack spacing={3}>
                            <Typography variant="h4" fontWeight={600} color="text.primary">
                                🗳️ Vote on Proposal
                            </Typography>

                            <TextField
                                label="Proposal ID"
                                type="number"
                                value={voteId}
                                onChange={(e) => setVoteId(e.target.value)}
                                fullWidth
                                helperText={title ? `Proposal: ${title}` : "Enter a proposal ID to see details"}
                            />

                            {voteData && (
                                <Box sx={{ 
                                    p: 2, 
                                    borderRadius: 2, 
                                    bgcolor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`
                                }}>
                                    <Stack spacing={1}>
                                        <Typography variant="h6">{title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Votes: {totalVotes?.toString()}
                                        </Typography>
                                        <Typography variant="body2" color={expired ? "error" : "success.main"}>
                                            {expired ? "Voting Ended" : "Voting Active"}
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                    Your Vote:
                                </Typography>
                                <ButtonGroup fullWidth>
                                    <Button
                                        variant={voteChoice === true ? "contained" : "outlined"}
                                        startIcon={<ThumbUpIcon />}
                                        onClick={() => setVoteChoice(true)}
                                        color="success"
                                    >
                                        Yes
                                    </Button>
                                    <Button
                                        variant={voteChoice === false ? "contained" : "outlined"}
                                        startIcon={<ThumbDownIcon />}
                                        onClick={() => setVoteChoice(false)}
                                        color="error"
                                    >
                                        No
                                    </Button>
                                </ButtonGroup>
                            </Box>

                            {address && (
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    Your Voting Power: {balance ? formatUnits(balance, 18) : '0'} TUP
                                </Typography>
                            )}

                            <MainButton
                                onClick={address ? submitVote : open}
                                fullWidth
                                disabled={address && (expired || voteChoice === null)}
                                sx={{
                                    mt: 2,
                                    fontWeight: 600,
                                    background: theme.palette.primary.main,
                                    ":hover": {
                                        background: theme.palette.primary.dark,
                                    },
                                }}
                            >
                                {address ? (expired ? "Voting Ended" : "Submit Vote") : "Connect Wallet"}
                            </MainButton>
                        </Stack>
                    </Fade>
                </VoteContainer>
            </Container>
        </>
    );
}

