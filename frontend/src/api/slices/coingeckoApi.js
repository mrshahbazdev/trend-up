import { cryptoMarketApi } from "../coinGeckoApi";

const ids = "bitcoin,ethereum,solana,dogecoin,binancecoin,cardano,polkadot,tron,chainlink,polygon,litecoin,uniswap,";
const vsCurrencies = "usd";
export const cryptoApi = cryptoMarketApi.injectEndpoints({
    endpoints: (builder) => ({
        getCryptoMarket: builder.query({
            query: () => ({
                url: `simple/price?ids=${ids}&vs_currencies=${vsCurrencies}`,
                method: "GET",
            }),
        }),
    }),
});
export const { useGetCryptoMarketQuery } = cryptoApi;
