import { styled } from "@mui/material/styles";
import Tab from "@mui/material/Tab";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";

const MotionTab = motion(Tab);

const CustomTab = styled(({ icon, selected, label,sx, ...props }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === "dark";

    const colors = isDarkMode
        ? { primary: "#e12e24", secondary: "#a61d66", text: "#fff", muted: "#aaa" }
        : { primary: "#16b48e", secondary: "#e0f7f1", text: "#222", muted: "#666" };

    return (
        <MotionTab
            {...props}
            icon={icon}
            disableRipple
            whileHover={{
                scale: 1.05,
                transition: { type: "spring", stiffness: 400 },
            }}
            animate={{
                background: selected
                    ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                    : "transparent",
                color: selected ? colors.text : colors.muted,
                boxShadow: selected ? "0 2px 10px rgba(0,0,0,0.1)" : "none",
            }}
            transition={{
                duration: 0.3,
            }}
            label={
                <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{
            opacity: 1,
            x: selected ? 0 : 0,
            color: selected ? colors.text : colors.muted,
        }}
                    transition={{ duration: 0.3 }}
                    style={{
                        fontWeight: selected ? 600 : 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        display: "inline-block",
                    }}
                >
                    {label}
                </motion.span>
            }
            sx={{
                minHeight: 48,
                minWidth: 48,
                padding: theme.spacing(1.2),
                margin: theme.spacing(0.5),
                borderRadius: "10px",
                justifyContent: "flex-start",
                textTransform: "none",
                "& .MuiTab-iconWrapper": {
                    marginRight: selected ? theme.spacing(1) : 0,
                    transition: "margin-right 0.3s ease",
                },
                mx: 0.5,
                ...sx
            }}
        />
    );
})(() => ({
    fontSize: "0.875rem",
    letterSpacing: "0.02em",
}));

export default CustomTab;
