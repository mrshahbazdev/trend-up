import { Box, CardContent, Avatar, Typography, Button, Stack, Divider, IconButton, Chip } from "@mui/material";
import {
    PersonAdd as PersonAddIcon,
    LocationOn as LocationIcon,
    Link as LinkIcon,
    MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import BoxConatner from "@/components/common/BoxContainer/BoxConatner";
import MainButton from "@/components/common/MainButton/MainButton";
import Posts from "@/components/Post/Posts";
import { dummyPost } from "@/constants";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Loading from "@/components/common/loading";
import { getImageUrl } from "@/config/env";

export default function Profile() {
    const { user, loading } = useSelector((state) => state.user);

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
    };

    const formatDate = (date) => {
        if (!date) return 'Recently';
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    if (loading || !user) {
        return <Loading isLoading={true} />;
    }

    return (
        <>
            <BoxConatner sx={{ mt: 2, p: 1.5 }}>
                <Box
                    sx={{
                        height: 200,
                        backgroundImage: `url(${getImageUrl(user.coverImage) || 'https://images.pexels.com/photos/158826/structure-light-led-movement-158826.jpeg'})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        position: "relative",
                        borderRadius: "3px",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                        }}
                    >
                        <IconButton
                            sx={{
                                bgcolor: "rgba(0,0,0,0.5)",
                                color: "white",
                                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                            }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </Box>
                </Box>

                <Box sx={{ px: 2, pt: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 1 }}>
                        <Avatar
                            src={getImageUrl(user.avatar) || 'https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes.png'}
                            sx={{
                                width: 120,
                                height: 120,
                                mt: -8,
                                border: "4px solid var(--color-card)",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                borderRadius: "50%",
                            }}
                        />
                        <Link to={"/user/edit-profile"}>
                        <MainButton sx={{ width: "150px" }}>Edit Profile</MainButton>
                        </Link>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "2rem", color: "text.secondary" }}>
                                {user.name}
                            </Typography>
                            {user.isEmailVerified && (
                                <Chip label="Verified" color="primary" size="small" />
                            )}
                        </Box>
                        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                            @ {user.username || 'No username'}
                        </Typography>
                        <Typography variant="body1" sx={{ color: "text.secondary", mb: 1, lineHeight: 1.5 }}>
                            {user.bio}
                        </Typography>

                        {/* Additional Info */}
                        <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", gap: 1 }}>
                            {user.location && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <LocationIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        {user.location}
                                    </Typography>
                                </Box>
                            )}
                            {user.website && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <LinkIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                    <Typography
                                        component="a"
                                        href={user.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        variant="body2"
                                        sx={{
                                            color: "primary.main",
                                            textDecoration: "none",
                                            cursor: "pointer",
                                            "&:hover": { textDecoration: "underline" },
                                        }}
                                    >
                                        {user.website.replace(/^https?:\/\//, '')}
                                    </Typography>
                                </Box>
                            )}
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Joined {formatDate(user.createdAt)}
                            </Typography>
                        </Stack>
                    </Box>

                    <Divider sx={{ bgcolor: "var(--color-border)", mb: 2 }} />

                    {/* Stats */}
                    <Stack direction="row" spacing={4}>
                        <Box sx={{ textAlign: "center", cursor: "pointer" }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                                {formatNumber(user.postsCount || 0)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Posts
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center", cursor: "pointer" }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                                {formatNumber(user.followersCount || 0)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Followers
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center", cursor: "pointer" }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                                {formatNumber(user.followingCount || 0)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                Following
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </BoxConatner>
            <BoxConatner sx={{ maxWidth: "full", mx: "auto", mt: 2, p: 1.5 }}>
                <Posts postData={dummyPost.slice(0,2)} />
            </BoxConatner>
        </>
    );
}
