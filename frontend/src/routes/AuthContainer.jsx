import Loading from "@/components/common/loading";
import { useSelector } from "react-redux";
import SecureRoutes from "@routes/SecureRoutes/SecureRoutes";
import UnSecureRoutes from "@routes/UnSecureRoutes/UnSecureRoutes";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAutoLogin } from "@/hooks/useAutoLogin";

const AuthContainer = () => {
    const { user, loading, isAuthenticated } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: autoLoginLoading } = useAutoLogin();

    useEffect(() => {
        if (loading || autoLoginLoading) return;
        
        if (isAuthenticated && user) {
            if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
                navigate("/home");
            }
        } else {
            const allowedPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
            if (!allowedPaths.includes(location.pathname)) {
                navigate("/login");
            }
        }
    }, [user, isAuthenticated, loading, autoLoginLoading, navigate, location.pathname]);

    if (loading || autoLoginLoading) return <Loading isLoading={true} />;

    return <div>{isAuthenticated && user ? <SecureRoutes /> : <UnSecureRoutes />}</div>;
};

export default AuthContainer;
