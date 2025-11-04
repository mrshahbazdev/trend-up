import { FormControl, FormHelperText, FormLabel, OutlinedInput } from "@mui/material";
import React from "react";

const InputFeild = ({
    error = "",
    placeholder = "",
    lable = "",
    onChange,
    color = "primary",
    value,
    type = "text",
    name = "",
    endAdornment = null,
}) => {
    return (
        <FormControl error={error} sx={{ display: "block", mt: 2 }}>
            {lable && <FormLabel>{lable}</FormLabel>}
            <OutlinedInput
                placeholder={placeholder}
                onChange={onChange}
                color={color}
                value={value}
                type={type}
                name={name}
                sx={{ width: "100%" }}
                endAdornment={endAdornment}
                error={error}
            />
            {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
    );
};

export default InputFeild;
