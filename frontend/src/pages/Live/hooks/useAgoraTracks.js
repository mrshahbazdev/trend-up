/**
 * src/pages/live/hooks/useAgoraTracks.js
 *
 * Custom hook to manage local audio tracks for Agora.
 * UPDATED: This now throws the original browser error for better debugging.
 */
import { useState, useCallback, useEffect } from 'react';
import { AgoraRTC } from './useScript'; // Import the AgoraRTC object

export const useAgoraTracks = () => {
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [error, setError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const createTracks = useCallback(async () => {
        if (!AgoraRTC) {
            setError("Agora SDK failed to load. Please refresh.");
            throw new Error("Agora SDK failed to load. Please refresh.");
        }
        setIsInitializing(true);
        setError(null);
        try {
            // Create microphone audio track
            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            setLocalAudioTrack(audioTrack);
            setIsAudioMuted(false);
            return audioTrack;
        } catch (err) {
            console.error("Agora Track Error:", err);
            
            // 🛑 FIX: Throw the original error
            // This will be caught by LiveStreamView's try/catch block
            // and display the *real* error message (e.g., NotFoundError, NotAllowedError)
            throw err; 
            
        } finally {
            setIsInitializing(false);
        }
    }, []);

    const toggleAudio = useCallback(async () => {
        if (!localAudioTrack) return;
        try {
            const muted = !isAudioMuted;
            await localAudioTrack.setMuted(muted);
            setIsAudioMuted(muted);
        } catch (err) {
            console.error("Failed to toggle audio:", err);
        }
    }, [localAudioTrack, isAudioMuted]);

    const closeTracks = useCallback(() => {
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
            setLocalAudioTrack(null);
        }
    }, [localAudioTrack]);

    // Cleanup tracks on unmount
    useEffect(() => {
        return () => {
            closeTracks();
        };
    }, [closeTracks]);

    return {
        localAudioTrack, isAudioMuted,
        error, isInitializing,
        createTracks, toggleAudio, closeTracks
    };
};
