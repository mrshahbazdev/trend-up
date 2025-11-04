import { IconButton, Button, Tooltip, useTheme } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast.jsx';

const LogoutButton = ({ variant = 'icon' }) => {
    const theme = useTheme();
    const { logout } = useAuth();
    const { showToast } = useToast();

    const handleLogout = () => {
        logout();
        showToast('Logged out successfully', 'success');
    };

    if (variant === 'button') {
        return (
            <Button
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                    color: theme.palette.text.secondary,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)',
                    }
                }}
            >
                Logout
            </Button>
        );
    }

    return (
        <Tooltip title="Logout" arrow>
            <IconButton
                onClick={handleLogout}
                sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)',
                        color: theme.palette.primary.main,
                    },
                    transition: 'all 0.2s ease',
                }}
            >
                <LogoutIcon />
            </IconButton>
        </Tooltip>
    );
};

export default LogoutButton;

