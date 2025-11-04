const mongoose = require('mongoose');
const { RtcTokenBuilder, RtcRole } = require('agora-token');
const Space = require('../models/stream.model'); 

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const TOKEN_EXPIRATION_TIME_IN_SECONDS = 3600; 

// ✅ Socket connection tracking
const connectedUsers = new Map(); // socketId -> {userId, channelName, uid, name}
const userHeartbeats = new Map(); // socketId -> lastHeartbeat

if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    console.error("FATAL ERROR: Agora App ID or Certificate is missing in environment variables.");
}

const generateAgoraToken = (channelName, uid, roleType) => {
    console.log(`🔄 [generateAgoraToken] Starting - Channel: ${channelName}, UID: ${uid}, Role: ${roleType}`);
    
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
        console.error("❌ [generateAgoraToken] Cannot generate token: Agora App ID or Certificate is missing.");
        return null;
    }

    const role = roleType === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRATION_TIME_IN_SECONDS;

    const uidForToken = Number(uid);
    if (isNaN(uidForToken)) {
        console.error(`❌ [generateAgoraToken] Invalid UID provided for token generation: ${uid}`);
        return null;
    }

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            uidForToken, 
            role,
            privilegeExpiredTs 
        );
        console.log(`✅ [generateAgoraToken] Token generated successfully for UID: ${uidForToken}`);
        return token;
    } catch (error) {
        console.error("❌ [generateAgoraToken] Error generating Agora token:", error);
        return null; 
    }
};

const createSpace = async (spaceData) => {
    console.log(`🔄 [createSpace] Starting - Data:`, spaceData);
    const { title, ownerName, ownerUid, ownerAgoraUid, channelName } = spaceData;
    
    const newSpace = new Space({
        title,
        ownerUid,
        ownerAgoraUid,
        ownerName,
        channelName,
        isLive: true,
        speakers: [{ uid: ownerAgoraUid, name: ownerName, isMuted: false }],
        raisedHands: [],
        listeners: [], 
    });
    
    await newSpace.save();
    console.log(`✅ [createSpace] Space created successfully - Channel: ${channelName}, Owner: ${ownerName}`);
    return newSpace;
};

const getLiveSpaces = async () => {
    console.log(`🔄 [getLiveSpaces] Fetching live spaces`);
    const spaces = await Space.find({ isLive: true }).sort({ createdAt: -1 });
    console.log(`✅ [getLiveSpaces] Found ${spaces.length} live spaces`);
    return spaces;
};

const getSpaceDetails = async (channelName) => {
    console.log(`🔄 [getSpaceDetails] Fetching space details - Channel: ${channelName}`);
    const space = await Space.findOne({ channelName: channelName, isLive: true });
    
    if (space) {
        console.log(`✅ [getSpaceDetails] Space found - Listeners: ${space.listeners.length}, Speakers: ${space.speakers.length}, RaisedHands: ${space.raisedHands.length}`);
    } else {
        console.log(`❌ [getSpaceDetails] Space not found or not live - Channel: ${channelName}`);
    }
    
    return space;
};

const stopSpace = async (channelName) => {
    console.log(`🔄 [stopSpace] Stopping space - Channel: ${channelName}`);
    const result = await Space.findOneAndUpdate(
        { channelName: channelName, isLive: true },
        { isLive: false, speakers: [], raisedHands: [], listeners: [] }, 
        { new: true }
    );
    
    if (result) {
        console.log(`✅ [stopSpace] Space stopped successfully - Channel: ${channelName}`);
    } else {
        console.log(`❌ [stopSpace] Space not found or already stopped - Channel: ${channelName}`);
    }
    
    return result;
};

// ✅ FIXED: userJoinedSpace with socket tracking
const userJoinedSpace = async (channelName, user, socketId = null) => {
    console.log(`🔄 [userJoinedSpace] Starting - Channel: ${channelName}, User:`, user, `Socket: ${socketId}`);
    
    const uidNum = Number(user.uid);
    if (isNaN(uidNum)) {
        console.error(`❌ [userJoinedSpace] Invalid UID: ${user.uid}`);
        return null;
    }
    
    try {
        // STEP 1: Pehle current space get karein
        const currentSpace = await Space.findOne({ channelName: channelName, isLive: true });
        if (!currentSpace) {
            console.error(`❌ [userJoinedSpace] Space not found - Channel: ${channelName}`);
            return null;
        }
        
        console.log(`📊 [userJoinedSpace] BEFORE - Listeners: ${currentSpace.listeners.length}, Speakers: ${currentSpace.speakers.length}, RaisedHands: ${currentSpace.raisedHands.length}`);
        
        // Check if user is owner
        if (currentSpace.ownerAgoraUid === uidNum) {
            console.log(`ℹ️ [userJoinedSpace] User is owner, skipping listener addition - UID: ${uidNum}`);
            return currentSpace;
        }
        
        // ✅ CRITICAL FIX: Same name wale user ko check karein
        let existingUser = null;
        let existingArray = null;
        
        existingUser = currentSpace.listeners.find(l => l.name === user.name);
        if (existingUser) existingArray = 'listeners';
        
        if (!existingUser) {
            existingUser = currentSpace.speakers.find(s => s.name === user.name);
            if (existingUser) existingArray = 'speakers';
        }
        
        if (!existingUser) {
            existingUser = currentSpace.raisedHands.find(r => r.name === user.name);
            if (existingUser) existingArray = 'raisedHands';
        }
        
        // Agar same name ka user already hai
        if (existingUser) {
            console.log(`🔄 [userJoinedSpace] User with same name already exists: "${user.name}" in ${existingArray}`);
            console.log(`ℹ️ [userJoinedSpace] Old UID: ${existingUser.uid}, New UID: ${uidNum}`);
            
            // Purane UID ko naye UID se replace karein
            if (existingArray === 'listeners') {
                currentSpace.listeners = currentSpace.listeners.map(listener => 
                    listener.name === user.name ? { ...listener, uid: uidNum } : listener
                );
            } else if (existingArray === 'speakers') {
                currentSpace.speakers = currentSpace.speakers.map(speaker => 
                    speaker.name === user.name ? { ...speaker, uid: uidNum } : speaker
                );
            } else if (existingArray === 'raisedHands') {
                currentSpace.raisedHands = currentSpace.raisedHands.map(hand => 
                    hand.name === user.name ? { ...hand, uid: uidNum } : hand
                );
            }
            
            await currentSpace.save();
            console.log(`✅ [userJoinedSpace] User UID updated - Name: "${user.name}", New UID: ${uidNum}`);
            return currentSpace;
        }
        
        // ✅ Check if user already exists with this UID
        const existingWithUID = 
            currentSpace.listeners.find(l => l.uid === uidNum) ||
            currentSpace.speakers.find(s => s.uid === uidNum) ||
            currentSpace.raisedHands.find(r => r.uid === uidNum);
        
        if (existingWithUID) {
            console.log(`ℹ️ [userJoinedSpace] User already exists with UID: ${uidNum}`);
            return currentSpace;
        }
        
        // ✅ Naya user add karein
        currentSpace.listeners.push({ uid: uidNum, name: user.name });
        await currentSpace.save();
        
        console.log(`✅ [userJoinedSpace] New user added as listener - UID: ${uidNum}, Name: "${user.name}"`);
        console.log(`📊 [userJoinedSpace] AFTER - Listeners: ${currentSpace.listeners.length}`);
        
        return currentSpace;
        
    } catch (error) {
        console.error(`❌ [userJoinedSpace] Error:`, error.message);
        return await getSpaceDetails(channelName);
    }
};

