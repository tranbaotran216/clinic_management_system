// frontend/src/components/ExaminationManagementPage.js
import React from 'react';
import { Tabs, Typography } from 'antd';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';

const { Title } = Typography;

const ExaminationManagementPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    let currentTabKey = "waiting-list";
    if (location.pathname.includes("/record-list")) {
        currentTabKey = "record-list";
    }

    const onChange = (key) => {
        navigate(key); // Navigate đến path tương ứng của tab
    };

    const items = [
        {
            key: 'waiting-list', // Sẽ map với path con
            label: `Danh sách Khám`,
        },
        {
            key: 'record-list', // Sẽ map với path con
            label: `Danh sách Phiếu Khám`,
        },
    ];

    return (
        <div>
            {/* Breadcrumb đã được DashboardLayout xử lý */}
            {/* <Title level={4}>Quản lý Khám Bệnh</Title> */}
            <Tabs 
                activeKey={currentTabKey} 
                onChange={(key) => navigate(`/dashboard/medical-records/${key}`)} // Điều hướng khi tab thay đổi
                items={items.map(item => ({key: item.key, label: item.label}))} // Chỉ cần key và label cho Tabs
            />
            <div style={{ marginTop: '16px' }}>
                <Outlet /> {/* Các component con sẽ được render ở đây */}
            </div>
        </div>
    );
};

export default ExaminationManagementPage;