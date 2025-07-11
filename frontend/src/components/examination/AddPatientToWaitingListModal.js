// frontend/src/components/examination/AddPatientToWaitingListModal.js
import React from 'react';
import { Modal, Form, Input, DatePicker, Select, InputNumber, Button } from 'antd';
import moment from 'moment';

const { Option } = Select;

const AddPatientToWaitingListModal = ({ visible, onCancel, onFinish }) => {
    const [form] = Form.useForm();

    const handleOk = () => {
        form.validateFields()
            .then(values => {
                // Định dạng lại dữ liệu trước khi gửi đi
                const formattedValues = {
                    ...values,
                    ngay_kham: values.ngay_kham.format('YYYY-MM-DD'),
                };
                onFinish(formattedValues);
                form.resetFields();
            })
            .catch(info => {
                console.log('Validate Failed:', info);
            });
    };
    
    return (
        <Modal
            title="Thêm Bệnh nhân vào Danh sách chờ"
            visible={visible}
            onCancel={onCancel}
            // Sử dụng footer tùy chỉnh để có nút loading nếu cần
            footer={[
                <Button key="back" onClick={onCancel}>
                    Hủy
                </Button>,
                <Button key="submit" type="primary" onClick={handleOk}>
                    Thêm
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                name="add_patient_to_waiting_list_form"
                initialValues={{
                    // Đặt ngày khám mặc định là hôm nay
                    ngay_kham: moment(),
                }}
            >
                <Form.Item
                    name="ho_ten"
                    label="Họ và Tên Bệnh nhân"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên bệnh nhân!' }]}
                >
                    <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
                
                <Form.Item
                    name="nam_sinh"
                    label="Năm sinh"
                    rules={[{ required: true, message: 'Vui lòng nhập năm sinh!' }]}
                >
                    <InputNumber style={{ width: '100%' }} placeholder="1990" min={1900} max={new Date().getFullYear()} />
                </Form.Item>

                <Form.Item
                    name="gioi_tinh"
                    label="Giới tính"
                    rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
                >
                    <Select placeholder="Chọn giới tính">
                        <Option value="Nam">Nam</Option>
                        <Option value="Nữ">Nữ</Option>
                        {/* <Option value="Khác">Khác</Option> */}
                    </Select>
                </Form.Item>
                
                <Form.Item
                    name="dia_chi"
                    label="Địa chỉ"
                >
                    <Input.TextArea rows={2} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
                </Form.Item>

                <Form.Item
                    name="ngay_kham"
                    label="Ngày Khám"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày khám!' }]}
                >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddPatientToWaitingListModal;