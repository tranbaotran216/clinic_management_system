// src/pages/RegisterAppointmentPage.js

import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  message,
  Radio,
  DatePicker,
  Space,
  Row,
  Col,
} from 'antd';
import moment from 'moment';

const { Title, Text } = Typography;

export default function RegisterAppointmentPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      ho_ten: values.ho_ten,
      nam_sinh: values.nam_sinh.year(),
      gioi_tinh: values.gioi_tinh,
      dia_chi: values.dia_chi,
      ngay_kham: values.ngay_kham.format('YYYY-MM-DD'),
      trieu_chung: values.trieu_chung || '',
    };

    try {
     
      const response = await fetch('/api/register-appointment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        message.success(
          <span>
            Đăng ký thành công! <br /> Mã lịch khám của bạn là: <strong>{data.ma_lich_kham}</strong>
          </span>,
          10
        );
        form.resetFields();
      } else {
        const errorMessage = data.detail || 
                           (typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Có lỗi xảy ra khi đăng ký.');
        message.error(errorMessage, 5);
      }
    } catch (error) {
      console.error('Lỗi khi gửi form:', error);
      message.error('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  const handleCancel = () => {
    window.location.href = '/'; 
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f2f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 700,
        padding: '32px',
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        background: '#ffffff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
          Đăng ký Khám bệnh
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Vui lòng điền thông tin để đặt lịch hẹn với phòng khám.
        </Text>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
            <Row gutter={16}>
                <Col xs={24} sm={12}>
                    <Form.Item
                        label="Họ và tên"
                        name="ho_ten"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                    <Form.Item
                        label="Năm sinh"
                        name="nam_sinh"
                        rules={[{ required: true, message: 'Vui lòng chọn năm sinh!' }]}
                    >
                        <DatePicker picker="year" style={{ width: '100%' }} placeholder="Chọn năm" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                label="Giới tính"
                name="gioi_tinh"
                rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
            >
                <Radio.Group>
                <Radio value="M">Nam</Radio>
                <Radio value="F">Nữ</Radio>
                </Radio.Group>
            </Form.Item>

            <Form.Item
                label="Địa chỉ"
                name="dia_chi"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
            >
                <Input placeholder="Số nhà, đường, phường/xã, quận/huyện..." />
            </Form.Item>

            <Form.Item
                label="Ngày khám mong muốn"
                name="ngay_kham"
                rules={[{ required: true, message: 'Vui lòng chọn ngày khám!' }]}
            >
                <DatePicker 
                    style={{ width: '100%' }} 
                    format="DD/MM/YYYY" 
                    placeholder="Chọn ngày"
                    disabledDate={(current) => current && current < moment().startOf('day')}
                />
            </Form.Item>

            <Form.Item
                label="Mô tả ngắn gọn triệu chứng (nếu có)"
                name="trieu_chung"
            >
                <Input.TextArea rows={3} placeholder="Ví dụ: ho, sốt, đau đầu trong 3 ngày..." />
            </Form.Item>
            
            <Form.Item>
                <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: '16px' }}>
                    <Button onClick={handleCancel}>
                        Hủy
                    </Button>
                    <Button onClick={handleReset}>
                        Nhập lại
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Xác nhận Đăng ký
                    </Button>
                </Space>
            </Form.Item>
        </Form>
      </div>
    </div>
  );
}