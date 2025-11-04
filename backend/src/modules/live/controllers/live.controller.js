const liveService = require('../services/live.service');
const { v4: uuidv4 } = require('uuid');

const startSpace = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const { title, ownerName } = req.body;
        if (!title || !ownerName) {
            return res.status(400).json({ message: 'Title and ownerName are required.' });
        }

        const ownerIdFromAuth = req.user?._id;
        if (!ownerIdFromAuth) {
             console.warn('Owner ID not found from authentication middleware for startSpace.');
        }

        const ownerUidNumber = Math.floor(Math.random() * 1000000);

        const channelName = `${title.toLowerCase().split(' ').join('-')}-${uuidv4().substring(0, 8)}`;

        const token = liveService.generateAgoraToken(channelName, ownerUidNumber, 'publisher');

        const spaceData = {
            title,
            ownerName,
            ownerUid: ownerIdFromAuth,
            ownerAgoraUid: ownerUidNumber,
            channelName
        };
        const newSpace = await liveService.createSpace(spaceData);

        res.status(201).json({
            message: 'Space started successfully',
            token: token,
            channelName: newSpace.channelName,
            ownerAgoraUid: newSpace.ownerAgoraUid,
            space: newSpace,
        });
    } catch (error) {
        console.error("Error in startSpace controller:", error);
        res.status(500).json({ message: 'Failed to start space', error: error.message });
    }
};

const getLiveSpaces = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const spaces = await liveService.getLiveSpaces();
        res.status(200).json({
            message: 'Live spaces fetched successfully',
            count: spaces.length,
            spaces: spaces,
        });
    } catch (error) {
        console.error("Error in getLiveSpaces controller:", error);
        res.status(500).json({ message: 'Failed to fetch live spaces', error: error.message });
    }
};

const getSpaceDetails = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const { channelName } = req.params;
        const space = await liveService.getSpaceDetails(channelName);
        if (!space) {
            return res.status(404).json({ message: 'Live space not found.' });
        }
        res.status(200).json({
            message: 'Space details fetched successfully',
            space: space,
        });
    } catch (error) {
         console.error("Error in getSpaceDetails controller:", error);
        res.status(500).json({ message: 'Failed to fetch space details', error: error.message });
    }
};

const stopSpace = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const { channelName } = req.body;

        const updatedSpace = await liveService.stopSpace(channelName);
        if (!updatedSpace) {
             return res.status(404).json({ message: 'Space not found or already stopped.' });
        }

        const io = req.app.get('socketio');
        if (io && channelName) {
            io.to(channelName).emit('spaceEnded');
             console.log(`[Emit] Sent spaceEnded to ${channelName}`);
        }

        res.status(200).json({ message: 'Space stopped successfully' });
    } catch (error) {
         console.error("Error in stopSpace controller:", error);
        res.status(500).json({ message: 'Failed to stop space', error: error.message });
    }
};

const getJoinToken = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const { channelName, userName, role = 'audience', uid } = req.body;
        if (!channelName || !userName) {
            return res.status(400).json({ message: 'channelName and userName are required.' });
        }
         if (role !== 'publisher' && role !== 'audience') {
              return res.status(400).json({ message: 'Invalid role specified. Must be publisher or audience.' });
         }

        const space = await liveService.getSpaceDetails(channelName);
        if (!space) {
             return res.status(404).json({ message: 'Cannot join: Space not found or not live.' });
        }

        const joiningUidNumber = uid ? Number(uid) : Math.floor(Math.random() * 1000000);

        const token = liveService.generateAgoraToken(channelName, joiningUidNumber, role);

        res.status(200).json({
            message: `Token generated for ${role}`,
            token: token,
            channelName: channelName,
            uid: joiningUidNumber,
            userName: userName,
        });
    } catch (error) {
        console.error("Error in getJoinToken controller:", error);
        res.status(500).json({ message: 'Failed to generate join token', error: error.message });
    }
};

