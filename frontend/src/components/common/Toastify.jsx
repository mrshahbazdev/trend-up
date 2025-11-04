import { Alert, Snackbar, Slide, useTheme, alpha } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

// Slide transition for modern feel
function SlideTransition(props) {
    return <Slide {...props} direction="down" />;
}

const Toastify = ({ toast, onClose }) => {
    const theme = useTheme();

    const iconMapping = {
        success: <CheckCircleIcon fontSize="inherit" />,
        error: <ErrorIcon fontSize="inherit" />,
        warning: <WarningIcon fontSize="inherit" />,
        info: <InfoIcon fontSize="inherit" />,
    };

    const truncateMessage = (message) => {
        if (message?.length > 200) {
            return message.slice(0, 200) + "...";
        }
        return message;
    };

    return (
        <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            open={toast.open}
            autoHideDuration={toast.duration}
            onClose={onClose}
            TransitionComponent={SlideTransition}
            sx={{ 
                mt: 2,
                '& .MuiSnackbar-root': {
                    top: '80px',
                }
            }}
        >
            <Alert
                icon={iconMapping[toast.severity]}
                onClose={onClose}
                severity={toast.severity}
                variant="filled"
                sx={{
                    width: '100%',
                    maxWidth: '600px',
                    boxShadow: theme.shadows[8],
                    backgroundColor: toast.severity === 'success' 
                        ? theme.palette.primary.main
                        : toast.severity === 'error'
                        ? '#f44336'
                        : toast.severity === 'warning'
                        ? '#ff9800'
                        : theme.palette.primary.main,
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    border: `1px solid ${alpha('#fff', 0.1)}`,
                    backdropFilter: 'blur(10px)',
                    '& .MuiAlert-icon': {
                        color: '#fff',
                    },
                    '& .MuiAlert-action': {
                        color: '#fff',
                    },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[12],
                    }
                }}
            >
                {truncateMessage(toast.message)}
            </Alert>
        </Snackbar>
    );
};

export default Toastify;