// ✅ FIXED: userLeftSpace with socket tracking
const userLeftSpace = async (channelName, userUid, userName = null) => {
    console.log(`🔄 [userLeftSpace] Starting - Channel: ${channelName}, UserUID: ${userUid}, UserName: ${userName}`);
    
    const uidNum = Number(userUid);
    if (isNaN(uidNum)) {
        console.error(`❌ [userLeftSpace] Invalid UID: ${userUid}`);
        return null;
    }

    try {
        const currentSpace = await Space.findOne({ channelName: channelName, isLive: true });
        if (!currentSpace) {
            console.error(`❌ [userLeftSpace] Space not found - Channel: ${channelName}`);
            return null;
        }
        
        console.log(`📊 [userLeftSpace] BEFORE - Listeners: ${currentSpace.listeners.length}, Speakers: ${currentSpace.speakers.length}, RaisedHands: ${currentSpace.raisedHands.length}`);
        
        // ✅ UID se remove karein
        const originalListenersCount = currentSpace.listeners.length;
        const originalSpeakersCount = currentSpace.speakers.length;
        const originalRaisedHandsCount = currentSpace.raisedHands.length;
        
        currentSpace.listeners = currentSpace.listeners.filter(listener => listener.uid !== uidNum);
        currentSpace.speakers = currentSpace.speakers.filter(speaker => speaker.uid !== uidNum);
        currentSpace.raisedHands = currentSpace.raisedHands.filter(hand => hand.uid !== uidNum);
        
        // ✅ Agar UID se remove nahi hua aur userName diya gaya hai, toh name se remove karein
        if (userName && 
            currentSpace.listeners.length === originalListenersCount &&
            currentSpace.speakers.length === originalSpeakersCount &&
            currentSpace.raisedHands.length === originalRaisedHandsCount) {
            
            console.log(`🔄 [userLeftSpace] Removing by name: ${userName}`);
            currentSpace.listeners = currentSpace.listeners.filter(listener => listener.name !== userName);
            currentSpace.speakers = currentSpace.speakers.filter(speaker => speaker.name !== userName);
            currentSpace.raisedHands = currentSpace.raisedHands.filter(hand => hand.name !== userName);
        }
        
        await currentSpace.save();
        
        console.log(`✅ [userLeftSpace] User removed from all arrays - UID: ${uidNum}`);
        console.log(`📊 [userLeftSpace] AFTER - Listeners: ${currentSpace.listeners.length}, Speakers: ${currentSpace.speakers.length}, RaisedHands: ${currentSpace.raisedHands.length}`);
        
        return currentSpace;
        
    } catch (error) {
        console.error(`❌ [userLeftSpace] Error:`, error.message);
        return null;
    }
};

// ✅ SOCKET CONNECTION MANAGEMENT FUNCTIONS
const registerSocketUser = (socketId, userData) => {
    const { userId, channelName, uid, name } = userData;
    
    connectedUsers.set(socketId, {
        userId,
        channelName,
        uid,
        name,
        socketId,
        connectedAt: new Date()
    });

    userHeartbeats.set(socketId, Date.now());
    
    console.log(`🔗 [registerSocketUser] User registered - Socket: ${socketId}, Name: ${name}, Channel: ${channelName}`);
};

const handleSocketDisconnect = async (socketId) => {
    console.log(`🔗 [handleSocketDisconnect] Socket disconnected: ${socketId}`);
    
    const userInfo = connectedUsers.get(socketId);
    if (userInfo) {
        const { channelName, uid, name } = userInfo;
        
        console.log(`🗑️ [handleSocketDisconnect] Removing user ${name} from room ${channelName}`);
        
        try {
            const updatedSpace = await userLeftSpace(channelName, uid, name);
            
            // Real-time update bhejein (agar socket.io available hai)
            if (global.io) {
                global.io.to(channelName).emit('roomStateUpdate', updatedSpace);
                console.log(`📢 [handleSocketDisconnect] Room state updated for ${channelName}`);
            }
        } catch (error) {
            console.error('❌ [handleSocketDisconnect] Error removing user:', error);
        }
        
        // Remove from tracking
        connectedUsers.delete(socketId);
        userHeartbeats.delete(socketId);
    }
};

