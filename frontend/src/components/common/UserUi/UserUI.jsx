import { Avatar, Stack, Typography } from "@mui/material";
import React from "react";

const UserUI = ({ username, userImage }) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar src={userImage} />
      <Typography
        sx={(theme) => ({ color: theme.palette.text.secondary })}
        fontWeight={600}
      >
        {username}
      </Typography>
    </Stack>
  );
};

export default UserUI;
