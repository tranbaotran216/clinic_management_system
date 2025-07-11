import React, { useState, useEffect, useContext } from 'react';
import { Typography, Row, Col, Card, Statistic, Spin, Alert, Avatar, Space, theme } from 'antd'; 
import { TeamOutlined, DollarCircleOutlined, UserOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AuthContext } from './App';
import eventBus from './utils/eventBus';

const { Title, Text } = Typography;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { 'Authorization': `Bearer ${token}` };
};

const COLORS = ['#7B66FF', '#5FBDFF', '#96EFFF', '#C5FFF8', '#84D2C5'];

const DashboardHomePage = () => {
    const { currentUser } = useContext(AuthContext);
    const [summaryData, setSummaryData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 2. Lấy các token màu của theme hiện tại
    const { token } = theme.useToken();

    const fetchSummary = async () => {
        setError('');
        try {
            const response = await fetch('/api/dashboard/summary/', { headers: getAuthHeaders() });
            if (response.ok) {
                const data = await response.json();
                setSummaryData(data);
            } else {
                throw new Error(`Lỗi ${response.status}: Không thể tải dữ liệu tóm tắt.`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if (currentUser) {
            setLoading(true);
            fetchSummary();
            const handlePkbCreated = () => fetchSummary();
            eventBus.on('pkb-created', handlePkbCreated);
            return () => eventBus.off('pkb-created', handlePkbCreated);
        }
    }, [currentUser]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>;
    }

    if (error) {
        return <Alert message="Lỗi" description={error} type="error" showIcon />;
    }

    // --- RENDER ---
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Hàng 1: Chào mừng và các chỉ số nhanh */}
            <Row gutter={[24, 24]} align="stretch">
                <Col xs={24} md={8} lg={6}>
                    {/* 3. Dùng màu từ token cho Card Chào mừng */}
                    <Card style={{ 
                        background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorInfoBg} 100%)`, 
                        height: '100%', 
                        border: `1px solid ${token.colorBorderSecondary}`
                    }}>
                        <Space direction="vertical" align="center" style={{ width: '100%' }}>
                            <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: token.colorBgContainer, color: token.colorPrimary, border: `2px solid ${token.colorPrimaryBorder}` }} />
                            <Title level={4} style={{ marginTop: 16, marginBottom: 0, color: token.colorTextHeading }}>Chào Mừng Bạn!</Title>
                            <Text style={{ color: token.colorTextSecondary }}>{currentUser?.ho_ten}</Text>
                        </Space>
                    </Card>
                </Col>
                <Col xs={12} md={8} lg={5}>
                    <Card style={{ height: '100%' }}>
                        <Statistic
                            title="Lượt khám hôm nay"
                            value={summaryData?.daily_appointments ?? 0}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: token.colorPrimary }}
                        />
                    </Card>
                </Col>
                <Col xs={12} md={8} lg={5}>
                    <Card style={{ height: '100%' }}>
                        <Statistic
                            title="Doanh thu hôm nay"
                            value={summaryData?.daily_revenue ?? 0}
                            precision={0}
                            prefix={<DollarCircleOutlined />}
                            suffix="VNĐ"
                            valueStyle={{ color: token.colorSuccess }}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                     <Card style={{ height: '100%' }}>
                        <Statistic
                            title="Nhân viên xuất sắc (Tuần)"
                            value={summaryData.top_employee_week?.nguoi_lap_phieu__ho_ten || 'Chưa có'}
                            prefix={<ArrowUpOutlined />}
                        />
                        <Text type="secondary">
                            {summaryData.top_employee_week ? `Với ${summaryData.top_employee_week.pkb_count} phiếu khám` : 'Chưa có dữ liệu'}
                        </Text>
                    </Card>
                </Col>
            </Row>

            {/* Hàng 2: Các biểu đồ */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title="Thống kê bệnh nhân trong 7 ngày qua">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={summaryData.weekly_patient_stats} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid stroke={token.colorBorderSecondary} />
                                <XAxis dataKey="date" stroke={token.colorTextSecondary} />
                                <YAxis allowDecimals={false} stroke={token.colorTextSecondary} />
                                <Tooltip contentStyle={{ backgroundColor: token.colorBgElevated, borderColor: token.colorBorderSecondary }} />
                                <Legend />
                                <Line type="monotone" dataKey="so_benh_nhan" name="Số bệnh nhân" stroke={token.colorPrimary} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Top 5 bệnh phổ biến (tuần)">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={summaryData.top_diseases_stats}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {summaryData.top_diseases_stats?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} ca`, name]} contentStyle={{ backgroundColor: token.colorBgElevated, borderColor: token.colorBorderSecondary }}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardHomePage;