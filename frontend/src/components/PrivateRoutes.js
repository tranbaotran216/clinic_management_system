// frontend/src/components/PrivateRoutes.js
import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from './App'; // Hoặc nơi bạn định nghĩa AuthContext

const PrivateRoute = ({ requiredPermission }) => {
    const { currentUser, loadingAuth } = useContext(AuthContext);
    // const location = useLocation(); // Không cần nếu RequireAuth đã xử lý

    if (loadingAuth) {
        return <div>Đang kiểm tra quyền truy cập...</div>;
    }

    // RequireAuth đã đảm bảo currentUser tồn tại
    if (!currentUser) {
        // Dòng này không nên được thực thi nếu RequireAuth hoạt động đúng
        return <Navigate to="/login" replace />;
    }

    // currentUser.permissions là mảng các chuỗi permission
    const hasPermission = currentUser.permissions && currentUser.permissions.includes(requiredPermission);

    if (!hasPermission) {
        console.warn(`User ${currentUser.ten_dang_nhap || currentUser.username} không có quyền: ${requiredPermission}`);
        // Chuyển hướng đến trang "unauthorized"
        return <Navigate to="/unauthorized" state={{ missingPermission: requiredPermission }} replace />;
    }

    return <Outlet />; // Render component trang con nếu có quyền
};

export default PrivateRoute;