import React, { useState, useEffect, useContext, useMemo } from 'react'; // Đã xóa useRef
import {
    Table, Button, Space, Modal, Typography, message, Row, Col, Card, Descriptions, Input
} from 'antd';
import { EyeOutlined, FileTextOutlined, ReloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './App';
import dayjs from 'dayjs';
// Đã xóa import useReactToPrint
import PrintableInvoice from './PrintableInvoice'; // Quan trọng: file này cũng phải là phiên bản đã sửa

const { Title, Text } = Typography;
const { Search } = Input;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const PKBDetailView = ({ pkbData }) => {
    if (!pkbData) return null;
    return (
        <div style={{ padding: '8px' }}>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Họ tên">{pkbData.benh_nhan.ho_ten}</Descriptions.Item>
                <Descriptions.Item label="Ngày khám">{dayjs(pkbData.ngay_kham).format('DD/MM/YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Triệu chứng" span={2}>{pkbData.trieu_chung}</Descriptions.Item>
                <Descriptions.Item label="Dự đoán bệnh" span={2}>{pkbData.loai_benh_chuan_doan?.ten_loai_benh || 'Chưa có'}</Descriptions.Item>
                <Descriptions.Item label="Người lập phiếu">{pkbData.nguoi_lap_phieu?.ho_ten || 'Chưa có thông tin'}</Descriptions.Item>
            </Descriptions>
            <Title level={5}>Đơn thuốc chi tiết</Title>
            <Table
                dataSource={pkbData.chi_tiet_don_thuoc}
                rowKey="id" size="small" pagination={false} bordered
                columns={[
                    { title: 'Tên thuốc', dataIndex: ['thuoc', 'ten_thuoc'] },
                    { title: 'Số lượng', dataIndex: 'so_luong_ke', align: 'center' },
                    { title: 'Đơn vị', dataIndex: ['thuoc', 'don_vi_tinh', 'ten_don_vi_tinh'] },
                    { title: 'Cách dùng', dataIndex: ['cach_dung_chi_dinh', 'ten_cach_dung'] },
                ]}
            />
        </div>
    );
};

const MedicalRecordListPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    // Đã xóa toàn bộ logic phức tạp của react-to-print (useRef, useEffect, useState isPrintingReady)

    const canView = currentUser?.permissions?.includes('accounts.view_pkb');
    const canViewInvoice = currentUser?.permissions?.includes('accounts.view_hoadon');

    const fetchData = async () => {
        if (!canView) return;
        setLoading(true);
        try {
            const response = await fetch('/api/pkb/', { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Lỗi tải danh sách phiếu khám.');
            const data = await response.json();
            setMedicalRecords(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchData(); 
    }, [canView]);

    const filteredRecords = useMemo(() => {
        if (!searchText) return medicalRecords;
        return medicalRecords.filter(record =>
            record.benh_nhan?.ho_ten?.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [medicalRecords, searchText]);

    const showDetailModal = (record) => {
        setSelectedRecord(record);
        setIsDetailModalVisible(true);
    };

    const showInvoiceModal = (record) => {
        setSelectedRecord(record);
        setIsInvoiceModalVisible(true);
    };

    const handleModalClose = () => {
        setIsDetailModalVisible(false);
        setIsInvoiceModalVisible(false);
        setSelectedRecord(null);
    };

    const columns = [
        { title: 'STT', key: 'stt', render: (_, __, index) => index + 1, width: 60, align: 'center' },
        { title: 'Mã PKB', dataIndex: 'id', key: 'id', width: 80, align: 'center' },
        { title: 'Bệnh nhân', dataIndex: ['benh_nhan', 'ho_ten'], key: 'benh_nhan', sorter: (a, b) => a.benh_nhan.ho_ten.localeCompare(b.benh_nhan.ho_ten) },
        { title: 'Ngày khám', dataIndex: 'ngay_kham', key: 'ngay_kham', render: (text) => dayjs(text).format('DD/MM/YYYY'), sorter: (a, b) => dayjs(a.ngay_kham).unix() - dayjs(b.ngay_kham).unix() },
        { title: 'Chẩn đoán', dataIndex: ['loai_benh_chuan_doan', 'ten_loai_benh'], key: 'chuan_doan', render: (text) => text || 'Chưa có' },
        {
            title: 'Hành Động', key: 'action', width: 280, align: 'center', fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => showDetailModal(record)}>Xem Chi Tiết</Button>
                    {canViewInvoice && <Button icon={<FileTextOutlined />} onClick={() => showInvoiceModal(record)} disabled={!record.hoa_don_lien_ket}>Hóa đơn</Button>}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={14}>
                        <Search placeholder="Tìm theo tên bệnh nhân..." onSearch={setSearchText} onChange={e => !e.target.value && setSearchText('')} allowClear enterButton />
                    </Col>
                    <Col xs={24} sm={12} md={10} style={{ textAlign: 'right' }}>
                        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Tải lại</Button>
                    </Col>
                </Row>
            </Card>

            <Table columns={columns} dataSource={filteredRecords} loading={loading} rowKey="id" bordered style={{ marginTop: 16 }} scroll={{ x: 'max-content' }} />

            <Modal title={`Chi Tiết Phiếu Khám Bệnh #${selectedRecord?.id}`} open={isDetailModalVisible} onCancel={handleModalClose} footer={null} width={800} destroyOnClose>
                <PKBDetailView pkbData={selectedRecord} />
            </Modal>

            {/* Modal hóa đơn giờ đã được đơn giản hóa tối đa */}
            <Modal
                title={`Hóa đơn cho Phiếu khám #${selectedRecord?.id}`}
                open={isInvoiceModalVisible}
                onCancel={handleModalClose}
                width={800}
                destroyOnClose
                footer={[
                    <Button key="back" onClick={handleModalClose}>
                        Đóng
                    </Button>,
                    <Button
                        key="print"
                        type="primary"
                        icon={<PrinterOutlined />}
                        // Chỉ cần gọi hàm in của trình duyệt, cực kỳ đơn giản và đáng tin cậy
                        onClick={() => window.print()}
                    >
                        In / Lưu PDF
                    </Button>,
                ]}
            >
                {/* Component PrintableInvoice sẽ tự xử lý việc ẩn/hiện khi in thông qua CSS */}
                <PrintableInvoice record={selectedRecord} />
            </Modal>
        </div>
    );
};

export default MedicalRecordListPage;