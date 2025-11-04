import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import React from "react";
import Post from "./Post";
import { useGetPostsQuery } from "@/api/slices/socialApi";

const Posts = ({ postData, useApiData = false, queryParams = {} }) => {
    // Use API data if requested, otherwise use passed postData
    const { data, error, isLoading } = useGetPostsQuery(queryParams, {
        skip: !useApiData
    });

    if (useApiData) {
        if (isLoading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Alert severity="error" sx={{ mt: 2 }}>
                    Failed to load posts: {error.data?.message || 'Something went wrong'}
                </Alert>
            );
        }

        const posts = data?.data?.posts || [];
        
        if (posts.length === 0) {
            return (
                <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary">
                        No posts yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Be the first to share something!
                    </Typography>
                </Box>
            );
        }

        return (
            <Box mt={3}>
                {posts.map((post) => (
                    <Post key={post._id} data={post} />
                ))}
            </Box>
        );
    }

    // Fallback to original behavior with passed postData
    if (!postData || postData.length === 0) {
        return (
            <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                    No posts to display
                </Typography>
            </Box>
        );
    }

    return (
        <Box mt={3}>
            {postData.map((post) => (
                <Post key={post.id || post._id} data={post} />
            ))}
        </Box>
    );
};

export default Posts;
