/**
 * src/pages/live/hooks/useScript.js
 *
 * Custom hook to load an external script (like Agora SDK).
 * ---
 * UPDATED: We now import Agora via NPM, so this hook is simplified
 * to just confirm it's loaded and provide a compatible interface.
 */
import { useState, useEffect } from 'react';
// import { AGORA_SDK_URL } from '../constants'; // No longer needed

// Import Agora directly from the npm package
import AgoraSDK from 'agora-rtc-sdk-ng';

// This module-level variable will hold the loaded AgoraRTC object
export let AgoraRTC = AgoraSDK;

// The 'url' parameter is no longer needed
export const useScript = () => { 
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Since we import it directly, it's always "loaded"
        if (AgoraRTC) {
            setLoaded(true);
        } else {
            // This should realistically never happen with an npm import
            setError(true);
        }
    }, []); 

    return [loaded, error];
};