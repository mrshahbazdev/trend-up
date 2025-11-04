import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const BACKEND_URL = 'http://localhost:3001/api/v1/live';

export const useAgoraTracks = () => {
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [error, setError] = useState(null);

    const createTracks = useCallback(async () => {
        try {
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            setLocalAudioTrack(audioTrack);
            setIsAudioMuted(false);
            return audioTrack;
        } catch (err) {
            setError("Could not access microphone. Please check permissions.");
            return null;
        }
    }, []);

    const toggleAudio = useCallback(async () => {
        if (!localAudioTrack) return;
        const muted = !isAudioMuted;
        await localAudioTrack.setMuted(muted);
        setIsAudioMuted(muted);
    }, [localAudioTrack, isAudioMuted]);

    const closeTracks = useCallback(() => {
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
            setLocalAudioTrack(null);
        }
    }, [localAudioTrack]);

    useEffect(() => {
        return () => closeTracks();
    }, [closeTracks]);

    return { localAudioTrack, isAudioMuted, error, createTracks, toggleAudio, closeTracks };
};

export const useAgoraClient = (appId, channelName, authToken, user) => {
    const clientRef = useRef(null);
    const [localUid, setLocalUid] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [error, setError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState("Initializing...");

    useEffect(() => {
        if (!clientRef.current) {
            clientRef.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
        }
    }, []);

    const handleUserPublished = useCallback(async (user, mediaType) => {
        await clientRef.current.subscribe(user, mediaType);
        if (mediaType === "audio") {
            setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
            user.audioTrack.play();
        }
    }, []);

    const handleUserUnpublished = useCallback((user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    }, []);

    const join = useCallback(async (role, initialDetails = null, audioTrack = null) => {
        if (!clientRef.current) return;

        setIsInitializing(true);
        setError(null);
        setConnectionStatus("Preparing to join...");

        try {
            let agoraToken = initialDetails?.token;
            const uid = localUid || initialDetails?.uid || (user?._id ? Number(parseInt(user._id.slice(-6), 16)) : null) || Math.floor(Math.random() * 100000);
            setLocalUid(uid);
            
            if (!agoraToken) {
                setConnectionStatus("Getting access token...");
                const response = await fetch(`${BACKEND_URL}/token/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        channelName,
                        uid,
                        userName: user?.name || "Anonymous Listener",
                        role: 'audience'
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || `Failed to get token: ${response.status}`);
                }
                const data = await response.json();
                agoraToken = data.token;
                
                // --- DEBUG LOG 1 ---
                console.log("Backend se mila data:", data);
            }

            if (!agoraToken) throw new Error("Authentication token is missing.");

            // --- DEBUG LOG 2 ---
            console.log("Agora ko bhej rahe hain:", {
                appId: appId,
                channelName: channelName,
                token: agoraToken,
                uid: uid
            });

            clientRef.current.on("user-published", handleUserPublished);
            clientRef.current.on("user-unpublished", handleUserUnpublished);

            await clientRef.current.setClientRole(role);
            setConnectionStatus(`Joining as ${role}...`);

            await clientRef.current.join(appId, channelName, agoraToken, uid);

            if (role === 'publisher' && audioTrack) {
                await clientRef.current.publish([audioTrack]);
            }

            setIsConnected(true);
            setConnectionStatus("Connected!");

        } catch (err) {
            setError(`Failed to join channel: ${err.message}`);
            setIsConnected(false);
        } finally {
            setIsInitializing(false);
        }
    }, [appId, channelName, authToken, user, localUid, handleUserPublished, handleUserUnpublished]);

    const leave = useCallback(async () => {
        if (clientRef.current) {
            clientRef.current.off("user-published", handleUserPublished);
            clientRef.current.off("user-unpublished", handleUserUnpublished);
            await clientRef.current.leave();
        }
        setRemoteUsers([]);
        setIsConnected(false);
    }, [handleUserPublished, handleUserUnpublished]);

    return {
        client: clientRef.current,
        localUid,
        isConnected,
        remoteUsers,
        error,
        isInitializing,
        connectionStatus,
        join,
        leave,
    };
};