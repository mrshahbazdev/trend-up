import { useState, useRef, useEffect } from "react";
import {
    Box,
    Typography,
    IconButton,
    TextField,
    Avatar,
    Chip,
    Stack,
    styled,
    alpha,
    useTheme,
    Popover,
    useMediaQuery,
} from "@mui/material";
import {
    Send as SendIcon,
    Favorite as LikeIcon,
    Share as ShareIcon,
    AttachMoney as DonateIcon,
    EmojiEmotions as EmojiIcon,
    Chat as ChatIcon,
    Close as CloseIcon,
    Star as StarIcon,
    PersonAdd as PersonAddIcon,
    CardGiftcard as CardGiftcardIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";

// Styled components
const ChatContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== "isCompact",
})(({ theme, isCompact }) => ({
    width: isCompact ? "100%" : 350,
    height: isCompact ? "100%" : "100%",
    backgroundColor: alpha(theme.palette.background.paper, 0.97),
    backdropFilter: "blur(16px)",
    borderLeft: isCompact ? "none" : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: isCompact ? "16px 16px 0 0" : "0",
    transition: "all 0.3s ease-in-out",
    boxShadow: isCompact ? theme.shadows[8] : "none",

    [theme.breakpoints.down("md")]: {
        ...(!isCompact && {
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            transform: "translateX(100%)",
            zIndex: 1000,
            "&.chat-open": {
                transform: "translateX(0)",
            },
        }),
    },
    [theme.breakpoints.down("sm")]: {
        width: "100%",
        borderRadius: isCompact ? "16px 16px 0 0" : "0",
    },
}));

const MessageItem = styled(motion.div)(({ theme, type }) => ({
    display: "flex",
    alignItems: "flex-start",
    padding: "8px 12px",
    backgroundColor: type === "donation" ? alpha(theme.palette.success.main, 0.15) : "transparent",
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    transition: "all 0.2s ease",

    "&:hover": {
        backgroundColor: alpha(theme.palette.action.hover, 0.08),
    },
}));

const EmojiPickerContainer = styled(Box)(({ theme }) => ({
    position: "absolute",
    bottom: "100%",
    right: 0,
    marginBottom: 8,
    zIndex: 1000,

    "& .emoji-picker-react": {
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        borderRadius: theme.shape.borderRadius * 2,
        boxShadow: theme.shadows[8],
        width: "100% !important",
        maxWidth: 350,
    },

    [theme.breakpoints.down("sm")]: {
        right: "auto",
        left: 0,

        "& .emoji-picker-react": {
            maxWidth: "100%",
            width: "100vw !important",
            marginLeft: "-16px",
        },
    },
}));

const CompactHeader = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.5),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: alpha(theme.palette.background.paper, 0.9),
    backdropFilter: "blur(12px)",
}));

const ActionButtonsContainer = styled(Stack)(({ theme, isCompact }) => ({
    flexDirection: "row",
    gap: theme.spacing(0.5),

    ...(isCompact && {
        overflowX: "auto",
        padding: theme.spacing(0.5),
        "&::-webkit-scrollbar": {
            display: "none",
        },
        msOverflowStyle: "none",
        scrollbarWidth: "none",
    }),
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    overflowY: "auto",
    padding: theme.spacing(0.5),
}));

