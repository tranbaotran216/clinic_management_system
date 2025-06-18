import React from 'react';
import { Typography, Descriptions, Table, Button, Space, message, Divider } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const PKBDetailView = ({ pkbData }) => {
    const navigate = useNavigate();

    if (!pkbData) {
        return <Text>Không có dữ liệu để hiển thị.</Text>;
    }

    const chiTietColumns = [
        { title: 'STT', key: 'stt', render: (text, record, index) => index + 1, width: 50 },
        { title: 'Tên thuốc', dataIndex: ['thuoc', 'ten_thuoc'], key: 'ten_thuoc' },
        { title: 'ĐVT', dataIndex: ['thuoc', 'don_vi_tinh', 'ten_don_vi_tinh'], key: 'don_vi_tinh' },
        { title: 'Số lượng', dataIndex: 'so_luong_ke', key: 'so_luong_ke', align: 'center' },
        { title: 'Cách dùng', dataIndex: ['cach_dung_chi_dinh', 'ten_cach_dung'], key: 'cach_dung' },
    ];

    const handleViewInvoice = () => {
        // Chúng ta sẽ làm chức năng này sau, tạm thời chỉ log
        if (pkbData.hoa_don_lien_ket && pkbData.hoa_don_lien_ket.id) {
            message.info(`Sẽ mở hóa đơn #${pkbData.hoa_don_lien_ket.id}`);
            // navigate(`/dashboard/billing/${pkbData.hoa_don_lien_ket.id}`);
        } else {
            message.info("Phiếu khám này chưa có hóa đơn.");
        }
    };

    return (
        <div>
            <Descriptions title="Thông tin chung" bordered column={2} size="small">
                <Descriptions.Item label="Mã PKB">{pkbData.id}</Descriptions.Item>
                <Descriptions.Item label="Ngày khám">{dayjs(pkbData.ngay_kham).format('DD/MM/YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Bệnh nhân">{pkbData.benh_nhan?.ho_ten}</Descriptions.Item>
                <Descriptions.Item label="Chẩn đoán">{pkbData.loai_benh_chuan_doan?.ten_loai_benh || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Triệu chứng" span={2}>{pkbData.trieu_chung || 'N/A'}</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 20, marginBottom: 10 }}>Đơn thuốc</Title>
            <Table
                columns={chiTietColumns}
                dataSource={pkbData.chi_tiet_don_thuoc || []}
                rowKey="id"
                pagination={false}
                size="small"
                bordered
            />

            {pkbData.hoa_don_lien_ket && (
                 <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <Button type="primary" onClick={handleViewInvoice}>
                        Xem Hóa Đơn
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PKBDetailView;