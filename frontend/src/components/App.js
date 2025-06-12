// --- THƯ VIỆN REACT & ROUTER ---
import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';

// --- THƯ VIỆN GIAO DIỆN ---
import { Spin } from 'antd';

// --- AUTHENTICATION & CONTEXT ---
import PrivateRoute from "./PrivateRoutes";
export const AuthContext = createContext(null);

// --- CÁC THÀNH PHẦN LAYOUT CHÍNH ---
import DashboardLayout from "./DashboardLayout";

// --- CÁC TRANG CÔNG KHAI (PUBLIC PAGES) ---
import HomePage from "./HomePage";
import Intro from "./Intro";
import LoginPage from "./LoginPage";
import Services from "./Services";
import UnAuthorized from "./UnAuthorized";

// --- CÁC TRANG TRONG DASHBOARD (DASHBOARD PAGES) ---
import AccountsPage from "./AccountsPage";
import AppointmentsPage from "./AppointmentsPage";
import DashboardHomepage from "./DashboardHomepage";
import RolesPage from "./RolesPage";


// --- AUTH PROVIDER COMPONENT ---
const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    const fetchCurrentUser = async () => {
        setLoadingAuth(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
            setCurrentUser(null);
            setLoadingAuth(false);
            return;
        }
        try {
            const response = await fetch('api/auth/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data);
            } else {
                setCurrentUser(null);
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            setCurrentUser(null);
            localStorage.removeItem('authToken');
        } finally {
            setLoadingAuth(false);
        }
    };

    const login = async (credentials) => {
        setLoadingAuth(true);
        try {
            const response = await fetch('/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('authToken', data.access);
                await fetchCurrentUser();
                return true;
            }
            return false;
        } catch (error) {
            return false;
        } finally {
            setLoadingAuth(false);
        }
    };

    const logout = async () => {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const authContextValue = { currentUser, loadingAuth, login, logout, fetchCurrentUser };

    if (loadingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// --- REQUIRE AUTH COMPONENT ---
const RequireAuth = ({ children }) => {
    const { currentUser, loadingAuth } = useContext(AuthContext);
    const location = useLocation();

    if (loadingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin tip="Đang xác thực..." size="large" />
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};


// --- APP COMPONENT ---
export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Các route công khai */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/intro" element={<Intro />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnAuthorized />} />

                    {/* Route chính cho Dashboard, được bảo vệ bởi RequireAuth */}
                    <Route
                        path="/dashboard"
                        element={
                            <RequireAuth>
                                <DashboardLayout />
                            </RequireAuth>
                        }
                    >
                        {/* Trang chủ mặc định của dashboard */}
                        <Route index element={<DashboardHomepage />} />

                        {/* Các route con được bảo vệ bởi PrivateRoute với permission cụ thể */}
                        <Route element={<PrivateRoute requiredPermission="auth.view_group" />}>
                            <Route path="roles-permissions" element={<RolesPage />} />
                        </Route>

                        <Route element={<PrivateRoute requiredPermission="auth.view_user" />}>
                            <Route path="accounts" element={<AccountsPage />} />
                        </Route>
                        
                        <Route element={<PrivateRoute requiredPermission="patients.manage_patient_waiting_list" />}>
                            <Route path="appointments" element={<AppointmentsPage />} />
                        </Route>

                        {/* Thêm các route con khác ở đây */}
                        {/* ... */}
                        
                        {/* Route 404 cho các đường dẫn không khớp bên trong /dashboard */}
                        <Route path="*" element={<h2>404 - Trang không tồn tại</h2>} />
                    </Route>

                    {/* Route 404 ở cấp cao nhất, redirect về trang chủ */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}