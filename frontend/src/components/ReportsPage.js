// frontend/src/components/ReportsPage.js

import React from 'react';
import { Tabs, Typography } from 'antd';
import RevenueReportTab from './reports/RevenueReportTab';
import MedicationReportTab from './reports/MedicationReportTab';

const { Title } = Typography;

const ReportsPage = () => {
    const items = [
        { key: 'revenue', label: 'Báo cáo Doanh thu', children: <RevenueReportTab /> },
        { key: 'medication', label: 'Báo cáo Sử dụng thuốc', children: <MedicationReportTab /> },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Báo cáo & Thống kê</Title>
            <Tabs defaultActiveKey="revenue" items={items} type="card" />
        </div>
    );
};

export default ReportsPage;