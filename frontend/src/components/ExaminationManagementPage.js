// frontend/src/components/ExaminationManagementPage.js

import React from 'react';
import { Tabs, Typography } from 'antd';

// Import các component con sẽ là nội dung của mỗi tab
import WaitingListPage from './WaitingListPage';
import MedicalRecordListPage from './MedicalRecordListPage';

const { Title } = Typography;

const ExaminationManagementPage = () => {
    // Định nghĩa nội dung cho từng tab
    const items = [
        {
            key: '1',
            label: `Danh sách Khám`,
            children: <WaitingListPage />, // Tab 1 sẽ hiển thị component này
        },
        {
            key: '2',
            label: `Danh sách Phiếu Khám Bệnh`,
            children: <MedicalRecordListPage />, // Tab 2 sẽ hiển thị component này
        },
    ];

    return (
        <div style={{ padding: '0 24px' }}>
            <Title level={3} style={{ marginBottom: 24 }}>Quản lý khám bệnh</Title>
            <Tabs defaultActiveKey="1" items={items} type="card" />
        </div>
    );
};

export default ExaminationManagementPage;