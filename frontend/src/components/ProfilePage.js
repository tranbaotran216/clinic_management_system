import React, { useContext, useState } from 'react'; 
import { Card, Descriptions, Avatar, Typography, Tag, Button, Modal, Form, Input, message, Space, Upload, Spin } from 'antd';
import { UserOutlined, LockOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import { AuthContext } from './App.js';

const { Title, Text } = Typography;

const getAuthHeaders = (isFormData = false) => {
    const token = localStorage.getItem('authToken');
    // Khi gửi FormData, không cần 'Content-Type', trình duyệt sẽ tự đặt
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

const ProfilePage = () => {
    const { currentUser, logout, fetchCurrentUser } = useContext(AuthContext);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
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
                setTimeout(logout, 1500);
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

    // --- LOGIC UPLOAD AVATAR MỚI ---
    const handleAvatarUpload = async ({ file }) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            // Sử dụng PATCH để chỉ cập nhật một phần của user
            const response = await fetch(`/api/users/${currentUser.id}/`, {
                method: 'PATCH',
                headers: getAuthHeaders(true), // Báo cho helper biết đây là FormData
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.avatar?.[0] || 'Upload ảnh thất bại.');
            }

            message.success('Cập nhật ảnh đại diện thành công!');
            // Tải lại thông tin người dùng để cập nhật avatar trên toàn bộ ứng dụng
            fetchCurrentUser(); 

        } catch (error) {
            message.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    // Hàm kiểm tra file trước khi upload
    const beforeUpload = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('Bạn chỉ có thể upload file JPG/PNG!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Hình ảnh phải nhỏ hơn 2MB!');
        }
        return isJpgOrPng && isLt2M;
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
                    {/* --- COMPONENT UPLOAD AVATAR --- */}
                    <Upload
                        name="avatar"
                        showUploadList={false}
                        customRequest={handleAvatarUpload}
                        beforeUpload={beforeUpload}
                    >
                        <Spin spinning={uploading}>
                            <Avatar 
                                size={80} 
                                src={currentUser.avatar_url} // Trỏ đến URL avatar từ API
                                icon={!currentUser.avatar_url && <UserOutlined />}
                                style={{ cursor: 'pointer', border: '2px solid #ddd' }}
                            />
                        </Spin>
                    </Upload>
                    <Text type="secondary" style={{display: 'block', fontSize: 12, marginTop: 8}}>Nhấn vào ảnh để thay đổi</Text>
                    {/* --- KẾT THÚC COMPONENT UPLOAD --- */}
                    <Title level={4} style={{ marginTop: 8 }}>{currentUser.ho_ten || currentUser.ten_dang_nhap}</Title>
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