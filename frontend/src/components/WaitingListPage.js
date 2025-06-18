// frontend/src/components/WaitingListPage.js (PHIÊN BẢN CÓ LỌC NGÀY - ĐẦY ĐỦ)

import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
    Table, Button, Space, Modal, Form, Input, DatePicker, Select,
    message, Popconfirm, Tooltip, Typography, InputNumber, Row, Col, Card
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, FileAddOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './App';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

// Hàm tiện ích để lấy header xác thực
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const WaitingListPage = () => {
    // --- STATE & CONTEXT ---
    const { currentUser } = useContext(AuthContext);
    const [waitingList, setWaitingList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    // State mới để quản lý ngày được chọn, mặc định là hôm nay
    const [selectedDate, setSelectedDate] = useState(dayjs());

    // --- PERMISSIONS ---
    const canAdd = currentUser?.permissions?.includes('accounts.add_dskham');
    const canChange = currentUser?.permissions?.includes('accounts.change_dskham');
    const canDelete = currentUser?.permissions?.includes('accounts.delete_dskham');
    const canCreatePKB = currentUser?.permissions?.includes('accounts.add_pkb');

    // --- DATA FETCHING (Sử dụng selectedDate) ---
    const fetchData = async (dateToFetch) => {
        // Hàm nhận vào một ngày cụ thể để fetch
        if (!dateToFetch) return;
        setLoading(true);
        try {
            const params = { ngay_kham: dateToFetch.format('YYYY-MM-DD') };
            const query = new URLSearchParams(params).toString();
            const response = await fetch(`/api/ds-kham/?${query}`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`Lỗi tải danh sách khám (mã ${response.status})`);
            const data = await response.json();
            setWaitingList(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Tự động gọi lại fetchData khi selectedDate thay đổi
    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate]);

    // --- SEARCH & FILTER LOGIC ---
    const filteredWaitingList = useMemo(() => {
        if (!searchText) {
            return waitingList;
        }
        const lowercasedSearchText = searchText.toLowerCase();
        return waitingList.filter(item =>
            item.benh_nhan && (
                item.benh_nhan.ho_ten?.toLowerCase().includes(lowercasedSearchText) ||
                item.benh_nhan.nam_sinh?.toString().includes(lowercasedSearchText) ||
                item.benh_nhan.dia_chi?.toLowerCase().includes(lowercasedSearchText)
            )
        );
    }, [waitingList, searchText]);

    // --- MODAL & FORM HANDLERS ---
    const showModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            form.setFieldsValue({
                ngay_kham: dayjs(item.ngay_kham, 'YYYY-MM-DD'),
                ho_ten: item.benh_nhan.ho_ten,
                gioi_tinh: item.benh_nhan.gioi_tinh,
                dia_chi: item.benh_nhan.dia_chi,
                nam_sinh: item.benh_nhan.nam_sinh,
            });
        } else {
            form.resetFields();
            // Khi thêm mới, ngày khám mặc định là ngày đang được chọn trên DatePicker
            form.setFieldsValue({ ngay_kham: selectedDate });
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const method = editingItem ? 'PUT' : 'POST';
            let url = '/api/ds-kham/';
            if (editingItem) {
                url += `${editingItem.id}/`;
            }
            const payload = {
                ngay_kham: values.ngay_kham.format('YYYY-MM-DD'),
                benh_nhan: {
                    ho_ten: values.ho_ten,
                    nam_sinh: values.nam_sinh,
                    gioi_tinh: values.gioi_tinh,
                    dia_chi: values.dia_chi || '',
                }
            };
            const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
            if (response.ok) {
                message.success(`Đã ${editingItem ? 'cập nhật' : 'thêm'} thành công!`);
                setIsModalVisible(false);
                fetchData(selectedDate);
            } else {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = "Thao tác thất bại. ";
                if (errorData.benh_nhan) {
                    errorMessage += Object.entries(errorData.benh_nhan).map(([key, value]) => `${key}: ${value.join(', ')}`).join('; ');
                } else {
                    errorMessage += Object.values(errorData).flat().join(' ');
                }
                message.error(errorMessage, 7);
            }
        } catch (errorInfo) {
            console.log('Validation/API error:', errorInfo);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/ds-kham/${id}/`, { method: 'DELETE', headers: getAuthHeaders() });
            if (response.status === 204 || response.ok) {
                message.success('Xóa khỏi danh sách chờ thành công!');
                fetchData(selectedDate);
            } else { message.error('Lỗi khi xóa.'); }
        } catch (error) { message.error('Lỗi kết nối khi xóa.'); }
    };
    
    const handleCreatePKB = (record) => {
        navigate('/dashboard/medical-records/new', { state: { dsKhamId: record.id, patientId: record.benh_nhan.id, patientName: record.benh_nhan.ho_ten, examinationDate: record.ngay_kham } });
    };

    const handleDateChange = (date) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    // --- TABLE COLUMNS DEFINITION ---
    const columns = [
        { title: 'STT', key: 'stt', render: (_, __, index) => index + 1, width: 60, align: 'center' },
        { title: 'Họ Tên', dataIndex: ['benh_nhan', 'ho_ten'], key: 'ho_ten', sorter: (a, b) => a.benh_nhan.ho_ten.localeCompare(b.benh_nhan.ho_ten) },
        { title: 'Giới tính', dataIndex: 'gioi_tinh_display', key: 'gioi_tinh_display', align: 'center', filters: [{ text: 'Nam', value: 'Nam' }, { text: 'Nữ', value: 'Nữ' }, { text: 'Khác', value: 'Khác' }], onFilter: (value, record) => record.gioi_tinh_display === value },
        { title: 'Năm Sinh', dataIndex: ['benh_nhan', 'nam_sinh'], key: 'nam_sinh', align: 'center', sorter: (a, b) => a.benh_nhan.nam_sinh - b.benh_nhan.nam_sinh },
        { title: 'Địa chỉ', dataIndex: ['benh_nhan', 'dia_chi'], key: 'dia_chi' },
        {
            title: 'Hành Động', key: 'action', width: 250, align: 'center',
            render: (_, record) => (
                <Space>
                    {canCreatePKB && <Button type="primary" icon={<FileAddOutlined />} onClick={() => handleCreatePKB(record)}>Thêm phiếu khám bệnh</Button>}
                    {canChange && <Tooltip title="Sửa"><Button shape="circle" icon={<EditOutlined />} onClick={() => showModal(record)} /></Tooltip>}
                    {canDelete && <Popconfirm title="Xóa bệnh nhân này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy"><Tooltip title="Xóa"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm>}
                </Space>
            ),
        },
    ];

    // --- JSX RENDER ---
    return (
        <div>
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} justify="space-between" align="middle">
                    <Col xs={24} sm={12} md={6}>
                        <DatePicker 
                            value={selectedDate} 
                            onChange={handleDateChange}
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                            allowClear={false}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={10}>
                         <Search 
                            placeholder="Tìm theo tên bệnh nhân..." 
                            onSearch={value => setSearchText(value)}
                            onChange={e => { if (!e.target.value) setSearchText(''); }}
                            allowClear 
                            enterButton 
                        />
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={() => fetchData(selectedDate)} loading={loading}>Tải lại</Button>
                            {canAdd && <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm bệnh nhân</Button>}
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Table 
                columns={columns} 
                dataSource={filteredWaitingList} 
                loading={loading} 
                rowKey="id" 
                bordered 
                scroll={{ x: 'max-content' }}
            />

            <Modal
                title={editingItem ? "Sửa thông tin đăng ký khám" : "Thêm bệnh nhân vào danh sách chờ"}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                destroyOnClose
                okText={editingItem ? "Lưu" : "Thêm"}
                cancelText="Hủy"
                width={720}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 24 }} onFinish={handleOk}>
                     <Row gutter={24}>
                        <Col span={12}><Form.Item name="ho_ten" label="Họ và tên:" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}><Input placeholder="Họ và tên" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="gioi_tinh" label="Giới tính:" rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}><Select placeholder="Giới tính"><Option value="M">Nam</Option><Option value="F">Nữ</Option><Option value="O">Khác</Option></Select></Form.Item></Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={12}><Form.Item name="dia_chi" label="Địa chỉ:" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}><Input placeholder="Địa chỉ" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="nam_sinh" label="Năm sinh:" rules={[{ required: true, message: 'Vui lòng nhập năm sinh!' }]}><InputNumber style={{ width: '100%' }} placeholder="Năm sinh" min={1900} max={dayjs().year()} /></Form.Item></Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={12}><Form.Item name="ngay_kham" label="Ngày khám:" rules={[{ required: true, message: 'Vui lòng chọn ngày khám!' }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default WaitingListPage;