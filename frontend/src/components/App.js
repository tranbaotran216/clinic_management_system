// frontend/src/App.js

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
// ... các component trang khác

// --- AUTH PROVIDER COMPONENT (GIỮ NGUYÊN) ---
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
            const response = await fetch('/api/auth/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
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
            console.error("Lỗi đăng nhập:", error);
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

    const authContextValue = { currentUser, loadingAuth, login, logout, fetchCurrentUser };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// --- REQUIRE AUTH COMPONENT (GIỮ NGUYÊN) ---
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


// --- APP COMPONENT (ĐÃ CẤU TRÚC LẠI ROUTE TÀI KHOẢN) ---
export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* ===== CÁC ROUTE CÔNG KHAI ===== */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/intro" element={<Intro />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnAuthorized />} />

                    {/* ===== ROUTE CHÍNH CHO DASHBOARD, ĐƯỢC BẢO VỆ ===== */}
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

                        {/* --- CÁC ROUTE CON ĐƯỢC BẢO VỆ BỞI PERMISSION CỤ THỂ --- */}
                        
                        {/* =================================================================== */}
                        {/* 1. Quản lý Tài khoản & Vai trò (nhóm chung) */}
                        {/* PrivateRoute này sẽ kiểm tra quyền xem tài khoản, nếu có quyền này */}
                        {/* thì mới cho vào các route con bên trong. */}
                        {/* =================================================================== */}
                        <Route element={<PrivateRoute requiredPermission="accounts.view_taikhoan" />}>
                            {/* Route để xem trang quản lý tài khoản */}
                            <Route path="accounts" element={<AccountsPage />} />
                            
                            {/* Route để xem trang quản lý vai trò. Vẫn nằm trong đây */}
                            {/* vì nếu user có quyền xem tài khoản, họ cũng nên thấy mục này. */}
                            {/* Logic hiển thị menu vẫn do DashboardLayout quyết định. */}
                        </Route>

                        {/* 2. Quản lý danh sách khám */}
                        <Route element={<PrivateRoute requiredPermission="accounts.view_dskham" />}>
                            <Route path="appointments" element={<AppointmentsPage />} />
                        </Route>

                        {/* 3. Quản lý phiếu khám bệnh */}
                        <Route element={<PrivateRoute requiredPermission="accounts.view_pkb" />}>
                            <Route path="medical-records" element={<h2>Trang Quản lý Phiếu khám bệnh</h2>} />
                        </Route>

                        {/* 4. Quản lý Thuốc (các route con) */}
                        <Route element={<PrivateRoute requiredPermission="accounts.view_thuoc" />}>
                            <Route path="medications/inventory" element={<h2>Trang Quản lý Kho thuốc</h2>} />
                            <Route path="medications/search" element={<h2>Trang Tra cứu thuốc</h2>} />
                        </Route>
                        <Route element={<PrivateRoute requiredPermission="accounts.add_chitietpkb" />}>
                            <Route path="medications/usage" element={<h2>Trang Kê đơn thuốc</h2>} />
                        </Route>

                        {/* 5. Xem hóa đơn */}
                        <Route element={<PrivateRoute requiredPermission="accounts.view_hoadon" />}>
                            <Route path="billing" element={<h2>Trang Xem hóa đơn</h2>} />
                        </Route>

                        {/* 6. Báo cáo & Thống kê */}
                        <Route element={<PrivateRoute requiredPermission="accounts.view_hoadon" />}>
                             <Route path="reports" element={<h2>Trang Báo cáo & Thống kê</h2>} />
                        </Route>

                        {/* 7. Quản lý Danh mục (các route con) */}
                         <Route element={<PrivateRoute requiredPermission="accounts.view_loaibenh" />}>
                            <Route path="regulations/diseases" element={<h2>Trang Quản lý Loại Bệnh</h2>} />
                        </Route>
                         <Route element={<PrivateRoute requiredPermission="accounts.view_donvitinh" />}>
                            <Route path="regulations/units" element={<h2>Trang Quản lý Đơn Vị Tính</h2>} />
                        </Route>
                         <Route element={<PrivateRoute requiredPermission="accounts.view_cachdung" />}>
                            <Route path="regulations/usages" element={<h2>Trang Quản lý Cách Dùng</h2>} />
                        </Route>

                        {/* Route 404 cho các đường dẫn không khớp BÊN TRONG /dashboard */}
                        <Route path="*" element={<h2>404 - Trang bạn tìm không tồn tại trong khu vực quản lý.</h2>} />
                    </Route>

                    {/* Route 404 ở CẤP CAO NHẤT, redirect về trang chủ */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}