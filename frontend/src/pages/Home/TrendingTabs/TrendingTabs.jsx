import React, { useEffect, useState } from "react";
import { TabContext, TabPanel } from "@mui/lab";
import { Box, Container } from "@mui/material";
import CustomTabs from "@/components/common/CustomTabs/CustomTabs";
import CustomTab from "@/components/common/CustomTabs/CustomTab";
import { useNavigate, useLocation } from "react-router-dom";

import { 
    StreamIcon, 
    ExploreIcon, 
    FollowingIcon, 
    ForYouIcon,
    TimelineIcon 
} from "@/assets/icons";

// Import actual feed components
import ForYouFeed from "@/components/Feed/ForYouFeed";
import FollowingFeed from "@/components/Feed/FollowingFeed";
import TrendingFeed from "@/components/Feed/TrendingFeed";
import DiscoverFeed from "@/components/Feed/DiscoverFeed";

// Tab configuration matching sidebar routes
const tabConfig = {
    foryou: { tabId: "1", route: "/social/foryou", label: "For You", icon: ForYouIcon },
    following: { tabId: "2", route: "/social/following", label: "Following", icon: FollowingIcon },
    trending: { tabId: "3", route: "/social/trending", label: "Trending", icon: TimelineIcon },
    discover: { tabId: "4", route: "/social/discover", label: "Discover", icon: ExploreIcon },
};

const TrendingTabs = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [tabId, setTabId] = useState("1");

    const handleChange = (event, newValue) => {
        setTabId(newValue);
        // Navigate to the corresponding route
        const tab = Object.values(tabConfig).find(t => t.tabId === newValue);
        if (tab) {
            navigate(tab.route);
        }
    };

    useEffect(() => {
        // Sync tab with current route
        const currentPath = location.pathname;
        const matchedTab = Object.values(tabConfig).find(tab => 
            currentPath.includes(tab.route.split('/').pop())
        );
        if (matchedTab) {
            setTabId(matchedTab.tabId);
        }
    }, [location.pathname]);
    return (
        <TabContext value={tabId}>
            <Box
                sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                    display: "flex",
                    justifyContent: { xs: "center", md: "center" },
                    mb: 1,
                    mt: 2,
                }}
            >
                <CustomTabs onChange={handleChange} aria-label="social feed tabs">
                    {Object.values(tabConfig).map((tab) => (
                        <CustomTab 
                            key={tab.tabId}
                            icon={<tab.icon />} 
                            label={tab.label} 
                            value={tab.tabId} 
                            selected={tabId} 
                            sx={{ px: 0.5 }} 
                        />
                    ))}
                </CustomTabs>
            </Box>

            {tabId === "1" && (
                <TabPanel value="1" sx={{ p: 0 }}>
                    <ForYouFeed />
                </TabPanel>
            )}
            {tabId === "2" && (
                <TabPanel value="2" sx={{ p: 0 }}>
                    <FollowingFeed />
                </TabPanel>
            )}
            {tabId === "3" && (
                <TabPanel value="3" sx={{ p: 0 }}>
                    <TrendingFeed />
                </TabPanel>
            )}
            {tabId === "4" && (
                <TabPanel value="4" sx={{ p: 0 }}>
                    <DiscoverFeed />
                </TabPanel>
            )}
        </TabContext>
    );
};

export default TrendingTabs;
