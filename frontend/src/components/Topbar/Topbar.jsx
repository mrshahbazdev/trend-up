import { useMediaQuery, useTheme } from "@mui/material";
import Navbar from '@components/Topbar/Navbar'
import Header from '@components/Topbar/Header'

const Topbar = () => {
    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
    return <> {isMdUp ? <Navbar /> : <Header />}</>;
};

export default Topbar;
