import React from "react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import { CloseIcon, PlayArrowIcon, PauseIcon } from "@/assets/icons";

const MediaPreview = ({ file, onRemove, index }) => {
    const theme = useTheme();
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [duration, setDuration] = React.useState(null);
    const videoRef = React.useRef(null);
    const audioRef = React.useRef(null);

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handlePlayPause = () => {
        if (isVideo && videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        } else if (isAudio && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleLoadedMetadata = (e) => {
        setDuration(e.target.duration);
    };

    const formatDuration = (seconds) => {
        if (!seconds || !isFinite(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <Box
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                p: 2,
                mb: 1,
                background: theme.palette.background.paper,
                position: "relative",
            }}
        >
            {/* Remove button */}
            <IconButton
                size="small"
                onClick={() => onRemove(index)}
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    zIndex: 1,
                    "&:hover": {
                        background: "rgba(0, 0, 0, 0.9)",
                    },
                }}
            >
                <CloseIcon />
            </IconButton>

            {/* File info */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                    {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {formatFileSize(file.size)}
                    {duration && ` • ${formatDuration(duration)}`}
                </Typography>
            </Box>

            {/* Media preview */}
            {isImage && (
                <Box
                    sx={{
                        width: "100%",
                        maxHeight: 200,
                        borderRadius: 1,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: theme.palette.grey[100],
                    }}
                >
                    <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                        }}
                    />
                </Box>
            )}

            {isVideo && (
                <Box sx={{ position: "relative" }}>
                    <video
                        ref={videoRef}
                        src={URL.createObjectURL(file)}
                        style={{
                            width: "100%",
                            maxHeight: 200,
                            borderRadius: 8,
                            background: "#000",
                        }}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        preload="metadata"
                    />
                    {/* Play/Pause overlay */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            background: "rgba(0, 0, 0, 0.7)",
                            borderRadius: "50%",
                            p: 1,
                            cursor: "pointer",
                            "&:hover": {
                                background: "rgba(0, 0, 0, 0.9)",
                            },
                        }}
                        onClick={handlePlayPause}
                    >
                        {isPlaying ? (
                            <PauseIcon sx={{ color: "white", fontSize: 32 }} />
                        ) : (
                            <PlayArrowIcon sx={{ color: "white", fontSize: 32 }} />
                        )}
                    </Box>
                </Box>
            )}

            {isAudio && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        background: theme.palette.grey[100],
                        borderRadius: 1,
                    }}
                >
                    <IconButton
                        onClick={handlePlayPause}
                        sx={{
                            background: theme.palette.primary.main,
                            color: "white",
                            "&:hover": {
                                background: theme.palette.primary.dark,
                            },
                        }}
                    >
                        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                            Audio File
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {duration ? formatDuration(duration) : "Loading..."}
                        </Typography>
                    </Box>
                    <audio
                        ref={audioRef}
                        src={URL.createObjectURL(file)}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        preload="metadata"
                        style={{ display: "none" }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default MediaPreview;
