import React, { useState, useEffect, useRef, useCallback, Fragment } from "react";
import {
    Box, Button, Typography, styled, useTheme, Fade, IconButton, alpha, Chip, Stack, CircularProgress, Alert
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from 'react-redux';
import { People as PeopleIcon } from "@mui/icons-material";
import { io } from "socket.io-client"; 

import { BACKEND_URL, AGORA_APP_ID, SOCKET_URL } from "../constants"; 

import { useScript, AgoraRTC } from "../hooks/useScript";
import { useAgoraTracks } from "../hooks/useAgoraTracks";

import { VideoGridComponent } from "../components/VideoGridComponent";
import { VideoControls } from "../components/VideoControls";
import { LiveChat } from "../components/LiveChat";
import { NotificationAnimation } from "../components/NotificationAnimation";
import { UserListPanel } from "../components/UserListPanel";

import {
    LiveContainer,
    VideoSection,
    ChatSection,
    ChatToggleButton,
    UserListToggleButton
} from "../styled/StreamViewStyles";


export const LiveStreamView = () => {
    const { channelName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const socketRef = useRef(null); 
    const [socketConnected, setSocketConnected] = useState(false);

    useScript();

    const { user } = useSelector((state) => state.user || {});
    const authToken = useSelector((state) =>
        state.auth?.token ||
        state.user?.token ||
        state.user?.accessToken ||
        state.auth?.accessToken
    );

    const agoraClientRef = useRef(null);
    const isJoiningRef = useRef(false);
    const { localAudioTrack, isAudioMuted, error: trackError, isInitializing: trackInitializingHook, createTracks, toggleAudio, closeTracks } = useAgoraTracks();

    const [spaceDetails, setSpaceDetails] = useState(location.state?.spaceDetails?.space || null);
    const [agoraToken, setAgoraToken] = useState(location.state?.spaceDetails?.token || null);
    
    const [agoraUid, setAgoraUid] = useState(null);

    const [isOwner, setIsOwner] = useState(() => {
        const initialState = location.state?.spaceDetails;
        if (user?._id && initialState?.space?.ownerUid) {
            return String(user._id) === String(initialState.space.ownerUid);
        }
        if (initialState?.ownerAgoraUid && initialState?.uid) {
             return String(initialState.ownerAgoraUid) === String(initialState.uid);
        }
        return false;
    });

    const [role, setRole] = useState(isOwner ? 'host' : 'audience');
    
    const [isConnected, setIsConnected] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [speakers, setSpeakers] = useState(location.state?.spaceDetails?.space?.speakers || []);
    const [raisedHands, setRaisedHands] = useState(location.state?.spaceDetails?.space?.raisedHands || []);
    const [isHandRaisedState, setIsHandRaisedState] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState(null); 
    
    const [alert, setAlert] = useState(null); 

    const [chatOpen, setChatOpen] = useState(false);
    const [isUserListOpen, setIsUserListOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState("Initializing...");
    const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => {
                setAlert(null);
            }, 5000); 
            return () => clearTimeout(timer);
        }
    }, [alert]);

    useEffect(() => {
        if (!AGORA_APP_ID || AGORA_APP_ID === 'YOUR_ACTUAL_AGORA_APP_ID' || AGORA_APP_ID.length < 32) {
            setError("Invalid Agora App ID. Please configure a valid App ID in src/pages/live/constants.js");
            setIsInitializing(false);
        }
    }, []);

    const notifyBackend = async (endpoint, data = {}) => {
        // 🛑 FIX: sendBeacon se remove kiya, kyuki woh sirf onUnload mein theek se kaam karta hai.
        try {
            await fetch(`${BACKEND_URL}/space/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ 
                    channelName, 
                    ...data 
                })
            });
        } catch (err) {
            console.warn(`Failed to notify backend: ${endpoint}`, err);
        }
    };

    const handleLeave = useCallback(async (spaceHasEnded = false) => {
        setConnectionStatus("Leaving...");
        
        if (!spaceHasEnded && role === 'audience' && agoraUid) { 
            // 🛑 FIX: user-left ko uid chahiye
            await notifyBackend('user-left', { uid: agoraUid });
        }

        try {
            await agoraClientRef.current?.leave();
        } catch (e) {
            console.error("Error on Agora leave:", e);
        }
        closeTracks();
        setIsConnected(false);
        if (socketConnected && !spaceHasEnded && agoraUid) {
            socketRef.current?.emit('leaveRoom', { uid: agoraUid, channelName });
        }
        navigate('/live');
    }, [agoraUid, channelName, closeTracks, navigate, socketConnected, authToken, role]); 

    const handleUserPublished = useCallback(async (user, mediaType) => {
        if (!agoraClientRef.current) return;
        try {
            await agoraClientRef.current.subscribe(user, mediaType);
            if (mediaType === "audio") {
                setRemoteUsers(prev => {
                    const exists = prev.some(u => u.uid === user.uid);
                    if (exists) {
                        return prev.map(u => u.uid === user.uid ? { ...u, audioTrack: user.audioTrack } : u);
                    }
                    return [...prev, { uid: user.uid, audioTrack: user.audioTrack, videoTrack: null }];
                });
                
                if (!needsUserInteraction) {
                    user.audioTrack?.play();
                }
            }
        } catch (err) {
            console.error("Failed to subscribe to user:", err);
        }
    }, [needsUserInteraction]);

    const handleUserUnpublished = useCallback((user, mediaType) => {
        if (mediaType === "audio") {
            setRemoteUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, audioTrack: null } : u));
        }
    }, []);

    const handleUserJoined = useCallback((user) => {
        setRemoteUsers(prev => {
            if (prev.some(u => u.uid === user.uid)) return prev;
            return [...prev, { uid: user.uid, audioTrack: null, videoTrack: null }];
        });
    }, []);

    const handleUserLeft = useCallback((user, reason) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    }, []);

    const handleRoomStateUpdate = useCallback((updatedSpaceData) => {
        if (updatedSpaceData?.channelName === channelName) {
            setSpaceDetails(updatedSpaceData);
            setSpeakers(updatedSpaceData.speakers || []);
            setRaisedHands(updatedSpaceData.raisedHands || []);
            const meRaisedHand = updatedSpaceData.raisedHands?.some(u => String(u.uid) === String(agoraUid));
            setIsHandRaisedState(!!meRaisedHand);
            if (user?._id && updatedSpaceData.ownerUid) {
                setIsOwner(String(user._id) === String(updatedSpaceData.ownerUid));
            }
        }
    }, [agoraUid, channelName, user?._id]);

    const handleHandAccepted = useCallback(async ({ channelName: acceptedChannel }) => {
        if (acceptedChannel === channelName && role === 'audience' && agoraUid) {
            setConnectionStatus("Promoting to speaker...");
            try {
                await notifyBackend('user-left', { uid: agoraUid });

                const response = await fetch(`${BACKEND_URL}/token/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify({ channelName, uid: agoraUid, role: 'publisher' })
                });
                if (!response.ok) throw new Error('Failed to get host token');
                const data = await response.json();

                setIsInitializing(true);
                await agoraClientRef.current.leave();
                const newAudioTrack = await createTracks();

                if (newAudioTrack) {
                    setAgoraToken(data.token);
                    setRole('host'); 
                    await agoraClientRef.current.join(AGORA_APP_ID, channelName, data.token, agoraUid);
                    await agoraClientRef.current.publish([newAudioTrack]);
                    setIsConnected(true);
                    setIsHandRaisedState(false);
                    setConnectionStatus("You are now a speaker!");
                    setAlert({ severity: 'success', message: 'You are now a speaker!' }); 
                    setNeedsUserInteraction(false); 
                } else {
                    setRole('audience');
                    throw new Error("Could not create audio track. Check mic permissions.");
                }
            } catch (err) {
                console.error("Failed to become speaker:", err);
                setAlert({ severity: 'warning', message: `Failed to become speaker: ${err.name} - ${err.message}. Joined as audience.` });
                await notifyBackend('user-joined', { uid: agoraUid, name: user.name || "Anonymous" }); 
                handleLeave(); 
            } finally {
                setIsInitializing(false);
            }
        }
    }, [channelName, role, agoraUid, createTracks, authToken, handleLeave, user]);

    const handleYouWereRemoved = useCallback(async ({ channelName: removedChannel }) => {
        if (removedChannel === channelName && role === 'host' && String(agoraUid) !== String(spaceDetails?.ownerAgoraUid)) {
            setConnectionStatus("Returning to audience...");
            try {
                setIsInitializing(true);
                if (localAudioTrack) {
                    await agoraClientRef.current.unpublish([localAudioTrack]);
                }
                closeTracks();

                const response = await fetch(`${BACKEND_URL}/token/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify({ channelName, uid: agoraUid, role: 'audience' })
                });
                if (!response.ok) throw new Error('Failed to get audience token');
                const data = await response.json();

                await agoraClientRef.current.leave();
                setAgoraToken(data.token);
                setRole('audience');
                await agoraClientRef.current.join(AGORA_APP_ID, channelName, data.token, agoraUid);
                setIsConnected(true);
                setConnectionStatus("You are now in the audience.");
                setNeedsUserInteraction(true); 

                await notifyBackend('user-joined', { uid: agoraUid, name: user.name || "Anonymous" });

            } catch (err) {
                console.error("Error returning to audience:", err);
                setError(`Error returning to audience: ${err.message}`);
                handleLeave();
            } finally {
                setIsInitializing(false);
            }
        }
    }, [channelName, role, agoraUid, spaceDetails, localAudioTrack, closeTracks, authToken, handleLeave, user]);

    const handleSpaceEnded = useCallback(({ channelName: endedChannel }) => {
        if (endedChannel === channelName) {
            alert("The space has ended.");
            handleLeave(true);
        }
    }, [channelName, handleLeave]);


    useEffect(() => {
        // 🛑 FIX: This function runs on component unmount (browser close/refresh)
        const cleanupListener = (e) => {
            // Check if AgoraUID is valid and user is an audience member
            if (agoraUid && role === 'audience' && authToken) {
                // Prepare data payload for sendBeacon (must be a FormData or Blob/string)
                const payload = JSON.stringify({ channelName, uid: agoraUid });
                const blob = new Blob([payload], { type: 'application/json' });

                // Use sendBeacon for guaranteed, non-blocking cleanup on browser close/refresh
                navigator.sendBeacon(`${BACKEND_URL}/space/user-left`, blob);
            }
        };

        window.addEventListener('beforeunload', cleanupListener);
        
        if (!authToken) {
            console.log("[LiveStreamView] No auth token yet, waiting...");
            return () => {
                window.removeEventListener('beforeunload', cleanupListener);
            };
        }

        if (error) return () => {
            window.removeEventListener('beforeunload', cleanupListener);
        };
        
        if (!AgoraRTC) {
            setError("Agora SDK not available.");
            setIsInitializing(false);
            return () => {
                window.removeEventListener('beforeunload', cleanupListener);
            };
        }

        if (isJoiningRef.current) return () => {
            window.removeEventListener('beforeunload', cleanupListener);
        };

        if (!agoraClientRef.current) {
            agoraClientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        }
        const client = agoraClientRef.current;

        socketRef.current = io(SOCKET_URL, { 
            auth: {
                token: authToken 
            },
            transports: ['websocket', 'polling']
        });
        const socket = socketRef.current;


        const onSocketConnect = () => {
            setConnectionStatus("Socket connected");
            setSocketConnected(true);
        }
        const onSocketDisconnect = () => {
            setConnectionStatus("Socket disconnected");
            setSocketConnected(false);
        }
        const onRoomStateUpdate = (data) => handleRoomStateUpdate(data);
        const onHandAccepted = (data) => handleHandAccepted(data);
        const onYouWereRemoved = (data) => handleYouWereRemoved(data);
        const onSpaceEnded = (data) => handleSpaceEnded(data);
        const onNewChatMessage = (message) => { 
            setMessages(prev => [...prev.slice(-100), message]);
        };
        const onNewHandRaise = ({ userName }) => {
            setIsOwner(prevIsOwner => {
                if (prevIsOwner) {
                    setAlert({ severity: 'info', message: `${userName} is requesting to speak` });
                }
                return prevIsOwner;
            });
        };

        if (socket && typeof socket.on === 'function') {
            socket.on('connect', onSocketConnect);
            socket.on('disconnect', onSocketDisconnect);
            socket.on('roomStateUpdate', onRoomStateUpdate);
            socket.on('handAccepted', onHandAccepted);
            socket.on('youWereRemoved', onYouWereRemoved);
            socket.on('spaceEnded', onSpaceEnded);
            socket.on('newChatMessage', onNewChatMessage); 
            socket.on('newHandRaise', onNewHandRaise); 
        }

        const onUserPublished = (user, mediaType) => handleUserPublished(user, mediaType);
        const onUserUnpublished = (user, mediaType) => handleUserUnpublished(user, mediaType);
        const onUserJoined = (user) => handleUserJoined(user);
        const onUserLeft = (user, reason) => handleUserLeft(user, reason);

        client.on("user-published", onUserPublished);
        client.on("user-unpublished", onUserUnpublished);
        client.on("user-joined", onUserJoined);
        client.on("user-left", onUserLeft);

        const fetchSpaceDetails = async () => {
            if (!spaceDetails && channelName) {
                setConnectionStatus("Fetching space information...");
                try {
                    const response = await fetch(`${BACKEND_URL}/space/details/${channelName}`, {
                        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
                    });
                    if (response.status === 404) {
                        setError("Space not found or has ended.");
                        setIsInitializing(false);
                        return null;
                    }
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    const data = await response.json();
                    setSpaceDetails(data.space);
                    setSpeakers(data.space?.speakers || []);
                    setRaisedHands(data.space?.raisedHands || []);
                    
                    let isNowOwner = false;
                    if (user?._id && data.space?.ownerUid) {
                        isNowOwner = String(user._id) === String(data.space.ownerUid);
                        setIsOwner(isNowOwner);
                    }
                    return isNowOwner;
                } catch (e) {
                    setError(`Could not load space details: ${e.message}`);
                    setIsInitializing(false);
                    return null;
                }
            }
            return isOwner;
        };
        
        const joinChannel = async (ownerStatus) => {
            if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
                console.warn("Join call skipped: Client is already connected or connecting.");
                return;
            }

            isJoiningRef.current = true;
            
            let currentToken = agoraToken;
            let currentUid = location.state?.spaceDetails?.ownerUid 
                ? Number(location.state.spaceDetails.ownerUid) 
                : Math.floor(Math.random() * 1000000) + 1;
                
            let currentUserName = user?.name || "Anonymous";

            let isHost = ownerStatus;
            let audioTrackToPublish = null;
            
            if (isHost) {
                setConnectionStatus("Requesting microphone access...");
                try {
                    audioTrackToPublish = await createTracks();
                    if (!audioTrackToPublish) {
                        throw new Error("createTracks returned null.");
                    }
                } catch (micError) {
                    console.warn("Mic check failed, downgrading to audience:", micError);
                    setAlert({ severity: 'warning', message: `Mic Error: ${micError.name} - ${micError.message}. Joined as audience.` });
                    isHost = false; 
                }
            }
            
            const requiredRole = isHost ? 'host' : 'audience';
            const backendRole = isHost ? 'publisher' : 'audience';

            setRole(requiredRole); 
            
            setConnectionStatus(`Getting ${backendRole} token...`);
            
            try {
                const response = await fetch(`${BACKEND_URL}/token/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify({
                        channelName,
                        userName: currentUserName,
                        role: backendRole,
                        uid: currentUid 
                    })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || `Failed to get token: ${response.status}`);
                }
                const data = await response.json();
                currentToken = data.token;
                
                currentUid = Number(data.uid); 
                setAgoraToken(currentToken);
                setAgoraUid(currentUid); 

            } catch (err) {
                setError(`Could not get access token: ${err.message}`);
                setIsInitializing(false);
                isJoiningRef.current = false; 
                return;
            }

            if (channelName && currentToken && currentUid) {
                setConnectionStatus("Connecting to audio channel...");
                setIsInitializing(true);
                setError(null); 

                try {
                    await client.setClientRole(requiredRole);
                    
                    setConnectionStatus("Joining space...");
                    await client.join(AGORA_APP_ID, channelName, currentToken, currentUid);
                    
                    if (requiredRole === 'host' && audioTrackToPublish) {
                        setConnectionStatus("Publishing audio...");
                        await client.publish([audioTrackToPublish]);
                    }
                    
                    setIsConnected(true);
                    setConnectionStatus("Connected successfully!");

                    if (requiredRole === 'audience') {
                        setNeedsUserInteraction(true);
                        await notifyBackend('user-joined', { uid: currentUid, name: currentUserName }); 
                    }
                    
                } catch (err) {
                    console.error("Agora Join Error:", err);
                    setError(`Connection failed: ${err.message}`);
                    setIsConnected(false);
                    closeTracks();
                } finally {
                    setIsInitializing(false);
                    isJoiningRef.current = false; 
                }
            } else {
                setError("Missing required connection parameters");
                setIsInitializing(false);
                isJoiningRef.current = false; 
            }
        };

        const initializeConnection = async () => {
            const ownerStatus = await fetchSpaceDetails();
            if (ownerStatus !== null) { 
                await joinChannel(ownerStatus);
            }
        };

        initializeConnection();

        return () => {
            window.removeEventListener('beforeunload', cleanupListener);
            
            const uidToLeave = agoraUid;
            const channelToLeave = channelName;

            // 🛑 FIX: Send final beacon on cleanup if component unmounts normally
            if (uidToLeave && role === 'audience' && authToken) {
                 const payload = JSON.stringify({ channelName, uid: uidToLeave });
                 const blob = new Blob([payload], { type: 'application/json' });

                 // Use sendBeacon for guaranteed, non-blocking cleanup
                 navigator.sendBeacon(`${BACKEND_URL}/space/user-left`, blob);
            }

            if (agoraClientRef.current) {
                agoraClientRef.current.off("user-published", onUserPublished);
                agoraClientRef.current.off("user-unpublished", onUserUnpublished);
                agoraClientRef.current.off("user-joined", onUserJoined);
                agoraClientRef.current.off("user-left", onUserLeft);

                agoraClientRef.current.leave().catch(e => console.error("Error on cleanup leave:", e));
                
                agoraClientRef.current = null;
            }

            closeTracks();
            setIsConnected(false);
            isJoiningRef.current = false; 

            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off('connect', onSocketConnect);
                socketRef.current.off('disconnect', onSocketDisconnect);
                socketRef.current.off('roomStateUpdate', onRoomStateUpdate);
                socketRef.current.off('handAccepted', onHandAccepted);
                socketRef.current.off('youWereRemoved', onYouWereRemoved);
                socketRef.current.off('spaceEnded', onSpaceEnded);
                socketRef.current.off('newChatMessage', onNewChatMessage); 
                socketRef.current.off('newHandRaise', onNewHandRaise); 
                socketRef.current = null;
            }
            
            if (socketConnected && uidToLeave && channelToLeave && socketRef.current) {
                socketRef.current.emit('leaveRoom', { uid: uidToLeave, channelName: channelToLeave });
            }
        };
    }, [channelName, authToken, user?._id]); 

    useEffect(() => {
        if (isConnected && socketConnected && socketRef.current && agoraUid && channelName) {
            console.log(`Registering user with socket: ${agoraUid}`);
            socketRef.current.emit('registerUser', { uid: agoraUid, channelName });
        }
    }, [isConnected, socketConnected, agoraUid, channelName]);


    const handleStopSpace = useCallback(async () => {
        if (!isOwner) return;
        if (!window.confirm("Are you sure you want to end this space for everyone?")) return;
        try {
            const response = await fetch(`${BACKEND_URL}/space/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ channelName })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to stop space');
            }
        } catch (err) {
            console.error("Error stopping space:", err);
            alert(`Error stopping space: ${err.message}`);
        }
    }, [isOwner, channelName, authToken]);

    const handleRaiseHandToggle = useCallback(async () => {
        if (role !== 'audience' || !agoraUid || !user) return;
        
        const endpoint = isHandRaisedState ? '/space/lower-hand' : '/space/raise-hand';
        const body = {
            channelName,
            userUid: agoraUid,
            userName: user.name || "Anonymous"
        };

        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${isHandRaisedState ? 'lower' : 'raise'} hand`);
            }

            if (!isHandRaisedState) {
                setAlert({ severity: 'success', message: 'Your request to speak has been sent!' });
            } else {
                setAlert({ severity: 'info', message: 'Your request to speak has been withdrawn.' });
            }

        } catch (err) {
            console.error("Hand raise error:", err);
            setAlert({ severity: 'error', message: `Error: ${err.message}` });
        }
    }, [role, agoraUid, isHandRaisedState, channelName, user, authToken]);

    const handleAcceptHandRequest = useCallback(async (userUid) => {
        if (!isOwner) return;
        console.log(`Accepting hand for user: ${userUid}`);
        try {
            const response = await fetch(`${BACKEND_URL}/space/accept-hand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ channelName, userUid })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to accept hand');
            }
        } catch (err) {
            console.error("Failed to accept hand:", err);
            setAlert({ severity: 'warning', message: `Error accepting hand: ${err.message}` });
        }
    }, [isOwner, channelName, authToken]);

    const handleRemoveSpeakerRequest = useCallback(async (speakerUid) => {
        if (!isOwner) return;
        console.log(`Removing speaker: ${speakerUid}`);
        if (String(speakerUid) === String(spaceDetails?.ownerAgoraUid)) {
            setAlert({ severity: 'warning', message: "Owner cannot be removed." });
            return;
        }
        try {
            const response = await fetch(`${BACKEND_URL}/space/remove-speaker`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ channelName, speakerUid })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to remove speaker');
            }
        } catch (err) {
            console.error("Failed to remove speaker:", err);
            setAlert({ severity: 'warning', message: `Error removing speaker: ${err.message}` });
        }
    }, [isOwner, channelName, authToken, spaceDetails?.ownerAgoraUid]);


    const handleAudienceClick = () => {
        if (!agoraClientRef.current) return;
        
        console.log("User interacted, playing remote tracks.");
        setNeedsUserInteraction(false);
        
        const remoteTracks = remoteUsers.map(user => user.audioTrack).filter(Boolean);
        for (const track of remoteTracks) {
            try {
                if (track.isPlaying === false) { 
                    track.play();
                }
            } catch (e) {
                console.error("Error playing remote track on click:", e);
                setAlert({ severity: 'warning', message: "Could not play audio. Please check browser permissions." });
            }
        }
    };

    const handleSendMessage = (msg) => {
        if (socketConnected && socketRef.current) {
            socketRef.current.emit('chatMessage', { channelName, message: msg, userName: user?.name || "Anonymous" });
        } else {
            setMessages(prev => [...prev, { id: Date.now(), user: "You", text: msg, type: "message" }]);
        }
    };

    const handleDonate = () => addNotification({ type: "donation", data: { amount: 5, fromUser: "TestUser", message: "Great stream!" } });
    const handleLike = () => addNotification({ type: "like", data: {} });
    const handleSubscribe = () => {};
    const handleFollow = () => addNotification({ type: "follow", data: {} });
    const handleGift = () => addNotification({ type: "gift", data: {} });
    const handleShare = () => {};
    
    const toggleChat = () => {
        setChatOpen(prev => !prev);
        if (isUserListOpen) setIsUserListOpen(false); 
    };

    const toggleUserList = () => {
        console.log("Toggling user list");
        setIsUserListOpen(prev => {
            console.log("Setting isUserListOpen to:", !prev);
            return !prev;
        });
        if (chatOpen) setChatOpen(false); 
    };
    
    const addNotification = (n) => {
        const id = Date.now();
        setNotifications((p) => [...p.slice(-5), { ...n, id }]);
        setTimeout(() => {
            setNotifications((p) => p.filter(item => item.id !== id));
        }, 4000);
    };

    const canSpeak = role === 'host';

    if (isInitializing) {
        return (
            <LiveContainer sx={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', p: 3 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    Connecting to {spaceDetails?.title || 'space'}...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {connectionStatus}
                </Typography>
                <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
                    <Typography variant="caption" color="text.secondary">
                        • Agora SDK: {AgoraRTC ? "✅ Loaded" : "⏳ Loading"}
                    </Typography><br />
                    <Typography variant="caption" color="text.secondary">
                        • Socket: {socketConnected ? "✅ Connected" : "❌ Disconnected"}
                    </Typography><br />
                    <Typography variant="caption" color="text.secondary">
                        • Space Details: {spaceDetails ? "✅ Loaded" : "⏳ Fetching"}
                    </Typography>
                </Box>
            </LiveContainer>
        );
    }

    if (error) {
        return (
            <LiveContainer sx={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', p: 3 }}>
                <Typography variant="h5" color="error" gutterBottom>Connection Error</Typography>
                <Alert severity="error" sx={{ mt: 1, mb: 3, maxWidth: 400, mx: 'auto', textAlign: 'left' }}>
                    {error}
                </Alert>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={() => navigate('/live')}>
                        Back to Dashboard
                    </Button>
                    <Button variant="outlined" onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </Stack>
            </LiveContainer>
        );
    }

    return (
        <LiveContainer>
            {needsUserInteraction && (
                <Fade in={true}>
                    <Box
                        onClick={handleAudienceClick}
                        sx={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 9998,
                            cursor: 'pointer'
                        }}
                    >
                        <Typography variant="h4" color="white" gutterBottom>
                            Welcome to {spaceDetails?.title || 'the space'}
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            sx={{
                                fontSize: '1.2rem',
                                padding: '12px 24px',
                                backgroundColor: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: theme.palette.primary.dark,
                                }
                            }}
                        >
                            Click to Listen
                        </Button>
                    </Box>
                </Fade>
            )}

            <VideoSection>
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 'calc(100% - 32px)' }}>
                    <Chip
                        label={isConnected ? "Connected" : (connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected')}
                        color={isConnected ? "success" : (connectionStatus === 'connecting' ? 'warning' : 'error')}
                        size="small"
                        sx={{ backdropFilter: 'blur(4px)', bgcolor: alpha(theme.palette.background.paper, 0.7) }}
                    />
                    {alert && (
                        <Alert severity={alert.severity} onClose={() => setAlert(null)} sx={{ backdropFilter: 'blur(4px)', bgcolor: alpha(theme.palette.warning.light, 0.7) }}>
                            {alert.message}
                        </Alert>
                    )}
                </Box>
                
                <VideoGridComponent
                    speakers={speakers}
                    localUid={agoraUid}
                    localAudioTrack={localAudioTrack}
                    localIsMuted={isAudioMuted}
                    remoteUsers={remoteUsers}
                    onUserClick={() => {}}
                />

                <VideoControls
                    isMuted={isAudioMuted}
                    onToggleAudio={toggleAudio}
                    onLeave={handleLeave}
                    isOwner={isOwner}
                    onStopSpace={handleStopSpace}
                    onRaiseHand={handleRaiseHandToggle}
                    isHandRaised={isHandRaisedState}
                    canSpeak={canSpeak}
                />

                <Stack direction="row" spacing={1} sx={{ position: 'absolute', bottom: 16 + 80, right: 16, zIndex: 101 }}>
                    <UserListToggleButton onClick={toggleUserList}>
                        <PeopleIcon sx={{ fontSize: '1.1rem' }} />
                        {isUserListOpen ? "Hide List" : "Show List"}
                    </UserListToggleButton>
                    
                    <ChatToggleButton onClick={toggleChat}>
                        💬 {chatOpen ? "Hide Chat" : "Show Chat"}
                    </ChatToggleButton>
                </Stack>

                <AnimatePresence>
                    {chatOpen && (
                        <ChatSection initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
                            <LiveChat
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                onDonate={handleDonate} 
                                onLike={handleLike} 
                                onSubscribe={handleSubscribe} 
                                onFollow={handleFollow} 
                                onGift={handleGift} 
                                onShare={handleShare}
                                chatOpen={chatOpen}
                                onToggleChat={toggleChat}
                                isCompact={true}
                                socketRef={socketRef}
                                socketConnected={socketConnected}
                            />
                        </ChatSection>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isUserListOpen && (
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 102 }}
                        >
                            <UserListPanel
                                isOpen={isUserListOpen}
                                onClose={toggleUserList}
                                spaceDetails={spaceDetails}
                                isOwner={isOwner}
                                localUid={agoraUid}
                                onAcceptRequest={handleAcceptHandRequest}
                                onRemoveSpeaker={handleRemoveSpeakerRequest}
                                remoteUsers={remoteUsers}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

            </VideoSection>
            
            <Box sx={{ position: 'absolute', top: 80, left: 0, right: 0, zIndex: 1000, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <AnimatePresence>
                    {notifications.map((n) => <NotificationAnimation key={n.id} notification={n} />)}
                </AnimatePresence>
            </Box>
        </LiveContainer>
    );
};
