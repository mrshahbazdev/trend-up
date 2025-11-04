import { useRef, useEffect, useCallback } from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Avatar,
    Chip,
    LinearProgress,
    Tooltip,
    Badge,
    ButtonGroup,
    Divider,
    styled,
    useTheme,
    alpha,
} from "@mui/material";
import {
    Send as SendIcon,
    EmojiEmotions as EmojiIcon,
    AttachFile as AttachIcon,
    Image as ImageIcon,
    Description as FileIcon,
    Close as CloseIcon,
    Reply as ReplyIcon,
    MoreVert as MoreIcon,
    Menu as MenuIcon,
    Call as CallIcon,
    Videocam as VideoIcon,
    Info as InfoIcon,
    Verified,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "../../components/common/EmojiPicker/EmojiPicker";

// Modern styled components
const MessageContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius * 2,
    transition: theme.transitions.create(["background-color", "transform"]),
    "&:hover": {
        backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
    marginBottom: theme.spacing(0.5),
}));

const ChatBubble = styled(Box)(({ theme, iscurrentuser }) => ({
    backgroundColor: iscurrentuser ? alpha(theme.palette.primary.main, 0.15) : theme.palette.background.paper,
    borderRadius: iscurrentuser
        ? `${theme.shape.borderRadius * 3}px ${theme.shape.borderRadius * 3}px 0 ${theme.shape.borderRadius * 3}px`
        : `${theme.shape.borderRadius * 3}px ${theme.shape.borderRadius * 3}px ${theme.shape.borderRadius * 3}px 0`,
    padding: theme.spacing(1.5, 2),
    maxWidth: "75%",
    boxShadow: theme.shadows[1],
    position: "relative",
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    backdropFilter: "blur(8px)",
}));

const ActionButtons = styled(Box)(({ theme }) => ({
  opacity: 0,
  transition: theme.transitions.create("opacity"),
  display: "flex",
  gap: theme.spacing(0.5),
  position: "absolute",
  right: theme.spacing(1),
  top: theme.spacing(1),
  backgroundColor: alpha(theme.palette.background.default, 0.9),
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(0.5),
  backdropFilter: "blur(4px)",
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,

  ".message-container:hover &": {
    opacity: 1,
  },
}));
const ChatContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: `radial-gradient(circle at 20% 30%, ${alpha(theme.palette.primary.light, 0.1)} 0%, transparent 40%)`,
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
}));

