// frontend/src/components/PrivateRoutes.js
import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from './App'; // Hoặc nơi bạn định nghĩa AuthContext

const PrivateRoute = ({ requiredPermissions }) => {
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

    // (Tr) chỗ này cần để xử lý cái regulations -> tại nó có nhìu page con + mỗi page 1 quyền riêng
    // (Tr) lấy mấy cái quyền đó
    const userPermissions = currentUser.permissions || [];
    
    console.log('currentUser', currentUser);
    console.log('userPermissions', userPermissions);
    console.log('requiredPermissions', requiredPermissions);

    const hasPermission =
        !requiredPermissions || requiredPermissions.length === 0 ||
        requiredPermissions.some(p => userPermissions.includes(p));


    if (!hasPermission) {
        console.warn(`User ${currentUser.ten_dang_nhap || currentUser.username} không có quyền: ${requiredPermissions}`);
        // Chuyển hướng đến trang "unauthorized"
        return <Navigate to="/unauthorized" state={{ missingPermission: requiredPermissions }} replace />;
    }

    return <Outlet />; // Render component trang con nếu có quyền
};

export default PrivateRoute;