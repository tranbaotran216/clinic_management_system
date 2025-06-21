import React, { useContext } from 'react';
import { Card, Descriptions, Avatar, Typography, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { AuthContext } from './App.js';

const { Title } = Typography;

const ProfilePage = () => {
    const { currentUser } = useContext(AuthContext);

    if (!currentUser) return null;

    return (
        <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar size={80} icon={<UserOutlined />} />
                <Title level={4} style={{ marginTop: 16 }}>{currentUser.ho_ten || currentUser.ten_dang_nhap}</Title>
            </div>

            <Descriptions column={1} bordered>
                <Descriptions.Item label="Họ tên">{currentUser.ho_ten}</Descriptions.Item>
                <Descriptions.Item label="Tên đăng nhập">{currentUser.ten_dang_nhap}</Descriptions.Item>
                <Descriptions.Item label="Email">{currentUser.email || '—'}</Descriptions.Item>
                <Descriptions.Item label="Vai trò">
                    {currentUser.groups?.length > 0
                        ? currentUser.groups.map(group => (
                                <Tag color="blue" key={group.id}>{group.name}</Tag>
                            ))
                        : 'Không rõ'}
                </Descriptions.Item>

            </Descriptions>
        </Card>
    );
};

export default ProfilePage;
