import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import {
    Table, Button, Space, Modal, Typography, message, Row, Col, Card, Descriptions, Input
} from 'antd';
import { EyeOutlined, FileTextOutlined, ReloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { AuthContext } from './App';
import dayjs from 'dayjs';

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

const InvoiceContent = React.forwardRef(({ record }, ref) => {
    if (!record || !record.hoa_don_lien_ket) return null;
    const invoice = record.hoa_don_lien_ket;
    const patient = record.benh_nhan;

    return (
        <div ref={ref} style={{ padding: '20px', color: '#000' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={4} style={{ marginBottom: 0 }}>PHÒNG MẠCH XYZ</Title>
                <Text>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</Text><br />
                <Text>SĐT: 0123.456.789</Text>
            </div>
            <Title level={3} style={{ textAlign: 'center' }}>HÓA ĐƠN THANH TOÁN</Title>
            <Title level={5} style={{ textAlign: 'center', marginTop: -10, marginBottom: 24 }}>(Phiếu khám #{record.id})</Title>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Bệnh nhân">{patient.ho_ten}</Descriptions.Item>
                <Descriptions.Item label="Ngày thanh toán">{dayjs(invoice.ngay_thanh_toan).format('HH:mm DD/MM/YYYY')}</Descriptions.Item>
            </Descriptions>
            <Title level={5}>Chi tiết đơn thuốc</Title>
            <Table dataSource={record.chi_tiet_don_thuoc} rowKey="id" size="small" pagination={false} bordered
                columns={[
                    { title: 'Tên thuốc', dataIndex: ['thuoc', 'ten_thuoc'] },
                    { title: 'SL', dataIndex: 'so_luong_ke', align: 'center' },
                    { title: 'Đơn giá', dataIndex: ['thuoc', 'don_gia'], align: 'right', render: (price) => new Intl.NumberFormat('vi-VN').format(price) },
                    { title: 'Thành tiền', align: 'right', render: (item) => <Text strong>{new Intl.NumberFormat('vi-VN').format(item.so_luong_ke * item.thuoc.don_gia)}</Text> },
                ]}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}><Text strong>Tổng tiền thuốc</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right"><Text strong>{new Intl.NumberFormat('vi-VN').format(invoice.tien_thuoc)}</Text></Table.Summary.Cell>
                    </Table.Summary.Row>
                )} />
            <Descriptions bordered column={1} size="small" style={{ marginTop: 24 }}>
                <Descriptions.Item label="Tiền khám">{new Intl.NumberFormat('vi-VN').format(invoice.tien_kham)} VND</Descriptions.Item>
                <Descriptions.Item label="Tổng tiền thuốc">{new Intl.NumberFormat('vi-VN').format(invoice.tien_thuoc)} VND</Descriptions.Item>
                <Descriptions.Item label={<Text strong>TỔNG CỘNG THANH TOÁN</Text>}><Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>{new Intl.NumberFormat('vi-VN').format(invoice.tong_tien)} VND</Text></Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div><Text strong>Người lập phiếu</Text><br /><br /><br />(Ký, ghi rõ họ tên)</div>
                <div><Text strong>Người thanh toán</Text><br /><br /><br />(Ký, ghi rõ họ tên)</div>
            </div>
        </div>
    );
});

const MedicalRecordListPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();
    const invoiceContentRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => invoiceContentRef.current,
        documentTitle: `HoaDon-PKB${selectedRecord?.id}-${selectedRecord?.benh_nhan?.ho_ten.replace(/\s/g, '') || ''}`,
        onBeforeGetContent: () => {
            return new Promise((resolve) => {
                message.loading({ content: 'Đang chuẩn bị file...', key: 'printing', duration: 0 });
                setTimeout(() => {
                    resolve();
                }, 300); // Đợi một chút để đảm bảo DOM đã render xong
            });
        },
        onAfterPrint: () => {
            message.success({ content: 'Hoàn tất!', key: 'printing', duration: 2 });
        },
    });

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

    useEffect(() => { fetchData(); }, [canView]);

    const filteredRecords = useMemo(() => {
        if (!searchText) return medicalRecords;
        return medicalRecords.filter(record =>
            record.benh_nhan?.ho_ten?.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [medicalRecords, searchText]);

    const showDetailModal = (record) => { setSelectedRecord(record); setIsDetailModalVisible(true); };
    const showInvoiceModal = (record) => { setSelectedRecord(record); setIsInvoiceModalVisible(true); };
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
                    <Col xs={24} sm={12} md={14}><Search placeholder="Tìm theo tên bệnh nhân..." onSearch={setSearchText} onChange={e => !e.target.value && setSearchText('')} allowClear enterButton /></Col>
                    <Col xs={24} sm={12} md={10} style={{ textAlign: 'right' }}><Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Tải lại</Button></Col>
                </Row>
            </Card>

            <Table columns={columns} dataSource={filteredRecords} loading={loading} rowKey="id" bordered style={{ marginTop: 16 }} scroll={{ x: 'max-content' }}/>

            <Modal title={`Chi Tiết Phiếu Khám Bệnh #${selectedRecord?.id}`} open={isDetailModalVisible} onCancel={handleModalClose} footer={null} width={800} destroyOnClose>
                <PKBDetailView pkbData={selectedRecord} />
            </Modal>
            
            <Modal
                title={`Hóa đơn cho Phiếu khám #${selectedRecord?.id}`}
                open={isInvoiceModalVisible}
                onCancel={handleModalClose}
                footer={[
                    <Button key="back" onClick={handleModalClose}>Đóng</Button>,
                    <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>In / Lưu PDF</Button>
                ]}
                width={800}
                destroyOnClose
            >
                {/* Component này chỉ để xem trước */}
                <InvoiceContent record={selectedRecord} />
            </Modal>

            {/* Component ẩn dùng cho việc in ấn */}
            {selectedRecord && (
                <div style={{ display: 'none' }}>
                    <InvoiceContent record={selectedRecord} ref={invoiceContentRef} />
                </div>
            )}
        </div>
    );
};
        
export default MedicalRecordListPage;