const handleSocketHeartbeat = (socketId) => {
    userHeartbeats.set(socketId, Date.now());
    console.log(`❤️ [handleSocketHeartbeat] Heartbeat from socket: ${socketId}`);
};

// ✅ PERIODIC CONNECTION CLEANUP
const startConnectionCleanup = () => {
    console.log('🔄 [startConnectionCleanup] Starting connection cleanup service...');
    
    setInterval(async () => {
        try {
            const now = Date.now();
            const heartbeatTimeout = 45000; // 45 seconds
            let cleanedCount = 0;
            
            console.log(`🔍 [Connection Cleanup] Checking ${connectedUsers.size} connected users...`);
            
            for (const [socketId, lastBeat] of userHeartbeats) {
                if (now - lastBeat > heartbeatTimeout) {
                    const userInfo = connectedUsers.get(socketId);
                    if (userInfo) {
                        console.log(`⏰ [Connection Cleanup] Removing inactive user: ${userInfo.name} (${socketId})`);
                        await handleSocketDisconnect(socketId);
                        cleanedCount++;
                    }
                }
            }
            
            if (cleanedCount > 0) {
                console.log(`✅ [Connection Cleanup] Removed ${cleanedCount} inactive users`);
            }
            
        } catch (error) {
            console.error('❌ [Connection Cleanup] Error:', error);
        }
    }, 30000); // Check every 30 seconds
};

// ✅ MANUAL USER REMOVAL (Emergency cleanup)
const forceRemoveUser = async (channelName, userName) => {
    console.log(`🛠️ [forceRemoveUser] Force removing user: ${userName} from ${channelName}`);
    
    try {
        const space = await Space.findOne({ channelName: channelName, isLive: true });
        if (!space) {
            console.error(`❌ [forceRemoveUser] Space not found: ${channelName}`);
            return null;
        }
        
        const beforeCount = space.listeners.length + space.speakers.length + space.raisedHands.length;
        
        // Remove user from all arrays by name
        space.listeners = space.listeners.filter(listener => listener.name !== userName);
        space.speakers = space.speakers.filter(speaker => speaker.name !== userName);
        space.raisedHands = space.raisedHands.filter(hand => hand.name !== userName);
        
        await space.save();
        
        const afterCount = space.listeners.length + space.speakers.length + space.raisedHands.length;
        const removedCount = beforeCount - afterCount;
        
        console.log(`✅ [forceRemoveUser] Removed ${removedCount} entries for user: ${userName}`);
        
        return space;
    } catch (error) {
        console.error(`❌ [forceRemoveUser] Error:`, error);
        return null;
    }
};

// Other functions remain the same (requestToSpeak, lowerHand, promoteToSpeaker, removeSpeaker)
const requestToSpeak = async (channelName, user) => {
    console.log(`🔄 [requestToSpeak] Starting - Channel: ${channelName}, User:`, user);
    
    const { uid, name } = user;
    const uidNum = Number(uid);

    if (isNaN(uidNum)) {
        console.error(`❌ [requestToSpeak] Invalid UID type: ${uid}`);
        return null;
    }

    try {
        const currentSpace = await Space.findOne({ channelName: channelName, isLive: true });
        if (!currentSpace) {
            console.error(`❌ [requestToSpeak] Space not found - Channel: ${channelName}`);
            return null;
        }

        console.log(`📊 [requestToSpeak] BEFORE - Listeners: ${currentSpace.listeners.length}, RaisedHands: ${currentSpace.raisedHands.length}`);

        const existingInSpeakers = currentSpace.speakers.find(s => s.name === name);
        const existingInRaisedHands = currentSpace.raisedHands.find(r => r.name === name);
        
        if (existingInSpeakers || existingInRaisedHands) {
            console.log(`❌ [requestToSpeak] User already in speakers or raised hands - Name: ${name}`);
            return currentSpace;
        }

        currentSpace.raisedHands.push({ uid: uidNum, name: name });
        currentSpace.listeners = currentSpace.listeners.filter(listener => listener.name !== name);
        
        await currentSpace.save();
        
        console.log(`✅ [requestToSpeak] User moved to raised hands - Name: ${name}`);
        console.log(`📊 [requestToSpeak] AFTER - Listeners: ${currentSpace.listeners.length}, RaisedHands: ${currentSpace.raisedHands.length}`);
        
        return currentSpace;
        
    } catch (error) {
        console.error(`❌ [requestToSpeak] Error:`, error.message);
        return null;
    }
};

