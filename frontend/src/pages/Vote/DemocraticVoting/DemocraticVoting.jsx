import { useState } from "react";
import {
    Box,
    Typography,
    Stack,
    Avatar,
    AvatarGroup,
    Container,
    useTheme,
    LinearProgress,
    Divider,
    Fade,
} from "@mui/material";
import Loading from "@/components/common/loading";
import MainButton from "@/components/common/MainButton/MainButton";
import { useToast } from "@/hooks/useToast.jsx";
import InputFeild from "@/components/common/InputFeild/InputFeild";
import { useTokenWriteFunction } from "@/connectivityAssets/hooks";
import { useGenrelContext } from "@/context/GenrelContext";
import { useAppKit } from "@reown/appkit/react";
import VoteContainer from "@/components/common/VoteContainer/VoteContainer";

const votingOptions = [{ id: 1, label: "1% - Reduce fees", percentage: 0 }];

const participants = [
    { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/250px-User_icon_2.svg.png" },
    { img: "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740" },
    { img: "https://static.vecteezy.com/system/resources/thumbnails/004/607/791/small_2x/man-face-emotive-icon.jpg" },
    { img: "https://static.vecteezy.com/system/resources/thumbnails/004/607/791/small_2x/man-face-emotive-icon.jpg" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRI9lRck6miglY0SZF_BZ_sK829yiNskgYRUg&s" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnSA1zygA3rubv-VK0DrVcQ02Po79kJhXo_A&s" },
];

export default function DemocraticVoting() {
    const theme = useTheme();
    const { address } = useGenrelContext();
    const { open } = useAppKit();
    const { handleWriteContract } = useTokenWriteFunction();

    const [title, setTitle] = useState({ text: "", error: "" });
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const onTextChange = (e) => {
        const text = e.target.value;
        setTitle({
            text,
            error: text?.trim().length < 2 ? "Minimum two characters required" : "",
        });
    };


    const vote = async () => {
        if (title.text.trim().length < 2) {
            showToast("Minimum two characters allowed", "error");
            return;
        }
        try {
            setIsLoading(true);
            await handleWriteContract("createDemocraticVote", [title.text], address);
        } catch (error) {
            const errMsg = error?.data?.message || error?.reason || error?.message || "Voting failed";
            showToast(errMsg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Loading isLoading={isLoading} />
            <Container maxWidth="md">
                <VoteContainer>
                    <Fade in timeout={300}>
                        <Stack spacing={2}>
                            <Typography variant="h4" fontWeight={600} color="text.primary">
                                🗳️ Democratic Voting
                            </Typography>

                            <Typography variant="body1" color="text.secondary" fontWeight={500}>
                                View results and participate in democratic voting
                            </Typography>

                            <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />

                            <Typography variant="h6" fontWeight={500} color="text.secondary">
                                What should the transaction fees be set to?
                            </Typography>

                            <Stack spacing={2}>
                                {votingOptions.map((option) => (
                                    <Box key={option.id}>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="body2" color="text.primary">
                                                {option.label}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600} color="text.secondary">
                                                {option.percentage}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={option.percentage}
                                            sx={{
                                                height: 10,
                                                borderRadius: 5,
                                                backgroundColor: theme.palette.background.default,
                                                "& .MuiLinearProgress-bar": {
                                                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                                    boxShadow: `0 0 8px ${theme.palette.primary.main}`,
                                                },
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Stack>

                            <Typography variant="body2" color="text.secondary" textAlign="center" mt={2}>
                                Your Balance: 0
                            </Typography>

                            <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} mt={3}>
                                <AvatarGroup max={4}>
                                    {participants.map((p, i) => (
                                        <Avatar key={i} src={p.img} />
                                    ))}
                                </AvatarGroup>
                                <Typography variant="body2" color="text.secondary">
                                    {participants.length} Participants
                                </Typography>
                            </Stack>

                            <InputFeild
                                placeholder="Vote ID"
                                name="voteId"
                                type="text"
                                value={title.text}
                                onChange={onTextChange}
                                error={title.error}
                            />

                            <MainButton
                                onClick={address ? vote : open}
                                fullWidth
                                sx={{
                                    mt: 2,
                                    fontWeight: 600,
                                    background: theme.palette.primary.main,
                                    ":hover": {
                                        background: theme.palette.primary.dark,
                                    },
                                }}
                            >
                                {address ? "Submit Vote" : "Connect Wallet"}
                            </MainButton>
                        </Stack>
                    </Fade>
                </VoteContainer>
            </Container>
        </>
    );
}
