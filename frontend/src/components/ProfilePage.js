// src/pages/ProfilePage.js

import React, { useContext, useState } from 'react'; 
import { Card, Descriptions, Avatar, Typography, Tag, Button, Modal, Form, Input, message, Space } from 'antd';
import { UserOutlined, LockOutlined, EditOutlined } from '@ant-design/icons';
import { AuthContext } from './App.js';

const { Title } = Typography;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const ProfilePage = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const showModal = () => setIsModalVisible(true);
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const onFinishChangePassword = async (values) => {
    setLoading(true);
    try {
        const response = await fetch('/api/auth/change-password/', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                current_password: values.current_password,
                new_password: values.new_password,
                confirm_password: values.confirm_password,
            }),
        });

        if (response.ok) {
            const data = await response.json(); 
            message.success(data.detail || 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
            setIsModalVisible(false);
            form.resetFields();
            
            setTimeout(() => {
                logout();
            }, 1500);

        } else {

            const errorData = await response.json();
            const errorMessage = errorData.detail || Object.values(errorData).flat().join(' ');
            throw new Error(errorMessage);
        }

    } catch (error) {
        message.error(error.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
        setLoading(false);
    }
};

    if (!currentUser) return null;

    return (
        <>
            <Card
                title={<Title level={4}>Thông tin tài khoản</Title>}
                extra={
                    <Button type="primary" icon={<EditOutlined />} onClick={showModal}>
                        Đổi mật khẩu
                    </Button>
                }
            >
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
                            : 'Không có'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Modal
                title="Đổi mật khẩu"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinishChangePassword}
                    style={{ marginTop: 24 }}
                >
                    <Form.Item name="current_password" label="Mật khẩu hiện tại" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu hiện tại" />
                    </Form.Item>
                    <Form.Item name="new_password" label="Mật khẩu mới" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }, { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' }]} hasFeedback>
                        <Input.Password prefix={<LockOutlined />} placeholder="Ít nhất 8 ký tự" />
                    </Form.Item>
                    <Form.Item name="confirm_password" label="Xác nhận mật khẩu mới" dependencies={['new_password']} hasFeedback rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu mới!' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('new_password') === value) { return Promise.resolve(); } return Promise.reject(new Error('Mật khẩu xác nhận không khớp!')); }, })]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleCancel}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={loading}>Lưu thay đổi</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default ProfilePage;