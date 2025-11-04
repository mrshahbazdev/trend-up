import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";

const ButtonBorder = styled(Button)(({ theme }) => ({
    border: `1px solid ${theme.palette.primary.main}`,
    background: "rgba(255, 255, 255, 0.10)",
    backdropFilter: "blur(2px)",
    color: theme.palette.primary.main,
    fontFamily: "Helvetica",
    fontSize: "14px",
    fontWeight: "700",
    letterSpacing: "0.16px",
    textTransform: "uppercase",
    padding: "10px 20px",
    borderRadius: "24px",
}));

export default ButtonBorder;
