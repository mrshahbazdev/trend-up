import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BoxConatner from "../common/BoxContainer/BoxConatner";
import AnimatedDialog from "../common/AnimatedDialog";
import RealtimeReactionCounter from "../common/RealtimeReactionCounter";
import LiveCommentFeed from "../common/LiveCommentFeed";
import ReactionPicker from "../common/ReactionPicker";
import ReactionButton from "../common/ReactionButton";
import CommentThread from "../common/CommentThread";
import CommentSection from "../common/CommentSection";
import ShareModal from "../common/ShareModal";
import {
  IconButton, 
  Stack, 
  Typography, 
  useTheme,
  Avatar,
  Box,
  Chip,
  Menu,
  MenuItem,
  Button,
  TextField,
} from "@mui/material";
import {
    CommentBorderIcon,
    CommentIcon,
    HeartBorderIcon,
    HeartIcon,
    LikeBorderIcon,
    LikeIcon,
    MoreHorizIcon,
    ShareIcon,
    BookmarkBorderIcon,
    BookmarkIcon,
    FlagIcon,
    DeleteIcon,
    EmojiEmotionsIcon,
    TrendingUpIcon,
    LocalFireDepartmentIcon,
} from "@/assets/icons";
import UserUI from "../common/UserUi/UserUI";
import Poll from "../Poll/Poll";
import Prediction from "../Prediction/Prediction";
import { 
  useReactToPostMutation, 
  useGetPostReactionsQuery,
  useGetPostCommentsQuery,
  useCreateCommentMutation,
  useReactToCommentMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useDeletePostMutation,
} from "@/api/slices/socialApi";
import { useSelector } from "react-redux";
import { useToast } from "@/hooks/useToast";
import { usePostRoom, useRealtimeUpdates, useTypingIndicator } from "@/hooks/useSocket";
import { formatDistanceToNow } from "date-fns";

const MotionIconButton = motion(IconButton);
const bounceEffect = {
    whileTap: { scale: 1.4 },
    transition: { type: "spring", stiffness: 300, damping: 10 },
};

// Helper function to safely format dates
const formatDate = (dateString) => {
    // Handle null, undefined, empty string, or invalid values
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
        return 'Just now';
    }
    
    try {
        // Convert to Date object
        const date = new Date(dateString);
        
        // Check if the date is valid
        if (isNaN(date.getTime()) || date.getTime() === 0) {
            return 'Just now';
        }
        
        // Check if date is in the future (which might cause issues)
        if (date.getTime() > Date.now()) {
            return 'Just now';
        }
        
        // Use formatDistanceToNow for valid dates
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
        return 'Just now';
    }
};

