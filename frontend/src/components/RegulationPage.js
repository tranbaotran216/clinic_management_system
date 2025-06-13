import React, { useContext, useEffect } from 'react';
import { Card, Col, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { BookOutlined } from '@ant-design/icons';
import { AuthContext } from './App';

const { Title } = Typography;

const RegulationPage = () => {
    const navigate = useNavigate();
    // const { currentUser } = useContext(AuthContext);

    //  useEffect(() => {
    //     if (
    //         currentUser &&
    //         !(
    //             currentUser.permission?.includes('view_loaibenh') ||
    //             currentUser.permission?.includes('view_donvitinh') ||
    //             currentUser.permission?.includes('view_cachdung')
    //         )
    //     ) {
    //         navigate('/unauthorized');
    //     }
    // }, [currentUser, navigate]);

    const handleNavigate = (path) => {
        console.log('Navigating to: ', path);
        navigate(path);
    };

    const cardStyle = {
        cursor: 'pointer',
        borderRadius: '12px',
        transition: 'transform 0.2s',
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={3}>Quản lý quy định</Title>
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        style={{ borderRadius: 12, cursor: 'pointer' }}
                        title="Loại bệnh"
                        onClick={() => handleNavigate('/dashboard/regulations/diseases')}
                    >
                        <BookOutlined style={{ fontSize: 36, color: '#1890ff' }} />
                        <p style={{ marginTop: 16 }}>Các loại bệnh</p>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        style={{ borderRadius: 12, cursor: 'pointer' }}
                        title="Đơn vị tính"
                        onClick={() => handleNavigate('/dashboard/regulations/units')}
                    >
                        <BookOutlined style={{ fontSize: 36, color: '#52c41a' }} />
                        <p style={{ marginTop: 16 }}>Quản lý đơn vị đo lường thuốc</p>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        hoverable
                        style={{ borderRadius: 12, cursor: 'pointer' }}
                        title="Cách dùng"
                        onClick={() => handleNavigate('/dashboard/regulations/usages')}
                    >
                        <BookOutlined style={{ fontSize: 36, color: '#faad14' }} />
                        <p style={{ marginTop: 16 }}>Quản lý cách dùng thuốc</p>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default RegulationPage;
