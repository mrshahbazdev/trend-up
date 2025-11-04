import { Popover } from "@mui/material";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useState } from "react";

export default function EmojiPicker({ children, onSelect }) {
    const [anchorEl, setAnchorEl] = useState(null);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEmojiSelect = (emoji) => {
        onSelect(emoji.native);
        handleClose();
    };

    return (
        <>
            <div onClick={handleClick}>{children}</div>
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
            >
                <Picker data={data} onEmojiSelect={handleEmojiSelect} />
            </Popover>
        </>
    );
}
