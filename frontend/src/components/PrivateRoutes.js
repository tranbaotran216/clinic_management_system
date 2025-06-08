import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
    const isAuthenticated = !!localStorage.getItem('access'); // Kiểm tra xem có access token không
    const userRole = localStorage.getItem('userRole');       // Lấy tên vai trò đã lưu khi đăng nhập
    const location = useLocation(); // Lấy vị trí hiện tại

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;