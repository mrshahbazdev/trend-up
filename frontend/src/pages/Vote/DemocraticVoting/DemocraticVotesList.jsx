import { useState, useEffect } from "react";
import { 
    Box, Typography, Stack, Container, Grid, 
    Chip, useTheme, Button, Dialog, DialogTitle, 
    DialogContent, DialogActions, LinearProgress 
} from "@mui/material";
import { useDemocraticVotesLength, useDemocraticVote, useDemocraticVoteResult } from "@/connectivityAssets/hooks";
import Loading from "@/components/common/loading";

function VoteDetailModal({ open, onClose, voteId }) {
    const { result, isLoading } = useDemocraticVoteResult(voteId);
    const { voteData } = useDemocraticVote(voteId);
    const theme = useTheme();

    if (isLoading || !result) return null;

    const [message, yesPercentage, noPercentage, totalVotes] = result;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Typography variant="h6" fontWeight={600}>
                    {voteData?.[0] || "Vote Details"}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        {message}
                    </Typography>
                    
                    <Box>
                        <Stack direction="row" justifyContent="space-between" mb={1}>
                            <Typography variant="body2">Yes: {yesPercentage?.toString()}%</Typography>
                            <Typography variant="body2">No: {noPercentage?.toString()}%</Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={Number(yesPercentage || 0)}
                            sx={{
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: theme.palette.background.default,
                                "& .MuiLinearProgress-bar": {
                                    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                                },
                            }}
                        />
                    </Box>

                    <Typography variant="caption" color="text.disabled">
                        Total Votes: {totalVotes?.toString() || 0}
                    </Typography>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}

function VoteCard({ voteId, onClick }) {
    const { voteData } = useDemocraticVote(voteId);
    const theme = useTheme();

    if (!voteData) return null;

    const [title, totalVotes, votedYes, expiryTimestamp] = voteData;
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = Number(expiryTimestamp) - now;
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    
    const yesPercent = Number(totalVotes) > 0 ? (Number(votedYes) / Number(totalVotes)) * 100 : 0;
    const noPercent = 100 - yesPercent;

    return (
        <Box
            onClick={onClick}
            sx={{
                p: 2.5,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                cursor: 'pointer',
                background: theme.palette.mode === "dark"
                    ? "linear-gradient(145deg, rgba(25,25,25,1) 0%, rgba(40,40,40,1) 100%)"
                    : "linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(248,249,250,1) 100%)",
                transition: 'all 0.3s ease',
                '&:hover': {
                    boxShadow: theme.palette.mode === "dark" ? 
                        "0 8px 24px rgba(0,0,0,0.8)" : 
                        "0 8px 24px rgba(0,0,0,0.15)",
                    transform: 'translateY(-2px)',
                }
            }}
        >
            <Stack spacing={1.5}>
                <Typography variant="h6" fontWeight={600}>
                    #{voteId} - {title}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip 
                        label={timeRemaining > 0 ? `${days}d ${hours}h left` : "Ended"} 
                        size="small"
                        color={timeRemaining > 0 ? "primary" : "default"}
                    />
                    <Chip 
                        label={`${totalVotes?.toString()} votes`} 
                        size="small"
                        variant="outlined"
                    />
                </Stack>

                <LinearProgress
                    variant="determinate"
                    value={yesPercent}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.background.default,
                        "& .MuiLinearProgress-bar": {
                            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                        },
                    }}
                />

                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="success.main">
                        ✅ {yesPercent.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="error.main">
                        ❌ {noPercent.toFixed(1)}%
                    </Typography>
                </Stack>
            </Stack>
        </Box>
    );
}

export default function DemocraticVotesList() {
    const { votesCount, isLoading } = useDemocraticVotesLength();
    const [selectedVoteId, setSelectedVoteId] = useState(null);
    const [votes, setVotes] = useState([]);

    useEffect(() => {
        if (votesCount) {
            const count = Number(votesCount);
            const voteIds = Array.from({ length: count }, (_, i) => i);
            setVotes(voteIds);
        }
    }, [votesCount]);

    if (isLoading) return <Loading isLoading={true} />;

    return (
        <Container maxWidth="lg">
            <Stack spacing={3}>
                <Typography variant="h4" fontWeight={600}>
                    All Democratic Votes ({votes.length})
                </Typography>

                {votes.length === 0 ? (
                    <Box sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 2
                    }}>
                        <Typography variant="body1" color="text.secondary">
                            No democratic votes found. Create the first one!
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2}>
                        {votes.map((voteId) => (
                            <Grid item xs={12} md={6} key={voteId}>
                                <VoteCard 
                                    voteId={voteId} 
                                    onClick={() => setSelectedVoteId(voteId)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Stack>

            <VoteDetailModal
                open={selectedVoteId !== null}
                onClose={() => setSelectedVoteId(null)}
                voteId={selectedVoteId}
            />
        </Container>
    );
}

