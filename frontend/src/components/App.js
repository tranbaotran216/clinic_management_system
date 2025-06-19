// frontend/src/components/App.js (Đã thêm route Báo cáo)

// --- THƯ VIỆN REACT & ROUTER ---
import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';

// --- THƯ VIỆN GIAO DIỆN ---
import { Spin, Typography } from 'antd';
import { Link } from 'react-router-dom';

// --- CORE COMPONENTS ---
import PrivateRoute from "./PrivateRoutes";
import DashboardLayout from "./DashboardLayout";
export const AuthContext = createContext(null);

// --- PUBLIC PAGES ---
import HomePage from "./HomePage";
import Intro from "./Intro";
import LoginPage from "./LoginPage";
import Services from "./Services";
import UnAuthorized from "./UnAuthorized";

// --- DASHBOARD PAGES ---
import AccountsPage from "./AccountsPage";
import DashboardHomepage from "./DashboardHomepage";
import ExaminationManagementPage from "./ExaminationManagementPage";
import MedicationSearchPage from "./MedicationSearchPage";
import RegulationPage from "./RegulationPage";
import DiseasesPage from "./Regulations/DiseasesPage";
import UnitsPage from "./Regulations/UnitsPage";
import UsagesPage from "./Regulations/UsagesPage";
import MedicinePage from "./Regulations/MedicinePage";
import ReportsPage from './ReportsPage'; // ✅ BƯỚC 1: IMPORT COMPONENT MỚI

const { Title } = Typography;

// --- AUTH PROVIDER COMPONENT (Giữ nguyên) ---
const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    const fetchCurrentUser = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setCurrentUser(null); setLoadingAuth(false); return;
        }
        try {
            setLoadingAuth(true); 
            const response = await fetch('/api/auth/me/', { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) {
                const data = await response.json(); setCurrentUser(data);
            } else {
                localStorage.removeItem('authToken'); setCurrentUser(null);
            }
        } catch (error) {
            console.error("Lỗi khi fetch user:", error);
            localStorage.removeItem('authToken'); setCurrentUser(null);
        } finally {
            setLoadingAuth(false);
        }
    };

    const login = async (credentials) => {
        try {
            const response = await fetch('/api/login/', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('authToken', data.access);
                await fetchCurrentUser();
                return true;
            }
            const errorData = await response.json().catch(() => ({}));
            // Không set error state ở đây vì nó không tồn tại trong context này
            // message.error(errorData.detail || errorData.error || "Tên đăng nhập hoặc mật khẩu không đúng.");
            return false;
        } catch (error) {
            console.error("Lỗi đăng nhập:", error);
            // message.error("Đã có lỗi xảy ra trong quá trình đăng nhập.");
            return false;
        }
    };

    const logout = async () => {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    if (loadingAuth && !currentUser) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Đang tải ứng dụng..." />
            </div>
        );
    }

    const authContextValue = { currentUser, loadingAuth, login, logout, fetchCurrentUser };
    return (<AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>);
};

// --- REQUIRE AUTH COMPONENT (Giữ nguyên) ---
const RequireAuth = ({ children }) => {
    const { currentUser, loadingAuth } = useContext(AuthContext);
    const location = useLocation();

    if (loadingAuth) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin tip="Đang xác thực..." size="large" /></div>;
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
                    {/* ===== PUBLIC ROUTES ===== */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/intro" element={<Intro />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnAuthorized />} />

                    {/* ===== DASHBOARD ROUTES (PROTECTED) ===== */}
                    <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                        <Route index element={<DashboardHomepage />} />

                        {/* 1. Quản lý Tài khoản & Vai trò */}
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_taikhoan", "auth.view_group"]} />}>
                            <Route path="accounts" element={<AccountsPage />} />
                        </Route>

                        {/* 2. Quản lý Khám bệnh */}
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_dskham", "accounts.view_pkb"]} />}>
                            <Route path="medical-records/*" element={<ExaminationManagementPage />} />
                        </Route>
                        
                        {/* 3. Tra cứu thuốc */}
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_thuoc"]} />}>
                            <Route path="medications/search" element={<MedicationSearchPage />} />
                        </Route>
                        
                        {/* 4. Báo cáo & Thống kê */}
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_hoadon"]} />}>
                            <Route path="reports" element={<ReportsPage />} />
                        </Route>

                        {/* 5. Quản lý Quy định */}
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

                        {/* Các route không dùng đến đã được xóa */}
                        
                        <Route path="*" element={<div style={{padding: 20}}><Title level={2}>404 - Trang không tìm thấy</Title><Link to="/dashboard">Quay lại Trang chủ Dashboard</Link></div>} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}