const LiveChat = ({
    messages,
    onSendMessage,
    onDonate,
    onLike,
    onSubscribe,
    onFollow,
    onGift,
    onShare,
    chatOpen,
    onToggleChat,
    isCompact = false,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const emojiButtonRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [message, setMessage] = useState("");
    const [emojiAnchor, setEmojiAnchor] = useState(null);

    const handleSendMessage = () => {
        if (message.trim()) {
            onSendMessage(message);
            setMessage("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEmojiClick = (emojiData) => {
        setMessage((prev) => prev + emojiData.emoji);
        setEmojiAnchor(null);
    };

    const handleEmojiButtonClick = (event) => {
        setEmojiAnchor(event.currentTarget);
    };

    const handleEmojiClose = () => {
        setEmojiAnchor(null);
    };

    const emojiOpen = Boolean(emojiAnchor);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <ChatContainer
            isCompact={isCompact}
            sx={{
                ...(isCompact && {
                    maxHeight: "50vh",
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    boxShadow: theme.shadows[6],
                }),
            }}
        >
            {/* Header */}
            {isCompact ? (
                <CompactHeader>
                    <Typography variant="h6" fontWeight={600} sx={{ fontSize: "1.1rem" }}>
                        💬 Live Chat ({messages.length})
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={onToggleChat}
                        sx={{
                            color: theme.palette.text.secondary,
                            "&:hover": {
                                color: theme.palette.text.primary,
                                backgroundColor: alpha(theme.palette.action.hover, 0.1),
                            },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </CompactHeader>
            ) : (
                <Box
                    sx={{
                        p: theme.spacing(1.5),
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: alpha(theme.palette.background.paper, 0.9),
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <Typography variant="h6" fontWeight={600}>
                        Live Chat ({messages.length})
                    </Typography>
                    {isMobile && (
                        <IconButton
                            size="small"
                            onClick={onToggleChat}
                            sx={{
                                color: theme.palette.text.secondary,
                                "&:hover": {
                                    color: theme.palette.text.primary,
                                    backgroundColor: alpha(theme.palette.action.hover, 0.1),
                                },
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            )}

            {/* Action Buttons */}
            <Box
                sx={{
                    p: theme.spacing(1),
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    background: alpha(theme.palette.background.default, 0.6),
                    backdropFilter: "blur(8px)",
                }}
            >
                <ActionButtonsContainer isCompact={isCompact}>
                    <IconButton
                        size="small"
                        onClick={onLike}
                        title="Send Like"
                        sx={{
                            color: theme.palette.error.main,
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                            "&:hover": {
                                backgroundColor: alpha(theme.palette.error.main, 0.2),
                            },
                        }}
                    >
                        <LikeIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={onSubscribe}
                        title="Subscribe"
                        sx={{
                            color: theme.palette.warning.main,
                            backgroundColor: alpha(theme.palette.warning.main, 0.1),
                            "&:hover": {
                                backgroundColor: alpha(theme.palette.warning.main, 0.2),
                            },
                        }}
                    >
                        <StarIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={onFollow}
                        title="Follow"
                        sx={{
                            color: theme.palette.info.main,
                            backgroundColor: alpha(theme.palette.info.main, 0.1),
                            "&:hover": {
                                backgroundColor: alpha(theme.palette.info.main, 0.2),
                            },
                        }}
                    >
                        <PersonAddIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={onGift}
                        title="Send Gift"
                        sx={{
                            color: theme.palette.success.main,
                            backgroundColor: alpha(theme.palette.success.main, 0.1),
                            "&:hover": {
                                backgroundColor: alpha(theme.palette.success.main, 0.2),
                            },
                        }}
                    >
                        <CardGiftcardIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={onDonate}
                        title="Donate"
                        sx={{
                            color: theme.palette.primary.main,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            "&:hover": {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                            },
                        }}
                    >
                        <DonateIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={onShare}
                        title="Share"
                        sx={{
                            color: theme.palette.text.secondary,
                            backgroundColor: alpha(theme.palette.action.hover, 0.1),
                            "&:hover": {
                                backgroundColor: alpha(theme.palette.action.hover, 0.2),
                                color: theme.palette.text.primary,
                            },
                        }}
                    >
                        <ShareIcon fontSize="small" />
                    </IconButton>
                </ActionButtonsContainer>
            </Box>

            {/* Messages List with Animations */}
            <MessagesContainer className="custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <MessageItem
                            key={msg.id}
                            type={msg.type}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            layout
                        >
                            <Avatar
                                sx={{
                                    width: 36,
                                    height: 36,
                                    mr: 1.5,
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    bgcolor:
                                        msg.type === "donation"
                                            ? theme.palette.success.main
                                            : theme.palette.primary.main,
                                }}
                            >
                                {msg.user[0].toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={600}
                                        sx={{
                                            color:
                                                msg.type === "donation"
                                                    ? theme.palette.success.main
                                                    : theme.palette.text.primary,
                                        }}
                                    >
                                        {msg.user}
                                    </Typography>
                                    {msg.type === "donation" && (
                                        <Chip
                                            label="DONATION"
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: "0.65rem",
                                                fontWeight: 700,
                                                backgroundColor: alpha(theme.palette.success.main, 0.2),
                                                color: theme.palette.success.main,
                                            }}
                                        />
                                    )}
                                </Box>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        wordBreak: "break-word",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {msg.text}
                                </Typography>
                            </Box>
                        </MessageItem>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </MessagesContainer>

            {/* Message Input - Always visible at bottom */}
            <Box
                sx={{
                    p: theme.spacing(1.5),
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    position: "relative",
                    background: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: "blur(12px)",
                }}
            >
                <TextField
                    fullWidth
                    placeholder="Send a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="small"
                    multiline
                    maxRows={3}
                    InputProps={{
                        startAdornment: (
                            <IconButton
                                ref={emojiButtonRef}
                                onClick={handleEmojiButtonClick}
                                size="small"
                                sx={{
                                    mr: 1,
                                    color: theme.palette.text.secondary,
                                    "&:hover": {
                                        color: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                }}
                            >
                                <EmojiIcon />
                            </IconButton>
                        ),
                        endAdornment: (
                            <IconButton
                                onClick={handleSendMessage}
                                disabled={!message.trim()}
                                size="small"
                                sx={{
                                    color: message.trim() ? theme.palette.primary.main : theme.palette.text.disabled,
                                    "&:hover:not(:disabled)": {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    },
                                }}
                            >
                                <SendIcon />
                            </IconButton>
                        ),
                        sx: {
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.background.default, 0.7),
                            "&:hover": {
                                backgroundColor: alpha(theme.palette.background.default, 0.8),
                            },
                            "&.Mui-focused": {
                                backgroundColor: alpha(theme.palette.background.default, 0.9),
                                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                            },
                            fontSize: "0.9rem",
                            padding: theme.spacing(0.5),
                        },
                    }}
                />

                {/* Emoji Picker Popover */}
                <Popover
                    open={emojiOpen}
                    anchorEl={emojiAnchor}
                    onClose={handleEmojiClose}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "center",
                    }}
                    transformOrigin={{
                        vertical: "bottom",
                        horizontal: "center",
                    }}
                    sx={{
                        "& .MuiPopover-paper": {
                            backgroundColor: "transparent",
                            boxShadow: "none",
                            overflow: "visible",
                        },
                    }}
                >
                    <EmojiPickerContainer>
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            autoFocusSearch={false}
                            theme={theme.palette.mode}
                            skinTonesDisabled
                            searchDisabled={false}
                            width={isSmallMobile ? 300 : 350}
                            height={isSmallMobile ? 300 : 400}
                        />
                    </EmojiPickerContainer>
                </Popover>
            </Box>
        </ChatContainer>
    );
};

export default LiveChat;
