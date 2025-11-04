import Login from "@/pages/Login/Login";
import Register from "@/pages/Register/Register";
import ForgotPassword from "@/pages/ForgotPassword/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword/ResetPassword";
import { Route, Routes } from "react-router-dom";

const UnSecureRoutes = () => {
    return (
        <Routes>
            <Route element={<Login />}  path="/login" />
            <Route element={<Register />}  path="/register" />
            <Route element={<ForgotPassword />}  path="/forgot-password" />
            <Route element={<ResetPassword />}  path="/reset-password" />
        </Routes>
    );
};

export default UnSecureRoutes;
