import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
    Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography, Tooltip, Row, Col, Card
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Search } = Input;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
};

const UnitsPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    // Permissions
    const canAdd = currentUser?.permissions?.includes('accounts.add_donvitinh');
    const canChange = currentUser?.permissions?.includes('accounts.change_donvitinh');
    const canDelete = currentUser?.permissions?.includes('accounts.delete_donvitinh');

    // Fetch data
    const fetchUnits = async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            
            const response = await fetch('/api/don-vi-tinh/', { headers });

            if (response.ok) {
                const data = await response.json();
                setUnits(Array.isArray(data) ? data : (data.results || []));
            } else {
                message.error(`Lỗi tải đơn vị tính (mã ${response.status})`);
            }
        } catch (error) {
            message.error('Lỗi kết nối khi tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    // Filter logic
    const filteredUnits = useMemo(() => {
        if (!searchText) return units;
        return units.filter(unit =>
            unit.ten_don_vi_tinh.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [units, searchText]);


    // Modal and Form Handlers
    const showModal = (record = null) => {
        setEditingUnit(record);
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
            const method = editingUnit ? 'PUT' : 'POST';
            
            const url = editingUnit ? `/api/don-vi-tinh/${editingUnit.id}/` : '/api/don-vi-tinh/';
            
            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(values)
            });

            if (response.ok) {
                message.success(`${editingUnit ? 'Cập nhật' : 'Thêm'} thành công!`);
                setIsModalVisible(false);
                fetchUnits();
            } else {
                const err = await response.json().catch(() => ({}));
                message.error(`Lỗi: ${Object.values(err).flat().join(' ')}`);
            }
        } catch (error) {
            console.log('Validation/API error:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            
            const response = await fetch(`/api/don-vi-tinh/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok || response.status === 204) {
                message.success('Đã xóa đơn vị tính.');
                fetchUnits();
            } else {
                message.error('Xóa thất bại. Có thể đơn vị tính này đang được sử dụng.');
            }
        } catch {
            message.error('Lỗi kết nối khi xóa.');
        }
    };

    // Table Columns
    const columns = [
        { title: 'STT', key: 'stt', render: (text, record, index) => index + 1, width: 80, align: 'center' },
        { title: 'Tên đơn vị tính', dataIndex: 'ten_don_vi_tinh', sorter: (a, b) => a.ten_don_vi_tinh.localeCompare(b.ten_don_vi_tinh) },
        {
            title: 'Hành động', key: 'action', width: 120, align: 'center',
            render: (_, record) => (
                <Space>
                    {canChange && <Tooltip title="Sửa"><Button shape="circle" icon={<EditOutlined />} onClick={() => showModal(record)} /></Tooltip>}
                    {canDelete && <Popconfirm title="Xóa đơn vị này?" onConfirm={() => handleDelete(record.id)}><Tooltip title="Xóa"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm>}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Button type="link" onClick={() => navigate('/dashboard/regulations')} style={{ marginBottom: 16 }}>
                ← Quay lại Quản lý Quy định
            </Button>
            <Title level={3}>Quản lý Đơn vị tính</Title>
            <Card>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={14}>
                        <Search
                            placeholder="Tìm theo tên đơn vị tính..."
                            onSearch={value => setSearchText(value)}
                            onChange={e => !e.target.value && setSearchText('')}
                            allowClear
                            enterButton
                        />
                    </Col>
                    <Col xs={24} sm={12} md={10} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={fetchUnits} loading={loading} />
                            {canAdd && <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm đơn vị tính</Button>}
                        </Space>
                    </Col>
                </Row>
            </Card>
            <Table
                columns={columns}
                dataSource={filteredUnits}
                rowKey="id"
                bordered
                loading={loading}
                style={{ marginTop: 16 }}
            />
            <Modal
                title={editingUnit ? 'Sửa đơn vị tính' : 'Thêm đơn vị tính'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 24 }} onFinish={handleOk}>
                    <Form.Item
                        name="ten_don_vi_tinh"
                        label="Tên đơn vị tính"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đơn vị tính' }]}
                    >
                        <Input placeholder="Ví dụ: Viên, Chai, Vỉ..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UnitsPage;