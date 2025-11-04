export const authUtils = {
    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
    },

    getTokens: () => {
        return {
            accessToken: localStorage.getItem("accessToken"),
            refreshToken: localStorage.getItem("refreshToken"),
        };
    },

    clearTokens: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    },

    isAuthenticated: () => {
        const { accessToken } = authUtils.getTokens();
        return !!accessToken;
    },

    decodeToken: (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    },

    isTokenExpired: (token) => {
        if (!token) return true;
        
        const decoded = authUtils.decodeToken(token);
        if (!decoded || !decoded.exp) return true;

        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    },

    isAccessTokenExpired: () => {
        const { accessToken } = authUtils.getTokens();
        return authUtils.isTokenExpired(accessToken);
    },

    getUserFromToken: () => {
        const { accessToken } = authUtils.getTokens();
        if (!accessToken) return null;
        
        const decoded = authUtils.decodeToken(accessToken);
        return decoded ? {
            userId: decoded.userId,
            email: decoded.email
        } : null;
    },
};

