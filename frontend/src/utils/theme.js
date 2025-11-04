import { createTheme } from "@mui/material/styles";

// Light Theme
const lightTheme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#16b48e", // Main brand color (teal)
            dark: "#0f8a6b", // Darker teal for hover states
            light: "#4dd4b8", // Lighter teal for backgrounds
        },
        secondary: {
            main: "#616161", // Grey for secondary elements
            dark: "#424242", // Darker grey
            light: "#9e9e9e", // Lighter grey
        },
        background: {
            default: "#f4f6f8", // Light grey background
            paper: "#ffffff", // White for cards/containers
        },
        text: {
            primary: "#212121", // Dark text for readability
            secondary: "#616161", // Grey text for secondary content
        },
        action: {
            hover: "#f5f5f5", // Light grey for hover states
            disabled: "#bdbdbd", // Disabled state color
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: "2.5rem",
            fontWeight: 500,
        },
        h2: {
            fontSize: "2rem",
            fontWeight: 500,
        },
        h3: {
            fontSize: "1.8rem",
            fontWeight: 500,
        },
        // Add more typography settings as needed
    },
    transitions: {
        duration: {
            standard: 300,
        },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: "none",
                    backgroundImage: "none",
                    backgroundColor: "#fff", // Ensure the AppBar is transparent
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                root: {
                    boxShadow: "none",
                    backgroundImage: "none",
                    backgroundColor: "#fff", // Ensure the AppBar is transparent
                },
            },
        },
    },
});

// Dark Theme
const darkTheme = createTheme({
    palette: {
        mode: "dark",
        primary: {
            main: "#16b48e", // Main brand color (teal)
            dark: "#0f8a6b", // Darker teal for hover states
            light: "#4dd4b8", // Lighter teal for backgrounds
        },
        secondary: {
            main: "#616161", // Grey for secondary elements
            dark: "#424242", // Darker grey
            light: "#9e9e9e", // Lighter grey
        },
        background: {
            default: "#030303", // Dark background
            paper: "#0b0f19", // Darker for cards/containers
        },
        text: {
            primary: "#ffffff", // White text for readability
            secondary: "#bdbdbd", // Light grey text for secondary content
        },
        action: {
            hover: "#171b25", // Dark grey for hover states
            disabled: "#424242", // Disabled state color
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: "2.5rem",
            fontWeight: 500,
        },
        h2: {
            fontSize: "2rem",
            fontWeight: 500,
        },
        h3: {
            fontSize: "1.8rem",
            fontWeight: 500,
        },
        // Add more typography settings as needed
    },
    transitions: {
        duration: {
            standard: 300,
        },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: "none",
                    backgroundImage: "none",
                    backgroundColor: "#030303",
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                root: {
                    boxShadow: "none",
                    backgroundImage: "none",
                    backgroundColor: "#030303",
                },
            },
        },
    },
});

export { lightTheme, darkTheme };
