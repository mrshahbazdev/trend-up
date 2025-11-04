import Chat from "@/pages/Chat/Chat";
import Home from "@/pages/Home/Home";
// import GoLiveView from "@/pages/Live/Live";
// import LiveStreamView from "@/pages/Live/LiveStream";
import LiveAppWrapper from "@/pages/Live/LivePages"; 
import EditProfilePage from "@/pages/profile/Edit/EditProfile";
import Profile from "@/pages/profile/UserProfile";
import Vote from "@/pages/Vote/Vote";
import Social from "@/pages/Social/Social";
import NotificationCenter from "@/pages/Notifications/NotificationCenter";
import OtherUserProfile from "@/pages/User/OtherUserProfile";
import UserSearch from "@/components/User/UserSearch";
import KarmaDashboard from "@/pages/Karma/KarmaDashboard";
import { Route, Routes } from "react-router-dom";

const SecureRoutes = () => {
    return (
        <Routes>
            <Route element={<Home />} path="/home/*" />
            <Route element={<Social />} path="/social/*" />
            <Route element={<Vote />} path="/vote" />
            <Route element={<Chat />} path="/chat" />
            <Route element={<LiveAppWrapper />} path="/live/*" />
            {/* <Route element={<LiveStreamView />} path="/live/stream" /> */}
            <Route element={<Profile />} path="/user/profile" />
            <Route element={<EditProfilePage />} path="/user/edit-profile" />
            <Route element={<UserSearch />} path="/users/search" />
            <Route element={<OtherUserProfile />} path="/user/:userId" />
            <Route element={<NotificationCenter />} path="/notifications" />
            <Route element={<KarmaDashboard />} path="/karma" />
        </Routes>
    );
};

export default SecureRoutes;
