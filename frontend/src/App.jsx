import AppWrapper from "@/components/AppWrapper/AppWrapper";
import AuthContainer from "@routes/AuthContainer";
import { ToastProvider, useToast } from '@/hooks/useToast.jsx';
import Toastify from '@/components/common/Toastify';
import KarmaGainToast from '@/components/common/KarmaGainToast';
import { SocketProvider } from '@/context/SocketContext';
import { ConfigProvider } from '@/context/GenrelContext';
import { useSelector } from 'react-redux';

// Toast notification wrapper
function ToastNotification() {
    const { toast, hideToast } = useToast();
    return <Toastify toast={toast} onClose={hideToast} />;
}

// Karma notifications wrapper
function KarmaNotifications() {
    const { user } = useSelector((state) => state.user);
    return user ? <KarmaGainToast userId={user._id} /> : null;
}

function App() {
    return (
        <ConfigProvider>
            <ToastProvider>
                <SocketProvider>
                    <AppWrapper>
                        <AuthContainer />
                        <ToastNotification />
                        <KarmaNotifications />
                    </AppWrapper>
                </SocketProvider>
            </ToastProvider>
        </ConfigProvider>
    );
}

export default App;
