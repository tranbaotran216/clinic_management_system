// frontend/src/components/App.js

import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, Link } from 'react-router-dom';
import { Spin, Typography, message, Button } from 'antd';
import PrivateRoute from "./PrivateRoutes";
import DashboardLayout from "./DashboardLayout";

// --- APP PAGES (Các trang do React quản lý) ---
import LoginPage from "./LoginPage";
import UnAuthorized from "./UnAuthorized";
import RegisterAppointmentPage from "./RegisterAppointmentPage";

// --- DASHBOARD PAGES ---
import AccountsPage from "./AccountsPage";
import DashboardHomepage from "./DashboardHomePage";
import ExaminationManagementPage from "./ExaminationManagementPage";
import MedicationSearchPage from "./MedicationSearchPage";
import RegulationPage from "./RegulationPage";
import DiseasesPage from "./Regulations/DiseasesPage";
import UnitsPage from "./Regulations/UnitsPage";
import UsagesPage from "./Regulations/UsagesPage";
import MedicinePage from "./Regulations/MedicinePage";
import ReportsPage from './ReportsPage';
import ProfilePage from "./ProfilePage";

export const AuthContext = createContext(null);
const { Title } = Typography;

// --- AUTH PROVIDER COMPONENT ---
const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setCurrentUser(null);
            setLoadingAuth(false);
            return;
        }
        try {
            setLoadingAuth(true);
            const response = await fetch('/api/auth/me/', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data);
            } else {
                localStorage.removeItem('authToken');
                setCurrentUser(null);
            }
        } catch (error) {
            console.error("Lỗi khi fetch user:", error);
            localStorage.removeItem('authToken');
            setCurrentUser(null);
        } finally {
            setLoadingAuth(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('authToken', data.access);
                await fetchCurrentUser();
                return { success: true };
            }
            const errorData = await response.json().catch(() => ({}));
            return { success: false, message: errorData.detail || "Tên đăng nhập hoặc mật khẩu không đúng." };
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            return { success: false, message: "Lỗi kết nối đến máy chủ." };
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        // Chuyển hướng về trang chủ của Django
        window.location.href = '/'; 
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    if (loadingAuth) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Đang tải ứng dụng..." />
            </div>
        );
    }

    const authContextValue = { currentUser, loadingAuth, login, logout, fetchCurrentUser };
    return (<AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>);
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
            <BrowserRouter basename="/app">
                <Routes>
                    {/* ===== CÁC ROUTE DO REACT QUẢN LÝ ===== */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register-appointment" element={<RegisterAppointmentPage />} />
                    <Route path="/unauthorized" element={<UnAuthorized />} />

                    {/* ===== DASHBOARD ROUTES (ĐƯỢC BẢO VỆ) ===== */}
                    <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                        <Route index element={<DashboardHomepage />} />
                        <Route path="profile" element={<ProfilePage />} />

                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_taikhoan", "auth.view_group"]} />}>
                            <Route path="accounts" element={<AccountsPage />} />
                        </Route>

                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_dskham", "accounts.view_pkb"]} />}>
                            <Route path="medical-records/*" element={<ExaminationManagementPage />} />
                        </Route>
                        
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_thuoc"]} />}>
                            <Route path="medications/search" element={<MedicationSearchPage />} />
                        </Route>
                        
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_hoadon"]} />}>
                            <Route path="reports" element={<ReportsPage />} />
                        </Route>

                        <Route 
                            path="regulations"
                            element={ <PrivateRoute requiredPermissions={["accounts.change_quydinhvalue", "accounts.view_loaibenh", "accounts.view_donvitinh", "accounts.view_cachdung", "accounts.view_thuoc" ]} /> }
                        >
                            <Route index element={<RegulationPage />} />
                            <Route path="medicines" element={<MedicinePage />} /> 
                            <Route path="diseases" element={<DiseasesPage />} />
                            <Route path="units" element={<UnitsPage />} />
                            <Route path="usages" element={<UsagesPage />} />
                        </Route>
                        
                        <Route path="*" element={
                            <div style={{padding: 24, textAlign: 'center'}}>
                                <Title level={2}>404 - Không tìm thấy trang</Title>
                                <p>Trang bạn đang tìm kiếm không tồn tại trong khu vực quản lý.</p>
                                <Link to="/dashboard">
                                    <Button type="primary">Quay lại Trang chủ Dashboard</Button>
                                </Link>
                            </div>
                        } />
                    </Route>

                    {/* Bắt tất cả các URL không hợp lệ trong /app và chuyển hướng về trang login */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}