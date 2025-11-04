import { TabList } from "@mui/lab";
import { styled } from "@mui/material/styles";

const CustomTabs = styled(TabList)(() => ({
    minHeight: 48,
    "& .MuiTabs-indicator": {
        display: "none", // We’re using background instead
    },
}));
export default CustomTabs;
