import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../App';

const { Title } = Typography;

const DiseasesPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDisease, setEditingDisease] = useState(null);
    const [form] = Form.useForm();

    const canAdd = currentUser?.permissions?.includes('accounts.add_loaibenh');
    const canChange = currentUser?.permissions?.includes('accounts.change_loaibenh');
    const canDelete = currentUser?.permissions?.includes('accounts.delete_loaibenh');

    const fetchDiseases = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/diseases/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setDiseases(data.results || data);
        } catch (error) {
            message.error('Lỗi khi tải loại bệnh');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiseases();
    }, []);

    const showModal = (record = null) => {
        setEditingDisease(record);
        if (record) {
            form.setFieldsValue(record);
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            console.log('Form values:', values);

            const token = localStorage.getItem('authToken');
            const method = editingDisease ? 'PUT' : 'POST';
            const url = editingDisease
                ? `/api/diseases/${editingDisease.id}/`
                : '/api/diseases/';
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(values)
            });
            if (response.ok) {
                message.success(`${editingDisease ? 'Cập nhật' : 'Thêm'} thành công!`);
                setIsModalVisible(false);
                fetchDiseases();
            } else {
                const err = await response.json();
                message.error(`Lỗi: ${err.detail || JSON.stringify(err)}`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/diseases/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok || response.status === 204) {
                message.success('Đã xóa loại bệnh');
                fetchDiseases();
            } else {
                message.error('Xóa thất bại');
            }
        } catch {
            message.error('Lỗi kết nối khi xóa');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            align: 'center',
            width: 80
        },
        {
            title: 'Tên loại bệnh',
            dataIndex: 'ten_loai_benh',
            key: 'ten_loai_benh',
        },
        {
            title: 'Sửa đổi',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
                <Space>
                    {canChange && (
                        <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
                    )}
                    {canDelete && (
                        <Popconfirm title="Xóa loại bệnh này?" onConfirm={() => handleDelete(record.id)}>
                            <Button danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div>
            <Title level={3}>Quản lý Loại bệnh</Title>
            <Space style={{ marginBottom: 16 }}>
                <Button icon={<ReloadOutlined />} onClick={fetchDiseases} loading={loading}>
                    Tải lại
                </Button>
                {canAdd && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                        Thêm loại bệnh
                    </Button>
                )}
            </Space>
            <Table
                columns={columns}
                dataSource={diseases}
                rowKey="id"
                bordered
                loading={loading}
            />
            <Modal
                title={editingDisease ? 'Sửa loại bệnh' : 'Thêm loại bệnh'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="ten_loai_benh"
                        label="Tên loại bệnh"
                        rules={[{ required: true, message: 'Vui lòng nhập tên loại bệnh' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DiseasesPage;