// 🛑 UPDATED: Ab uid aur name bhi accept karein
const userJoined = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        // 🛑 NEW: uid aur name accept kiya
        const { channelName, uid, name } = req.body;
        if (!channelName || !uid || !name) {
            return res.status(400).json({ message: 'channelName, uid, and name are required.' });
        }
        const updatedSpace = await liveService.userJoinedSpace(channelName, { uid: Number(uid), name });

        const emitRoomUpdate = req.app.get('emitRoomUpdate');
        if (emitRoomUpdate) emitRoomUpdate(channelName, updatedSpace);

        res.status(200).json({ message: 'Listener added.' });
    } catch (error) {
        console.error("Error in userJoined controller:", error);
        res.status(500).json({ message: 'Failed to add listener', error: error.message });
    }
};

// 🛑 UPDATED: Ab uid bhi accept karein
const userLeft = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const { channelName, uid } = req.body;
        if (!channelName || !uid) {
            return res.status(400).json({ message: 'channelName and uid are required.' });
        }
        // 🛑 uid pass kiya
        const updatedSpace = await liveService.userLeftSpace(channelName, Number(uid));
        
        const emitRoomUpdate = req.app.get('emitRoomUpdate');
        if (emitRoomUpdate) emitRoomUpdate(channelName, updatedSpace);

        res.status(200).json({ message: 'Listener removed.' });
    } catch (error) {
        console.error("Error in userLeft controller:", error);
        res.status(500).json({ message: 'Failed to remove listener', error: error.message });
    }
};

const raiseHand = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const { channelName, userUid, userName } = req.body;

        if (!channelName || !userUid || !userName) {
            return res.status(400).json({ message: 'channelName, userUid, and userName are required in the request body.' });
        }

        const currentSpace = await liveService.getSpaceDetails(channelName);
        if (!currentSpace) {
            return res.status(404).json({ message: 'Space not found.' });
        }

        const isSpeaker = currentSpace.speakers.some(s => String(s.uid) === String(userUid));
        if (isSpeaker) {
            return res.status(409).json({ message: 'Already a speaker.' });
        }

        const alreadyRaised = currentSpace.raisedHands.some(h => String(h.uid) === String(userUid));
        if (alreadyRaised) {
            return res.status(409).json({ message: 'Request already pending.' });
        }

        const user = { uid: userUid, name: userName };
        let updatedSpace = await liveService.requestToSpeak(channelName, user);

         if (!updatedSpace) {
             console.warn(`requestToSpeak returned null (user ${userUid} might already be in list). Fetching current space...`);
             updatedSpace = await liveService.getSpaceDetails(channelName);
         }

        const emitRoomUpdate = req.app.get('emitRoomUpdate');
        if (emitRoomUpdate && updatedSpace) emitRoomUpdate(channelName, updatedSpace);

        const io = req.app.get('socketio');
        const userSockets = req.app.get('userSockets');
        const ownerAgoraUid = currentSpace.ownerAgoraUid;
        const ownerSocketId = userSockets ? userSockets[String(ownerAgoraUid)] : null;

        if (io && ownerSocketId) {
             io.to(ownerSocketId).emit('newHandRaise', { userName: user.name });
             console.log(`[Emit] Sent newHandRaise to owner ${ownerSocketId} for user ${user.name}`);
        }

        res.status(200).json({ message: 'Request to speak submitted.'});
    } catch (error) {
         console.error("Error in raiseHand controller:", error);
        res.status(500).json({ message: 'Failed to raise hand', error: error.message });
    }
};

const lowerHand = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const { channelName, userUid } = req.body;
        const authenticatedUserId = req.user?._id; 
        const requesterAgoraUid = req.user?.agoraUid; // 🛑 Yahan bhi Agora UID chahiye

        if (!channelName || !userUid) { 
            return res.status(400).json({ message: 'channelName and userUid are required.' });
        }

        let updatedSpace;
        const spaceDetails = await liveService.getSpaceDetails(channelName);
        if (!spaceDetails) {
            return res.status(404).json({ message: 'Space not found.' });
        }

        const isOwnerRequesting = spaceDetails.ownerUid.toString() === authenticatedUserId.toString();
        const isSelfRequesting = requesterAgoraUid && requesterAgoraUid.toString() === userUid.toString();

        if (isOwnerRequesting || isSelfRequesting) {
             updatedSpace = await liveService.lowerHand(channelName, userUid);
        } else {
            console.warn(`lowerHand forbidden: ownerId ${spaceDetails.ownerUid} !== reqId ${authenticatedUserId}. Self ${requesterAgoraUid} !== ${userUid}`);
             return res.status(403).json({ message: 'Forbidden: Only the owner or the user themselves can lower the hand.' });
        }


         if (!updatedSpace) {
             return res.status(404).json({ message: 'Could not lower hand. Request not found or space missing.' });
         }

        const emitRoomUpdate = req.app.get('emitRoomUpdate');
        if (emitRoomUpdate) emitRoomUpdate(channelName, updatedSpace);

        res.status(200).json({ message: 'Hand lowered successfully.' });
    } catch (error) {
        console.error("Error in lowerHand controller:", error);
        res.status(500).json({ message: 'Failed to lower hand', error: error.message });
    }
};

