import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Button, Card, Row, Col, message, Spin, Typography, Space } from 'antd';
// Đã xóa PrinterOutlined, chỉ giữ lại các icon cần thiết
import { ReloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
// Đã xóa các import liên quan đến react-to-print
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const { Title } = Typography;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const MedicationReportTab = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(dayjs());
    // Đã xóa reportRef vì không còn dùng để in
    
    const fetchReport = async (month) => {
        if (!month) return;
        setLoading(true);
        setData([]);
        try {
            const params = { month: month.month() + 1, year: month.year() };
            const query = new URLSearchParams(params).toString();
            const response = await fetch(`/api/reports/medication-usage/?${query}`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Lỗi tải báo cáo thuốc');
            const reportData = await response.json();
            setData(Array.isArray(reportData) ? reportData : []);
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => { fetchReport(selectedMonth); }, [selectedMonth]);

    // Đã xóa hàm handlePrint
    
    const handleExcelExport = () => {
        if (data.length === 0) {
            message.warning('Không có dữ liệu để xuất file Excel.');
            return;
        }

        message.loading({ content: 'Đang tạo file Excel...', key: 'excel_export', duration: 0 });

        const formattedData = data.map(item => ({
            'Tên thuốc': item.ten_thuoc,
            'Đơn vị tính': item.don_vi_tinh,
            'Số lượng sử dụng': item.tong_so_luong_su_dung,
            'Số lần kê đơn': item.so_lan_ke_don,
        }));
        
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BaoCaoSuDungThuoc");
        
        const fileName = `BaoCaoSuDungThuoc_${selectedMonth.format('MM-YYYY')}.xlsx`;
        XLSX.writeFile(wb, fileName);

        message.success({ content: 'Tạo file Excel thành công!', key: 'excel_export', duration: 2 });
    };
    
    const columns = [
        { title: 'STT', key: 'stt', render: (_, __, i) => i + 1, width: 60, align: 'center' },
        { title: 'Thuốc', dataIndex: 'ten_thuoc', sorter: (a, b) => a.ten_thuoc.localeCompare(b.ten_thuoc) },
        { title: 'Đơn vị tính', dataIndex: 'don_vi_tinh', align: 'center' },
        { title: 'Số lượng sử dụng', dataIndex: 'tong_so_luong_su_dung', align: 'right', sorter: (a, b) => a.tong_so_luong_su_dung - b.tong_so_luong_su_dung },
        { title: 'Số lần kê đơn', dataIndex: 'so_lan_ke_don', align: 'right', sorter: (a, b) => a.so_lan_ke_don - b.so_lan_ke_don },
    ];
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <Card>
                <Row justify="space-between" align="middle">
                    <Col>
                        <DatePicker onChange={setSelectedMonth} picker="month" defaultValue={selectedMonth} format="MM-YYYY" allowClear={false} />
                    </Col>
                    <Col>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={() => fetchReport(selectedMonth)} loading={loading} />
                            {/* Nút Lưu Excel giờ là nút chính */}
                            <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExcelExport}>Lưu Excel</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Đã xóa ref={reportRef} khỏi thẻ div này */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Title level={4} style={{ textAlign: 'center', flexShrink: 0 }}>BÁO CÁO SỬ DỤNG THUỐC THÁNG {selectedMonth.format("MM/YYYY")}</Title>
                    <Card style={{ marginBottom: 24, flexShrink: 0 }}>
                        {loading ? <div style={{height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Spin /></div> : (
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={data.slice(0, 10).sort((a, b) => b.tong_so_luong_su_dung - a.tong_so_luong_su_dung)}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }} >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="ten_thuoc" width={120} interval={0} />
                                    <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN').format(value)} />
                                    <Legend />
                                    <Bar dataKey="tong_so_luong_su_dung" name="Tổng số lượng đã dùng" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Card>
                    <Title level={5} style={{ flexShrink: 0 }}>Bảng chi tiết</Title>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <Table columns={columns} dataSource={data} rowKey="thuoc_id" loading={loading} bordered pagination={{ pageSize: 15 }} />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default MedicationReportTab;