const lowerHand = async (channelName, userUid, userName = null) => {
    console.log(`🔄 [lowerHand] Starting - Channel: ${channelName}, UserUID: ${userUid}, UserName: ${userName}`);
    
    const userUidNum = Number(userUid);
    if (isNaN(userUidNum)) {
        console.error(`❌ [lowerHand] Invalid UID type: ${userUid}`);
        return null;
    }

    try {
        const space = await Space.findOne({ channelName: channelName, isLive: true });
        if (!space) {
            console.log(`❌ [lowerHand] Space not found - Channel: ${channelName}`);
            return null; 
        }

        let user = space.raisedHands.find(u => u.uid === userUidNum);
        if (!user && userName) {
            user = space.raisedHands.find(u => u.name === userName);
        }

        if (!user) {
            console.log(`❌ [lowerHand] User not found in raised hands - UID: ${userUidNum}, Name: ${userName}`);
            return space; 
        }

        console.log(`📊 [lowerHand] BEFORE - Listeners: ${space.listeners.length}, RaisedHands: ${space.raisedHands.length}`);

        space.raisedHands = space.raisedHands.filter(hand => 
            hand.uid !== userUidNum && hand.name !== user.name
        );
        
        const existingInListeners = space.listeners.find(l => l.name === user.name);
        if (!existingInListeners) {
            space.listeners.push({ uid: userUidNum, name: user.name });
        }
        
        await space.save();
        
        console.log(`✅ [lowerHand] User moved back to listeners - Name: ${user.name}`);
        console.log(`📊 [lowerHand] AFTER - Listeners: ${space.listeners.length}, RaisedHands: ${space.raisedHands.length}`);
        
        return space;
        
    } catch (error) {
        console.error(`❌ [lowerHand] Error:`, error.message);
        return null;
    }
};

const promoteToSpeaker = async (channelName, userUid, userName = null) => {
    console.log(`🔄 [promoteToSpeaker] Starting - Channel: ${channelName}, UserUID: ${userUid}, UserName: ${userName}`);
    
    const userUidNum = Number(userUid);
    if (isNaN(userUidNum)) {
        console.error(`❌ [promoteToSpeaker] Invalid User UID format: ${userUid}`);
        return 'Invalid User UID format.';
    }

    try {
        const space = await Space.findOne({ channelName: channelName, isLive: true });
        if (!space) {
            console.error(`❌ [promoteToSpeaker] Space not found - Channel: ${channelName}`);
            return 'Space not found or not live.';
        }

        let user = space.raisedHands.find(user => user.uid === userUidNum);
        if (!user && userName) {
            user = space.raisedHands.find(user => user.name === userName);
        }
        
        if (!user) {
            user = space.listeners.find(user => user.uid === userUidNum);
            if (!user && userName) {
                user = space.listeners.find(user => user.name === userName);
            }
        }

        if (!user) {
            console.error(`❌ [promoteToSpeaker] User not found in listeners or requests - UID: ${userUidNum}, Name: ${userName}`);
            return 'User not found in listeners or requests.';
        }

        if (space.speakers.length >= 10) { 
            console.error(`❌ [promoteToSpeaker] Speaker limit reached - Current: ${space.speakers.length}`);
            return 'Speaker limit reached.';
        }

        console.log(`📊 [promoteToSpeaker] BEFORE - Listeners: ${space.listeners.length}, Speakers: ${space.speakers.length}, RaisedHands: ${space.raisedHands.length}`);

        space.raisedHands = space.raisedHands.filter(hand => hand.name !== user.name);
        space.listeners = space.listeners.filter(listener => listener.name !== user.name);
        space.speakers.push({ uid: userUidNum, name: user.name, isMuted: false });
        
        await space.save();
        
        console.log(`✅ [promoteToSpeaker] User promoted to speaker - Name: ${user.name}`);
        console.log(`📊 [promoteToSpeaker] AFTER - Listeners: ${space.listeners.length}, Speakers: ${space.speakers.length}, RaisedHands: ${space.raisedHands.length}`);
        
        return space;
        
    } catch (error) {
        console.error(`❌ [promoteToSpeaker] Error:`, error.message);
        return 'Internal server error';
    }
};