const Post = ({ data }) => {
    const theme = useTheme();
    const { user: currentUser } = useSelector((state) => state.user);
    const { showToast } = useToast();
    
    
    // Safety check for data
    if (!data || !data._id) {
        console.warn('Post component received invalid data:', data);
        return null;
    }
    
    // API hooks
    const [reactToPost] = useReactToPostMutation();
    const [createComment] = useCreateCommentMutation();
    const [reactToComment] = useReactToCommentMutation();
    const [followUser] = useFollowUserMutation();
    const [unfollowUser] = useUnfollowUserMutation();
    const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
    
    const { data: reactions } = useGetPostReactionsQuery(data._id);
    const { data: comments, refetch: refetchComments } = useGetPostCommentsQuery({ 
        postId: data._id, 
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    
    // Real-time hooks
    usePostRoom(data._id, true); // Join post room for real-time updates
    
    // Real-time updates handler
    const handleRealtimeUpdate = (update) => {
        console.log('[Post] Real-time update received:', update);
        // Handle different types of real-time updates
        switch (update.type) {
            case 'reaction_added':
                showToast('New reaction added!', 'info');
                break;
            case 'comment_added':
                showToast('New comment added!', 'info');
                break;
            case 'poll_voted':
                showToast('Someone voted on the poll!', 'info');
                break;
            case 'prediction_staked':
                showToast('New prediction stake!', 'info');
                break;
            default:
                break;
        }
    };
    
    useRealtimeUpdates(data._id, handleRealtimeUpdate);
    
    // Typing indicator hooks
    const { startTyping, stopTyping } = useTypingIndicator(
        data._id,
        currentUser?._id,
        (data) => console.log('[Post] User started typing:', data),
        (data) => console.log('[Post] User stopped typing:', data)
    );
    
    // Local state
    const [showComments, setShowComments] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [userReactions, setUserReactions] = useState({});
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [reactionPickerAnchor, setReactionPickerAnchor] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);

    // Handle reactions
    const handleReaction = useCallback(async (reactionType) => {
        try {
            await reactToPost({ postId: data._id, reactionType }).unwrap();
            setUserReactions(prev => ({
                ...prev,
                [reactionType]: !prev[reactionType]
            }));
        } catch (error) {
            showToast('Failed to react to post', 'error');
        }
    }, [reactToPost, data._id, showToast]);

    // Handle reaction picker
    const handleReactionPickerOpen = (event) => {
        setReactionPickerAnchor(event.currentTarget);
        setShowReactionPicker(true);
    };

    const handleReactionPickerClose = () => {
        setShowReactionPicker(false);
        setReactionPickerAnchor(null);
    };

    // Handle follow/unfollow
    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await unfollowUser(data.author._id).unwrap();
                setIsFollowing(false);
                showToast('Unfollowed user', 'success');
            } else {
                await followUser(data.author._id).unwrap();
                setIsFollowing(true);
                showToast('Following user', 'success');
            }
        } catch (error) {
            showToast('Failed to follow/unfollow user', 'error');
        }
    };

    // Handle comment submission
    const handleCommentSubmit = useCallback(async (content, parentCommentId = null) => {
        if (!content || !content.trim()) return;
        
        try {
            await createComment({ 
                postId: data._id, 
                content: content.trim(),
                parentCommentId: parentCommentId
            }).unwrap();
            
            showToast(parentCommentId ? 'Reply added' : 'Comment added', 'success');
            // Refetch comments to show the new comment
            refetchComments();
        } catch (error) {
            console.error('Comment submission error:', error);
            showToast(parentCommentId ? 'Failed to add reply' : 'Failed to add comment', 'error');
        }
    }, [createComment, data._id, showToast, refetchComments]);


    // Handle comment reaction
    const handleCommentReaction = useCallback(async (commentId, reactionType) => {
        try {
            await reactToComment({ commentId, reactionType }).unwrap();
        } catch (error) {
            showToast('Failed to react to comment', 'error');
        }
    }, [reactToComment, showToast]);

    // Handle delete post
    const handleDeletePost = async () => {
        try {
            await deletePost(data._id).unwrap();
            showToast('Post deleted successfully', 'success');
            setShowDeleteDialog(false);
            setMenuAnchor(null);
        } catch (error) {
            showToast(error.data?.message || 'Failed to delete post', 'error');
        }
    };

    // Get reaction count
    const getReactionCount = (type) => {
        if (!reactions?.data?.reactionCounts) return 0;
        const reactionData = reactions.data.reactionCounts.find(r => r.reactionType === type);
        return reactionData?.count || 0;
    };

    // Check if user has reacted
    const hasUserReacted = (type) => {
        // Check local state first
        if (userReactions[type] !== undefined) {
            return userReactions[type];
        }
        // Fallback to API data
        return reactions?.data?.userReactions?.includes(type) || false;
    };

    const getColor = (type) => {
        return hasUserReacted(type) ? theme.palette.primary.main : theme.palette.text.secondary;
    };

    return (
        <BoxConatner sx={{ mb: 2 }}>
            {/* Post Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar 
                        src={data.author?.avatar} 
                        alt={data.author?.username}
                        sx={{ width: 40, height: 40 }}
                    />
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                            {data.author?.username || data.author?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {formatDate(data.createdAt)}
                        </Typography>
                    </Box>
                </Stack>
                
                <Stack direction="row" spacing={1}>
                    {data.author?._id !== currentUser?._id && (
                        <Button 
                            size="small" 
                            variant={isFollowing ? "outlined" : "contained"}
                            onClick={handleFollow}
                        >
                            {isFollowing ? "Following" : "Follow"}
                        </Button>
                    )}
                    <IconButton 
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                        color={theme.palette.secondary.main}
                    >
                        <MoreHorizIcon />
                    </IconButton>
                </Stack>
                </Stack>

            {/* Post Content */}
            <Typography color={theme.palette.text.primary} fontWeight={400} mt={2} sx={{ whiteSpace: 'pre-wrap' }}>
                {data.content}
                </Typography>

            {/* Hashtags */}
            {data.hashtags && data.hashtags.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                    {data.hashtags.map((tag, index) => (
                        <Chip 
                            key={index} 
                            label={`#${tag}`} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                        />
                    ))}
                </Stack>
            )}

            {/* Post Media/Poll/Prediction */}
            {data.postType === 'poll' && data.pollOptions ? (
                <Box sx={{ mt: 2 }}>
                    <Poll pollData={data} postId={data._id} />
                </Box>
            ) : data.postType === 'prediction' && data.predictionData ? (
                <Box sx={{ mt: 2 }}>
                    <Prediction predictionData={data} postId={data._id} />
                </Box>
            ) : data.mediaUrls && data.mediaUrls.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                    {data.mediaUrls.map((url, index) => {
                        // Check file type
                        const isVideo = url.match(/\.(mp4|webm|ogg)$/i) || 
                                       data.postType === 'video' ||
                                       url.includes('video/');
                        
                        const isAudio = url.match(/\.(mp3|wav|ogg|m4a)$/i) || 
                                       data.postType === 'audio' ||
                                       url.includes('audio/');
                        
                        if (isVideo) {
                            return (
                                <video
                                    key={index}
                                    src={url}
                                    controls
                                    style={{ 
                                        width: "100%", 
                                        marginTop: "10px", 
                                        borderRadius: "10px",
                                        maxHeight: "400px"
                                    }}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            );
                        } else if (isAudio) {
                            return (
                                <Box
                                    key={index}
                                    sx={{
                                        mt: 1,
                                        p: 2,
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        background: 'background.paper',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <Typography variant="body2" fontWeight={500} sx={{ minWidth: 80 }}>
                                        🎵 Audio
                                    </Typography>
                                    <audio
                                        src={url}
                                        controls
                                        style={{ flexGrow: 1 }}
                                    >
                                        Your browser does not support the audio tag.
                                    </audio>
                                </Box>
                            );
                        } else {
                            return (
                                <img
                                    key={index}
                                    src={url}
                        width="100%"
                        style={{ marginTop: "10px", borderRadius: "10px" }}
                                    alt="post media"
                                />
                            );
                        }
                    })}
                </Box>
            ) : null}

            {/* Post Stats */}
            <Stack direction="row" spacing={2} mt={2} alignItems="center" sx={{ position: 'relative' }}>
                {/* Quick Reactions - Most Popular */}
                <Stack direction="row" spacing={1} alignItems="center">
                    {/* Heart */}
                    <ReactionButton
                        postId={data._id}
                        reactionType="HEART"
                        icon={HeartBorderIcon}
                        filledIcon={HeartIcon}
                        emoji="❤️"
                        color="#E91E63"
                        hoverColor="#F06292"
                        isActive={hasUserReacted("HEART")}
                        count={getReactionCount("HEART")}
                        onReaction={handleReaction}
                        showCount={true}
                        showFlyingEmoji={true}
                        size="medium"
                    />

                    {/* Like */}
                    <ReactionButton
                        postId={data._id}
                        reactionType="LIKE"
                        icon={LikeBorderIcon}
                        filledIcon={LikeIcon}
                        emoji="👍"
                        color="#2196F3"
                        hoverColor="#42A5F5"
                        isActive={hasUserReacted("LIKE")}
                        count={getReactionCount("LIKE")}
                        onReaction={handleReaction}
                        showCount={true}
                        showFlyingEmoji={true}
                        size="medium"
                    />

                    {/* Fire - Popular crypto reaction */}
                    <ReactionButton
                        postId={data._id}
                        reactionType="FIRE"
                        icon={LocalFireDepartmentIcon}
                        filledIcon={LocalFireDepartmentIcon}
                        emoji="🔥"
                        color="#FF6F00"
                        hoverColor="#FF8F00"
                        isActive={hasUserReacted("FIRE")}
                        count={getReactionCount("FIRE")}
                        onReaction={handleReaction}
                        showCount={true}
                        showFlyingEmoji={true}
                        size="medium"
                    />

                    {/* Bullish - Crypto reaction */}
                    <ReactionButton
                        postId={data._id}
                        reactionType="BULLISH"
                        icon={TrendingUpIcon}
                        filledIcon={TrendingUpIcon}
                        emoji="🚀"
                        color="#00C853"
                        hoverColor="#00E676"
                        isActive={hasUserReacted("BULLISH")}
                        count={getReactionCount("BULLISH")}
                        onReaction={handleReaction}
                        showCount={true}
                        showFlyingEmoji={true}
                        size="medium"
                    />
                    </Stack>

                    {/* Comment */}
                    <Stack direction="row" spacing={0.5} alignItems="center">
                        <MotionIconButton
                        onClick={() => setShowComments(!showComments)}
                        sx={{ color: showComments ? theme.palette.primary.main : theme.palette.text.secondary }}
                            {...bounceEffect}
                        >
                        {showComments ? <CommentIcon /> : <CommentBorderIcon />}
                        </MotionIconButton>
                        <Typography color={theme.palette.secondary.main} fontWeight={600}>
                            {data.commentCount || comments?.data?.pagination?.total || 0}
                        </Typography>
                    </Stack>

                {/* Share */}
                <MotionIconButton
                    onClick={() => setShareModalOpen(true)}
                    sx={{ color: theme.palette.text.secondary }}
                    {...bounceEffect}
                >
                    <ShareIcon />
                </MotionIconButton>

                {/* Bookmark */}
                <MotionIconButton
                    sx={{ color: theme.palette.text.secondary }}
                    {...bounceEffect}
                >
                    <BookmarkBorderIcon />
                </MotionIconButton>

                {/* More Reactions Button */}
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <MotionIconButton
                        onClick={handleReactionPickerOpen}
                        sx={{ 
                            color: theme.palette.text.secondary
                        }}
                        {...bounceEffect}
                    >
                        <EmojiEmotionsIcon />
                    </MotionIconButton>

                    {/* Reaction Picker */}
                    <AnimatePresence>
                        {showReactionPicker && (
                            <ReactionPicker
                                postId={data._id}
                                isOpen={showReactionPicker}
                                onClose={handleReactionPickerClose}
                                onReaction={handleReaction}
                                userReactions={userReactions}
                                reactionCounts={{
                                    HEART: getReactionCount("HEART"),
                                    LIKE: getReactionCount("LIKE"),
                                    FIRE: getReactionCount("FIRE"),
                                    BULLISH: getReactionCount("BULLISH"),
                                    BEARISH: getReactionCount("BEARISH"),
                                    GEM: getReactionCount("GEM"),
                                    MOON: getReactionCount("MOON"),
                                    RUGGED: getReactionCount("RUGGED"),
                                    WAGMI: getReactionCount("WAGMI"),
                                    NGMI: getReactionCount("NGMI"),
                                    ROCKET: getReactionCount("ROCKET"),
                                    DIAMOND: getReactionCount("DIAMOND"),
                                    THINKING: getReactionCount("THINKING"),
                                    LAUGH: getReactionCount("LAUGH"),
                                    SURPRISED: getReactionCount("SURPRISED"),
                                    ANGRY: getReactionCount("ANGRY"),
                                    SAD: getReactionCount("SAD"),
                                    CELEBRATE: getReactionCount("CELEBRATE"),
                                    CLAP: getReactionCount("CLAP"),
                                    HANDS: getReactionCount("HANDS")
                                }}
                                anchorEl={reactionPickerAnchor}
                            />
                        )}
                    </AnimatePresence>
                </Box>
            </Stack>

            {/* Enhanced Comments Section */}
            {showComments && (
                <CommentSection
                    postId={data._id}
                    onCommentSubmit={handleCommentSubmit}
                    onCommentReact={handleCommentReaction}
                    showInput={true}
                    maxHeight="600px"
                    autoLoad={true}
                    onTypingStart={startTyping}
                    onTypingStop={stopTyping}
                />
            )}

            {/* Post Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
            >
                <MenuItem onClick={() => setMenuAnchor(null)}>
                    <FlagIcon sx={{ mr: 1 }} />
                    Report Post
                </MenuItem>
                {data.author?._id === currentUser?._id && (
                    <MenuItem 
                        onClick={() => {
                            setShowDeleteDialog(true);
                            setMenuAnchor(null);
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <DeleteIcon sx={{ mr: 1 }} />
                        Delete Post
                    </MenuItem>
                )}
            </Menu>

            {/* Delete Confirmation Dialog */}
            <AnimatedDialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                title="Delete Post"
                headerColor="error"
                maxWidth="sm"
                fullWidth
                actions={
                    <>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Button 
                                onClick={() => setShowDeleteDialog(false)}
                                disabled={isDeleting}
                                sx={{
                                    color: '#ffffff',
                                    borderRadius: '20px',
                                    px: 3,
                                    py: 1,
                                    '&:hover': {
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Cancel
                            </Button>
                        </motion.div>
                        
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Button
                                variant="contained"
                                onClick={handleDeletePost}
                                disabled={isDeleting}
                                sx={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: '#ffffff',
                                    borderRadius: '20px',
                                    px: 3,
                                    py: 1,
                                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                                    '&:hover': {
                                        background: 'rgba(255, 255, 255, 0.3)',
                                        boxShadow: '0 6px 16px rgba(255, 255, 255, 0.3)',
                                        transform: 'translateY(-2px)',
                                    },
                                    '&:disabled': {
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        boxShadow: 'none',
                                        transform: 'none',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Post'}
                            </Button>
                        </motion.div>
                    </>
                }
            >
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Are you sure you want to delete this post? This action cannot be undone.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    The post and all its comments, reactions, and associated data will be permanently removed.
                </Typography>
            </AnimatedDialog>

            {/* Share Modal */}
            <ShareModal
                open={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                postData={data}
                onShare={(platform, data) => {
                    console.log(`Shared to ${platform}:`, data);
                    // Track sharing for karma rewards
                }}
            />
        </BoxConatner>
    );
};

export default Post;
