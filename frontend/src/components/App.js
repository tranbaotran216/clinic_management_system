import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, Link } from 'react-router-dom';
import { ConfigProvider, theme, Spin, Typography, message, Button } from 'antd';
import PrivateRoute from "./PrivateRoutes";
import DashboardLayout from "./DashboardLayout";

// --- Import các trang ---
import LoginPage from "./LoginPage";
import UnAuthorized from "./UnAuthorized";
import RegisterAppointmentPage from "./RegisterAppointmentPage";
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
export const ThemeContext = createContext({
    currentTheme: 'light',
    toggleTheme: () => {},
});

const { Title } = Typography;

// --- Auth Provider Component (Không thay đổi) ---
const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const fetchCurrentUser = async () => { const token = localStorage.getItem('authToken'); if (!token) { setCurrentUser(null); setLoadingAuth(false); return; } try { setLoadingAuth(true); const response = await fetch('/api/auth/me/', { headers: { 'Authorization': `Bearer ${token}` } }); if (response.ok) { const data = await response.json(); setCurrentUser(data); } else { localStorage.removeItem('authToken'); setCurrentUser(null); } } catch (error) { console.error("Lỗi khi fetch user:", error); localStorage.removeItem('authToken'); setCurrentUser(null); } finally { setLoadingAuth(false); } };
    const login = async (credentials) => { try { const response = await fetch('/api/auth/login/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) }); if (response.ok) { const data = await response.json(); localStorage.setItem('authToken', data.access); await fetchCurrentUser(); return { success: true }; } const errorData = await response.json().catch(() => ({})); return { success: false, message: errorData.detail || "Tên đăng nhập hoặc mật khẩu không đúng." }; } catch (error) { console.error("Lỗi đăng nhập:", error); return { success: false, message: "Lỗi kết nối đến máy chủ." }; } };
    const logout = () => { localStorage.removeItem('authToken'); setCurrentUser(null); window.location.href = '/'; };
    useEffect(() => { fetchCurrentUser(); }, []);
    if (loadingAuth) { return ( <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}> <Spin size="large" tip="Đang tải ứng dụng..." /> </div> ); }
    const authContextValue = { currentUser, loadingAuth, login, logout, fetchCurrentUser };
    return (<AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>);
};

// --- Require Auth Component (Không thay đổi) ---
const RequireAuth = ({ children }) => {
    const { currentUser, loadingAuth } = useContext(AuthContext);
    const location = useLocation();
    if (loadingAuth) { return ( <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}> <Spin tip="Đang xác thực..." size="large" /> </div> ); }
    if (!currentUser) { return <Navigate to="/login" state={{ from: location }} replace />; }
    return children;
};


// --- APP COMPONENT ---
export default function App() {
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'light');
    
    const toggleTheme = () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setCurrentTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const themeContextValue = { currentTheme, toggleTheme };
    
    // ================== SỬA LỖI GIAO DIỆN TẠI ĐÂY ==================
    // Cung cấp một bộ màu chi tiết hơn cho cả hai chế độ
    const antdTheme = {
        algorithm: currentTheme === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
        
        // Cấu hình các màu sắc cơ bản (tokens)
        token: {
            // Màu chính cho các nút, link, ...
            colorPrimary: '#1677ff',
            // Nền của toàn bộ layout (vùng xám mờ bên ngoài)
            colorBgLayout: currentTheme === 'light' ? '#f0f2f5' : '#1e1e1e',
            // Nền của các component container như Card, Table, Modal
            colorBgContainer: currentTheme === 'light' ? '#ffffff' : '#2a2a2a',
            // Màu viền
            colorBorderSecondary: currentTheme === 'light' ? '#f0f0f0' : '#424242',
            // Màu chữ chính
            colorText: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.88)' : 'rgba(255, 255, 255, 0.85)',
            // Màu chữ phụ (mô tả, placeholder)
            colorTextSecondary: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)',
        },

        // Cấu hình riêng cho từng component để tinh chỉnh sâu hơn
        components: {
            Sider: { // Tinh chỉnh cho thanh Sider bên trái
                colorBgSider: currentTheme === 'light' ? '#fff' : '#001529', // Màu nền Sider (xanh đậm cổ điển)
            },
            Menu: { // Tinh chỉnh cho Menu bên trong Sider
                colorItemBg: 'transparent',
                colorSubMenuBg: 'transparent',
                colorItemText: currentTheme === 'light' ? 'rgba(0, 0, 0, 0.88)' : 'rgba(255, 255, 255, 0.75)',
                colorItemTextHover: currentTheme === 'light' ? '#1677ff' : '#ffffff',
                colorItemTextSelected: currentTheme === 'light' ? '#1677ff' : '#ffffff',
                colorItemBgSelected: currentTheme === 'light' ? '#e6f4ff' : '#1677ff',
            },
            Card: { // Tinh chỉnh cho Card
                 colorBgContainer: currentTheme === 'light' ? '#ffffff' : '#2a2a2a',
            }
        },
    };

    return (
        <ThemeContext.Provider value={themeContextValue}>
            <ConfigProvider theme={antdTheme}>
                <AuthProvider>
                    <BrowserRouter basename="/app">
                        <Routes>
                            {/* --- Các Route không thay đổi --- */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register-appointment" element={<RegisterAppointmentPage />} />
                            <Route path="/unauthorized" element={<UnAuthorized />} />

                            <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                                <Route index element={<DashboardHomepage />} />
                                <Route path="profile" element={<ProfilePage />} />
                                <Route element={<PrivateRoute requiredPermissions={["accounts.view_taikhoan", "auth.view_group"]} />}>
                                    <Route path="accounts" element={<AccountsPage />} />
                                </Route>
                                <Route element={<PrivateRoute requiredPermissions={["accounts.view_dskham", "accounts.view_pkb"]} />}>
                                    <Route path="medical-records" element={<ExaminationManagementPage />} />
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
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </ConfigProvider>
        </ThemeContext.Provider>
    );
}