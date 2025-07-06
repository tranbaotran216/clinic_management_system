// frontend/src/components/AccountsPage.js
import React from 'react';
import { Typography } from 'antd'; // Ví dụ dùng AntD

const { Title } = Typography;

const AccountsPage = () => {
    return (
        <div>
            <Title level={3}>DS Khám</Title>
            <p>Nội dung DS Khám sẽ được hiển thị ở đây.</p>
            {/* Thêm Table, Form, Modal của AntD để quản lý user */}
        </div>
    );
};

export default AccountsPage;