const removeSpeaker = async (channelName, speakerUid, speakerName = null) => {
    console.log(`🔄 [removeSpeaker] Starting - Channel: ${channelName}, SpeakerUID: ${speakerUid}, SpeakerName: ${speakerName}`);
    
    const speakerUidNum = Number(speakerUid);
    if (isNaN(speakerUidNum)) {
        console.error(`❌ [removeSpeaker] Invalid Speaker UID format: ${speakerUid}`);
        return 'Invalid Speaker UID format.';
    }

    try {
        const space = await Space.findOne({ channelName: channelName, isLive: true });
        if (!space) {
            console.error(`❌ [removeSpeaker] Space not found - Channel: ${channelName}`);
            return 'Space not found.';
        }
        
        if (space.ownerAgoraUid && space.ownerAgoraUid === speakerUidNum) {
            console.error(`❌ [removeSpeaker] Attempt to remove owner - UID: ${speakerUidNum}`);
            return 'Owner cannot be removed.';
        }

        let speaker = space.speakers.find(s => s.uid === speakerUidNum);
        if (!speaker && speakerName) {
            speaker = space.speakers.find(s => s.name === speakerName);
        }

        if (!speaker) {
            console.error(`❌ [removeSpeaker] Speaker not found in list - UID: ${speakerUidNum}, Name: ${speakerName}`);
            return 'Speaker not found in list.';
        }

        console.log(`📊 [removeSpeaker] BEFORE - Listeners: ${space.listeners.length}, Speakers: ${space.speakers.length}`);

        space.speakers = space.speakers.filter(s => s.name !== speaker.name);
        
        const existingInListeners = space.listeners.find(l => l.name === speaker.name);
        if (!existingInListeners) {
            space.listeners.push({ uid: speakerUidNum, name: speaker.name });
        }
        
        await space.save();
        
        console.log(`✅ [removeSpeaker] Speaker demoted to listener - Name: ${speaker.name}`);
        console.log(`📊 [removeSpeaker] AFTER - Listeners: ${space.listeners.length}, Speakers: ${space.speakers.length}`);
        
        return space;
        
    } catch (error) {
        console.error(`❌ [removeSpeaker] Error:`, error.message);
        return 'Internal server error';
    }
};

