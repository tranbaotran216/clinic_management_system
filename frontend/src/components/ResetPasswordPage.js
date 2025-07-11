// src/pages/ResetPasswordPage.js

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ResetPasswordPage = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/auth/password-reset/confirm/${uid}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    password: values.password,
                    password2: values.password2,
                }),
            });
            
            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
            } else {
                throw new Error(data.detail || 'Đặt lại mật khẩu thất bại.');
            }
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
                <Card style={{ width: 400, textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 24 }} />
                    <Title level={3}>Đặt lại mật khẩu thành công!</Title>
                    <Text>Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.</Text>
                    <Button type="primary" block style={{ marginTop: 24 }} onClick={() => navigate('/login')}>
                        Về trang Đăng nhập
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
            <Card style={{ width: 400 }}>
                <Title level={3} style={{ textAlign: 'center' }}>Đặt lại mật khẩu</Title>
                <Form name="reset_password" onFinish={onFinish} layout="vertical">
                    <Form.Item
                        name="password"
                        label="Mật khẩu mới"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới!' }]}
                        hasFeedback
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
                    </Form.Item>
                    <Form.Item
                        name="password2"
                        label="Xác nhận mật khẩu mới"
                        dependencies={['password']}
                        hasFeedback
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Đặt lại mật khẩu
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default ResetPasswordPage;