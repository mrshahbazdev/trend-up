import React from "react";
import { Backdrop } from "@mui/material";
import { loadingGif } from "@/assets";

const Loading = ({ isLoading }) => {
    return (
        <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
            <img src={loadingGif} width={"100px"} />
        </Backdrop>
    );
};

export default Loading;
