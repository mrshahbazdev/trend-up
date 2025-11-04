import { useState } from 'react';
import {
    Typography,
    TextField,
    Box,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CancelIcon from '@mui/icons-material/Cancel';
import AnimatedDialog from '@/components/common/AnimatedDialog';
import { useDeleteAccountMutation } from '@/api/slices/userApi..js';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast.jsx';

const DeleteAccountDialog = ({ open, onClose }) => {
    const [confirmText, setConfirmText] = useState('');
    const [deleteAccount, { isLoading }] = useDeleteAccountMutation();
    const { logout } = useAuth();
    const { showToast } = useToast();

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            showToast('Please type DELETE to confirm', 'warning');
            return;
        }

        try {
            await deleteAccount().unwrap();
            showToast('Account deleted successfully', 'success');
            setTimeout(() => {
                logout();
            }, 1500);
        } catch (error) {
            showToast(error.data?.message || 'Failed to delete account', 'error');
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setConfirmText('');
            onClose();
        }
    };

    const actions = (
        <>
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <Button
                    onClick={handleClose}
                    disabled={isLoading}
                    startIcon={<CancelIcon />}
                    sx={{
                        color: '#ffffff',
                        borderRadius: '20px',
                        px: 3,
                        py: 1,
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                        },
                        transition: 'all 0.3s ease',
                    }}
                >
                    Cancel
                </Button>
            </motion.div>
            
            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
            >
                <Button
                    onClick={handleDelete}
                    disabled={isLoading || confirmText !== 'DELETE'}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteForeverIcon />}
                    sx={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: '#ffffff',
                        borderRadius: '20px',
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                        '&:hover': {
                            background: 'rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 6px 16px rgba(255, 255, 255, 0.3)',
                            transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.5)',
                            boxShadow: 'none',
                            transform: 'none',
                        },
                        transition: 'all 0.3s ease',
                    }}
                >
                    {isLoading ? 'Deleting...' : 'Delete Account'}
                </Button>
            </motion.div>
        </>
    );

    return (
        <AnimatedDialog
            open={open}
            onClose={handleClose}
            title="Delete Account"
            titleIcon={<WarningIcon />}
            headerColor="error"
            maxWidth="sm"
            fullWidth
            actions={actions}
        >
            <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    This action cannot be undone!
                </Typography>
                <Typography variant="body2">
                    Your account will be permanently deactivated and your data will be anonymized.
                </Typography>
            </Alert>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom color="text.primary">
                What will happen:
            </Typography>

            <List dense>
                <ListItem>
                    <ListItemIcon sx={{ minWidth: 35 }}>
                        <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: 'error.main' 
                        }} />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Your account will be deactivated"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon sx={{ minWidth: 35 }}>
                        <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: 'error.main' 
                        }} />
                    </ListItemIcon>
                    <ListItemText 
                        primary="Your email and username will be anonymized"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon sx={{ minWidth: 35 }}>
                        <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: 'error.main' 
                        }} />
                    </ListItemIcon>
                    <ListItemText 
                        primary="You will be logged out immediately"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon sx={{ minWidth: 35 }}>
                        <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: 'error.main' 
                        }} />
                    </ListItemIcon>
                    <ListItemText 
                        primary="This action cannot be reversed"
                        primaryTypographyProps={{ variant: 'body2' }}
                    />
                </ListItem>
            </List>

            <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.primary" gutterBottom>
                    To confirm deletion, type <strong>DELETE</strong> below:
                </Typography>
                <TextField
                    fullWidth
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="Type DELETE to confirm"
                    disabled={isLoading}
                    error={confirmText && confirmText !== 'DELETE'}
                    helperText={confirmText && confirmText !== 'DELETE' ? 'Must type DELETE exactly' : ''}
                    sx={{ mt: 1 }}
                />
            </Box>
        </AnimatedDialog>
    );
};

export default DeleteAccountDialog;

