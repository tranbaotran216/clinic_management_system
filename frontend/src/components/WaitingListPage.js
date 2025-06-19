// frontend/src/components/WaitingListPage.js (Bản full đã tích hợp Modal PKB)

import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
    Table, Button, Space, Modal, Form, Input, DatePicker, Select,
    message, Popconfirm, Tooltip, Typography, InputNumber, Row, Col, Card
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, FileAddOutlined, ReloadOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './App';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Component con cho bảng thuốc, giúp code gọn gàng
const PrescriptionTable = ({ form, medicines, usages }) => {
    const handleMedicineChange = (medicineId, fieldKey) => {
        const selectedMedicine = medicines.find(m => m.id === medicineId);
        if (selectedMedicine) {
            const currentFields = form.getFieldValue('chi_tiet_don_thuoc');
            currentFields[fieldKey] = {
                ...currentFields[fieldKey],
                don_vi_tinh: selectedMedicine.don_vi_tinh.ten_don_vi_tinh,
            };
            form.setFieldsValue({ chi_tiet_don_thuoc: currentFields });
        }
    };

    return (
        <Form.List name="chi_tiet_don_thuoc">
            {(fields, { add, remove }) => (
                <>
                    <Table
                        dataSource={fields}
                        pagination={false}
                        rowKey="key"
                        size="small"
                        bordered
                        columns={[
                            { title: 'STT', render: (text, record, index) => index + 1, width: 50 },
                            {
                                title: 'Thuốc (*)',
                                render: (text, record) => (
                                    <Form.Item name={[record.name, 'thuoc_id']} rules={[{ required: true, message: '!' }]} noStyle>
                                        <Select placeholder="Chọn thuốc" style={{ width: '100%' }} onChange={(value) => handleMedicineChange(value, record.key)}>
                                            {medicines.map(m => <Option key={m.id} value={m.id}>{m.ten_thuoc}</Option>)}
                                        </Select>
                                    </Form.Item>
                                )
                            },
                            { title: 'Đơn vị', width: 100, render: (text, record) => <Form.Item name={[record.name, 'don_vi_tinh']} noStyle><Input disabled /></Form.Item> },
                            { title: 'Số lượng (*)', width: 100, render: (text, record) => <Form.Item name={[record.name, 'so_luong_ke']} rules={[{ required: true, message: '!' }]} noStyle><InputNumber min={1} style={{ width: '100%' }} /></Form.Item> },
                            {
                                title: 'Cách dùng',
                                render: (text, record) => (
                                    <Form.Item name={[record.name, 'cach_dung_chi_dinh_id']} noStyle>
                                        <Select placeholder="Cách dùng" style={{ width: '100%' }} allowClear>
                                            {usages.map(u => <Option key={u.id} value={u.id}>{u.ten_cach_dung}</Option>)}
                                        </Select>
                                    </Form.Item>
                                )
                            },
                            { title: '', width: 50, align: 'center', render: (text, record) => <Button danger icon={<DeleteOutlined />} onClick={() => remove(record.name)} /> }
                        ]}
                    />
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 12 }}>Thêm thuốc</Button>
                </>
            )}
        </Form.List>
    );
};

const WaitingListPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [waitingList, setWaitingList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [registerForm] = Form.useForm();
    const [isPKBModalVisible, setIsPKBModalVisible] = useState(false);
    const [currentPatientForPKB, setCurrentPatientForPKB] = useState(null);
    const [pkbForm] = Form.useForm();
    const [isSubmittingPKB, setIsSubmittingPKB] = useState(false);
    const [diseases, setDiseases] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [usages, setUsages] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const navigate = useNavigate();

    const canAdd = currentUser?.permissions?.includes('accounts.add_dskham');
    const canChange = currentUser?.permissions?.includes('accounts.change_dskham');
    const canDelete = currentUser?.permissions?.includes('accounts.delete_dskham');
    const canCreatePKB = currentUser?.permissions?.includes('accounts.add_pkb');

    const fetchData = async (dateToFetch) => {
        if (!dateToFetch) return;
        setLoading(true);
        try {
            const params = { ngay_kham: dateToFetch.format('YYYY-MM-DD') };
            const query = new URLSearchParams(params).toString();
            const response = await fetch(`/api/ds-kham/?${query}`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`Lỗi tải danh sách khám (mã ${response.status})`);
            const data = await response.json();
            setWaitingList(Array.isArray(data) ? data : (data.results || []));
        } catch (error) { message.error(error.message); }
        finally { setLoading(false); }
    };

    const fetchDropdownData = async () => {
        if (diseases.length > 0) return;
        try {
            const headers = getAuthHeaders();
            const [disRes, medRes, usaRes] = await Promise.all([
                fetch('/api/loai-benh/', { headers }),
                fetch('/api/thuoc/', { headers }),
                fetch('/api/cach-dung/', { headers }),
            ]);
            setDiseases(await disRes.json());
            setMedicines(await medRes.json());
            setUsages(await usaRes.json());
        } catch (error) { message.error("Lỗi tải dữ liệu cho form phiếu khám."); }
    };

    useEffect(() => { fetchData(selectedDate); }, [selectedDate]);

    const filteredWaitingList = useMemo(() => {
        if (!searchText) return waitingList;
        const lowercasedSearchText = searchText.toLowerCase();
        return waitingList.filter(item =>
            item.benh_nhan && (
                item.benh_nhan.ho_ten?.toLowerCase().includes(lowercasedSearchText)
            )
        );
    }, [waitingList, searchText]);

    const showRegisterModal = (item = null) => {
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
            registerForm.resetFields();
            registerForm.setFieldsValue({ ngay_kham: selectedDate });
        }
        setIsRegisterModalVisible(true);
    };

    const handleRegisterOk = async () => {
        try {
            const values = await registerForm.validateFields();
            const method = editingItem ? 'PUT' : 'POST';
            let url = '/api/ds-kham/';
            if (editingItem) { url += `${editingItem.id}/`; }
            const payload = {
                ngay_kham: values.ngay_kham.format('YYYY-MM-DD'),
                benh_nhan: { ho_ten: values.ho_ten, nam_sinh: values.nam_sinh, gioi_tinh: values.gioi_tinh, dia_chi: values.dia_chi || '' }
            };
            const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(Object.values(errorData).flat().join(' '));
            }
            message.success(`Đã ${editingItem ? 'cập nhật' : 'thêm'} thành công!`);
            setIsRegisterModalVisible(false);
            fetchData(selectedDate);
        } catch (errorInfo) { console.log('Lỗi:', errorInfo); }
    };

    const handleRegisterCancel = () => { setIsRegisterModalVisible(false); };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/ds-kham/${id}/`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Lỗi khi xóa.');
            message.success('Xóa khỏi danh sách chờ thành công!');
            fetchData(selectedDate);
        } catch (error) { message.error(error.message); }
    };
    
    const showPKBModal = (record) => {
        setCurrentPatientForPKB(record);
        fetchDropdownData();
        pkbForm.setFieldsValue({
            ho_ten: record.benh_nhan.ho_ten,
            ngay_kham: dayjs(record.ngay_kham, 'YYYY-MM-DD'),
            trieu_chung: '',
            loai_benh_chuan_doan_id: null,
            chi_tiet_don_thuoc: []
        });
        setIsPKBModalVisible(true);
    };

    const handlePKBCancel = () => { setIsPKBModalVisible(false); pkbForm.resetFields(); setCurrentPatientForPKB(null); };

    const handlePKBSubmit = async () => {
        setIsSubmittingPKB(true);
        try {
            const values = await pkbForm.validateFields();
            const payload = {
                ds_kham_id: currentPatientForPKB.id,
                benh_nhan_id: currentPatientForPKB.benh_nhan.id,
                ngay_kham: values.ngay_kham.format('YYYY-MM-DD'),
                trieu_chung: values.trieu_chung,
                loai_benh_chuan_doan_id: values.loai_benh_chuan_doan_id,
                chi_tiet_don_thuoc: values.chi_tiet_don_thuoc || []
            };
            const response = await fetch('/api/pkb/', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(Object.values(errorData).flat().join(' '));
            }
            message.success("Tạo phiếu khám thành công!");
            handlePKBCancel();
            fetchData(selectedDate);
        } catch (error) {
            message.error(`Tạo phiếu khám thất bại: ${error.message || 'Vui lòng kiểm tra lại thông tin.'}`);
        } finally {
            setIsSubmittingPKB(false);
        }
    };
    
    const handleDateChange = (date) => { if (date) setSelectedDate(date); };

    const columns = [
        { title: 'STT', key: 'stt', render: (_, __, index) => index + 1, width: 60, align: 'center' },
        { title: 'Họ Tên', dataIndex: ['benh_nhan', 'ho_ten'], sorter: (a, b) => a.benh_nhan.ho_ten.localeCompare(b.benh_nhan.ho_ten) },
        { title: 'Giới tính', dataIndex: 'gioi_tinh_display', align: 'center', filters: [{ text: 'Nam', value: 'Nam' }, { text: 'Nữ', value: 'Nữ' }], onFilter: (value, record) => record.gioi_tinh_display === value },
        { title: 'Năm Sinh', dataIndex: ['benh_nhan', 'nam_sinh'], align: 'center', sorter: (a, b) => a.benh_nhan.nam_sinh - b.benh_nhan.nam_sinh },
        { title: 'Địa chỉ', dataIndex: ['benh_nhan', 'dia_chi'] },
        {
            title: 'Hành Động', key: 'action', width: 280, align: 'center', fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button type="primary" icon={record.da_kham ? <CheckCircleOutlined /> : <FileAddOutlined />} onClick={() => showPKBModal(record)} disabled={!canCreatePKB || record.da_kham}>
                        {record.da_kham ? 'Đã khám' : 'Thêm phiếu khám bệnh'}
                    </Button>
                    <Tooltip title="Sửa thông tin đăng ký"><Button shape="circle" icon={<EditOutlined />} onClick={() => showRegisterModal(record)} disabled={!canChange || record.da_kham}/></Tooltip>
                    <Tooltip title="Xóa khỏi danh sách"><Popconfirm title="Xóa bệnh nhân này?" onConfirm={() => handleDelete(record.id)}><Button shape="circle" danger icon={<DeleteOutlined />} disabled={!canDelete}/></Popconfirm></Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]} justify="space-between" align="middle">
                    <Col xs={24} sm={12} md={6}><DatePicker value={selectedDate} onChange={handleDateChange} format="DD/MM/YYYY" style={{ width: '100%' }} allowClear={false}/></Col>
                    <Col xs={24} sm={12} md={10}><Search placeholder="Tìm theo tên bệnh nhân..." onSearch={value => setSearchText(value)} onChange={e => { if (!e.target.value) setSearchText(''); }} allowClear enterButton /></Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}><Space><Button icon={<ReloadOutlined />} onClick={() => fetchData(selectedDate)} loading={loading}>Tải lại</Button>{canAdd && <Button type="primary" icon={<PlusOutlined />} onClick={() => showRegisterModal()}>Thêm bệnh nhân</Button>}</Space></Col>
                </Row>
            </Card>

            <Table columns={columns} dataSource={filteredWaitingList} loading={loading} rowKey="id" bordered scroll={{ x: 'max-content' }}/>

            <Modal title={editingItem ? "Sửa thông tin đăng ký khám" : "Thêm bệnh nhân vào danh sách chờ"} open={isRegisterModalVisible} onOk={handleRegisterOk} onCancel={handleRegisterCancel} destroyOnClose okText={editingItem ? "Lưu" : "Thêm"} cancelText="Hủy" width={720}>
                <Form form={registerForm} layout="vertical" style={{ marginTop: 24 }} onFinish={handleRegisterOk}>
                     <Row gutter={24}>
                        <Col span={12}><Form.Item name="ho_ten" label="Họ và tên:" rules={[{ required: true }]}><Input placeholder="Họ và tên" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="gioi_tinh" label="Giới tính:" rules={[{ required: true }]}><Select placeholder="Giới tính"><Option value="M">Nam</Option><Option value="F">Nữ</Option><Option value="O">Khác</Option></Select></Form.Item></Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={12}><Form.Item name="dia_chi" label="Địa chỉ:" rules={[{ required: true }]}><Input placeholder="Địa chỉ" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="nam_sinh" label="Năm sinh:" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} placeholder="Năm sinh" min={1900} max={dayjs().year()} /></Form.Item></Col>
                    </Row>
                    <Row gutter={24}>
                        <Col span={12}><Form.Item name="ngay_kham" label="Ngày khám:" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
                    </Row>
                </Form>
            </Modal>

            {currentPatientForPKB && (
                <Modal title={<Title level={4}>Thêm Phiếu Khám Bệnh</Title>} open={isPKBModalVisible} onCancel={handlePKBCancel} width={900} destroyOnClose footer={[ <Button key="back" onClick={handlePKBCancel}>Hủy</Button>, <Button key="submit" type="primary" loading={isSubmittingPKB} onClick={handlePKBSubmit}>Lưu Phiếu Khám</Button> ]}>
                    <Form form={pkbForm} layout="vertical">
                        <Row gutter={24}>
                            <Col span={12}><Form.Item name="ho_ten" label="Họ và tên:"><Input disabled /></Form.Item></Col>
                            <Col span={12}><Form.Item name="ngay_kham" label="Ngày khám:"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabled /></Form.Item></Col>
                        </Row>
                        <Row gutter={24}>
                            <Col span={12}><Form.Item name="trieu_chung" label="Triệu chứng (*):" rules={[{ required: true, message: 'Vui lòng nhập triệu chứng' }]}><Input.TextArea rows={1} placeholder="Nhập triệu chứng" /></Form.Item></Col>
                            <Col span={12}><Form.Item name="loai_benh_chuan_doan_id" label="Dự đoán loại bệnh (*):" rules={[{ required: true, message: 'Vui lòng chọn bệnh' }]}><Select placeholder="Chọn loại bệnh">{diseases.map(d => <Option key={d.id} value={d.id}>{d.ten_loai_benh}</Option>)}</Select></Form.Item></Col>
                        </Row>
                        <Title level={5} style={{ marginTop: 16, marginBottom: 16 }}>Đơn thuốc</Title>
                        <PrescriptionTable form={pkbForm} medicines={medicines} usages={usages} />
                    </Form>
                </Modal>
            )}
        </div>
    );
};

export default WaitingListPage;