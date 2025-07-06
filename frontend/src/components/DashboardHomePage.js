// frontend/src/components/DashboardHomepage.js (PHIÊN BẢN ĐÃ DECOR)

import React, { useState, useEffect, useContext } from 'react';
import { Typography, Row, Col, Card, Statistic, Spin, Alert, Avatar, Space } from 'antd';
import { TeamOutlined, DollarCircleOutlined, UserOutlined } from '@ant-design/icons';
import { AuthContext } from './App';
import eventBus from './utils/eventBus';

const { Title, Text } = Typography;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { 'Authorization': `Bearer ${token}` };
};

const DashboardHomePage = () => {
    const { currentUser } = useContext(AuthContext);
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUser) {
            const fetchSummary = async () => {
                setLoading(true);
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
            fetchSummary();

            eventBus.on('pkb-created', fetchSummary);
            
            return () => {
                eventBus.off('pkb-created', fetchSummary);
            }
        }
    }, [currentUser]);

    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '...';
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    // Card chào mừng theo thiết kế
    const WelcomeCard = () => (
        <Card style={{ background: 'linear-gradient(135deg, #e6f7ff 0%, #f6ffed 100%)', border: 'none' }}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#fff', color: '#1890ff', border: '2px solid #91d5ff' }} />
                <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>Chào Mừng Bạn!</Title>
                <Text type="secondary">{currentUser?.ho_ten}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{currentUser?.email}</Text>
            </Space>
        </Card>
    );

    // Card thống kê
    const StatCard = ({ icon, title, value, color, loading }) => (
        <Card loading={loading} style={{ border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
            <Statistic
                title={<Space>{icon}{title}</Space>}
                value={value}
                valueStyle={{ color: color, fontSize: '2.5rem', fontWeight: 500 }}
            />
        </Card>
    );
    
    // Logic render chính
    const renderContent = () => {
        if (error) {
            return <Alert message="Lỗi" description={error} type="error" showIcon />;
        }

        return (
            <Row gutter={[24, 24]}>
                {/* Cột Chào mừng */}
                <Col xs={24} md={8}>
                    <WelcomeCard />
                </Col>

                {/* Cột Thống kê */}
                <Col xs={24} md={16}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <StatCard
                            loading={loading}
                            icon={<TeamOutlined style={{ color: '#1890ff' }} />}
                            title="Lượt khám bệnh hôm nay"
                            value={summaryData?.daily_appointments ?? 0}
                            color="#1890ff"
                        />
                        <StatCard
                            loading={loading}
                            icon={<DollarCircleOutlined style={{ color: '#52c41a' }}/>}
                            title="Doanh thu hôm nay"
                            value={`${formatCurrency(summaryData?.daily_revenue ?? 0)} VNĐ`}
                            color="#3f8600"
                        />
                    </Space>
                </Col>
            </Row>
        );
    };

    return (
        <div>
            {/* Header chung có thể nằm ở DashboardLayout */}
            {/* <Title level={3}>Dashboard</Title> */}
            {renderContent()}
        </div>
    );
};

export default DashboardHomePage;