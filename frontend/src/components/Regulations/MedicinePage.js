// frontend/src/components/MedicinePage.js (PHIÊN BẢN HOÀN CHỈNH)

import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
    Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message, Typography, InputNumber, Row, Col, Card, Tooltip, DatePicker
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
};

const MedicinePage = () => {
    const { currentUser } = useContext(AuthContext);
    const [medicines, setMedicines] = useState([]);
    const [units, setUnits] = useState([]);
    const [usages, setUsages] = useState([]); // State mới cho cách dùng
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    // Permissions
    const canAdd = currentUser?.permissions?.includes('accounts.add_thuoc');
    const canChange = currentUser?.permissions?.includes('accounts.change_thuoc');
    const canDelete = currentUser?.permissions?.includes('accounts.delete_thuoc');

    // Fetch data
    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            const [medicinesRes, unitsRes, usagesRes] = await Promise.all([
                fetch('/api/thuoc/', { headers }),
                fetch('/api/don-vi-tinh/', { headers }),
                fetch('/api/cach-dung/', { headers }) // Tải thêm cách dùng
            ]);

            if (medicinesRes.ok && unitsRes.ok && usagesRes.ok) {
                const medicinesData = await medicinesRes.json();
                const unitsData = await unitsRes.json();
                const usagesData = await usagesRes.json();
                setMedicines(Array.isArray(medicinesData) ? medicinesData : (medicinesData.results || []));
                setUnits(Array.isArray(unitsData) ? unitsData : (unitsData.results || []));
                setUsages(Array.isArray(usagesData) ? usagesData : (usagesData.results || []));
            } else {
                message.error('Lỗi khi tải dữ liệu từ máy chủ.');
            }
        } catch (error) {
            message.error('Lỗi kết nối khi tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    
    // Filter logic
    const filteredMedicines = useMemo(() => {
        if (!searchText) return medicines;
        return medicines.filter(med => med.ten_thuoc?.toLowerCase().includes(searchText.toLowerCase()));
    }, [medicines, searchText]);

    // Modal handlers
    const showModal = (record = null) => {
        setEditingMedicine(record);
        if (record) {
            form.setFieldsValue({
                ...record,
                don_vi_tinh_id: record.don_vi_tinh?.id,
                cach_dung_mac_dinh_id: record.cach_dung_mac_dinh?.id,
                han_su_dung: record.han_su_dung ? dayjs(record.han_su_dung, 'YYYY-MM-DD') : null,
            });
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const method = editingMedicine ? 'PUT' : 'POST';
            const url = editingMedicine ? `/api/thuoc/${editingMedicine.id}/` : '/api/thuoc/';
            
            const payload = {
                ...values,
                han_su_dung: values.han_su_dung ? values.han_su_dung.format('YYYY-MM-DD') : null,
            };

            const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });

            if (response.ok) {
                message.success(`${editingMedicine ? 'Cập nhật' : 'Thêm'} thuốc thành công!`);
                setIsModalVisible(false);
                fetchData();
            } else {
                const err = await response.json().catch(() => ({}));
                message.error(`Lỗi: ${Object.values(err).flat().join(' ')}`);
            }
        } catch (error) { console.error("Lỗi khi lưu thuốc:", error); }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/thuoc/${id}/`, { method: 'DELETE', headers: getAuthHeaders() });
            if (response.ok || response.status === 204) {
                message.success('Đã xóa thuốc.');
                fetchData();
            } else { message.error('Xóa thất bại. Có thể thuốc đang được sử dụng.'); }
        } catch { message.error('Lỗi kết nối khi xóa.'); }
    };

    // Table columns
    const columns = [
        { title: 'STT', key: 'stt', render: (_, __, index) => index + 1, width: 60, align: 'center' },
        { title: 'Tên thuốc', dataIndex: 'ten_thuoc', sorter: (a, b) => a.ten_thuoc.localeCompare(b.ten_thuoc) },
        { title: 'Đơn vị tính', dataIndex: ['don_vi_tinh', 'ten_don_vi_tinh'] },
        { title: 'Cách dùng mặc định', dataIndex: ['cach_dung_mac_dinh', 'ten_cach_dung'] },
        { title: 'Số lượng tồn', dataIndex: 'so_luong_ton', sorter: (a, b) => a.so_luong_ton - b.so_luong_ton, align: 'right' },
        { title: 'Hạn sử dụng', dataIndex: 'han_su_dung', render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A' },
        { title: 'Đơn giá (VND)', dataIndex: 'don_gia', align: 'right', render: (price) => new Intl.NumberFormat('vi-VN').format(price), sorter: (a, b) => a.don_gia - b.don_gia },
        {
            title: 'Hành động', key: 'action', width: 120, align: 'center', fixed: 'right',
            render: (_, record) => (
                <Space>
                    {canChange && <Tooltip title="Sửa"><Button shape="circle" icon={<EditOutlined />} onClick={() => showModal(record)} /></Tooltip>}
                    {canDelete && <Popconfirm title="Xóa thuốc này?" onConfirm={() => handleDelete(record.id)}><Tooltip title="Xóa"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm>}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Button type="link" onClick={() => navigate('/dashboard/regulations')} style={{ marginBottom: 16 }}>← Quay lại Quản lý Quy định</Button>
            <Title level={3}>Quản lý Thuốc</Title>
            <Card>
                <Row gutter={[16, 16]} justify="space-between" align="middle">
                    <Col xs={24} sm={12} md={14}><Search placeholder="Tra cứu tên thuốc..." onSearch={setSearchText} onChange={e => !e.target.value && setSearchText('')} allowClear enterButton /></Col>
                    <Col xs={24} sm={12} md={10} style={{ textAlign: 'right' }}><Space><Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} />{canAdd && <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm thuốc</Button>}</Space></Col>
                </Row>
            </Card>
            <Table columns={columns} dataSource={filteredMedicines} rowKey="id" bordered loading={loading} style={{ marginTop: 16 }} scroll={{ x: 'max-content' }}/>
            <Modal title={editingMedicine ? 'Sửa thông tin thuốc' : 'Thêm thuốc mới'} open={isModalVisible} onOk={handleOk} onCancel={() => setIsModalVisible(false)} destroyOnClose>
                <Form form={form} layout="vertical" style={{ marginTop: 24 }} onFinish={handleOk}>
                    <Form.Item name="ten_thuoc" label="Tên thuốc (*)" rules={[{ required: true, message: 'Vui lòng nhập tên thuốc!' }]}><Input /></Form.Item>
                    <Form.Item name="cach_dung_mac_dinh_id" label="Cách dùng mặc định"  rules={[{ required: true, message: 'Vui lòng chọn cách dùng mặc định!' }]}><Select placeholder="Chọn cách dùng" allowClear>{usages.map(u => <Option key={u.id} value={u.id}>{u.ten_cach_dung}</Option>)}</Select></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="don_vi_tinh_id" label="Đơn vị tính (*)" rules={[{ required: true, message: 'Vui lòng nhập đơn vị tính!' }]}><Select placeholder="Chọn đơn vị tính">{units.map(u => <Option key={u.id} value={u.id}>{u.ten_don_vi_tinh}</Option>)}</Select></Form.Item></Col>
                        <Col span={12}><Form.Item name="han_su_dung" label="Hạn sử dụng"  rules={[{ required: true, message: 'Vui lòng chọn hạn sử dụng!' }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="so_luong_ton" label="Số lượng tồn (*)" rules={[{ required: true, message: 'Vui lòng nhập số lượng tồn!'  }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="don_gia" label="Đơn giá (VND) (*)" rules={[{ required: true, message: 'Vui lòng nhập đơn giá!'  }]}><InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v.replace(/\$\s?|(,*)/g, '')} /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default MedicinePage;