import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setAuth, initAuth, setLoading } from '@/store/slices/userSlices';
import { useGetProfileQuery } from '@/api/slices/authApi';
import { authUtils } from '@/utils/auth';

export const useAutoLogin = () => {
    const dispatch = useDispatch();
    const [shouldFetchProfile, setShouldFetchProfile] = useState(false);

    useEffect(() => {
        dispatch(initAuth());
        
        const { accessToken } = authUtils.getTokens();
        
        if (accessToken && !authUtils.isAccessTokenExpired()) {
            setShouldFetchProfile(true);
        } else {
            dispatch(setLoading(false));
        }
    }, [dispatch]);

    const { data, isLoading, isError } = useGetProfileQuery(undefined, {
        skip: !shouldFetchProfile,
    });

    useEffect(() => {
        if (data && !isLoading && !isError) {
            const { accessToken, refreshToken } = authUtils.getTokens();
            
            dispatch(setAuth({
                user: data.data,
                accessToken,
                refreshToken,
            }));
        }
        
        if (isError) {
            // Don't clear tokens here - baseQueryWithReauth already handles 401s and token refresh
            dispatch(setLoading(false));
        }
    }, [data, isLoading, isError, dispatch]);

    return { isLoading };
};

