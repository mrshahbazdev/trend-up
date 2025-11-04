/**
 * src/pages/live/views/MicTestView.jsx
 *
 * A simple page to test microphone access with Agora SDK
 * independently of the main application logic.
 */
import React, { useState, useCallback } from "react";
import { Box, Button, Typography, Alert, CircularProgress } from "@mui/material";
import { Mic, MicOff } from "@mui/icons-material";
import { AgoraRTC } from "../hooks/useScript"; // Import AgoraRTC
import { FullScreenContainer } from "../styled/GoLiveStyles"; // Reuse style

export const MicTestView = () => {
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleTestMic = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setLocalAudioTrack(null);
        setIsPlaying(false);

        if (!AgoraRTC) {
            setError("Agora SDK failed to load. Please refresh.");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Try to create the track
            const track = await AgoraRTC.createMicrophoneAudioTrack();
            setLocalAudioTrack(track);

            // 2. Play the track (you should hear your own echo)
            track.play();
            setIsPlaying(true);
            setError(null); // Clear previous errors

        } catch (err) {
            console.error("MIC TEST FAILED:", err);
            // Show the *real* browser error
            setError(`Error: ${err.name} - ${err.message}`);
            if (localAudioTrack) {
                localAudioTrack.stop();
                localAudioTrack.close();
            }
            setLocalAudioTrack(null);
        } finally {
            setIsLoading(false);
        }
    }, [localAudioTrack]); // Add dependency

    const handleStopTest = useCallback(() => {
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
        }
        setLocalAudioTrack(null);
        setIsPlaying(false);
        setError(null);
    }, [localAudioTrack]);

    return (
        <FullScreenContainer>
            <Typography variant="h3" gutterBottom>
                Microphone Test Page
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 600, textAlign: 'center' }}>
                Click the button below to test your microphone. If successful, you should
                hear your own voice (an echo). This uses the exact same code
                as the live stream.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Mic />}
                    onClick={handleTestMic}
                    disabled={isLoading || isPlaying}
                >
                    {isLoading ? "Testing..." : "Start Mic Test"}
                </Button>
                <Button
                    variant="outlined"
                    size="large"
                    color="error"
                    startIcon={<MicOff />}
                    onClick={handleStopTest}
                    disabled={!isPlaying}
                >
                    Stop Test
                </Button>
            </Box>

            {isPlaying && (
                <Alert severity="success" sx={{ minWidth: 300, justifyContent: 'center' }}>
                    Mic is LIVE! You should hear yourself.
                </Alert>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2, maxWidth: 600, whiteSpace: 'pre-wrap' }}>
                    **Test Failed:**
                    <br />
                    {error}
                    <br /><br />
                    Please check your OS system settings (Privacy & Security  Microphone)
                    and browser address bar permissions.
                </Alert>
            )}
        </FullScreenContainer>
    );
};
