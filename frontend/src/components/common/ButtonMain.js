import { styled } from "@mui/material";
import Button from "@mui/material/Button";

const ButtonMain = styled(Button)(({ theme }) => ({
    background: theme.palette.primary.main,

    fontSize: "14px",
    fontWeight: 700,
    color: "#fff",
    fontFamily: "Helvetica",
    letterSpacing: "0.16px",
    textTransform: "uppercase",
    padding: "10px 20px",
    borderRadius: "15px"
}));
export default ButtonMain;
