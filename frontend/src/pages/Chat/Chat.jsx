import { useState, useCallback } from "react";
import { Box, Drawer, styled, useMediaQuery, useTheme, alpha } from "@mui/material";
import UserList from "./UserList";
import ChatDetail from "./ChatDetail";
import WelcomeScreen from "./WelcomeScreen";
import { initialConversations, users } from "@/constants";
import { motion } from "framer-motion";

const DRAWER_WIDTH = 320;

// Styled components with Web3/Social Media aesthetics
const ChatContainer = styled(Box)({
    display: "flex",
    height: "100%",
    background: "transparent",
    position: "relative",
    overflow: "hidden",
    "&:before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "radial-gradient(circle at 20% 30%, rgba(100, 80, 255, 0.15) 0%, transparent 40%)",
        zIndex: -1,
    },
});

const StyledDrawer = styled(Drawer)(({ theme }) => ({
    width: DRAWER_WIDTH,
    flexShrink: 0,
    "& .MuiDrawer-paper": {
        width: DRAWER_WIDTH,
        boxSizing: "border-box",
        background: alpha(theme.palette.background.paper, 0.85),
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        borderRadius: "0 24px 24px 0",
        backdropFilter: "blur(16px)",
        boxShadow: `0 0 32px ${alpha(theme.palette.primary.main, 0.1)}`,
        overflow: "hidden",
        transition: theme.transitions.create(["width", "box-shadow"], {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
        }),
        "&:hover": {
            boxShadow: `0 0 48px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
    },
}));

const MainChatArea = styled(motion.div)(({ theme }) => ({
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
    height: "84vh",
    borderRadius: { md: "24px" },
    background: alpha(theme.palette.background.paper, 0.85),
    backdropFilter: "blur(16px)",
    boxShadow: `0 0 32px ${alpha(theme.palette.primary.main, 0.1)}`,
    overflow: "hidden",
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    transition: theme.transitions.create(["background", "box-shadow"], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
    }),
    "&:hover": {
        boxShadow: `0 0 48px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
    "&::-webkit-scrollbar": {
        width: "6px",
        background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
        background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        borderRadius: "6px",
    },
    "&": {
        scrollbarColor: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main}) transparent`,
        scrollbarWidth: "thin",
    },
    position: "relative",
    "&:before": {
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 100%)`,
        zIndex: -1,
    },
}));

