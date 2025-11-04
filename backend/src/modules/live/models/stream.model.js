const mongoose = require('mongoose');
const { Schema } = mongoose;

const speakerSchema = new Schema({
    uid: { type: Number, required: true },
    name: { type: String, required: true },
    isMuted: { type: Boolean, default: false }
}, { _id: false });

const raisedHandSchema = new Schema({
    uid: { type: Number, required: true },
    name: { type: String, required: true }
}, { _id: false });

// 🛑 ADDED: Listener Schema for the list
const listenerSchema = new Schema({
    uid: { type: Number, required: true },
    name: { type: String, required: true }
}, { _id: false });

const spaceSchema = new Schema({
    title: { type: String, required: true, trim: true },
    ownerUid: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, 
    ownerAgoraUid: { type: Number, required: true }, 
    ownerName: { type: String, required: true },
    channelName: { type: String, required: true, unique: true, index: true },
    isLive: { type: Boolean, default: true, index: true },
    
    speakers: [speakerSchema],
    raisedHands: [raisedHandSchema],
    
    // 🛑 UPDATED: Listeners array for list display
    listeners: [listenerSchema], 

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

spaceSchema.index({ isLive: 1, createdAt: -1 });

module.exports = mongoose.model('Space', spaceSchema);
