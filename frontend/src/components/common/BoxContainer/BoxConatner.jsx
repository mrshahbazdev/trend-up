import { Box } from "@mui/material";
import React from "react";

const BoxConatner = ({ children, sx }) => {
    return (
        <Box
            borderRadius={2}
            sx={(theme) => ({
                background: theme.palette.background.paper,
                p: { xs: 1, md: 2 },
                ...sx,
                boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.25)",
                border: `1px solid ${theme.palette.divider}`,
            })}
        >
            {children}
        </Box>
    );
};

export default BoxConatner;
