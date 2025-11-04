import React, { useState, useEffect, useCallback } from "react";
import { Box, CircularProgress, Typography, Button, styled, alpha } from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from 'react-redux';
import { useSocket } from '@/context/SocketContext';
import { useAgoraTracks, useAgoraClient } from './hooks/useAgora.js';
import { SpeakerGrid } from './components/SpeakerGrid.jsx';
import { RaisedHandsList } from './components/RaisedHandsList.jsx';
import { LiveHeader } from './components/LiveHeader.jsx';
import { VideoControls } from "./components/VideoControls.jsx";

const LiveContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    height: "100vh",
    flexDirection: "column",
    background: theme.palette.mode === "dark"
        ? `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${alpha(theme.palette.primary.dark, 0.7)} 100%)`
        : `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${alpha(theme.palette.primary.light, 0.3)} 100%)`,
    position: "relative",
    overflow: "hidden",
}));

const VideoSection = styled(Box)(({ theme }) => ({
    flex: 1,
    position: "relative",
    overflow: "hidden",
    background: 'transparent',
    paddingBottom: '80px',
}));

export const LiveStreamView = () => {
    const { channelName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { socket, isConnected: socketConnected, emitEvent } = useSocket();

    const { user } = useSelector((state) => state.user || {});
    const authToken = useSelector((state) => state.auth?.token || state.user?.token);

    const AGORA_APP_ID = '86989c3ed57c427dacdc73c8b6271cbf';

    const [spaceDetails, setSpaceDetails] = useState(null);
    const [speakers, setSpeakers] = useState([]);
    const [raisedHands, setRaisedHands] = useState([]);
    const [isOwner, setIsOwner] = useState(false);
    const [role, setRole] = useState('audience');
    const [isHandRaised, setIsHandRaised] = useState(false);

    const { localAudioTrack, isAudioMuted, toggleAudio, createTracks } = useAgoraTracks();
    const {
        localUid,
        isConnected,
        remoteUsers,
        error,
        isInitializing,
        connectionStatus,
        join,
        leave,
    } = useAgoraClient(AGORA_APP_ID, channelName, authToken, user);

    useEffect(() => {
        const initialize = async () => {
            const initialRole = location.state?.spaceDetails?.space?.ownerId === user?._id ? 'publisher' : 'audience';
            setRole(initialRole);
            await join(initialRole, location.state?.spaceDetails);
        };
        initialize();

        return () => {
            leave();
        };
    }, [join, leave, user?._id, location.state]);

    useEffect(() => {
        if (!socket) return;

        const handleRoomStateUpdate = (data) => {
            if (data.channelName === channelName) {
                setSpaceDetails(data);
                setSpeakers(data.speakers || []);
                setRaisedHands(data.raisedHands || []);
                setIsOwner(data.ownerId === user?._id);
                const meRaisedHand = data.raisedHands?.some(u => String(u.uid) === String(localUid));
                setIsHandRaised(!!meRaisedHand);
            }
        };

        const handleHandAccepted = async () => {
            await leave();
            const audioTrack = await createTracks();
            if (audioTrack) {
                await join('publisher', null, audioTrack);
            }
        };

        const handleYouWereRemoved = async () => {
            await leave();
            await join('audience');
        };

        const handleSpaceEnded = () => {
            alert("The space has ended.");
            leave();
            navigate('/live');
        };

        socket.on('roomStateUpdate', handleRoomStateUpdate);
        socket.on('handAccepted', handleHandAccepted);
        socket.on('youWereRemoved', handleYouWereRemoved);
        socket.on('spaceEnded', handleSpaceEnded);

        return () => {
            socket.off('roomStateUpdate', handleRoomStateUpdate);
            socket.off('handAccepted', handleHandAccepted);
            socket.off('youWereRemoved', handleYouWereRemoved);
            socket.off('spaceEnded', handleSpaceEnded);
        };
    }, [socket, channelName, user?._id, localUid, leave, join, createTracks, navigate]);

    const handleRaiseHandToggle = () => {
        if (role !== 'audience' || !localUid) return;
        const event = isHandRaised ? 'lowerHand' : 'raiseHand';
        emitEvent(event, { channelName, user: { uid: localUid, name: user?.name || "Anonymous" } });
    };

    const handleAcceptHandRaise = (userToAccept) => {
        emitEvent('acceptHand', { channelName, userToAccept });
    };

    const handleStopSpace = () => {
        if (!isOwner) return;
        emitEvent('stopSpace', { channelName });
    };

    if (isInitializing) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>{connectionStatus}</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <Typography color="error">{error}</Typography>
                <Button onClick={() => navigate('/live')}>Go Back</Button>
            </Box>
        );
    }

    const canSpeak = role === 'publisher';

    return (
        <LiveContainer>
            <VideoSection>
                <LiveHeader
                    title={spaceDetails?.title}
                    ownerName={spaceDetails?.ownerName}
                />

                {isOwner && (
                    <RaisedHandsList
                        raisedHands={raisedHands}
                        onAccept={handleAcceptHandRaise}
                    />
                )}

                <SpeakerGrid
                    speakers={speakers}
                    remoteUsers={remoteUsers}
                    localUid={localUid}
                    ownerUid={spaceDetails?.ownerAgoraUid}
                />

                <VideoControls
                    isMuted={isAudioMuted}
                    onToggleAudio={toggleAudio}
                    onLeave={() => { leave(); navigate('/live'); }}
                    isOwner={isOwner}
                    onStopSpace={handleStopSpace}
                    onRaiseHand={handleRaiseHandToggle}
                    isHandRaised={isHandRaised}
                    canSpeak={canSpeak}
                />
            </VideoSection>
        </LiveContainer>
    );
};