const acceptHand = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const { channelName, userUid } = req.body;

        if (!channelName || !userUid) {
            return res.status(400).json({ message: 'channelName and userUid are required.' });
        }

        const result = await liveService.promoteToSpeaker(channelName, userUid);

        if (typeof result === 'string') {
            const statusCode = result.includes('limit') ? 409 : result.includes('not found') ? 404 : 400;
            return res.status(statusCode).json({ message: result });
        }

        const io = req.app.get('socketio');
        const emitRoomUpdate = req.app.get('emitRoomUpdate');
        const userSockets = req.app.get('userSockets'); 
        const targetSocketId = userSockets ? userSockets[String(userUid)] : null;

        if (io && targetSocketId) {
            io.to(targetSocketId).emit('handAccepted', { channelName });
             console.log(`[Emit] Sent handAccepted to ${userUid} (${targetSocketId})`);
        } else {
             console.warn(`[Socket] Could not find socket ID for user ${userUid} to emit handAccepted.`);
        }
        if (emitRoomUpdate) emitRoomUpdate(channelName, result);

        res.status(200).json({ message: 'User promoted to speaker.' });
    } catch (error) {
        console.error("Error in acceptHand controller:", error);
        res.status(500).json({ message: 'Failed to accept hand', error: error.message });
  }
};

const removeSpeaker = async (req, res) => {
    try {
        const liveService = require('../services/live.service'); 
        const { channelName, speakerUid } = req.body;
        const authenticatedUserId = req.user?._id; 

        if (!channelName || !speakerUid) { 
            return res.status(400).json({ message: 'channelName and speakerUid are required.' });
        }

        if (!authenticatedUserId) {
            return res.status(401).json({ message: 'Not authorized.' });
        }

        const space = await liveService.getSpaceDetails(channelName);
        if (!space) {
            return res.status(404).json({ message: 'Space not found.' });
        }

        if (space.ownerUid.toString() !== authenticatedUserId.toString()) {
            return res.status(403).json({ message: 'Forbidden: Only the space owner can remove speakers.' });
        }
        
        if (speakerUid.toString() === space.ownerAgoraUid.toString()) {
            return res.status(400).json({ message: 'Owner cannot remove themselves using this endpoint. Use stopSpace instead.' });
        }

        const result = await liveService.removeSpeaker(channelName, speakerUid);

         if (typeof result === 'string') { 
             return res.status(404).json({ message: result });
         }
         if (!result) { 
              return res.status(404).json({ message: 'Failed to remove speaker or space/speaker not found.' });
         }

        const io = req.app.get('socketio');
        const emitRoomUpdate = req.app.get('emitRoomUpdate');
        const userSockets = req.app.get('userSockets'); 
        const targetSocketId = userSockets ? userSockets[String(speakerUid)] : null;

        if (io && targetSocketId) {
            io.to(targetSocketId).emit('youWereRemoved', { channelName });
             console.log(`[Emit] Sent youWereRemoved to ${speakerUid} (${targetSocketId})`);
        } else {
             console.warn(`[Socket] Could not find socket ID for user ${speakerUid} to emit youWereRemoved.`);
        }
        if (emitRoomUpdate) emitRoomUpdate(channelName, result);

        res.status(200).json({ message: 'Speaker removed successfully.' });
    } catch (error) {
        console.error("Error in removeSpeaker controller:", error);
        res.status(500).json({ message: 'Failed to remove speaker', error: error.message });
    }
};

module.exports = {
    startSpace,
    getLiveSpaces,
    getSpaceDetails,
    stopSpace,
    getJoinToken,
    raiseHand,
    lowerHand,
    acceptHand,
    removeSpeaker,
    userJoined,
    userLeft,
};
