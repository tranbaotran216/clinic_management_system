import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../App';

const { Title } = Typography;

const UnitsPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [form] = Form.useForm();

    const canAdd = currentUser?.permissions?.includes('accounts.add_donvitinh');
    const canChange = currentUser?.permissions?.includes('accounts.change_donvitinh');
    const canDelete = currentUser?.permissions?.includes('accounts.delete_donvitinh');

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/api/units/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setUnits(data.results || data);
        } catch {
            message.error('Lỗi khi tải đơn vị tính');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const showModal = (record = null) => {
        setEditingUnit(record);
        form.setFieldsValue(record || {});
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('authToken');
            const method = editingUnit ? 'PUT' : 'POST';
            const url = editingUnit ? `/api/units/${editingUnit.id}/` : '/api/units/';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(values)
            });
            if (res.ok) {
                message.success(`${editingUnit ? 'Cập nhật' : 'Thêm'} thành công!`);
                setIsModalVisible(false);
                fetchUnits();
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
            const res = await fetch(`/api/units/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok || res.status === 204) {
                message.success('Đã xóa đơn vị tính');
                fetchUnits();
            } else {
                message.error('Xóa thất bại');
            }
        } catch {
            message.error('Lỗi kết nối khi xóa');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', align: 'center', width: 80 },
        { title: 'Tên đơn vị tính', dataIndex: 'ten_don_vi_tinh', key: 'ten_don_vi_tinh' },
        {
            title: 'Sửa đổi', key: 'actions', align: 'center',
            render: (_, record) => (
                <Space>
                    {canChange && <Button icon={<EditOutlined />} onClick={() => showModal(record)} />}
                    {canDelete && (
                        <Popconfirm title="Xóa đơn vị này?" onConfirm={() => handleDelete(record.id)}>
                            <Button danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div>
            <Title level={3}>Quản lý Đơn vị tính</Title>
            <Space style={{ marginBottom: 16 }}>
                <Button icon={<ReloadOutlined />} onClick={fetchUnits} loading={loading}>
                    Tải lại
                </Button>
                {canAdd && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
                        Thêm đơn vị tính
                    </Button>
                )}
            </Space>
            <Table columns={columns} dataSource={units} rowKey="id" bordered loading={loading} />
            <Modal
                title={editingUnit ? 'Sửa đơn vị tính' : 'Thêm đơn vị tính'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="ten_don_vi_tinh"
                        label="Tên đơn vị tính"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị tính' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UnitsPage;