export default function ChatDetail({
    currentUser,
    messages,
    newMessage,
    selectedFiles,
    emojiAnchor,
    reactionAnchor,
    uploadProgress,
    replyTo,
    isMobile,
    onOpenDrawer,
    onMessageChange,
    onFileSelect,
    onRemoveFile,
    onSendMessage,
    onKeyDown,
    onEmojiClick,
    onEmojiClose,
    onEmojiSelect,
    onReactionClick,
    onReactionClose,
    onAddReaction,
    onReply,
    onCancelReply,
}) {
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const formatFileSize = useCallback((bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }, []);

    const formatTime = useCallback((date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }, []);

    const getReplyMessage = useCallback((messageId) => messages.find((msg) => msg.id === messageId), [messages]);

    const handleCall = () => {
        console.log("Initiating voice call");
    };

    const handleVideoCall = () => {
        console.log("Initiating video call");
    };

    return (
        <ChatContainer>
            {/* Header with call buttons */}
            <Box
                sx={{
                    padding: theme.spacing(2),
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: "blur(12px)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}>
                    {isMobile && (
                        <IconButton
                            onClick={onOpenDrawer}
                            sx={{
                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                backdropFilter: "blur(8px)",
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    {currentUser && (
                        <>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                variant="dot"
                                color={
                                    currentUser.status === "online"
                                        ? "success"
                                        : currentUser.status === "away"
                                        ? "warning"
                                        : currentUser.status === "busy"
                                        ? "error"
                                        : "default"
                                }
                                sx={{
                                    "& .MuiBadge-dot": {
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        border: `2px solid ${theme.palette.background.paper}`,
                                    },
                                }}
                            >
                                <Avatar
                                    src={currentUser.avatar}
                                    sx={{
                                        bgcolor: currentUser.color,
                                        width: 44,
                                        height: 44,
                                        border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                                    }}
                                >
                                    {currentUser.name[0]}
                                </Avatar>
                            </Badge>
                            <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        {currentUser.name}
                                    </Typography>
                                    {currentUser.verified && <Verified fontSize="small" color="primary" />}
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color:
                                            currentUser.status === "online"
                                                ? theme.palette.success.main
                                                : currentUser.status === "away"
                                                ? theme.palette.warning.main
                                                : currentUser.status === "busy"
                                                ? theme.palette.error.main
                                                : theme.palette.text.secondary,
                                        textTransform: "capitalize",
                                        fontWeight: 500,
                                    }}
                                >
                                    {currentUser.status}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>

                <ButtonGroup variant="text" size="small">
                    <Tooltip title="Voice call">
                        <IconButton
                            onClick={handleCall}
                            sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                "&:hover": {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                },
                            }}
                        >
                            <CallIcon color="primary" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Video call">
                        <IconButton
                            onClick={handleVideoCall}
                            sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                "&:hover": {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                },
                            }}
                        >
                            <VideoIcon color="primary" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="User info">
                        <IconButton>
                            <InfoIcon />
                        </IconButton>
                    </Tooltip>
                </ButtonGroup>
            </Box>

            {/* Messages area */}
            <Box
                className="custom-scrollbar"
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    padding: theme.spacing(2),
                    background: `linear-gradient(${alpha(theme.palette.background.default, 0.8)}, ${alpha(
                        theme.palette.background.default,
                        0.9
                    )})`,
                    backdropFilter: "blur(8px)",
                    "&::-webkit-scrollbar": {
                        width: "6px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        borderRadius: theme.shape.borderRadius,
                    },
                }}
            >
                {messages.map((message, index) => {
                    const showAvatar = index === 0 || messages[index - 1].user.name !== message.user.name;
                    const replyMessage = message.replyTo ? getReplyMessage(message.replyTo) : null;
                    const isCurrentUser = message.user.name === "You";

                    return (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            layout
                        >
                            <MessageContainer
                                sx={{
                                    justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                                    flexDirection: isCurrentUser ? "row-reverse" : "row",
                                }}
                            >
                                {showAvatar ? (
                                    <Avatar
                                        src={message.user.avatar}
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: message.user.color,
                                            fontWeight: 600,
                                            border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                                            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
                                        }}
                                    >
                                        {message.user.name[0]}
                                    </Avatar>
                                ) : (
                                    <Box sx={{ width: 40, textAlign: "center" }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatTime(message.timestamp)}
                                        </Typography>
                                    </Box>
                                )}

                                <Box
                                    sx={{
                                        flex: 1,
                                        position: "relative",
                                        maxWidth: "80%",
                                    }}
                                    className="message-container"
                                >
                                    {showAvatar && (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                mb: 0.5,
                                                flexDirection: isCurrentUser ? "row-reverse" : "row",
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle2"
                                                sx={{
                                                    fontWeight: 600,
                                                    background: `linear-gradient(90deg, ${message.user.color}, ${theme.palette.secondary.main})`,
                                                    WebkitBackgroundClip: "text",
                                                    WebkitTextFillColor: "transparent",
                                                }}
                                            >
                                                {message.user.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatTime(message.timestamp)}
                                            </Typography>
                                        </Box>
                                    )}

                                    {replyMessage && (
                                        <Box
                                            sx={{
                                                mb: 1,
                                                padding: theme.spacing(1),
                                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                borderRadius: theme.shape.borderRadius,
                                                borderLeft: `3px solid ${theme.palette.primary.main}`,
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary">
                                                Replying to {replyMessage.user.name}
                                            </Typography>
                                            <Typography variant="body2" noWrap>
                                                {replyMessage.content.substring(0, 50)}
                                                {replyMessage.content.length > 50 ? "..." : ""}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* chat content */}
                                    {message.content && (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                                                marginBottom: theme.spacing(1),
                                            }}
                                        >
                                            <ChatBubble iscurrentuser={isCurrentUser}>
                                                <Typography variant="body2" color="text.primary">
                                                    {message.content}
                                                </Typography>
                                            </ChatBubble>
                                        </Box>
                                    )}

                                    {/* Action button && reaction button  */}
                                    <ActionButtons
                                        sx={{
                                            right: isCurrentUser ? "auto" : theme.spacing(1),
                                            left: isCurrentUser ? theme.spacing(1) : "auto",
                                        }}
                                    >
                                        <Tooltip title="Add reaction">
                                            <IconButton
                                                size="small"
                                                onClick={(e) => onReactionClick(e, message.id)}
                                                sx={{
                                                    "&:hover": {
                                                        color: theme.palette.primary.main,
                                                    },
                                                }}
                                            >
                                                <EmojiIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Reply">
                                            <IconButton
                                                size="small"
                                                onClick={() => onReply(message.id)}
                                                sx={{
                                                    "&:hover": {
                                                        color: theme.palette.primary.main,
                                                    },
                                                }}
                                            >
                                                <ReplyIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </ActionButtons>

                                    {message.attachments && (
                                        <Box sx={{ mt: 1 }}>
                                            {message.attachments.map((attachment, idx) => (
                                                <Box key={idx} sx={{ mb: 1 }}>
                                                    {attachment.type === "image" ? (
                                                        <Box
                                                            component={motion.img}
                                                            src={attachment.url}
                                                            alt={attachment.name}
                                                            sx={{
                                                                maxWidth: "100%",
                                                                maxHeight: 300,
                                                                borderRadius: theme.shape.borderRadius * 2,
                                                                cursor: "pointer",
                                                                border: `1px solid ${alpha(
                                                                    theme.palette.divider,
                                                                    0.2
                                                                )}`,
                                                                boxShadow: `0 4px 12px ${alpha(
                                                                    theme.palette.primary.main,
                                                                    0.1
                                                                )}`,
                                                            }}
                                                            whileHover={{ scale: 1.02 }}
                                                            onError={(e) => {
                                                                e.target.src = "/abstract-colorful-swirls.png";
                                                            }}
                                                        />
                                                    ) : (
                                                        <Paper
                                                            component={motion.div}
                                                            whileHover={{ scale: 1.01 }}
                                                            sx={{
                                                                padding: theme.spacing(1.5),
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: theme.spacing(1),
                                                                backgroundColor: alpha(
                                                                    theme.palette.background.paper,
                                                                    0.8
                                                                ),
                                                                backdropFilter: "blur(8px)",
                                                                borderRadius: theme.shape.borderRadius * 2,
                                                                border: `1px solid ${alpha(
                                                                    theme.palette.divider,
                                                                    0.2
                                                                )}`,
                                                            }}
                                                        >
                                                            <FileIcon color="primary" />
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography variant="body2" noWrap>
                                                                    {attachment.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {formatFileSize(attachment.size)}
                                                                </Typography>
                                                            </Box>
                                                        </Paper>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}

                                    {message.reactions.length > 0 && (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 0.5,
                                                mt: 1,
                                                justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                                            }}
                                        >
                                            {message.reactions.map((reaction, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={`${reaction.emoji} ${reaction.count}`}
                                                    size="small"
                                                    variant={reaction.users.includes("You") ? "filled" : "outlined"}
                                                    onClick={() => onAddReaction(message.id, reaction.emoji)}
                                                    sx={{
                                                        "&.MuiChip-filled": {
                                                            backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                                            color: theme.palette.primary.main,
                                                            border: `1px solid ${theme.palette.primary.main}`,
                                                        },
                                                        "&.MuiChip-outlined": {
                                                            backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                                            backdropFilter: "blur(4px)",
                                                        },
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </MessageContainer>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} />
            </Box>

            {/* Upload Progress */}
            {uploadProgress !== null && (
                <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                        height: 2,
                        "& .MuiLinearProgress-bar": {
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        },
                    }}
                />
            )}

            {/* Reply Preview */}
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Box
                            sx={{
                                padding: theme.spacing(1, 2),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                backdropFilter: "blur(8px)",
                            }}
                        >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <ReplyIcon fontSize="small" color="primary" />
                                <Typography variant="caption">
                                    Replying to {getReplyMessage(replyTo)?.user.name}
                                </Typography>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={onCancelReply}
                                sx={{
                                    "&:hover": {
                                        color: theme.palette.error.main,
                                    },
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File Preview */}
            {selectedFiles.length > 0 && (
                <Box
                    sx={{
                        padding: theme.spacing(1, 2),
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        backgroundColor: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Attachments ({selectedFiles.length})
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {selectedFiles.map((file, index) => (
                            <Chip
                                key={index}
                                label={`${file.name.substring(0, 15)}... (${formatFileSize(file.size)})`}
                                onDelete={() => onRemoveFile(index)}
                                icon={file.type.startsWith("image/") ? <ImageIcon /> : <FileIcon />}
                                variant="outlined"
                                sx={{
                                    maxWidth: 200,
                                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                    backdropFilter: "blur(4px)",
                                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Message Input */}
            <Box
                sx={{
                    padding: theme.spacing(2),
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: "blur(12px)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileSelect}
                        multiple
                        style={{ display: "none" }}
                        accept="image/*,application/*,text/*"
                    />

                    <Tooltip title="Attach file">
                        <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                "&:hover": {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                },
                            }}
                        >
                            <AttachIcon color="primary" />
                        </IconButton>
                    </Tooltip>

                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        value={newMessage}
                        onChange={(e) => onMessageChange(e.target.value)}
                        placeholder={replyTo ? "Reply..." : `Message ${currentUser?.name || ""}`}
                        variant="outlined"
                        size="small"
                        onKeyDown={onKeyDown}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                backdropFilter: "blur(8px)",
                                borderRadius: theme.shape.borderRadius * 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                "&:hover": {
                                    borderColor: alpha(theme.palette.primary.main, 0.5),
                                },
                                "&.Mui-focused": {
                                    borderColor: theme.palette.primary.main,
                                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                                },
                            },
                        }}
                    />

                    <Tooltip title="Emoji">
                        <IconButton
                            onClick={onEmojiClick}
                            sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                "&:hover": {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                },
                            }}
                        >
                            <EmojiIcon color="primary" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Send message">
                        <span>
                            <IconButton
                                onClick={onSendMessage}
                                disabled={!newMessage.trim() && selectedFiles.length === 0}
                                sx={{
                                    backgroundColor:
                                        !newMessage.trim() && selectedFiles.length === 0
                                            ? alpha(theme.palette.action.disabled, 0.1)
                                            : alpha(theme.palette.primary.main, 0.2),
                                    color:
                                        !newMessage.trim() && selectedFiles.length === 0
                                            ? theme.palette.text.disabled
                                            : theme.palette.primary.main,
                                    "&:hover": {
                                        backgroundColor:
                                            !newMessage.trim() && selectedFiles.length === 0
                                                ? alpha(theme.palette.action.disabled, 0.1)
                                                : alpha(theme.palette.primary.main, 0.3),
                                    },
                                }}
                            >
                                <SendIcon />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Box>

            {/* Emoji Pickers */}
            <EmojiPicker
                anchorEl={emojiAnchor}
                open={Boolean(emojiAnchor)}
                onClose={onEmojiClose}
                onEmojiSelect={onEmojiSelect}
            />

            <EmojiPicker
                anchorEl={reactionAnchor?.element || null}
                open={Boolean(reactionAnchor)}
                onClose={onReactionClose}
                onEmojiSelect={(emoji) => {
                    if (reactionAnchor) {
                        onAddReaction(reactionAnchor.messageId, emoji);
                    }
                }}
            />
        </ChatContainer>
    );
}