// ✅ DUPLICATE CLEANUP FUNCTION
const cleanupDuplicateUsers = async () => {
    console.log('🔄 [cleanupDuplicateUsers] Starting duplicate cleanup...');
    
    try {
        const spaces = await Space.find({ isLive: true });
        let totalCleaned = 0;
        
        for (let space of spaces) {
            console.log(`📊 [cleanupDuplicateUsers] Checking space: ${space.channelName}`);
            
            const uniqueListeners = [];
            const listenerNames = new Set();
            let listenerDuplicates = 0;
            
            space.listeners.forEach(listener => {
                if (!listenerNames.has(listener.name)) {
                    listenerNames.add(listener.name);
                    uniqueListeners.push(listener);
                } else {
                    listenerDuplicates++;
                    console.log(`🗑️ Removed duplicate listener: ${listener.name} (UID: ${listener.uid})`);
                }
            });
            
            const uniqueSpeakers = [];
            const speakerNames = new Set();
            let speakerDuplicates = 0;
            
            space.speakers.forEach(speaker => {
                if (!speakerNames.has(speaker.name)) {
                    speakerNames.add(speaker.name);
                    uniqueSpeakers.push(speaker);
                } else {
                    speakerDuplicates++;
                    console.log(`🗑️ Removed duplicate speaker: ${speaker.name} (UID: ${speaker.uid})`);
                }
            });
            
            const uniqueRaisedHands = [];
            const raisedHandsNames = new Set();
            let raisedHandsDuplicates = 0;
            
            space.raisedHands.forEach(hand => {
                if (!raisedHandsNames.has(hand.name)) {
                    raisedHandsNames.add(hand.name);
                    uniqueRaisedHands.push(hand);
                } else {
                    raisedHandsDuplicates++;
                    console.log(`🗑️ Removed duplicate raised hand: ${hand.name} (UID: ${hand.uid})`);
                }
            });
            
            if (listenerDuplicates > 0 || speakerDuplicates > 0 || raisedHandsDuplicates > 0) {
                await Space.findByIdAndUpdate(space._id, {
                    listeners: uniqueListeners,
                    speakers: uniqueSpeakers,
                    raisedHands: uniqueRaisedHands
                });
                
                totalCleaned += (listenerDuplicates + speakerDuplicates + raisedHandsDuplicates);
                console.log(`✅ [cleanupDuplicateUsers] Cleaned space ${space.channelName} - Listeners: -${listenerDuplicates}, Speakers: -${speakerDuplicates}, RaisedHands: -${raisedHandsDuplicates}`);
            }
        }
        
        console.log(`✅ [cleanupDuplicateUsers] Duplicate cleanup completed! Total cleaned: ${totalCleaned}`);
        return totalCleaned;
    } catch (error) {
        console.error('❌ [cleanupDuplicateUsers] Error during cleanup:', error);
        return 0;
    }
};

// ✅ EMERGENCY NAME CLEANUP
const emergencyNameCleanup = async () => {
    console.log('🚨 [emergencyNameCleanup] Starting emergency name-based cleanup...');
    const cleaned = await cleanupDuplicateUsers();
    console.log(`🚨 [emergencyNameCleanup] Emergency cleanup completed! Removed ${cleaned} duplicates.`);
    return cleaned;
};

// ✅ GET STABLE UID FUNCTION
const getStableUserUID = (userId, channelName, userName) => {
    const stableString = `${userId || 'anonymous'}-${channelName}-${userName}`;
    let hash = 0;
    for (let i = 0; i < stableString.length; i++) {
        const char = stableString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const stableUID = Math.abs(hash) % 1000000;
    console.log(`🔐 [getStableUserUID] Generated stable UID: ${stableUID} for user: ${userName}`);
    return stableUID;
};

// Server start par cleanup run karein
emergencyNameCleanup();
startConnectionCleanup(); // ✅ IMPORTANT: Connection cleanup start karein

// Periodic cleanup (har 10 minute mein)
setInterval(cleanupDuplicateUsers, 1 * 60 * 1000);

module.exports = {
    generateAgoraToken,
    createSpace,
    getLiveSpaces,
    getSpaceDetails,
    stopSpace,
    requestToSpeak,
    lowerHand,
    promoteToSpeaker,
    removeSpeaker,
    userJoinedSpace, 
    userLeftSpace,
    cleanupDuplicateUsers,
    emergencyNameCleanup,
    getStableUserUID,
    // ✅ NEW: Socket management functions export karein
    registerSocketUser,
    handleSocketDisconnect,
    handleSocketHeartbeat,
    forceRemoveUser,
    getConnectedUsers: () => connectedUsers,
    getUserHeartbeats: () => userHeartbeats
};