export default function Chat() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const [conversations, setConversations] = useState(initialConversations);
    const [activeUserId, setActiveUserId] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [emojiAnchor, setEmojiAnchor] = useState(null);
    const [reactionAnchor, setReactionAnchor] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [_blobUrls, setBlobUrls] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [searchQuery, setSearchQuery] = useState("");

    const currentConversation = activeUserId ? conversations.find((conv) => conv.userId === activeUserId) : null;
    const currentUser = activeUserId ? users.find((user) => user.id === activeUserId) : null;
    const messages = currentConversation?.messages || [];

    const handleUserSelect = useCallback(
        (userId) => {
            setActiveUserId(userId);
            setReplyTo(null);
            setNewMessage("");
            setSelectedFiles([]);
            setConversations((prev) =>
                prev.map((conv) => (conv.userId === userId ? { ...conv, unreadCount: 0 } : conv))
            );
            if (isMobile) setDrawerOpen(false);
        },
        [isMobile]
    );

    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() && selectedFiles.length === 0) return;

        const newBlobUrls = [];
        const attachments = selectedFiles.map((file) => {
            const url = URL.createObjectURL(file);
            newBlobUrls.push(url);
            return {
                name: file.name,
                url,
                type: file.type.startsWith("image/") ? "image" : "file",
                size: file.size,
            };
        });

        setBlobUrls((prev) => [...prev, ...newBlobUrls]);

        if (selectedFiles.length > 0) {
            setUploadProgress(0);
            for (let i = 0; i <= 100; i += 10) {
                await new Promise((resolve) => setTimeout(resolve, 50));
                setUploadProgress(i);
            }
            setUploadProgress(null);
        }

        const message = {
            id: Date.now().toString(),
            user: {
                name: "You",
                avatar: "/abstract-geometric-shapes.png",
                color: theme.palette.primary.main,
            },
            content: newMessage,
            timestamp: new Date(),
            reactions: [],
            attachments: attachments.length > 0 ? attachments : undefined,
            replyTo,
        };

        setConversations((prev) =>
            prev.map((conv) =>
                conv.userId === activeUserId ? { ...conv, messages: [...conv.messages, message] } : conv
            )
        );

        setNewMessage("");
        setSelectedFiles([]);
        setReplyTo(null);
    }, [newMessage, selectedFiles, replyTo, activeUserId, theme.palette.primary.main]);

    const handleFileSelect = useCallback((event) => {
        const files = Array.from(event.target.files || []);
        setSelectedFiles((prev) => [...prev, ...files]);
    }, []);

    const removeFile = useCallback((index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const addReaction = useCallback(
        (messageId, emoji) => {
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.userId === activeUserId
                        ? {
                              ...conv,
                              messages: conv.messages.map((msg) => {
                                  if (msg.id === messageId) {
                                      const existingReaction = msg.reactions.find((r) => r.emoji === emoji);
                                      if (existingReaction) {
                                          if (existingReaction.users.includes("You")) {
                                              return {
                                                  ...msg,
                                                  reactions: msg.reactions
                                                      .map((r) =>
                                                          r.emoji === emoji
                                                              ? {
                                                                    ...r,
                                                                    count: r.count - 1,
                                                                    users: r.users.filter((u) => u !== "You"),
                                                                }
                                                              : r
                                                      )
                                                      .filter((r) => r.count > 0),
                                              };
                                          } else {
                                              return {
                                                  ...msg,
                                                  reactions: msg.reactions.map((r) =>
                                                      r.emoji === emoji
                                                          ? { ...r, count: r.count + 1, users: [...r.users, "You"] }
                                                          : r
                                                  ),
                                              };
                                          }
                                      } else {
                                          return {
                                              ...msg,
                                              reactions: [...msg.reactions, { emoji, count: 1, users: ["You"] }],
                                          };
                                      }
                                  }
                                  return msg;
                              }),
                          }
                        : conv
                )
            );
        },
        [activeUserId]
    );

    const handleKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        },
        [handleSendMessage]
    );

    return (
        <ChatContainer>
            {/* Sidebar with modern Web3 styling */}
            <StyledDrawer
                variant={isMobile ? "temporary" : "permanent"}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile
                }}
            >
                <UserList
                    users={users}
                    conversations={conversations}
                    activeUserId={activeUserId}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onUserSelect={handleUserSelect}
                />
            </StyledDrawer>

            {/* Main Chat Area with animated Web3 elements */}
            <MainChatArea
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1],
                }}
                sx={{
                    borderRadius: "24px",
                    ml: { md: `${DRAWER_WIDTH}px` },
                    transform: { md: "translateX(0)" },
                }}
            >
                {!activeUserId ? (
                    <WelcomeScreen isMobile={isMobile} onOpenDrawer={() => setDrawerOpen(true)} />
                ) : (
                    <ChatDetail
                        currentUser={currentUser}
                        messages={messages}
                        newMessage={newMessage}
                        selectedFiles={selectedFiles}
                        emojiAnchor={emojiAnchor}
                        reactionAnchor={reactionAnchor}
                        uploadProgress={uploadProgress}
                        replyTo={replyTo}
                        isMobile={isMobile}
                        onOpenDrawer={() => setDrawerOpen(true)}
                        onMessageChange={setNewMessage}
                        onFileSelect={handleFileSelect}
                        onRemoveFile={removeFile}
                        onSendMessage={handleSendMessage}
                        onKeyDown={handleKeyDown}
                        onEmojiClick={(e) => setEmojiAnchor(e.currentTarget)}
                        onEmojiClose={() => setEmojiAnchor(null)}
                        onEmojiSelect={(emoji) => setNewMessage((prev) => prev + emoji)}
                        onReactionClick={(e, messageId) => setReactionAnchor({ element: e.currentTarget, messageId })}
                        onReactionClose={() => setReactionAnchor(null)}
                        onAddReaction={addReaction}
                        onReply={setReplyTo}
                        onCancelReply={() => setReplyTo(null)}
                    />
                )}
            </MainChatArea>
        </ChatContainer>
    );
}
