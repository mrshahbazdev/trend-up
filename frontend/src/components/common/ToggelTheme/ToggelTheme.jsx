// src/components/ThemeToggle.js
import { styled } from "@mui/material/styles";
import { useGenrelContext } from "../../../context/GenrelContext";
import { Switch } from "@mui/material";

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
    width: 62,
    height: 34,
    padding: 7,
    transition: theme.transitions.create(["background-color"], {
        duration: theme.transitions.duration.standard,
    }),
    "& .MuiSwitch-switchBase": {
        margin: 1,
        padding: 0,
        transform: "translateX(6px)",
        transition: theme.transitions.create(["transform"], {
            duration: theme.transitions.duration.standard,
        }),
        "&.Mui-checked": {
            transform: "translateX(22px)",
            color: theme.palette.primary.main,
            "& .MuiSwitch-thumb": {
                backgroundColor: "#FFC107", // golden glow for moon
                boxShadow: "0 0 8px rgba(255, 193, 7, 0.5)",
                "&::before": {
                    transform: "rotate(360deg)",
                    transition: "transform 0.4s ease",
                    backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="${encodeURIComponent(
                        "#fff"
                    )}" height="20" width="20" viewBox="0 0 24 24"><path d="M12 2a9.9 9.9 0 0 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16A8 8 0 0 1 12 4z"/></svg>')`,
                },
            },
            "& + .MuiSwitch-track": {
                backgroundColor: theme.palette.secondary.main,
            },
        },
    },
    "& .MuiSwitch-thumb": {
        backgroundColor: "#fff",
        width: 32,
        height: 32,
        position: "relative",
        transition: "background-color 0.3s ease, box-shadow 0.3s ease",
        "&::before": {
            content: "''",
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="${encodeURIComponent(
                "#ffb300"
            )}" height="20" width="20" viewBox="0 0 24 24"><path d="M6.76 4.84l-1.8-1.79L2.2 5.8l1.79 1.8L6.76 4.84zM1 12h4v-2H1v2zm10-9h2V1h-2v2zm10.79 2.21l-1.8-1.79-1.8 1.8 1.79 1.79 1.81-1.8zM17.24 4.84l1.8-1.79 2.76 2.75-1.8 1.8-2.76-2.76zM23 12h-4v2h4v-2zm-2.21 7.79l-1.79-1.8-1.8 1.8 1.8 1.79 1.79-1.79zM13 22h-2v2h2v-2zM4.22 19.78l-1.8-1.8-1.8 1.8 1.8 1.79 1.8-1.79z"/></svg>')`,
            transition: "transform 0.4s ease",
        },
    },
    "& .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: "#aab4be",
        borderRadius: 20 / 2,
        transition: theme.transitions.create(["background-color"], {
            duration: theme.transitions.duration.standard,
        }),
    },
}));

export const ThemeToggle = () => {
    const { isDarkMode, toggleTheme } = useGenrelContext();

    return <MaterialUISwitch sx={{ m: 1 }} checked={isDarkMode} onChange={toggleTheme} />;
};
