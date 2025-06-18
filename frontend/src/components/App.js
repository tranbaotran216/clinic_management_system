// frontend/src/components/App.js

// --- THƯ VIỆN REACT & ROUTER ---
import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';

// --- THƯ VIỆN GIAO DIỆN ---
import { Spin, Typography, message } from 'antd'; // Thêm Typography, message
import { Link } from 'react-router-dom';

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
import DashboardHomepage from "./DashboardHomepage";
import RegulationPage from "./RegulationPage";
import DiseasesPage from "./Regulations/DiseasesPage";
import UnitsPage from "./Regulations/UnitsPage";
import UsagesPage from "./Regulations/UsagesPage";

// === CÁC COMPONENT MỚI CHO QUẢN LÝ KHÁM BỆNH ===
import ExaminationManagementPage from "./ExaminationManagementPage"; // Trang chính chứa Tabs
import WaitingListPage from "./WaitingListPage";                   // Component cho tab "Danh sách Chờ Khám"
import MedicalRecordListPage from "./MedicalRecordListPage";       // Component cho tab "Danh sách Phiếu Khám"
import MedicalRecordFormPage from "./MedicalRecordFormPage";       // Component cho trang Tạo/Sửa PKB

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
                    {/* ===== CÁC ROUTE CÔNG KHAI ===== */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/intro" element={<Intro />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnAuthorized />} />

                    {/* ===== ROUTE CHÍNH CHO DASHBOARD ===== */}
                    <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                        <Route index element={<DashboardHomepage />} />

                        {/* 1. Quản lý Tài khoản & Vai trò */}
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_taikhoan", "auth.view_group"]} />}>
                            <Route path="accounts" element={<AccountsPage />} />
                        </Route>

                        {/* 2. QUẢN LÝ KHÁM BỆNH - CẤU TRÚC ĐÚNG */}
                        {/* Menu item 'Quản lý khám bệnh' có path là 'medical-records' */}
                        <Route 
                            path="medical-records"
                            element={
                                <PrivateRoute requiredPermissions={["accounts.view_dskham", "accounts.view_pkb"]}>
                                    <ExaminationManagementPage /> {/* Component cha chứa Tabs và Outlet */}
                                </PrivateRoute>
                            }
                        >
                            <Route index element={<Navigate to="waiting-list" replace />} /> 
                            <Route 
                                path="waiting-list" 
                                element={<WaitingListPage />} // Sẽ được render vào Outlet của ExaminationManagementPage
                            />
                            <Route 
                                path="record-list" 
                                element={<MedicalRecordListPage />} // Sẽ được render vào Outlet của ExaminationManagementPage
                            />
                        </Route>

                        {/* Các route này nằm ngoài cấu trúc Tabs của ExaminationManagementPage */}
                        {/* Route để tạo PKB mới */}
                        <Route 
                            path="medical-records/new"
                            element={
                                <PrivateRoute requiredPermissions={["accounts.add_pkb"]}>
                                    <MedicalRecordFormPage mode="create" />
                                </PrivateRoute>
                            } 
                        />
                        {/* Route để sửa PKB */}
                        <Route 
                            path="medical-records/:pkbId/edit"
                            element={
                                <PrivateRoute requiredPermissions={["accounts.change_pkb"]}>
                                    <MedicalRecordFormPage mode="edit" />
                                </PrivateRoute>
                            } 
                        />
                        
                        {/* 3. Tra cứu thuốc */}
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_thuoc"]} />}>
                            <Route path="medications/search" element={<h2>Trang Tra cứu thuốc</h2>} />
                        </Route>

                        {/* Các route khác của bạn (Giữ nguyên) */}
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_hoadon"]} />}>
                            <Route path="billing" element={<h2>Trang Xem hóa đơn</h2>} />
                        </Route>
                        <Route element={<PrivateRoute requiredPermissions={["accounts.view_hoadon"]} />}>
                            <Route path="reports" element={<h2>Trang Báo cáo & Thống kê</h2>} />
                        </Route>
                        <Route 
                            path="regulations"
                            element={
                                <PrivateRoute requiredPermissions={[
                                    "accounts.change_quydinhvalue", "accounts.view_loaibenh", 
                                    "accounts.view_donvitinh", "accounts.view_cachdung", "accounts.view_thuoc" 
                                ]} />
                            }>
                            <Route index element={<RegulationPage />} />
                            <Route path="diseases" element={<DiseasesPage />} />
                            <Route path="units" element={<UnitsPage />} />
                            <Route path="usages" element={<UsagesPage />} />
                        </Route>
                        
                        <Route path="*" element={<div style={{padding: 20}}><Title level={2}>404 - Trang không tìm thấy</Title><Link to="/dashboard">Quay lại Trang chủ Dashboard</Link></div>} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}