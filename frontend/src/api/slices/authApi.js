import { baseApi } from "../baseApi";

export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        requestVerification: builder.mutation({
            query: (data) => ({
                url: '/auth/request-verification',
                method: 'POST',
                body: data
            }),
        }),

        verifyEmail: builder.mutation({
            query: (data) => ({
                url: '/auth/verify-email',
                method: 'POST',
                body: data
            }),
        }),

        register: builder.mutation({
            query: (data) => ({
                url: '/auth/register',
                method: 'POST',
                body: data
            })
        }),

        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials
            })
        }),

        getProfile: builder.query({
            query: () => '/auth/me',
            providesTags: ['Auth']
        }),

        refreshToken: builder.mutation({
            query: (data) => ({
                url: '/auth/refresh',
                method: 'POST',
                body: data
            }),
        }),

        forgotPassword: builder.mutation({
            query: (data) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: data
            }),
        }),

        validateResetToken: builder.query({
            query: (token) => `/auth/validate-reset-token/${token}`,
        }),

        resetPassword: builder.mutation({
            query: (data) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body: data
            }),
        }),

        requestWalletNonce: builder.mutation({
            query: (data) => ({
                url: '/auth/wallet/request-nonce',
                method: 'POST',
                body: data
            }),
        }),

        verifyWallet: builder.mutation({
            query: (data) => ({
                url: '/auth/wallet/verify',
                method: 'POST',
                body: data
            })
        }),
    })
});

export const {
    useRequestVerificationMutation,
    useVerifyEmailMutation,
    useRegisterMutation,
    useLoginMutation,
    useGetProfileQuery,
    useRefreshTokenMutation,
    useForgotPasswordMutation,
    useValidateResetTokenQuery,
    useResetPasswordMutation,
    useRequestWalletNonceMutation,
    useVerifyWalletMutation,
} = authApi;