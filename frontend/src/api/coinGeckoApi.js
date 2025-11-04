import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";

const CRYPTO_MARKET_URL = "https://api.coingecko.com/api/v3/";

export const cryptoMarketApi = createApi({
    reducerPath: "cryptoMarketApi",
    baseQuery: fetchBaseQuery({
        baseUrl: CRYPTO_MARKET_URL,
        prepareHeaders: (headers) => {
            headers.set("Accept", "application/json");
            return headers;
        },
    }),
    endpoints: () => ({}),
});