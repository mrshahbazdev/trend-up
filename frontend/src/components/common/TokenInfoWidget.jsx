import { Box, Typography, Stack, Grid, Chip, useTheme } from "@mui/material";
import { useTokenBalance } from "@/connectivityAssets/hooks";
import { useGenrelContext } from "@/context/GenrelContext";
import { formatUnits } from "viem";
import { MOCK_WEB3_DATA } from "@/constants";

const TokenInfoWidget = () => {
    const theme = useTheme();
    const { address } = useGenrelContext();
    const { balance } = useTokenBalance(address);

    const formatBalance = (bal) => {
        if (!bal) return '0';
        const formatted = formatUnits(bal, 18);
        return parseFloat(formatted).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <Box
            sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                background: theme.palette.mode === "dark"
                    ? "linear-gradient(145deg, rgba(25,25,25,1) 0%, rgba(40,40,40,1) 100%)"
                    : "linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(248,249,250,1) 100%)",
                boxShadow: theme.palette.mode === "dark" ? "0 0 12px rgba(0,0,0,0.7)" : "0 0 8px rgba(0,0,0,0.05)",
            }}
        >
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={600}>
                        💎 Your TUP Balance
                    </Typography>
                    <Chip label={MOCK_WEB3_DATA.tokenSymbol} size="small" color="primary" />
                </Stack>

                <Typography variant="h4" fontWeight={700} color="primary.main">
                    {formatBalance(balance)} TUP
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                            Token Name
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                            {MOCK_WEB3_DATA.tokenName}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                            Symbol
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                            {MOCK_WEB3_DATA.tokenSymbol}
                        </Typography>
                    </Grid>
                </Grid>

                {address && (
                    <Typography variant="caption" color="text.disabled" sx={{ wordBreak: 'break-all' }}>
                        Wallet: {address.slice(0, 6)}...{address.slice(-4)}
                    </Typography>
                )}
            </Stack>
        </Box>
    );
};

export default TokenInfoWidget;

