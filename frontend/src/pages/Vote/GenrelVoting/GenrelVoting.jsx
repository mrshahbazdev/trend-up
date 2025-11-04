import ButtonMain from "@/components/common/ButtonMain";
import InputFeild from "@/components/common/InputFeild/InputFeild";
import Loading from "@/components/common/loading";
import { useToast } from "@/hooks/useToast.jsx";
import {  useTokenWriteFunction } from "@/connectivityAssets/hooks";
import { useGenrelContext } from "@/context/GenrelContext";
import { Avatar, AvatarGroup, Box, Container, Stack, Typography } from "@mui/material";
import { useAppKit } from "@reown/appkit/react";
import React, { useState } from "react";

const participents = [
    { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/250px-User_icon_2.svg.png" },
    { img: "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740" },
    {
        img: "https://static.vecteezy.com/system/resources/thumbnails/004/607/791/small_2x/man-face-emotive-icon-smiling-male-character-in-blue-shirt-flat-illustration-isolated-on-white-happy-human-psychological-portrait-positive-emotions-user-avatar-for-app-web-design-vector.jpg",
    },
    {
        img: "https://static.vecteezy.com/system/resources/thumbnails/004/607/791/small_2x/man-face-emotive-icon-smiling-male-character-in-blue-shirt-flat-illustration-isolated-on-white-happy-human-psychological-portrait-positive-emotions-user-avatar-for-app-web-design-vector.jpg",
    },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRI9lRck6miglY0SZF_BZ_sK829yiNskgYRUg&s" },
    { img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnSA1zygA3rubv-VK0DrVcQ02Po79kJhXo_A&s" },
];

const GenrelVoting = () => {
    const { address } = useGenrelContext();
    const { open } = useAppKit();
    const { handleWriteContract } = useTokenWriteFunction();

    const [title, setTitle] = useState({ text: "", error: "" });
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const onTextChange = (e) => {
        const text = e.target.value?.trim();

        setTitle((prev) => ({ ...prev, text: text, error: text?.length < 2 ? "Minimum two chrachters allowed" : "" }));
    };

    const vote = async () => {
        if (title.text?.trim()?.length < 2) {
            showToast("Minimum two chrachters allowed", "error");
            return;
        }
        try {
            setIsLoading(true);

            await handleWriteContract("createDemocraticVote", [title.text], address);

            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);

            if (error?.data?.message) {
                showToast(error?.data?.message, "error");
            } else if (error?.reason) {
                showToast(error?.reason, "error");
            } else {
                showToast(error?.message, "error");
            }
        }
    };
    return (
        <>
            <Loading isLoading={isLoading} />
            <Container maxWidth="sm">
                <Box
                    sx={(theme) => ({
                        border: `2px solid ${theme.palette.secondary.main}`,
                        borderRadius: "15px",
                        padding: { md: 4, xs: 1.5 },
                    })}
                >
                    <Typography
                        sx={(theme) => ({
                            fontSize: {
                                md: "22px",
                                xs: "18px",
                            },
                            textAlign: "center",
                            color: theme.palette.text.secondary,
                            fontWeight: 700,
                        })}
                    >
                        Genrel Voting
                    </Typography>
                    <Typography
                        sx={(theme) => ({
                            textAlign: "center",
                            color: theme.palette.secondary.main,
                            mt: 3,
                        })}
                    >
                        Participents
                    </Typography>
                    <Stack direction={"row"} alignItems={"center"} justifyContent={"center"} mt={2} gap={"50px"}>
                        <AvatarGroup max={4}>
                            {participents.map((item, i) => (
                                <Avatar src={item.img} key={i} sizes="small" />
                            ))}
                        </AvatarGroup>

                        <Typography
                            sx={(theme) => ({
                                textAlign: "center",
                                color: theme.palette.secondary.main,
                            })}
                        >
                            People
                        </Typography>
                    </Stack>
                    <Typography
                        sx={(theme) => ({
                            textAlign: "center",
                            color: theme.palette.secondary.main,
                            mt: 3,
                        })}
                    >
                        Vote Id
                    </Typography>
                    <InputFeild
                        placeholder="Vote Id"
                        name="voteId"
                        type="text"
                        onChange={onTextChange}
                        value={title.text}
                        error={title.error}
                    />
                    {address ? (
                        <>
                            {" "}
                            <ButtonMain onClick={vote} sx={{ mt: 2, width: "100%" }}>
                                Vote
                            </ButtonMain>
                        </>
                    ) : (
                        <ButtonMain onClick={open} sx={{ mt: 2, width: "100%" }}>
                            Connect Wallet
                        </ButtonMain>
                    )}
                </Box>
            </Container>
        </>
    );
};

export default GenrelVoting;
