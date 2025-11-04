import { useState, useEffect, useRef } from "react";

const useCamera = () => {
    const [cameraActive, setCameraActive] = useState(true);
    const [cameraError, setCameraError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const videoRef = useRef(null);

    // Initialize camera on component mount
    useEffect(() => {
        const initializeCamera = async () => {
            try {
                setIsInitializing(true);
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setCameraError("Camera access not supported in this browser");
                    setCameraActive(false);
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user", // Use front camera
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: true,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setCameraActive(true);
                    setCameraError(null);
                }
            } catch (error) {
                console.error("Error accessing camera:", error);
                setCameraError("Unable to access camera. Please check permissions.");
                setCameraActive(false);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeCamera();

        // Cleanup function to stop camera when component unmounts
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach((track) => track.stop());
            }
        };
    }, []);

    // Handle video element updates when camera state changes
    useEffect(() => {
        if (cameraActive && videoRef.current && videoRef.current.srcObject) {
            videoRef.current.play().catch((err) => console.warn("Video play failed:", err));
        }
    }, [cameraActive]);

    const toggleCamera = async () => {
        try {
            if (cameraActive) {
                // Stop all tracks & reset ref
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject;
                    stream.getTracks().forEach((track) => track.stop());
                    videoRef.current.srcObject = null;
                }
                setCameraActive(false);
                setCameraError(null);
            } else {
                // Set initializing state while requesting new stream
                setIsInitializing(true);
                
                // Request new stream
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: true,
                });

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Small delay to ensure video element is ready
                    await new Promise(resolve => setTimeout(resolve, 100));
                    // Required for autoplay in some browsers
                    await videoRef.current.play().catch((err) => console.warn("Autoplay prevented:", err));
                }

                setCameraActive(true);
                setCameraError(null);
                setIsInitializing(false);
            }
        } catch (error) {
            console.error("Error toggling camera:", error);
            setCameraError("Failed to access camera");
            setCameraActive(false);
            setIsInitializing(false);
        }
    };

    return {
        cameraActive,
        cameraError,
        isInitializing,
        videoRef,
        toggleCamera,
    };
};

export default useCamera;
