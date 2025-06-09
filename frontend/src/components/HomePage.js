import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Row, Col, Card, Space } from 'antd'; // Import các component AntD
import { LoginOutlined, ScheduleOutlined, HomeOutlined, InfoCircleOutlined, SolutionOutlined } from '@ant-design/icons'; // Import icons

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

const HomePage = () => {
    const navigate = useNavigate();

    // Hàm xử lý khi click nút Đăng ký khám bệnh (bạn có thể thay đổi navigate đến trang thật sau)
    const handleRegisterAppointment = () => {
        // navigate('/register-appointment'); // Ví dụ: điều hướng đến trang đăng ký khám
        alert('Đi tới trang đăng ký khám bệnh (chức năng này sẽ được phát triển sau)');
    };

    return (
        <Layout className="layout" style={{ minHeight: '100vh' }}>
            {/* Header */}
            <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
                <div className="logo" style={{ color: 'white', fontSize: '1.5em', fontWeight: 'bold' }}>
                    <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
                        <HomeOutlined style={{ marginRight: 8 }} />
                        Phòng Mạch Tư
                    </Link>
                </div>
                <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['home']} style={{ lineHeight: '64px', flexGrow: 1, justifyContent: 'flex-end' }}>
                    <Menu.Item key="home" icon={<HomeOutlined />}>
                        <Link to="/">Trang chủ</Link>
                    </Menu.Item>
                    <Menu.Item key="services" icon={<SolutionOutlined />}>
                        <Link to="/services">Dịch vụ</Link>
                    </Menu.Item>
                    <Menu.Item key="intro" icon={<InfoCircleOutlined />}>
                        <Link to="/intro">Giới thiệu</Link>
                    </Menu.Item>
                    {/* Bạn có thể thêm nút Login/Register ở đây nếu muốn */}
                </Menu>
            </Header>

            {/* Nội dung chính */}
            <Content style={{ padding: '0 48px', marginTop: 24 }}>
                <div style={{ background: '#fff', padding: 48, minHeight: 380, textAlign: 'center', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
                    <Title level={2} style={{ marginBottom: 24 }}>
                        Chào mừng đến với Hệ thống Quản lý Phòng mạch Tư
                    </Title>
                    <Paragraph style={{ fontSize: '1.1em', color: '#595959', marginBottom: 40 }}>
                        Nơi bạn có thể dễ dàng đặt lịch khám, tra cứu thông tin bệnh án,
                        và tiếp cận các dịch vụ y tế chất lượng cao của chúng tôi.
                    </Paragraph>

                    {/* Các Card giới thiệu (Ví dụ) */}
                    <Row gutter={[16, 24]} justify="center" style={{ marginBottom: 40 }}>
                        <Col xs={24} sm={12} md={8}>
                            <Card title="Đặt Lịch Khám Nhanh Chóng" hoverable>
                                <ScheduleOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: 16 }} />
                                <Paragraph>Tiết kiệm thời gian với hệ thống đặt lịch trực tuyến tiện lợi.</Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card title="Tra Cứu Thông Tin Dễ Dàng" hoverable>
                                <InfoCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
                                <Paragraph>Truy cập hồ sơ bệnh án và lịch sử khám bệnh của bạn mọi lúc, mọi nơi.</Paragraph>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Card title="Dịch Vụ Chuyên Nghiệp" hoverable>
                                <SolutionOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: 16 }} />
                                <Paragraph>Đội ngũ y bác sĩ giàu kinh nghiệm, tận tâm và trang thiết bị hiện đại.</Paragraph>
                            </Card>
                        </Col>
                    </Row>


                    {/* Nút hành động */}
                    <Space size="large">
                        <Button
                            type="primary"
                            icon={<LoginOutlined />}
                            size="large"
                            onClick={() => navigate('/login')}
                        >
                            Đăng nhập Hệ thống
                        </Button>
                        <Button
                            type="default" // Hoặc type="primary" ghost
                            icon={<ScheduleOutlined />}
                            size="large"
                            onClick={handleRegisterAppointment}
                        >
                            Đăng ký khám bệnh
                        </Button>
                    </Space>
                </div>
            </Content>

            {/* Footer */}
            <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
                Phòng Mạch Tư ©{new Date().getFullYear()} - Chăm sóc sức khỏe tận tâm
            </Footer>
        </Layout>
    );
};

export default HomePage;