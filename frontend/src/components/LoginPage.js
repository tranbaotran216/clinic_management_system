// src/pages/LoginPage.js

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Alert,
  Modal, // <-- THÊM: Import Modal
  message, // <-- THÊM: Dùng message để thông báo thành công
} from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, MailOutlined } from '@ant-design/icons'; // <-- THÊM: Import MailOutlined
import { AuthContext } from './App'; // <-- Cập nhật đường dẫn nếu cần

const { Title, Text, Link } = Typography; // <-- THÊM: Import Link

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, currentUser } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ================== THÊM: State và form cho Modal ==================
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotPasswordForm] = Form.useForm();
  const [forgotLoading, setForgotLoading] = useState(false);
  // ===================================================================

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const onFinish = async (values) => {
    setError('');
    setLoading(true);
    try {
      // Sửa lại logic gọi hàm login để xử lý thông báo lỗi từ API
      const result = await login({
        ten_dang_nhap: values.tenDangNhap,
        password: values.password,
      });

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi trong quá trình đăng nhập.');
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Validation Failed:', errorInfo);
  };

  // ================== THÊM: Các hàm xử lý cho Modal ==================
  const showForgotModal = () => {
    setIsForgotModalVisible(true);
  };

  const handleForgotOk = async () => {
    try {
        setForgotLoading(true);
        const values = await forgotPasswordForm.validateFields();
        // **TODO:** Bạn cần tự xây dựng API để xử lý việc này
        console.log('Gửi yêu cầu reset cho email:', values.email);
        message.success('Nếu email tồn tại, một liên kết đặt lại mật khẩu đã được gửi.');
        
        setIsForgotModalVisible(false);
        forgotPasswordForm.resetFields();

    } catch (errorInfo) {
        message.error('Vui lòng nhập một địa chỉ email hợp lệ.');
    } finally {
        setForgotLoading(false);
    }
  };

  const handleForgotCancel = () => {
    setIsForgotModalVisible(false);
  };
  // ===================================================================


  return (
    <> {/* Bọc tất cả trong Fragment để thêm Modal */}
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
            
            {/* ================== THÊM: Link Quên mật khẩu ================== */}
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
                <Link onClick={showForgotModal}>Quên mật khẩu?</Link>
            </div>
            {/* =================================================================== */}

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

      {/* ================== THÊM: Modal Quên mật khẩu ================== */}
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
      {/* =================================================================== */}
    </>
  );
};

export default LoginPage;