import CreatePost from "@/components/CreatePost/CreatePost";
import Posts from "@/components/Post/Posts";
import ForYouFeed from "@/components/Feed/ForYouFeed";
import { Box, Container, Grid2, Typography, useMediaQuery } from "@mui/material";
import React, { useState } from "react";
import CryptoNewsList from "./CryptoNewsList/CryptoNewsList";
import CryptoMarketList from "./CryptoMarketList/CryptoMarketList";
import { useTheme } from "@emotion/react";
import { TabContext, TabPanel } from "@mui/lab";
import CustomTabs from "@/components/common/CustomTabs/CustomTabs";
import CustomTab from "@/components/common/CustomTabs/CustomTab";
import { CryptoMarketIcon, FeedIcon, TimelineIcon } from "@/assets/icons";
import TrendingTabs from "./TrendingTabs/TrendingTabs";

const DesktopScreen = () => (
    <Box>
        <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, md: 3 }} sx={{ display: { xs: "none", md: "block" } }}>
                <Typography variant="h2" color="textSecondary" sx={{ mb: 2, ml: 1 }}>
                    Latest Crypto News
                </Typography>
                <CryptoNewsList />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6 }} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TrendingTabs />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 3 }} sx={{ display: { xs: "none", md: "block" } }}>
                <Typography variant="h2" color="textSecondary" sx={{ mb: 2, ml: 1 }}>
                    Latest Market Trends
                </Typography>
                <CryptoMarketList />
            </Grid2>
        </Grid2>
    </Box>
);

const MobileScreen = ({ handleChange, tabId }) => {
    return (
        <Box>
            <TabContext value={tabId}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <CustomTabs onChange={handleChange} aria-label="home tabs">
                        <CustomTab icon={<FeedIcon />} label="Crypto News" value={1} selected={tabId} />
                        <CustomTab icon={<TimelineIcon />} label="News Feed" value={2} selected={tabId} />
                        <CustomTab icon={<CryptoMarketIcon />} label="Crypto Market" value={3} selected={tabId} />
                    </CustomTabs>
                </Box>
                <TabPanel value={1}  sx={{ px: { md: 2, xs: 0 }, py: 2 }}>
                    <Typography variant="h2" color="textSecondary" sx={{ mb: 2, ml: 1 }}>
                        Latest Crypto News
                    </Typography>
                    <CryptoNewsList />
                </TabPanel>
                <TabPanel value={2} sx={{ px: { md: 2, xs: 0 }, py: 2 }}>
                    <TrendingTabs />
                </TabPanel>
                <TabPanel value={3} sx={{ px: { md: 2, xs: 0 }, py: 2 }}>
                    {" "}
                    <Typography variant="h2" color="textSecondary" sx={{ mb: 2, ml: 1 }}>
                        Latest Market Trends
                    </Typography>
                    <CryptoMarketList />
                </TabPanel>
            </TabContext>
        </Box>
    );
};

const Home = () => {
    const theme = useTheme();
    const isMdup = useMediaQuery(theme.breakpoints.up("lg"));



    const [tabId, setTabId] = useState(1);

    const handleChange = (event, newValue) => {
        setTabId(newValue);
    };
    return <Box>{isMdup ? <DesktopScreen /> : <MobileScreen handleChange={handleChange} tabId={tabId} />}</Box>;
};

export default Home;
