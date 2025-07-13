// File: frontend/src/components/reports/RevenueReportTab.js

import React, { useState, useEffect } from 'react';
import { Table, DatePicker, Button, Card, Row, Col, message, Spin, Typography, Space } from 'antd';
import { ReloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const { Title } = Typography;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const RevenueReportTab = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(dayjs());

    const fetchReport = async (month) => {
        if (!month) return;
        setLoading(true);
        setData([]);
        try {
            const params = { month: month.month() + 1, year: month.year() };
            const query = new URLSearchParams(params).toString();
            const response = await fetch(`/api/reports/revenue/?${query}`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Lỗi tải báo cáo doanh thu');
            const reportData = await response.json();
            setData(Array.isArray(reportData) ? reportData : []);
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(selectedMonth);
    }, [selectedMonth]);
    
    const handleExcelExport = () => {
        if (data.length === 0) {
            message.warning('Không có dữ liệu để xuất file Excel.');
            return;
        }
        message.loading({ content: 'Đang tạo file Excel...', key: 'excel_export', duration: 0 });
        const totalRow = {
            ngay: 'Tổng cộng',
            so_benh_nhan: data.reduce((sum, item) => sum + item.so_benh_nhan, 0),
            doanh_thu: data.reduce((sum, item) => sum + parseFloat(item.doanh_thu), 0),
            ty_le: '100%',
        };
        const formattedData = data.map(item => ({ 'Ngày': dayjs(item.ngay).format('DD/MM/YYYY'), 'Số bệnh nhân': item.so_benh_nhan, 'Doanh thu (VND)': item.doanh_thu, 'Tỷ lệ (%)': item.ty_le, }));
        const finalData = [ ...formattedData, { 'Ngày': 'Tổng cộng', 'Số bệnh nhân': totalRow.so_benh_nhan, 'Doanh thu (VND)': totalRow.doanh_thu, 'Tỷ lệ (%)': totalRow.ty_le, } ];
        const ws = XLSX.utils.json_to_sheet(finalData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "BaoCaoDoanhThu");
        const fileName = `BaoCaoDoanhThu_${selectedMonth.format('MM-YYYY')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        message.success({ content: 'Tạo file Excel thành công!', key: 'excel_export', duration: 2 });
    };

    const columns = [
        { title: 'STT', key: 'stt', render: (_, __, i) => i + 1, width: 60, align: 'center' },
        { title: 'Ngày', dataIndex: 'ngay', sorter: (a, b) => dayjs(a.ngay).unix() - dayjs(b.ngay).unix(), render: (d) => dayjs(d).format('DD/MM/YYYY') },
        { title: 'Số bệnh nhân', dataIndex: 'so_benh_nhan', align: 'center', sorter: (a, b) => a.so_benh_nhan - b.so_benh_nhan },
        { title: 'Doanh thu (VND)', dataIndex: 'doanh_thu', align: 'right', sorter: (a, b) => a.doanh_thu - b.doanh_thu, render: (val) => new Intl.NumberFormat('vi-VN').format(val) },
        { title: 'Tỷ lệ (%)', dataIndex: 'ty_le', align: 'right', sorter: (a, b) => a.ty_le - b.ty_le, render: (val) => `${val}%` },
    ];

    const formatYAxis = (tickItem) => {
        if (tickItem >= 1000000) return `${tickItem / 1000000}tr`;
        if (tickItem >= 1000) return `${tickItem / 1000}k`;
        return tickItem;
    };
    
    const totalRevenue = data.reduce((sum, item) => sum + parseFloat(item.doanh_thu), 0);

    return (
        <div style={{ display: 'grid', gap: '24px' }}>
            <Card>
                <Row justify="space-between" align="middle">
                    <Col><DatePicker onChange={setSelectedMonth} picker="month" defaultValue={selectedMonth} format="MM-YYYY" allowClear={false} /></Col>
                    <Col><Space><Button icon={<ReloadOutlined />} onClick={() => fetchReport(selectedMonth)} loading={loading} /><Button type="primary" icon={<FileExcelOutlined />} onClick={handleExcelExport}>Lưu Excel</Button></Space></Col>
                </Row>
            </Card>
            
            <Title level={4} style={{ textAlign: 'center', margin: 0 }}>BÁO CÁO DOANH THU THÁNG {selectedMonth.format("MM/YYYY")}</Title>
            
            <Card>
                {loading ? <div style={{height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Spin /></div> : (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={data} margin={{ top: 100, right: 30, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ngay" tickFormatter={(dateStr) => dayjs(dateStr).format('DD')} />
                        <YAxis 
                            yAxisId="left" 
                            tickFormatter={formatYAxis} 
                            label={{ value: 'Doanh thu (VND)', angle: -90, position: 'insideLeft' }}
                            domain={[0, 'dataMax + 100000']} // Tăng khoảng cách đỉnh
                        />
                        <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            allowDecimals={false} 
                            label={{ value: 'Số bệnh nhân', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip formatter={(value, name) => [new Intl.NumberFormat('vi-VN').format(value), name]} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="doanh_thu" name="Doanh thu" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="so_benh_nhan" name="Số bệnh nhân" stroke="#82ca9d" />
                    </LineChart>
                </ResponsiveContainer>
                )}
            </Card>

            <Title level={5}>Bảng chi tiết</Title>
            <Table columns={columns} dataSource={data} rowKey="ngay" loading={loading} bordered pagination={false}
                summary={() => (
                    <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2}><Typography.Text strong>Tổng cộng</Typography.Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="center"><Typography.Text strong>{data.reduce((sum, item) => sum + item.so_benh_nhan, 0)}</Typography.Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right"><Typography.Text strong>{new Intl.NumberFormat('vi-VN').format(totalRevenue)}</Typography.Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right"><Typography.Text strong>100%</Typography.Text></Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </div>
    );
};
export default RevenueReportTab;