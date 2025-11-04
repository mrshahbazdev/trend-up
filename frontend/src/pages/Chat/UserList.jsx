import {
    Box,
    Typography,
    TextField,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemButton,
    Avatar,
    Badge,
    Chip,
    InputAdornment,
    styled,
    alpha,
} from "@mui/material";
import { Search as SearchIcon, Bolt, Verified } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";

// Styled components with modern Web3 aesthetics
const MotionListItemButton = motion(ListItemButton);

const StatusBadge = ({ status, theme }) => {
    return styled(Box)(() => ({
        width: 14,
        height: 14,
        borderRadius: "50%",
        backgroundColor:
            status === "online"
                ? theme.palette.success.main
                : status === "away"
                ? theme.palette.warning.main
                : status === "busy"
                ? theme.palette.error.main
                : theme.palette.text.disabled,
        border: `3px solid ${theme.palette.background.paper}`,
        boxShadow: `0 0 0 2px ${theme.palette.background.default}`,
    }));
};

const UserContainer = styled(Box)(({ theme }) => ({
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: alpha(theme.palette.background.paper, 0.85),
    backdropFilter: "blur(16px)",
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
}));

const Header = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3, 2),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`,
}));

const UserNameText = styled(Typography)(({ theme, $isactive }) => ({
    fontWeight: $isactive ? 700 : 600,
    background: $isactive
        ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
        : "none",
    WebkitBackgroundClip: $isactive ? "text" : "none",
    WebkitTextFillColor: $isactive ? "transparent" : theme.palette.text.primary,
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
}));

export default function UserList({ users, conversations, activeUserId, searchQuery, onSearchChange, onUserSelect }) {
    const theme = useTheme();

    const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <UserContainer>
            {/* Header with Web3 styling */}
            <Header>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Bolt
                        sx={{
                            color: theme.palette.primary.main,
                            fontSize: "1.5rem",
                        }}
                    />
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: "-0.5px",
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}
                    >
                        TrendUp Chat
                    </Typography>
                </Box>
            </Header>

            {/* Search with modern styling */}
            <Box sx={{ p: 2, pb: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon
                                    sx={{
                                        color: alpha(theme.palette.text.secondary, 0.8),
                                    }}
                                />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            bgcolor: alpha(
                                theme.palette.mode === "dark"
                                    ? theme.palette.background.default
                                    : theme.palette.background.paper,
                                0.7
                            ),
                            borderRadius: "12px",
                            color: theme.palette.text.primary,
                            transition: theme.transitions.create(["border-color", "box-shadow"]),
                            "& fieldset": {
                                borderColor: alpha(theme.palette.divider, 0.3),
                            },
                            "&:hover fieldset": {
                                borderColor: alpha(theme.palette.primary.light, 0.5),
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: theme.palette.primary.main,
                                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                            },
                        },
                    }}
                />
            </Box>

            {/* Users List with modern styling */}
            <Box
                sx={{
                    flex: 1,
                    overflow: "auto",
                    "&::-webkit-scrollbar": {
                        width: "6px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        background: `linear-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        borderRadius: "6px",
                    },
                    p: 1,
                }}
            >
                <List sx={{ py: 0 }}>
                    {filteredUsers.map((user) => {
                        const conversation = conversations.find((conv) => conv.userId === user.id);
                        const isActive = activeUserId === user.id;
                        const unreadCount = conversation?.unreadCount || 0;

                        return (
                            <ListItem key={user.id} disablePadding sx={{ p: 0.5 }}>
                                <MotionListItemButton
                                    onClick={() => onUserSelect(user.id)}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    sx={{
                                        py: 1.5,
                                        px: 2,
                                        borderRadius: "12px",
                                        bgcolor: isActive ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                                        border: `1px solid ${
                                            isActive
                                                ? alpha(theme.palette.primary.main, 0.3)
                                                : alpha(theme.palette.divider, 0.2)
                                        }`,
                                        "&:hover": {
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                            borderColor: alpha(theme.palette.primary.main, 0.4),
                                        },
                                    }}
                                    whileHover={{
                                        scale: 1.02,
                                        transition: { duration: 0.2 },
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                            badgeContent={() => StatusBadge({ status, theme })}
                                        >
                                            <Avatar
                                                src={user.avatar}
                                                sx={{
                                                    bgcolor: user.color,
                                                    width: 44,
                                                    height: 44,
                                                    fontSize: "1rem",
                                                    fontWeight: 700,
                                                    border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                                                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                                                }}
                                            >
                                                {user.name[0]}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <UserNameText variant="body1" $isactive={isActive}>
                                                    {user.name}
                                                    {user.verified && (
                                                        <Verified
                                                            fontSize="small"
                                                            sx={{
                                                                color: theme.palette.primary.main,
                                                                ml: 0.5,
                                                            }}
                                                        />
                                                    )}
                                                </UserNameText>
                                                {unreadCount > 0 && (
                                                    <Chip
                                                        label={unreadCount}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: theme.palette.error.main,
                                                            color: theme.palette.error.contrastText,
                                                            height: 22,
                                                            fontSize: "0.7rem",
                                                            minWidth: 22,
                                                            fontWeight: 700,
                                                            boxShadow: `0 2px 4px ${alpha(
                                                                theme.palette.error.main,
                                                                0.3
                                                            )}`,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color:
                                                        user.status === "offline"
                                                            ? alpha(theme.palette.text.secondary, 0.7)
                                                            : user.status === "online"
                                                            ? theme.palette.success.main
                                                            : user.status === "away"
                                                            ? theme.palette.warning.main
                                                            : theme.palette.error.main,
                                                    textTransform: "capitalize",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.5,
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {user.status === "offline" && user.lastSeen
                                                    ? `Last seen ${user.lastSeen.toLocaleTimeString([], {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                      })}`
                                                    : user.status}
                                            </Typography>
                                        }
                                    />
                                </MotionListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
        </UserContainer>
    );
}
