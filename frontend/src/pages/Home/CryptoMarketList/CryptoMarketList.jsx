import { useGetCryptoMarketQuery } from "@/api/slices/coingeckoApi";
import coinIcons from "@/assets";
import { Card, Typography, CircularProgress, Box, Avatar, Paper } from "@mui/material";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";

const MotionBox = motion(Box);
const mockPriceSeries = (price) => {
    const fluctuation = 0.05; // 5% fluctuation
    const length = 30; // longer series (e.g. simulate 30 min or days)

    const series = Array.from({ length }, () => {
        const variation = (Math.random() - 0.5) * 2 * fluctuation; // -5% to +5%
        price += price * variation;
        return +price.toFixed(2);
    });

    return series;
};
const CryptoMarketList = () => {
    const { data, isLoading } = useGetCryptoMarketQuery();

    if (isLoading) return <CircularProgress />;
    return (
        <Box display="flex" gap={2} flexDirection={"column"} justifyContent="center" alignItems={"center"} p={2}>
            {Object.entries(data).map(([coin, info]) => {
                const prices = mockPriceSeries(info.usd);
                const isUpwardTrend = prices[prices.length - 1] >= prices[0];

                const lineColor = isUpwardTrend ? "#16b48e" : "#e53935";
                const areaColor = isUpwardTrend ? "rgba(22,180,142,0.1)" : "rgba(229,57,53,0.1)";

                const chartOptions = {
                    grid: { left: 0, right: 0, top: 0, bottom: 0 },
                    xAxis: {
                        type: "category",
                        boundaryGap: false,
                        show: false,
                        data: prices.map((_, i) => i),
                    },
                    yAxis: { type: "value", show: false },
                    series: [
                        {
                            data: prices,
                            type: "line",
                            smooth: true,
                            showSymbol: false,
                            lineStyle: { width: 2, color: lineColor },
                            areaStyle: { color: areaColor },
                        },
                    ],
                };
                return (
                    <MotionBox
                        key={coin}
                        component={Paper}
                        elevation={4}
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        sx={{
                            p: 2,
                            minWidth: 240,
                            borderRadius: 3,
                            background: (theme) => (theme.palette.mode === "dark" ? "#1e1e1e" : "#fafafa"),
                            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={2}>
                            <Avatar src={coinIcons[coin]} alt={coin} sx={{ width: 48, height: 48 }} />
                            <Box>
                                <Typography variant="h6" fontWeight={600} textTransform="capitalize">
                                    {coin}
                                </Typography>
                                <Typography variant="body1" color={isUpwardTrend ? "success.main" : "error.main"}>
                                    ${info.usd.toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>

                        <ReactECharts
                            option={chartOptions}
                            style={{ height: 60, width: "100%" }}
                            opts={{ renderer: "svg" }}
                        />
                    </MotionBox>
                );
            })}
        </Box>
    );
};

export default CryptoMarketList;
