import React, { useState } from "react";
import { TabContext, TabPanel } from "@mui/lab";
import { Box, Container, Grid } from "@mui/material";
import CreateDemocraticVote from "./DemocraticVoting/DemocraticVoting";
import DemocraticVotesList from "./DemocraticVoting/DemocraticVotesList";
import VoteOnProposal from "./DemocraticVoting/VoteOnProposal";
import HodlVoting from "./Hodl/HodlVoting";
import { EmojiPeopleIcon, HowToVoteIcon, SecurityIcon } from "@/assets/icons";
import CustomTabs from "@/components/common/CustomTabs/CustomTabs";
import CustomTab from "@/components/common/CustomTabs/CustomTab";
import ListIcon from "@mui/icons-material/List";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import HowToVoteOutlinedIcon from "@mui/icons-material/HowToVoteOutlined";
import MockModeIndicator from "@/components/common/MockModeIndicator";
import TokenInfoWidget from "@/components/common/TokenInfoWidget";

const Vote = () => {
    const [tabId, setTabId] = useState("1");

    const handleChange = (event, newValue) => {
        setTabId(newValue);
    };

    return (
            <Container maxWidth="xl">
                <MockModeIndicator />
                
                <Grid container spacing={3}>
                    {/* Sidebar with Token Info */}
                    <Grid item xs={12} md={3}>
                        <TokenInfoWidget />
                    </Grid>

                    {/* Main Voting Content */}
                    <Grid item xs={12} md={9}>
                        <TabContext value={tabId}>
                            <Box
                                sx={{
                                    borderBottom: 1,
                                    borderColor: "divider",
                                    display: "flex",
                                    justifyContent: { xs: "center", md: "left" },
                                    mb: 2,
                                    overflowX: "auto",
                                }}
                            >
                                <CustomTabs onChange={handleChange} aria-label="voting tabs" variant="scrollable" scrollButtons="auto">
                                    <CustomTab
                                        icon={<ListIcon />}
                                        label="All Votes"
                                        value={"1"}
                                        selected={tabId}
                                        sx={{ minWidth: { xs: "100px", md: "120px" } }}
                                    />
                                    <CustomTab
                                        icon={<HowToVoteOutlinedIcon />}
                                        label="Vote"
                                        value={"2"}
                                        selected={tabId}
                                        sx={{ minWidth: { xs: "100px", md: "120px" } }}
                                    />
                                    <CustomTab
                                        icon={<AddCircleIcon />}
                                        label="Create"
                                        value={"3"}
                                        selected={tabId}
                                        sx={{ minWidth: { xs: "100px", md: "120px" } }}
                                    />
                                    <CustomTab
                                        icon={<SecurityIcon />}
                                        label="HODL"
                                        value={"4"}
                                        selected={tabId}
                                        sx={{ minWidth: { xs: "100px", md: "120px" } }}
                                    />
                                </CustomTabs>
                            </Box>

                            <TabPanel value="1" sx={{ px: { md: 2, xs: 0 }, py: 2 }}>
                                <DemocraticVotesList />
                            </TabPanel>
                            <TabPanel value="2" sx={{ px: { md: 2, xs: 0 }, py: 2 }}>
                                <VoteOnProposal />
                            </TabPanel>
                            <TabPanel value="3" sx={{ px: { md: 2, xs: 0 }, py: 2 }}>
                                <CreateDemocraticVote />
                            </TabPanel>
                            <TabPanel value="4" sx={{ px: { md: 2, xs: 0 }, py: 2 }}>
                                <HodlVoting />
                            </TabPanel>
                        </TabContext>
                    </Grid>
                </Grid>
            </Container>
      
    );
};

export default Vote;
