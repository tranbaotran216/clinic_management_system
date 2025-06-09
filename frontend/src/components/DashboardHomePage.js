// frontend/src/components/DashboardHomepage.js
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from './App'; // Đảm bảo đường dẫn đúng
import { Row, Col, Card, Statistic, Typography, Spin, Alert } from 'antd';
import { DollarCircleOutlined, SolutionOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const DashboardHomePage = () => { // Đổi tên component nếu tên file khác
    const { currentUser } = useContext(AuthContext);
    const [summaryData, setSummaryData] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true); // Bắt đầu là true
    const [errorSummary, setErrorSummary] = useState('');

    useEffect(() => {
        console.log("DHP useEffect: currentUser is", currentUser);
        if (!currentUser || !currentUser.permissions) { // Quan trọng: Kiểm tra cả permissions
            console.log("DHP: currentUser or permissions not ready, setting loadingSummary=false");
            setLoadingSummary(false); // Không fetch nếu user hoặc permissions chưa sẵn sàng
            setSummaryData({}); // Đảm bảo không hiển thị dữ liệu cũ hoặc lỗi
            return;
        }

        const fetchSummary = async () => {
            console.log("DHP fetchSummary: STARTING, setLoadingSummary(true)");
            setLoadingSummary(true);
            setErrorSummary('');
            try {
                const token = localStorage.getItem('authToken');
                // console.log("DHP fetchSummary: Token is", token);
                if (!token) {
                    setErrorSummary('Token không tồn tại để lấy summary.');
                    return; // Không fetch nếu không có token (finally sẽ set loading false)
                }

                const response = await fetch('/quan-ly-tai-khoan/dashboard/summary/', { // URL API summary
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log("DHP fetchSummary: API summary response status:", response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log("DHP fetchSummary: API summary data OK:", data);
                    setSummaryData(data);
                } else {
                    const errorText = await response.text();
                    console.error("DHP fetchSummary: API Summary Error - Status:", response.status, "Text:", errorText);
                    setErrorSummary(`Lỗi tải summary: ${response.status}`);
                    setSummaryData({});
                }
            } catch (error) {
                console.error("DHP fetchSummary: CATCH block - Error fetching summary:", error);
                setErrorSummary('Lỗi mạng hoặc lỗi xử lý khi tải summary.');
                setSummaryData({});
            } finally {
                console.log("DHP fetchSummary: FINALLY block, setLoadingSummary(false)");
                setLoadingSummary(false); // LUÔN LUÔN GỌI Ở ĐÂY
            }
        };

        fetchSummary();

    }, [currentUser]); // Chạy lại khi currentUser thay đổi

    // Logic render giữ nguyên như file bạn đã cung cấp
    // Chỉ cần đảm bảo currentUser được kiểm tra trước khi truy cập permissions
    if (!currentUser) {
         // RequireAuth nên xử lý việc này, nhưng để an toàn:
        return <Spin tip="Đang chờ thông tin người dùng..." style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }} />;
    }

    if (loadingSummary) {
        return <Spin tip="Đang tải dữ liệu dashboard..." style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }} />;
    }

    const userPermissions = currentUser.permissions || [];
    const canViewAppointmentCount = userPermissions.includes('appointments.view_daily_appointment_count');
    const canViewRevenue = userPermissions.includes('reports.view_daily_revenue_summary');

    return (
        // ... (phần JSX render giữ nguyên như file DashboardHomepage.js bạn gửi) ...
        <div>
            <Title level={2} style={{ marginBottom: '4px' }}>Chào mừng {currentUser.ho_ten || currentUser.ten_dang_nhap}!</Title>
            <Paragraph type="secondary" style={{ marginBottom: '24px' }}>Đây là trang tổng quan chính của phòng mạch.</Paragraph>

            {errorSummary && !loadingSummary && <Alert message="Lỗi Tải Dữ Liệu" description={errorSummary} type="error" showIcon style={{ marginBottom: 16 }} />}

            {!loadingSummary && !errorSummary && (
                <Row gutter={[16, 16]}>
                    {(canViewAppointmentCount && summaryData && summaryData.daily_appointments !== undefined) && (
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="Lượt khám hôm nay"
                                    value={summaryData.daily_appointments}
                                    prefix={<SolutionOutlined />}
                                    valueStyle={{ color: '#3f8600' }}
                                />
                            </Card>
                        </Col>
                    )}
                    {(canViewRevenue && summaryData && summaryData.daily_revenue !== undefined) && (
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Card hoverable>
                                <Statistic
                                    title="Doanh thu hôm nay"
                                    value={summaryData.daily_revenue}
                                    precision={0}
                                    prefix={<DollarCircleOutlined />}
                                    suffix="VNĐ"
                                    valueStyle={{ color: '#cf1322' }}
                                />
                            </Card>
                        </Col>
                    )}
                </Row>
            )}
            {!loadingSummary && !errorSummary &&
             !(canViewAppointmentCount && summaryData && summaryData.daily_appointments !== undefined) &&
             !(canViewRevenue && summaryData && summaryData.daily_revenue !== undefined) &&
             (Object.keys(summaryData || {}).length === 0 || (summaryData && summaryData.message)) &&
                <Alert message="Thông báo" description={summaryData?.message || "Không có thông tin tóm tắt nào được hiển thị cho bạn."} type="info" showIcon />
            }
        </div>
    );
};

export default DashboardHomePage; // Hoặc DashboardHomepage