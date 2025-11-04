import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    setAuth, 
    logout as logoutAction, 
    setLoading, 
    setError 
} from '@/store/slices/userSlices';
import {
    useLoginMutation,
    useRegisterMutation,
    useRefreshTokenMutation,
    useVerifyWalletMutation,
} from '@/api/slices/authApi';
import { authUtils } from '@/utils/auth';

export const useAuth = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading, error, accessToken, refreshToken } = useSelector(
        (state) => state.user
    );

    const [loginMutation] = useLoginMutation();
    const [registerMutation] = useRegisterMutation();
    const [refreshTokenMutation] = useRefreshTokenMutation();
    const [verifyWalletMutation] = useVerifyWalletMutation();

    const login = async (credentials) => {
        try {
            dispatch(setLoading(true));
            const result = await loginMutation(credentials).unwrap();
            
            dispatch(setAuth({
                user: result.data.user,
                accessToken: result.data.accessToken,
                refreshToken: result.data.refreshToken,
            }));
            
            navigate('/home');
            return result;
        } catch (err) {
            dispatch(setError(err.data?.message || 'Login failed'));
            throw err;
        }
    };

    const register = async (data) => {
        try {
            dispatch(setLoading(true));
            const result = await registerMutation(data).unwrap();
            
            dispatch(setAuth({
                user: result.data.user,
                accessToken: result.data.accessToken,
                refreshToken: result.data.refreshToken,
            }));
            
            navigate('/home');
            return result;
        } catch (err) {
            dispatch(setError(err.data?.message || 'Registration failed'));
            throw err;
        }
    };

    const loginWithWallet = async (walletAddress, signature, nonce) => {
        try {
            dispatch(setLoading(true));
            const result = await verifyWalletMutation({
                walletAddress,
                signature,
                nonce
            }).unwrap();
            
            dispatch(setAuth({
                user: result.data.user,
                accessToken: result.data.accessToken,
                refreshToken: result.data.refreshToken,
            }));
            
            navigate('/home');
            return result;
        } catch (err) {
            dispatch(setError(err.data?.message || 'Wallet login failed'));
            throw err;
        }
    };

    const logout = () => {
        dispatch(logoutAction());
        navigate('/login');
    };

    const refreshAccessToken = async () => {
        try {
            const result = await refreshTokenMutation({ 
                refreshToken 
            }).unwrap();
            
            authUtils.setTokens(result.data.accessToken, refreshToken);
            return result.data.accessToken;
        } catch (err) {
            logout();
            throw err;
        }
    };

    return {
        user,
        isAuthenticated,
        loading,
        error,
        accessToken,
        refreshToken,
        login,
        register,
        loginWithWallet,
        logout,
        refreshAccessToken,
    };
};

