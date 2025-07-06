import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
    Table, Button, Modal, Form, Input, Space, Popconfirm, message, Typography, Tooltip, Row, Col, Card
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Search } = Input;
const { TextArea } = Input;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
};

const UsagesPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [usages, setUsages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUsage, setEditingUsage] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    // Permissions
    const canAdd = currentUser?.permissions?.includes('accounts.add_cachdung');
    const canChange = currentUser?.permissions?.includes('accounts.change_cachdung');
    const canDelete = currentUser?.permissions?.includes('accounts.delete_cachdung');

    // Fetch data
    const fetchUsages = async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            
            const response = await fetch('/api/cach-dung/', { headers });
            
            if (response.ok) {
                const data = await response.json();
                setUsages(Array.isArray(data) ? data : (data.results || []));
            } else {
                message.error(`Lỗi khi tải cách dùng (mã ${response.status})`);
            }
        } catch (error) {
            message.error('Lỗi kết nối khi tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsages();
    }, []);

    // Filter logic
    const filteredUsages = useMemo(() => {
        if (!searchText) return usages;
        return usages.filter(usage =>
            usage.ten_cach_dung.toLowerCase().includes(searchText.toLowerCase()) ||
            (usage.mo_ta && usage.mo_ta.toLowerCase().includes(searchText.toLowerCase()))
        );
    }, [usages, searchText]);


    // Modal and Form Handlers
    const showModal = (record = null) => {
        setEditingUsage(record);
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
            const method = editingUsage ? 'PUT' : 'POST';
            
            const url = editingUsage ? `/api/cach-dung/${editingUsage.id}/` : '/api/cach-dung/';
            
            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(values)
            });

            if (response.ok) {
                message.success(`${editingUsage ? 'Cập nhật' : 'Thêm'} thành công!`);
                setIsModalVisible(false);
                fetchUsages();
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
            
            const response = await fetch(`/api/cach-dung/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok || response.status === 204) {
                message.success('Đã xóa cách dùng.');
                fetchUsages();
            } else {
                message.error('Xóa thất bại. Có thể cách dùng này đang được sử dụng.');
            }
        } catch {
            message.error('Lỗi kết nối khi xóa.');
        }
    };

    // Table Columns
    const columns = [
        { title: 'STT', key: 'stt', render: (text, record, index) => index + 1, width: 80, align: 'center' },
        { title: 'Tên cách dùng', dataIndex: 'ten_cach_dung', sorter: (a, b) => a.ten_cach_dung.localeCompare(b.ten_cach_dung) },
        { title: 'Mô tả', dataIndex: 'mo_ta', key: 'mo_ta' },
        {
            title: 'Hành động', key: 'action', width: 120, align: 'center',
            render: (_, record) => (
                <Space>
                    {canChange && <Tooltip title="Sửa"><Button shape="circle" icon={<EditOutlined />} onClick={() => showModal(record)} /></Tooltip>}
                    {canDelete && <Popconfirm title="Xóa cách dùng này?" onConfirm={() => handleDelete(record.id)}><Tooltip title="Xóa"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm>}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Button type="link" onClick={() => navigate('/dashboard/regulations')} style={{ marginBottom: 16 }}>
                ← Quay lại Quản lý Quy định
            </Button>
            <Title level={3}>Quản lý Cách dùng thuốc</Title>
            <Card>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={14}>
                        <Search
                            placeholder="Tìm theo tên hoặc mô tả..."
                            onSearch={value => setSearchText(value)}
                            onChange={e => !e.target.value && setSearchText('')}
                            allowClear
                            enterButton
                        />
                    </Col>
                    <Col xs={24} sm={12} md={10} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={fetchUsages} loading={loading} />
                            {canAdd && <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm cách dùng</Button>}
                        </Space>
                    </Col>
                </Row>
            </Card>
            <Table
                columns={columns}
                dataSource={filteredUsages}
                rowKey="id"
                bordered
                loading={loading}
                style={{ marginTop: 16 }}
            />
            <Modal
                title={editingUsage ? 'Sửa cách dùng' : 'Thêm cách dùng'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 24 }} onFinish={handleOk}>
                    <Form.Item
                        name="ten_cach_dung"
                        label="Tên cách dùng"
                        rules={[{ required: true, message: 'Vui lòng nhập tên cách dùng' }]}
                    >
                        <Input placeholder="Ví dụ: Ngày uống 2 lần sau ăn" />
                    </Form.Item>
                    <Form.Item
                        name="mo_ta"
                        label="Mô tả chi tiết (nếu có)"
                    >
                        <TextArea rows={3} placeholder="Mô tả thêm về cách dùng thuốc..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UsagesPage;