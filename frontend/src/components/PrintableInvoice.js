import React from 'react';
import { Descriptions, Table, Typography } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PrintableInvoice = ({ record }) => {
    if (!record || !record.hoa_don_lien_ket) {
        return <div className="printable-area"><Text type="secondary">Không có dữ liệu hóa đơn.</Text></div>;
    }

    const invoice = record.hoa_don_lien_ket;
    const patient = record.benh_nhan;

    const printStyles = `
        /* @page là quy tắc để điều khiển chính trang giấy in */
        @page {
            size: A4; /* Chỉ định khổ giấy là A4 */
            margin: 20mm; /* Tạo lề 2cm cho tất cả các cạnh (trên, dưới, trái, phải) */
        }

        /* @media print là quy tắc cho nội dung BÊN TRONG trang giấy */
        @media print {
            /* Thiết lập font chữ và cỡ chữ cơ bản cho trang in */
            body {
                font-family: 'Times New Roman', Times, serif; /* Font chữ chuyên nghiệp cho in ấn */
                font-size: 12pt; /* Cỡ chữ tiêu chuẩn cho văn bản */
            }

            /* Quy tắc cũ: Ẩn tất cả mọi thứ trước */
            body * {
                visibility: hidden;
            }

            /* Quy tắc cũ: Chỉ hiện khu vực hóa đơn */
            .printable-area, .printable-area * {
                visibility: visible;
            }

            /* Quy tắc cũ: Đặt hóa đơn lên trên cùng */
            .printable-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }

            /* --- TINH CHỈNH FONT CHỮ CHO ĐẸP HƠN --- */
            .printable-area .ant-typography,
            .printable-area .ant-descriptions-item-label,
            .printable-area .ant-descriptions-item-content,
            .printable-area .ant-table {
                font-size: 12pt !important; /* Đảm bảo tất cả chữ có cùng cỡ */
                color: #000 !important; /* Đảm bảo chữ màu đen */
            }

            .printable-area .ant-typography[class*="level-3"] { /* HÓA ĐƠN THANH TOÁN */
                font-size: 22pt !important;
                font-weight: bold;
            }

            .printable-area .ant-typography[class*="level-4"] { /* Tên phòng mạch */
                font-size: 16pt !important;
                font-weight: bold;
            }

            .printable-area .ant-typography[class*="level-5"] { /* (Phiếu khám #) và Chi tiết đơn thuốc */
                font-size: 14pt !important;
                font-weight: bold;
            }
        }
    `;

    return (
        <div className="printable-area">
            <style>{printStyles}</style>
            
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={4}>PHÒNG MẠCH MEDICAL CLINIC</Title>
                <Text>Địa chỉ: Khu phố 12, Linh Trung, TP. Thủ Đức</Text><br />
                <Text>SĐT: 0355.644.805</Text>
            </div>
            <Title level={3} style={{ textAlign: 'center' }}>HÓA ĐƠN THANH TOÁN</Title>
            <Title level={5} style={{ textAlign: 'center', marginTop: -10, marginBottom: 24 }}>(Phiếu khám #{record.id})</Title>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Bệnh nhân">{patient.ho_ten}</Descriptions.Item>
                <Descriptions.Item label="Ngày thanh toán">{dayjs(invoice.ngay_thanh_toan).format('HH:mm DD/MM/YYYY')}</Descriptions.Item>
            </Descriptions>
            <Title level={5}>Chi tiết đơn thuốc</Title>
            <Table
                dataSource={record.chi_tiet_don_thuoc}
                rowKey="id" size="small" pagination={false} bordered
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
                )}
            />
            <Descriptions bordered column={1} size="small" style={{ marginTop: 24 }}>
                <Descriptions.Item label="Tiền khám">{new Intl.NumberFormat('vi-VN').format(invoice.tien_kham)} VND</Descriptions.Item>
                <Descriptions.Item label="Tổng tiền thuốc">{new Intl.NumberFormat('vi-VN').format(invoice.tien_thuoc)} VND</Descriptions.Item>
                <Descriptions.Item label={<Text strong>TỔNG CỘNG THANH TOÁN</Text>}><Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>{new Intl.NumberFormat('vi-VN').format(invoice.tong_tien)} VND</Text></Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                    <Text strong>Người lập phiếu</Text>
                    <br /><br /><br />
                    <Text strong>{record.nguoi_lap_phieu?.ho_ten || '.........................'}</Text>
                    <br/>
                    <Text type="secondary" style={{fontStyle: 'italic'}}>(Ký tên)</Text>
                </div>
                <div>
                    <Text strong>Người thanh toán</Text>
                    <br /><br /><br />
                    <Text strong>{record.benh_nhan?.ho_ten || '.........................'}</Text>
                    <br/>
                    <Text type="secondary" style={{fontStyle: 'italic'}}>(Ký tên)</Text>
                </div>
            </div>
        </div>
    );
};

export default PrintableInvoice;