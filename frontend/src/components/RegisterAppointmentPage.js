import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  message,
  Radio,
  DatePicker
} from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function RegisterAppointmentPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const nam_sinh = values.nam_sinh ? values.nam_sinh.year() : null;
      const ngay_kham = values.ngay_kham ? values.ngay_kham.format('YYYY-MM-DD') : null;

      const response = await fetch('/api/register-appointment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ho_ten: values.ho_ten,
          nam_sinh,
          gioi_tinh: values.gioi_tinh,
          dia_chi: values.dia_chi || '',
          ngay_kham,
          trieu_chung: values.trieu_chung || '',
        })
      });

      const data = await response.json();

      if (response.ok) {
        message.success(`Đăng ký thành công! Mã lịch khám: ${data.ma_lich_kham}`);
        form.resetFields();
      } else {
        message.error(data.detail || 'Có lỗi xảy ra khi đăng ký.');
      }
    } catch (error) {
      console.error('Lỗi khi gửi form:', error);
      message.error('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxHeight: '100vh',
      overflowY: 'auto',
      padding: 24,
      background: '#fff'
    }}>
      <div style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: 24,
        border: '1px solid #ddd',
        borderRadius: 8,
        background: '#fafafa'
      }}>
        <Title level={2} style={{ textAlign: 'center' }}>
          Đăng ký khám bệnh
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Họ và tên"
            name="ho_ten"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Năm sinh"
            name="nam_sinh"
            rules={[{ required: true, message: 'Vui lòng chọn năm sinh' }]}
          >
            <DatePicker picker="year" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Giới tính"
            name="gioi_tinh"
            rules={[{ required: true, message: 'Chọn giới tính' }]}
          >
            <Radio.Group>
              <Radio value="M">Nam</Radio>
              <Radio value="F">Nữ</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="dia_chi"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Ngày khám"
            name="ngay_kham"
            rules={[{ required: true, message: 'Vui lòng chọn ngày khám' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Triệu chứng"
            name="trieu_chung"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Đăng ký khám
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
