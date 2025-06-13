import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../App';

const { Title } = Typography;

const UsagesPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [usages, setUsages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUsage, setEditingUsage] = useState(null);
    const [form] = Form.useForm();

    const canAdd = currentUser?.permissions?.includes('accounts.add_cachdung');
    const canChange = currentUser?.permissions?.includes('accounts.change_cachdung');
    const canDelete = currentUser?.permissions?.includes('accounts.delete_cachdung');

    const fetchUsages = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/usages/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUsages(data.results || data);
        } catch {
            message.error('Lỗi khi tải cách dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsages();
    }, []);

    const showModal = (record = null) => {
        setEditingUsage(record);
        form.setFieldsValue(record || {});
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('authToken');
            const method = editingUsage ? 'PUT' : 'POST';
            const url = editingUsage ? `/api/usages/${editingUsage.id}/` : '/api/usages/';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(values)
            });
            if (res.ok) {
                message.success(`${editingUsage ? 'Cập nhật' : 'Thêm'} thành công!`);
                setIsModalVisible(false);
                fetchUsages();
            } else {
                const err = await res.json();
                message.error(`Lỗi: ${err.detail || JSON.stringify(err)}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`/api/usages/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok || res.status === 204) {
                message.success('Đã xóa cách dùng');
                fetchUsages();
            } else {
                message.error('Xóa thất bại');
            }
        } catch {
            message.error('Lỗi kết nối khi xóa');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', align: 'center', width: 80 },
        { title: 'Tên cách dùng', dataIndex: 'ten_cach_dung', key: 'ten_cach_dung' },
        {
            title: 'Sửa đổi', key: 'actions', align: 'center',
            render: (_, record) => (
                <Space>
                    {canChange && <Button icon={<EditOutlined />} onClick={() => showModal(record)} />}
                    {canDelete && (
                        <Popconfirm title="Xóa cách dùng này?" onConfirm={() => handleDelete(record.id)}>
                            <Button danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div>
            <Title level={3}>Quản lý Cách dùng</Title>
            <Space style={{ marginBottom: 16 }}>
                <Button icon={<ReloadOutlined />} onClick={fetchUsages} loading={loading}>
                    Tải lại
                </Button>
                {canAdd && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                        Thêm cách dùng
                    </Button>
                )}
            </Space>
            <Table columns={columns} dataSource={usages} rowKey="id" bordered loading={loading} />
            <Modal
                title={editingUsage ? 'Sửa cách dùng' : 'Thêm cách dùng'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="ten_cach_dung"
                        label="Tên cách dùng"
                        rules={[{ required: true, message: 'Vui lòng nhập tên cách dùng' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UsagesPage;
