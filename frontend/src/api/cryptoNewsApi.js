import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";

const CRYPTO_NEWS_URL = "https://cryptopanic.com/api/developer/v2";
const { VITE_CRYPTOPANIC_TOKEN } = import.meta.env;
console.log("Cryptopanic Token", VITE_CRYPTOPANIC_TOKEN);

export const cryptoNewsApi = createApi({
    reducerPath: "cryptoNewsApi",
    baseQuery: fetchBaseQuery({
        baseUrl: CRYPTO_NEWS_URL,
        prepareHeaders: (headers) => {
            headers.set("Accept", "application/json");
            return headers;
        },
    }),
    endpoints: (builder) => ({
        getCryptoNews: builder.query({
            query: () => `/posts/?auth_token=${VITE_CRYPTOPANIC_TOKEN}&public=true`,
        }),
    }),
});

export const { useGetCryptoNewsQuery } = cryptoNewsApi;