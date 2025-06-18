import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Space, Modal, Tooltip, Typography, message, Spin, Row, Col } from 'antd';
import { EyeOutlined, EditOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './App';
import dayjs from 'dayjs';
import PKBDetailView from './PKBDetailView'; // Component hiển thị chi tiết PKB (sẽ tạo ở bước sau)
// import InvoiceDetailViewModal from './InvoiceDetailViewModal'; // Component hiển thị chi tiết Hóa Đơn (sẽ tạo sau)

const { Title } = Typography;

// Hàm helper để tạo header với token
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const MedicalRecordListPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isPkbModalVisible, setIsPkbModalVisible] = useState(false);
    // const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false); // Sẽ dùng sau
    const [selectedItem, setSelectedItem] = useState(null);

    const navigate = useNavigate();

    // Lấy quyền
    const canChange = currentUser?.permissions?.includes('accounts.change_pkb');
    const canViewInvoice = currentUser?.permissions?.includes('accounts.view_hoadon');

    const fetchMedicalRecords = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/pkb/', { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Lỗi tải danh sách phiếu khám.');
            const data = await response.json();
            // API của ViewSet thường trả về object có key 'results'
            setMedicalRecords(Array.isArray(data) ? data : data.results || []); 
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedicalRecords();
    }, []);

    const showPkbModal = (record) => {
        setSelectedItem(record);
        setIsPkbModalVisible(true);
    };

    const handleEditPKB = (pkbId) => {
        navigate(`/dashboard/medical-records/${pkbId}/edit`);
    };

    const handleModalClose = () => {
        setIsPkbModalVisible(false);
        // setIsInvoiceModalVisible(false);
        setSelectedItem(null);
    };

    const columns = [
        { title: 'Mã PKB', dataIndex: 'id', key: 'id', width: 100 },
        { title: 'Bệnh nhân', dataIndex: ['benh_nhan', 'ho_ten'], key: 'benh_nhan' },
        { title: 'Ngày khám', dataIndex: 'ngay_kham', key: 'ngay_kham', render: (text) => dayjs(text).format('DD/MM/YYYY') },
        { title: 'Chẩn đoán', dataIndex: ['loai_benh_chuan_doan', 'ten_loai_benh'], key: 'chuan_doan', render: (text) => text || 'Chưa có' },
        {
            title: 'Hành Động',
            key: 'action',
            width: 280,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => showPkbModal(record)}>
                        Xem Chi Tiết
                    </Button>
                    {canChange && (
                        <Button icon={<EditOutlined />} onClick={() => handleEditPKB(record.id)}>
                            Sửa
                        </Button>
                    )}
                    {canViewInvoice && record.hoa_don_lien_ket && (
                        <Tooltip title={`Xem HĐ #${record.hoa_don_lien_ket.id}`}>
                            <Button type="dashed" icon={<FileTextOutlined />}>
                                HĐ
                            </Button>
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                 <Col><Title level={4} style={{margin: 0}}>Danh sách Phiếu Khám Bệnh Đã Tạo</Title></Col>
                 <Col><Button icon={<ReloadOutlined />} onClick={fetchMedicalRecords} loading={loading} /></Col>
            </Row>

            <Table
                columns={columns}
                dataSource={medicalRecords}
                loading={loading}
                rowKey="id"
                bordered
            />

            <Modal
                title={`Chi Tiết Phiếu Khám Bệnh #${selectedItem?.id}`}
                open={isPkbModalVisible}
                onCancel={handleModalClose}
                footer={null}
                width={800}
                destroyOnClose
            >
                {/* Dùng component PKBDetailView để hiển thị chi tiết */}
                {selectedItem && <PKBDetailView pkbData={selectedItem} />}
            </Modal>
        </div>
    );
};

export default MedicalRecordListPage;