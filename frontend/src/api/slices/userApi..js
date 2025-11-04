import { baseApi } from "../baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get current user's profile
    getMyProfile: builder.query({
      query: () => '/users/me',
      providesTags: ['User'],
    }),

    // Get user by username (public)
    getUserByUsername: builder.query({
      query: (username) => `/users/${username}`,
      providesTags: (result, error, username) => [{ type: 'User', id: username }],
    }),

    // Update profile
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/users/profile',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // Upload avatar
    uploadAvatar: builder.mutation({
      query: (formData) => ({
        url: '/users/avatar',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),

    // Upload cover image
    uploadCover: builder.mutation({
      query: (formData) => ({
        url: '/users/cover',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),

    // Delete account
    deleteAccount: builder.mutation({
      query: () => ({
        url: '/users/account',
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    // Search users
    searchUsers: builder.query({
      query: ({ q, limit = 10 }) => `/users/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useGetUserByUsernameQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useUploadCoverMutation,
  useDeleteAccountMutation,
  useSearchUsersQuery,
} = userApi;