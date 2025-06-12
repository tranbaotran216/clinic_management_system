// frontend/src/components/App.js
import 'antd/dist/reset.css';
import React, { useContext, createContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

// Các trang công khai
// import HomePage from "./HomePage"; // HomePage cũ, có thể giữ comment hoặc xóa
import HomePageNew from "./HomePageNew"; // Trang chủ mới đã được import
import Intro from "./Intro";
import Services from "./Services";
import LoginPage from "./LoginPage";
import UnAuthorized from "./UnAuthorized";

// Các thành phần của Dashboard
import DashboardLayout from "./DashboardLayout";
import DashboardHomePage from "./DashboardHomePage"; // Đảm bảo tên file khớp: DashboardHomepage.js
import AccountsPage from "./AccountsPage";
import AppointmentsPage from "./AppointmentsPage";

// Component bảo vệ route
import PrivateRoute from "./PrivateRoutes";

export const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true); // Bắt đầu là true

    const fetchCurrentUser = async () => {
        console.log("AuthProvider: fetchCurrentUser - STARTING");
        setLoadingAuth(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log("AuthProvider: fetchCurrentUser - No token");
            setCurrentUser(null);
            setLoadingAuth(false); // QUAN TRỌNG
            return;
        }
        try {
            // Đảm bảo URL này là chính xác và backend của bạn đang chạy
            const response = await fetch('/quan-ly-tai-khoan/auth/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log("AuthProvider: fetchCurrentUser - User data from /auth/me/", data);
                setCurrentUser(data); // data này PHẢI có trường 'permissions'
            } else {
                console.log("AuthProvider: fetchCurrentUser - Failed, status:", response.status);
                setCurrentUser(null);
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error("AuthProvider: fetchCurrentUser - Error:", error);
            setCurrentUser(null);
            localStorage.removeItem('authToken');
        }
        setLoadingAuth(false); // QUAN TRỌNG: Luôn set false ở cuối
        // Dòng log này sẽ hiển thị giá trị cũ của loadingAuth và currentUser vì setState là bất đồng bộ
        // console.log("AuthProvider: fetchCurrentUser - FINISHED, loadingAuth:", loadingAuth, "currentUser:", currentUser ? currentUser.ten_dang_nhap : null);
    };

    const login = async (credentials) => {
        console.log("AuthProvider: login - STARTING");
        setLoadingAuth(true); // Bắt đầu quá trình login
        try {
            // Đảm bảo URL này là chính xác
            const response = await fetch('/quan-ly-tai-khoan/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (response.ok) {
                const data = await response.json();
                console.log("AuthProvider: login - API call OK, token:", data.access);
                localStorage.setItem('authToken', data.access);

                console.log("AuthProvider: login - Calling and AWAITING fetchCurrentUser...");
                await fetchCurrentUser(); 
                console.log("AuthProvider: login - fetchCurrentUser completed.");
                return true;
            }
            const errorData = await response.text();
            console.log("AuthProvider: login - API call FAILED, status:", response.status, "Error data:", errorData);
            setLoadingAuth(false); 
            return false;
        } catch (error) {
            console.error("AuthProvider: login - CATCH block, Error:", error);
            setLoadingAuth(false); 
            return false;
        }
    };

    const logout = async () => {
        console.log("AuthProvider: logout");
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        // Không cần setLoadingAuth(true) ở đây, việc redirect sẽ do component gọi logout xử lý
    };

    useEffect(() => {
        console.log("AuthProvider: Initial useEffect - Calling fetchCurrentUser");
        fetchCurrentUser();
    }, []);

    // Để xem giá trị currentUser và loadingAuth thay đổi chính xác hơn sau khi fetchCurrentUser
    useEffect(() => {
        if (!loadingAuth) {
            console.log("AuthProvider: State updated - loadingAuth:", loadingAuth, "currentUser:", currentUser ? currentUser.ten_dang_nhap : "null");
        }
    }, [loadingAuth, currentUser]);


    return (
        <AuthContext.Provider value={{ currentUser, loadingAuth, login, logout, fetchCurrentUser }}>
            {/* Bạn có thể giữ hoặc bỏ component loading toàn màn hình này tùy ý */}
            {/* {loadingAuth && !currentUser ? <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}><Spin size="large" tip="Đang tải ứng dụng..."/></div> : children} */}
            {children}
        </AuthContext.Provider>
    );
};

// Component RequireAuth (Thêm console.log để debug)
const RequireAuth = ({ children }) => {
    const { currentUser, loadingAuth } = useContext(AuthContext);
    const location = useLocation();

    console.log("RequireAuth Check: loadingAuth =", loadingAuth, ", currentUser =", currentUser ? currentUser.ten_dang_nhap : null, ", path:", location.pathname);

    if (loadingAuth) {
        console.log("RequireAuth: Still loading auth, showing loading indicator.");
        // Cân nhắc hiển thị một spinner hoặc UI loading tốt hơn ở đây
        return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Đang xác thực quyền truy cập...</div>;
    }

    if (!currentUser) {
        console.log("RequireAuth: No currentUser (loadingAuth is false), redirecting to login. Attempted to go to:", location.pathname);
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Dòng log này bây giờ sẽ chính xác hơn vì đã qua bước loadingAuth
    console.log("RequireAuth: currentUser exists and loadingAuth is false. Allowing access. User permissions:", currentUser.permissions);
    return children;
};


export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* THAY ĐỔI Ở ĐÂY: Sử dụng HomePageNew cho route "/" */}
                    <Route path="/" element={<HomePageNew />} /> 
                    
                    <Route path="/services" element={<Services />} />
                    <Route path="/intro" element={<Intro />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<UnAuthorized />} />
                    
                    <Route
                        path="/dashboard"
                        element={
                            <RequireAuth>
                                <DashboardLayout />
                            </RequireAuth>
                        }
                    >
                        {/* 
                          Sử dụng element={<Outlet />} bên trong DashboardLayout để render các route con.
                          Route index nên trỏ đến một component cụ thể, không chỉ là Navigate nếu DashboardHomePage
                          là component bạn muốn hiển thị mặc định cho /dashboard.
                          Nếu DashboardLayout có <Outlet/> thì DashboardHomePage sẽ được render ở đó.
                        */}
                        <Route index element={<DashboardHomePage />} /> 
                        
                        {/* Các Route được bảo vệ bởi PrivateRoute */}
                        <Route element={<PrivateRoute requiredPermission="accounts.manage_accounts" />}>
                            <Route path="accounts" element={<AccountsPage />} />
                        </Route>
                        <Route element={<PrivateRoute requiredPermission="patients.manage_patient_waiting_list" />}>
                            <Route path="appointments" element={<AppointmentsPage />} />
                        </Route>
                        {/* ... các route khác của dashboard ... */}
                        <Route path="*" element={<div>404 - Trang không tồn tại trong Dashboard</div>} />
                    </Route>
                    
                    {/* Route bắt lỗi 404 chung cho toàn ứng dụng, nên đặt ở cuối cùng */}
                    <Route path="*" element={<Navigate to="/" replace />} /> 
                    {/* Hoặc <Route path="*" element={<div>404 - Trang không tìm thấy</div>} /> */}
                </Routes>
            </Router>
        </AuthProvider>
    );
}