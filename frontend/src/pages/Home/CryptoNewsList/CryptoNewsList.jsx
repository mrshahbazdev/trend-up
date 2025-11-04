import React, { useEffect, useState } from "react";
import { Card, CardContent, Typography, Stack, Box, useTheme, IconButton, CircularProgress } from "@mui/material";
import { motion } from "framer-motion";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LaunchIcon from "@mui/icons-material/Launch";
import { useGetCryptoNewsQuery } from "@/api/cryptoNewsApi";
import { store } from "@/store/srore";


const MotionBox = motion(Box);

// Animation Variants
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1 },
    }),
};

const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const CryptoNewsList = () => {
    console.log(store.getState().cryptoNewsApi);
   const [news, setNews] = useState([]);
    
    // ✅ Calling the RTK query hook
    const { data, isLoading, error } = useGetCryptoNewsQuery();

    // 🔍 Logging to debug hook structure
    useEffect(() => {
        console.log({ data, isLoading, error }, "GET_NEWS_STATUS");
    }, [data, isLoading, error]);

    // ✅ Sync state when data is available
    useEffect(() => {
        if (data?.results?.length) {
            setNews(data.results.slice(0, 5));
        }
    }, [data]);
  
    const theme = useTheme();

    if (isLoading) return <CircularProgress />;

    return (
        <Stack spacing={2}>
            {/* <MainButton onClick={refetch}> fetch </MainButton> */}
            {news.map((item, i) => (
                <MotionBox
                    key={item.id}
                    custom={i}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.015 }}
                >
                    <Card
                        sx={{
                            borderRadius: 3,
                            p: 2,
                            background: theme.palette.mode === "dark" ? "#1a1a1a" : "#f5f5f5",
                            boxShadow: "0px 6px 18px rgba(0, 0, 0, 0.1), 0px 1px 3px rgba(0,0,0,0.06)",
                            transition: "all 0.3s ease-in-out",
                            cursor: "pointer",
                            "&:hover": {
                                boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15), 0px 1px 5px rgba(0,0,0,0.1)",
                            },
                        }}
                    >
                        <CardContent>
                            <Stack spacing={1}>
                                <Typography
                                    variant="h6"
                                    fontSize={"17px"}
                                    fontWeight={700}
                                    color={theme.palette.text.primary}
                                >
                                    {item.title}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color={theme.palette.text.secondary}
                                    sx={{
                                        lineHeight: 1.6,
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                    }}
                                >
                                    {item.description}
                                </Typography>

                                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <AccessTimeIcon fontSize="small" />
                                        <Typography variant="caption">{formatDate(item.published_at)}</Typography>
                                    </Stack>
                                    <IconButton>
                                        <a
                                            href={`https://cryptopanic.com/news/${item.id}/${item?.slug}`}
                                            style={{ textDecoration: "none" }}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {" "}
                                            <LaunchIcon fontSize="small" sx={{ opacity: 0.6 }} />{" "}
                                        </a>
                                    </IconButton>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </MotionBox>
            ))}
        </Stack>
    );
};

export default CryptoNewsList;
