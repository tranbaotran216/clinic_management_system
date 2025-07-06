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

const DiseasesPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDisease, setEditingDisease] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    // Permissions
    const canAdd = currentUser?.permissions?.includes('accounts.add_loaibenh');
    const canChange = currentUser?.permissions?.includes('accounts.change_loaibenh');
    const canDelete = currentUser?.permissions?.includes('accounts.delete_loaibenh');

    // Fetch data
    const fetchDiseases = async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            const response = await fetch('/api/loai-benh/', { headers });

            if (response.ok) {
                const data = await response.json();
                setDiseases(Array.isArray(data) ? data : (data.results || []));
            } else {
                message.error(`Lỗi khi tải loại bệnh (mã ${response.status})`);
            }
        } catch (error) {
            message.error('Lỗi kết nối khi tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiseases();
    }, []);
    
    // Filter logic
    const filteredDiseases = useMemo(() => {
        if (!searchText) return diseases;
        return diseases.filter(disease =>
            disease.ten_loai_benh.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [diseases, searchText]);


    // Modal and Form Handlers
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
            const method = editingDisease ? 'PUT' : 'POST';

            const url = editingDisease ? `/api/loai-benh/${editingDisease.id}/` : '/api/loai-benh/';
            
            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(values)
            });

            if (response.ok) {
                message.success(`${editingDisease ? 'Cập nhật' : 'Thêm'} thành công!`);
                setIsModalVisible(false);
                fetchDiseases();
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
    
            const response = await fetch(`/api/loai-benh/${id}/`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (response.ok || response.status === 204) {
                message.success('Đã xóa loại bệnh.');
                fetchDiseases();
            } else {
                message.error('Xóa thất bại. Có thể loại bệnh này đang được sử dụng.');
            }
        } catch {
            message.error('Lỗi kết nối khi xóa.');
        }
    };

    // Table Columns
    const columns = [
        { title: 'STT', key: 'stt', render: (text, record, index) => index + 1, width: 80, align: 'center' },
        { title: 'Tên loại bệnh', dataIndex: 'ten_loai_benh', sorter: (a, b) => a.ten_loai_benh.localeCompare(b.ten_loai_benh) },
        {
            title: 'Hành động', key: 'action', width: 120, align: 'center',
            render: (_, record) => (
                <Space>
                    {canChange && <Tooltip title="Sửa"><Button shape="circle" icon={<EditOutlined />} onClick={() => showModal(record)} /></Tooltip>}
                    {canDelete && <Popconfirm title="Xóa loại bệnh này?" onConfirm={() => handleDelete(record.id)}><Tooltip title="Xóa"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm>}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
             <Button type="link" onClick={() => navigate('/dashboard/regulations')} style={{ marginBottom: 16 }}>
                ← Quay lại Quản lý Quy định
            </Button>
            <Title level={3}>Quản lý Loại bệnh</Title>
            <Card>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={14}>
                        <Search
                            placeholder="Tìm theo tên loại bệnh..."
                            onSearch={value => setSearchText(value)}
                            onChange={e => !e.target.value && setSearchText('')}
                            allowClear
                            enterButton
                        />
                    </Col>
                    <Col xs={24} sm={12} md={10} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={fetchDiseases} loading={loading} />
                            {canAdd && <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm loại bệnh</Button>}
                        </Space>
                    </Col>
                </Row>
            </Card>
            <Table
                columns={columns}
                dataSource={filteredDiseases}
                rowKey="id"
                bordered
                loading={loading}
                style={{ marginTop: 16 }}
            />
            <Modal
                title={editingDisease ? 'Sửa loại bệnh' : 'Thêm loại bệnh'}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 24 }} onFinish={handleOk}>
                    <Form.Item
                        name="ten_loai_benh"
                        label="Tên loại bệnh"
                        rules={[{ required: true, message: 'Vui lòng nhập tên loại bệnh' }]}
                    >
                        <Input placeholder="Ví dụ: Cảm cúm, Sốt siêu vi..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DiseasesPage;