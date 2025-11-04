import React, { useState, useEffect, useRef, useCallback, Fragment } from "react";
import {
    Box, Button, Typography, IconButton, alpha, Avatar, Chip, Stack, TextField, Popover, Tooltip, useMediaQuery, useTheme
} from "@mui/material";
import {
    Close as CloseIcon, Send as SendIcon, Favorite as LikeIcon, Share as ShareIcon, EmojiEmotions as EmojiIcon, CardGiftcard as CardGiftcardIcon
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from 'emoji-picker-react';
import {
    ChatContainer,
    MessageItem,
    EmojiPickerContainer,
    CompactHeader,
    ActionButtonsContainer,
    MessagesContainer
} from "../styled/ChatStyles";

export const LiveChat = ({ messages, onSendMessage, onDonate, onLike, onSubscribe, onFollow, onGift, onShare, chatOpen, onToggleChat, isCompact = false, // Existing Props
    // 🛑 NEW PROPS
    socketRef, socketConnected 
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const messagesEndRef = useRef(null);
    const [message, setMessage] = useState("");
    const [emojiAnchor, setEmojiAnchor] = useState(null);

    const handleSendMessageInternal = () => { 
        if (message.trim()) { 
            // 🛑 FIX: Use the emit logic passed from parent
            onSendMessage(message); 
            setMessage(""); 
        } 
    };

    const handleKeyPress = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessageInternal(); } };
    const handleEmojiClick = (emojiData) => { setMessage((prev) => prev + emojiData.emoji); setEmojiAnchor(null); };
    const handleEmojiButtonClick = (event) => { setEmojiAnchor(event.currentTarget); };
    const handleEmojiClose = () => { setEmojiAnchor(null); };
    const emojiOpen = Boolean(emojiAnchor);
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(scrollToBottom, [messages]);

    // Check if the chat input should be disabled
    const isInputDisabled = !socketConnected;

    return (
        <ChatContainer isCompact={isCompact} sx={{ ...(isCompact && { maxHeight: "50vh", border: `1px solid ${alpha(theme.palette.divider, 0.2)}`, boxShadow: theme.shadows[6] }) }}>
            
            {/* Header */}
            {isCompact ? (
                <CompactHeader>
                    <Typography variant="h6" fontWeight={600} sx={{ fontSize: "1.1rem" }}>💬 Live Chat ({messages.length})</Typography>
                    <IconButton size="small" onClick={onToggleChat} sx={{ color: theme.palette.text.secondary, "&:hover": { color: theme.palette.text.primary, backgroundColor: alpha(theme.palette.action.hover, 0.1) } }}> <CloseIcon fontSize="small" /> </IconButton>
                </CompactHeader>
            ) : (
                <Box sx={{ p: theme.spacing(1.5), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(12px)" }}>
                    <Typography variant="h6" fontWeight={600}> Live Chat ({messages.length})</Typography>
                    {isMobile && <IconButton size="small" onClick={onToggleChat} sx={{ color: theme.palette.text.secondary, "&:hover": { color: theme.palette.text.primary, backgroundColor: alpha(theme.palette.action.hover, 0.1) } }}> <CloseIcon fontSize="small" /> </IconButton>}
                </Box>
            )}

            {/* Action Buttons (Like, Gift, Share) */}
            <Box sx={{ p: theme.spacing(1), borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, background: alpha(theme.palette.background.default, 0.6), backdropFilter: "blur(8px)" }}>
                <ActionButtonsContainer isCompact={isCompact}>
                    <Tooltip title="Send Like">
                        <IconButton size="small" onClick={onLike} sx={{ color: theme.palette.error.main, backgroundColor: alpha(theme.palette.error.main, 0.1), "&:hover": { backgroundColor: alpha(theme.palette.error.main, 0.2) } }} disabled={isInputDisabled}> <LikeIcon fontSize="small" /> </IconButton>
                    </Tooltip>
                    <Tooltip title="Send Gift">
                        <IconButton size="small" onClick={onGift} sx={{ color: theme.palette.success.main, backgroundColor: alpha(theme.palette.success.main, 0.1), "&:hover": { backgroundColor: alpha(theme.palette.success.main, 0.2) } }} disabled={isInputDisabled}> <CardGiftcardIcon fontSize="small" /> </IconButton>
                    </Tooltip>
                    <Tooltip title="Share">
                        <IconButton size="small" onClick={onShare} sx={{ color: theme.palette.text.secondary, backgroundColor: alpha(theme.palette.action.hover, 0.1), "&:hover": { backgroundColor: alpha(theme.palette.action.hover, 0.2), color: theme.palette.text.primary } }} disabled={isInputDisabled}> <ShareIcon fontSize="small" /> </IconButton>
                    </Tooltip>
                </ActionButtonsContainer>
            </Box>

            {/* Messages Area */}
            <MessagesContainer className="custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <MessageItem key={msg.id} type={msg.type} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} layout>
                            <Avatar sx={{ width: 36, height: 36, mr: 1.5, fontSize: "1rem", fontWeight: 600, bgcolor: msg.type === "donation" ? theme.palette.success.main : theme.palette.primary.main }}>{msg.user[0]?.toUpperCase() || '?'}</Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ color: msg.type === "donation" ? theme.palette.success.main : theme.palette.text.primary }}>{msg.user}</Typography>
                                    {msg.type === "donation" && <Chip label="DONATION" size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, backgroundColor: alpha(theme.palette.success.main, 0.2), color: theme.palette.success.main }} />}
                                </Box>
                                <Typography variant="body2" sx={{ wordBreak: "break-word", lineHeight: 1.4 }}>{msg.text}</Typography>
                            </Box>
                        </MessageItem>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </MessagesContainer>

            {/* Message Input */}
            <Box sx={{ p: theme.spacing(1.5), borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`, position: "relative", background: alpha(theme.palette.background.paper, 0.9), backdropFilter: "blur(12px)" }}>
                <TextField fullWidth placeholder={isInputDisabled ? "Connecting to chat..." : "Send a message..."} value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={handleKeyPress} size="small" multiline maxRows={3} disabled={isInputDisabled}
                    InputProps={{
                        startAdornment: (
                            <IconButton 
                                onClick={handleEmojiButtonClick} 
                                size="small" 
                                sx={{ mr: 1, color: theme.palette.text.secondary, "&:hover": { color: theme.palette.primary.main, backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}
                                disabled={isInputDisabled}
                            >
                                <EmojiIcon />
                            </IconButton>
                        ),
                        endAdornment: (<IconButton onClick={handleSendMessageInternal} disabled={isInputDisabled || !message.trim()} size="small" sx={{ color: message.trim() ? theme.palette.primary.main : theme.palette.text.disabled, "&:hover:not(:disabled)": { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}><SendIcon /></IconButton>),
                        sx: { borderRadius: 2, backgroundColor: alpha(theme.palette.background.default, 0.7), "&:hover": { backgroundColor: alpha(theme.palette.background.default, 0.8) }, "&.Mui-focused": { backgroundColor: alpha(theme.palette.background.default, 0.9), boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}` }, fontSize: "0.9rem", padding: theme.spacing(0.5) }
                    }}
                />
                <Popover 
                    open={emojiOpen}
                    anchorEl={emojiAnchor} 
                    onClose={handleEmojiClose} 
                    anchorOrigin={{ vertical: "top", horizontal: "right" }} 
                    transformOrigin={{ vertical: "bottom", horizontal: "right" }} 
                    sx={{ "& .MuiPopover-paper": { backgroundColor: "transparent", boxShadow: "none", overflow: "visible" } }}
                >
                    <EmojiPickerContainer>
                        <EmojiPicker onEmojiClick={handleEmojiClick} autoFocusSearch={false} theme={theme.palette.mode} />
                    </EmojiPickerContainer>
                </Popover>
            </Box>
        </ChatContainer>
    );
};
