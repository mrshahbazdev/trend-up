import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

const initialState = {
  currentChat: null,
  conversations: [],
  messages: {},
  input: {
    text: "",
    files: [],
    replyTo: null,
    recording: null,
  },
  ui: {
    emojiPicker: null,
    reactionPicker: null,
    isRecording: false,
  }
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    setInputText: (state, action) => {
      state.input.text = action.payload;
    },
    addFile: (state, action) => {
      state.input.files = [...state.input.files, ...action.payload];
    },
    removeFile: (state, action) => {
      state.input.files = state.input.files.filter((_, i) => i !== action.payload);
    },
    setReplyTo: (state, action) => {
      state.input.replyTo = action.payload;
    },
    cancelReply: (state) => {
      state.input.replyTo = null;
    },
    sendMessage: (state) => {
      if (!state.input.text && state.input.files.length === 0) return;
      
      const chatId = state.currentChat;
      const newMessage = {
        id: uuidv4(),
        content: state.input.text,
        sender: "currentUser",
        timestamp: new Date().toISOString(),
        replyTo: state.input.replyTo,
        attachments: state.input.files.map(file => ({
          id: uuidv4(),
          type: file.type.startsWith("image/") ? "image" : "file",
          name: file.name,
          size: file.size,
          url: URL.createObjectURL(file)
        })),
        reactions: []
      };

      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(newMessage);
      state.input.text = "";
      state.input.files = [];
      state.input.replyTo = null;
    },
    addReaction: (state, action) => {
      const { chatId, messageId, emoji } = action.payload;
      const messages = state.messages[chatId];
      const message = messages.find(m => m.id === messageId);
      
      if (!message) return;
      
      const existingReaction = message.reactions.find(r => r.emoji === emoji);
      if (existingReaction) {
        existingReaction.count += 1;
      } else {
        message.reactions.push({ emoji, count: 1 });
      }
    },
    // ... other reducers
  }
});

export const { 
  setCurrentChat, 
  setInputText, 
  addFile, 
  removeFile, 
  setReplyTo, 
  cancelReply, 
  sendMessage,
  addReaction
} = chatSlice.actions;

export default chatSlice.reducer;