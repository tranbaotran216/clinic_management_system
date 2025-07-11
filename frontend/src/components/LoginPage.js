// src/pages/LoginPage.js

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Modal,
  message,
} from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, MailOutlined } from '@ant-design/icons';
import { AuthContext } from './App';

const { Title, Text } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotPasswordForm] = Form.useForm();
  const [forgotLoading, setForgotLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    // Hàm login trong AuthContext đã dùng fetch, nên giữ nguyên
    const result = await login({
      ten_dang_nhap: values.tenDangNhap,
      password: values.password,
    });

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
    }
    setLoading(false);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Validation Failed:', errorInfo);
  };

  const showForgotModal = () => {
    setIsForgotModalVisible(true);
  };

  const handleForgotCancel = () => {
    setIsForgotModalVisible(false);
  };

  // ================== SỬA LẠI HÀM NÀY ĐỂ DÙNG FETCH ==================
  const handleForgotOk = async () => {
    try {
      setForgotLoading(true);
      const values = await forgotPasswordForm.validateFields();
      
      const response = await fetch('/api/auth/password-reset/request/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email }),
      });

      const data = await response.json();

      if (response.ok) {
        message.success(data.detail);
        setIsForgotModalVisible(false);
        forgotPasswordForm.resetFields();
      } else {
        throw new Error(data.detail || 'Có lỗi xảy ra.');
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setForgotLoading(false);
    }
  };
  // ===================================================================

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #e3f2fd, #fff)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
        }}
      >
        <Card
          style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 12,
            boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <LoginOutlined style={{ fontSize: 32, color: '#1890ff' }} />
            <Title level={3} style={{ marginTop: 16 }}>
              Đăng nhập hệ thống
            </Title>
            <Text type="secondary">Vui lòng nhập thông tin để tiếp tục</Text>
          </div>

          <Form
            name="login_form"
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            {error && (
              <Form.Item>
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setError('')}
                />
              </Form.Item>
            )}

            <Form.Item
              label="Tên đăng nhập"
              name="tenDangNhap"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Nhập tên đăng nhập"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
                size="large"
              />
            </Form.Item>
            
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <Link onClick={showForgotModal}>Quên mật khẩu?</Link>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                style={{ width: '100%' }}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Text type="secondary">
              Chưa có tài khoản? Hãy liên hệ quản trị viên để được cấp quyền.
            </Text>
          </div>
        </Card>
      </div>

      <Modal
        title="Đặt lại mật khẩu"
        open={isForgotModalVisible}
        onOk={handleForgotOk}
        onCancel={handleForgotCancel}
        confirmLoading={forgotLoading}
        okText="Gửi yêu cầu"
        cancelText="Hủy"
      >
        <p>Vui lòng nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu.</p>
        <Form form={forgotPasswordForm} layout="vertical" style={{marginTop: "16px"}}>
            <Form.Item
                name="email"
                rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Địa chỉ email không hợp lệ!' }
                ]}
            >
                <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" />
            </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LoginPage;