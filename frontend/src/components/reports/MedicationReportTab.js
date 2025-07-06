import React, { useState, useEffect, useRef } from 'react';
import { Table, DatePicker, Button, Card, Row, Col, message, Spin, Typography, Space } from 'antd';
import { PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    const reportRef = React.useRef();
    
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

    const handlePrint = useReactToPrint({
        content: () => reportRef.current,
        documentTitle: `BaoCaoSuDungThuoc_${selectedMonth.format('MM-YYYY')}`
    });
    
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
                        <DatePicker onChange={setSelectedMonth} picker="month" defaultValue={selectedMonth} format="MM/YYYY" allowClear={false} />
                    </Col>
                    <Col>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={() => fetchReport(selectedMonth)} loading={loading} />
                            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>In báo cáo</Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <div ref={reportRef} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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