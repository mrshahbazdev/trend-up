import { useState, useEffect } from "react";
import { Button, CardContent, TextField, Avatar, Box, Typography, Grid, CircularProgress, Divider } from "@mui/material";
import { PhotoCamera as CameraIcon, Save as SaveIcon, Close as CloseIcon, Edit as EditIcon, DeleteForever as DeleteIcon } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import BoxConatner from "@/components/common/BoxContainer/BoxConatner";
import MainButton from "@/components/common/MainButton/MainButton";
import { useSelector, useDispatch } from "react-redux";
import { useUpdateProfileMutation, useUploadAvatarMutation, useUploadCoverMutation } from "@/api/slices/userApi..js";
import { setUser } from "@/store/slices/userSlices";
import { useToast } from "@/hooks/useToast.jsx";
import Loading from "@/components/common/loading";
import { getImageUrl } from "@/config/env";
import DeleteAccountDialog from "@/components/user/DeleteAccountDialog";

export default function EditProfilePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, loading: userLoading } = useSelector((state) => state.user);
    const { showToast } = useToast();

    const [profileData, setProfileData] = useState({
        name: '',
        username: '',
        bio: '',
        location: '',
        website: '',
    });

    const [errors, setErrors] = useState({});
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();
    const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadAvatarMutation();
    const [uploadCover, { isLoading: uploadingCover }] = useUploadCoverMutation();

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                username: user.username || '',
                bio: user.bio || '',
                location: user.location || '',
                website: user.website || '',
            });
            setAvatarPreview(getImageUrl(user.avatar));
            setCoverPreview(getImageUrl(user.coverImage));
        }
    }, [user]);

    const handleInputChange = (field, value) => {
        setProfileData((prev) => ({
            ...prev,
            [field]: value,
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('Avatar must be less than 5MB', 'error');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleCoverSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showToast('Cover image must be less than 10MB', 'error');
                return;
            }
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (profileData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (profileData.username && (profileData.username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(profileData.username))) {
            newErrors.username = 'Username must be 3+ characters (letters, numbers, underscore only)';
        }

        if (profileData.bio && profileData.bio.length > 500) {
            newErrors.bio = 'Bio cannot exceed 500 characters';
        }

        if (profileData.website && profileData.website.trim() && !/^https?:\/\/.+/.test(profileData.website)) {
            newErrors.website = 'Website must start with http:// or https://';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            showToast('Please fix form errors', 'error');
            return;
        }

        try {
            // Upload avatar if changed
            if (avatarFile) {
                const formData = new FormData();
                formData.append('avatar', avatarFile);
                const avatarResult = await uploadAvatar(formData).unwrap();
                dispatch(setUser(avatarResult.data.user));
            }

            // Upload cover if changed
            if (coverFile) {
                const formData = new FormData();
                formData.append('cover', coverFile);
                const coverResult = await uploadCover(formData).unwrap();
                dispatch(setUser(coverResult.data.user));
            }

            // Update profile data
            const result = await updateProfile(profileData).unwrap();
            dispatch(setUser(result.data.user));
            
            showToast('Profile updated successfully!', 'success');
            setTimeout(() => navigate('/user/profile'), 1500);
        } catch (error) {
            showToast(error.data?.message || 'Failed to update profile', 'error');
        }
    };

    const handleCancel = () => {
        navigate('/user/profile');
    };

    if (userLoading || !user) {
        return <Loading isLoading={true} />;
    }

    const isSaving = updating || uploadingAvatar || uploadingCover;

    return (
        <BoxConatner>
            <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                    <Typography variant="h3" sx={{ color: "text.primary", fontWeight: "bold" }}>
                        Edit Profile
                    </Typography>
                    <Link to="/user/profile" style={{ textDecoration: "none" }}>
                        <MainButton sx={{ borderRadius: 2, px: 3, py: 1.5 }}>Back to Profile</MainButton>
                    </Link>
                </Box>

                <Box sx={{ overflow: "hidden" }}>
                    {/* Background Image Section */}
                    <Box
                        sx={{
                            height: 192,
                            backgroundImage: `url(${coverPreview || 'https://images.pexels.com/photos/158826/structure-light-led-movement-158826.jpeg'})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            position: "relative",
                            "&:hover .cover-overlay": { opacity: 1 },
                        }}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            id="cover-upload"
                            style={{ display: 'none' }}
                            onChange={handleCoverSelect}
                        />
                        <Box
                            className="cover-overlay"
                            sx={{
                                position: "absolute",
                                inset: 0,
                                bgcolor: "rgba(0,0,0,0.4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "opacity 0.2s",
                                opacity: 0,
                            }}
                        >
                            <MainButton
                                component="label"
                                htmlFor="cover-upload"
                                startIcon={<CameraIcon />}
                                disabled={uploadingCover}
                                sx={{
                                    bgcolor: "rgba(255,255,255,0.9)",
                                    color: "black",
                                    "&:hover": { bgcolor: "white" },
                                }}
                            >
                                {uploadingCover ? 'Uploading...' : 'Change Cover'}
                            </MainButton>
                        </Box>
                    </Box>

                    <Box sx={{p:3}}>
                        {/* Profile Image Section */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 3 }}>
                            <Box sx={{ position: "relative" }}>
                                <Avatar
                                    src={avatarPreview || "/placeholder.svg"}
                                    alt={profileData.name}
                                    sx={{
                                        width: 112,
                                        height: 112,
                                        mt: -7,
                                        border: "4px solid",
                                        borderColor: "background.paper",
                                        boxShadow: 3,
                                    }}
                                >
                                    {profileData.name
                                        ? profileData.name.split(" ").map((n) => n[0]).join("")
                                        : '?'}
                                </Avatar>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="avatar-upload"
                                    style={{ display: 'none' }}
                                    onChange={handleAvatarSelect}
                                />
                                <Button
                                    component="label"
                                    htmlFor="avatar-upload"
                                    disabled={uploadingAvatar}
                                    sx={{
                                        position: "absolute",
                                        bottom: -8,
                                        right: -8,
                                        minWidth: 32,
                                        width: 32,
                                        height: 32,
                                        bgcolor: "primary.main",
                                        "&:hover": { bgcolor: "primary.dark" },
                                    }}
                                >
                                    {uploadingAvatar ? <CircularProgress size={16} color="inherit" /> : <CameraIcon sx={{ fontSize: 16 }} />}
                                </Button>
                            </Box>

                            {/* Action Buttons */}
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <MainButton onClick={handleCancel} startIcon={<CloseIcon />} disabled={isSaving}>
                                    Cancel
                                </MainButton>
                                <MainButton onClick={handleSave} startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </MainButton>
                            </Box>
                        </Box>

                        <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
                            {/* Form Fields */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <TextField
                                    label="Display Name"
                                    value={profileData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    fullWidth
                                    variant="outlined"
                                    required
                                    disabled={isSaving}
                                />

                                <TextField
                                    label="Username"
                                    value={profileData.username}
                                    onChange={(e) => handleInputChange("username", e.target.value)}
                                    error={!!errors.username}
                                    helperText={errors.username || 'Unique username (letters, numbers, underscore only)'}
                                    fullWidth
                                    variant="outlined"
                                    disabled={isSaving}
                                />

                                <TextField
                                    label="Bio"
                                    value={profileData.bio}
                                    onChange={(e) => handleInputChange("bio", e.target.value)}
                                    error={!!errors.bio}
                                    helperText={errors.bio || `${profileData.bio.length}/500 characters`}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    variant="outlined"
                                    disabled={isSaving}
                                />

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Location"
                                            value={profileData.location}
                                            onChange={(e) => handleInputChange("location", e.target.value)}
                                            error={!!errors.location}
                                            helperText={errors.location}
                                            fullWidth
                                            variant="outlined"
                                            placeholder="San Francisco, CA"
                                            disabled={isSaving}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Website"
                                            value={profileData.website}
                                            onChange={(e) => handleInputChange("website", e.target.value)}
                                            error={!!errors.website}
                                            helperText={errors.website || 'Include http:// or https://'}
                                            fullWidth
                                            variant="outlined"
                                            placeholder="https://example.com"
                                            disabled={isSaving}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Danger Zone */}
                            <Box sx={{ mt: 5, pt: 3, borderTop: 2, borderColor: 'error.main' }}>
                                <Typography variant="h6" color="error.main" gutterBottom fontWeight={600}>
                                    Danger Zone
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Once you delete your account, there is no going back. Please be certain.
                                </Typography>
                                <MainButton
                                    onClick={() => setDeleteDialogOpen(true)}
                                    startIcon={<DeleteIcon />}
                                    disabled={isSaving}
                                    sx={{ 
                                        mt: 2,
                                        bgcolor: 'error.main',
                                        '&:hover': { bgcolor: 'error.dark' }
                                    }}
                                >
                                    Delete Account
                                </MainButton>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <DeleteAccountDialog 
                open={deleteDialogOpen} 
                onClose={() => setDeleteDialogOpen(false)} 
            />
        </BoxConatner>
    );
}
