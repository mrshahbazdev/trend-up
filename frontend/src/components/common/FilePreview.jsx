import { Box, Paper, Typography } from "@mui/material";
import { Image, Description } from "@mui/icons-material";
import { motion } from "framer-motion";

export default function FilePreview({ file }) {
    if (file.type === "image") {
        return (
            <Box
                component={motion.img}
                src={file.url}
                alt={file.name}
                sx={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    borderRadius: 2,
                    mt: 1,
                }}
                whileHover={{ scale: 1.02 }}
            />
        );
    }

    return (
        <Paper
            component={motion.div}
            whileHover={{ scale: 1.01 }}
            sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                mt: 1,
            }}
        >
            {file.type.startsWith("image") ? <Image /> : <Description />}
            <Box>
                <Typography>{file.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                    {file.size}
                </Typography>
            </Box>
        </Paper>
    );
}
