import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "@api/baseApi";
import { socialApi } from "@api/slices/socialApi";
import userReducer from "./slices/userSlices";
import chatReducer from "./slices/chatSlice"; 
import { cryptoMarketApi } from "@/api/coinGeckoApi";
import { cryptoNewsApi } from "@/api/cryptoNewsApi";

export const store = configureStore({
    reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
        [socialApi.reducerPath]: socialApi.reducer,
        [cryptoMarketApi.reducerPath]: cryptoMarketApi.reducer,
        [cryptoNewsApi.reducerPath]: cryptoNewsApi.reducer,
        user: userReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(
        socialApi.middleware,
        cryptoMarketApi.middleware, 
        cryptoNewsApi.middleware
    ),
});

setupListeners(store.dispatch);
