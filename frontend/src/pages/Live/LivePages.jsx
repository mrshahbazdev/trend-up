/**
 * src/pages/live/LivePages.jsx
 *
 * This is the main wrapper for the Live application.
 * UPDATED: Now that Agora is bundled via npm, we no longer need
 * to check for script loading here.
 */
import React, { Fragment } from "react";
import { Routes, Route } from "react-router-dom";
// We no longer need the loading components (Box, CircularProgress, etc.)
// We also no longer need useScript or AGORA_SDK_URL here.
import { GoLiveView } from "./views/GoLiveView";
import { LiveStreamView } from "./views/LiveStreamView";
import { MicTestView } from "./views/MicTestView";
const LiveAppWrapper = () => {
    // The loading and error checks for Agora script are no longer needed.
    // The useScript hook will be called inside the views that need it.

    return (
        <Fragment>
            <Routes>
                <Route path="/" element={<GoLiveView />} />
                <Route path="/space/:channelName" element={<LiveStreamView />} />
                <Route path="/test" element={<MicTestView />} />
            </Routes>
        </Fragment>
    );
};

export default LiveAppWrapper;