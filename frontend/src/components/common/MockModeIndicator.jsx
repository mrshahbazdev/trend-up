import { Alert, Box } from "@mui/material";
import { DISABLE_WEB3 } from "@/constants";

const MockModeIndicator = () => {
    if (!DISABLE_WEB3) return null;
    
    return (
        <Box sx={{ mb: 2 }}>
            <Alert severity="warning" variant="filled">
                🔶 <strong>Demo Mode Active</strong> - Web3 is disabled. Using mock blockchain data for testing.
            </Alert>
        </Box>
    );
};

export default MockModeIndicator;

