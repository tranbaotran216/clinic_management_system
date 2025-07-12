// frontend/src/components/RegulationPage.js (Đã sửa mã quy định)

import React, { useState, useEffect, useContext } from 'react';
import { Card, Col, Row, Typography, InputNumber, Button, Form, message, Spin, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { BookOutlined, EditOutlined, SaveOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { AuthContext } from './App';

const { Title } = Typography;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
};

// Component con để hiển thị một ô quy định
const RegulationInput = ({ regulation, onSave, canChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (regulation) {
            form.setFieldsValue({ gia_tri: regulation.gia_tri });
        }
    }, [regulation, form]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            onSave(regulation.ma_quy_dinh, values.gia_tri);
            setIsEditing(false);
        } catch (error) {
            console.log('Validation Failed:', error);
        }
    };

    if (!regulation) return <Card size="small" loading={true}></Card>;

    return (
        <Card title={regulation.ma_quy_dinh_display} size="small" style={{ textAlign: 'left' }}>
            <Form form={form}>
                <Space.Compact style={{ width: '100%' }}>
                    <Form.Item name="gia_tri" noStyle>
                        <InputNumber
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => String(value).replace(/\$\s?|(,*)/g, '')}
                            style={{ width: 'calc(100% - 32px)' }}
                            disabled={!isEditing}
                        />
                    </Form.Item>
                    {canChange && (
                        isEditing ? (
                            <Button icon={<SaveOutlined />} type="primary" onClick={handleSave} />
                        ) : (
                            <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)} />
                        )
                    )}
                </Space.Compact>
            </Form>
        </Card>
    );
};


const RegulationPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useContext(AuthContext);
    
    const [regulations, setRegulations] = useState([]);
    const [loading, setLoading] = useState(false);

    const canChangeRegulations = currentUser?.permissions?.includes('accounts.change_quydinhvalue');

    const fetchRegulations = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/quy-dinh-value/', { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Lỗi tải danh sách quy định');
            const data = await response.json();
            setRegulations(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            message.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegulations();
    }, []);

    const handleSaveRegulation = async (ma_quy_dinh, gia_tri) => {
        
        const numericValue = parseInt(String(gia_tri).replace(/,/g, ''), 10);

        // Kiểm tra xem giá trị có hợp lệ không
        if (isNaN(numericValue)) {
            message.error("Giá trị không hợp lệ.");
            return;
        }

        try {
            const response = await fetch(`/api/quy-dinh-value/${ma_quy_dinh}/`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ gia_tri: numericValue }) // Gửi đi giá trị số
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(Object.values(errorData).flat().join(' '));
            }
            
            message.success('Cập nhật quy định thành công!');
            fetchRegulations(); // Tải lại để hiển thị giá trị mới
        } catch (error) {
            message.error(`Lỗi cập nhật: ${error.message}`);
            // Có thể fetchRegulations() lại ở đây để revert về giá trị cũ nếu có lỗi
            fetchRegulations();
        }
    };
    
    // ✅ SỬA LẠI CÁC MÃ QUY ĐỊNH CHO KHỚP VỚI MODEL DJANGO
    const maxPatientsReg = regulations.find(r => r.ma_quy_dinh === 'MAX_PATIENTS_PER_DAY');
    const examFeeReg = regulations.find(r => r.ma_quy_dinh === 'BASE_EXAMINATION_FEE');

    const handleNavigate = (path) => {
        navigate(path);
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={3}>Quản lý quy định</Title>
            
            <Title level={4} style={{ marginTop: '32px', marginBottom: '16px' }}>Quy định chung</Title>
            {loading ? <Spin /> : (
                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                        <RegulationInput 
                            regulation={maxPatientsReg} 
                            onSave={handleSaveRegulation} 
                            canChange={canChangeRegulations} 
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                         <RegulationInput 
                            regulation={examFeeReg} 
                            onSave={handleSaveRegulation} 
                            canChange={canChangeRegulations} 
                        />
                    </Col>
                </Row>
            )}

            <Title level={4} style={{ marginTop: '48px', marginBottom: '16px' }}>Danh mục hệ thống</Title>
            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card hoverable style={{ borderRadius: 12, textAlign: 'center' }} onClick={() => handleNavigate('/dashboard/regulations/medicines')}>
                        <MedicineBoxOutlined style={{ fontSize: 36, color: '#ff4d4f' }} />
                        <Title level={5} style={{ marginTop: 16 }}>Quản lý Thuốc</Title>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card hoverable style={{ borderRadius: 12, textAlign: 'center' }} onClick={() => handleNavigate('/dashboard/regulations/diseases')}>
                        <BookOutlined style={{ fontSize: 36, color: '#1890ff' }} />
                        <Title level={5} style={{ marginTop: 16 }}>Quản lý Loại bệnh</Title>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card hoverable style={{ borderRadius: 12, textAlign: 'center' }} onClick={() => handleNavigate('/dashboard/regulations/units')}>
                        <BookOutlined style={{ fontSize: 36, color: '#52c41a' }} />
                        <Title level={5} style={{ marginTop: 16 }}>Quản lý Đơn vị tính</Title>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card hoverable style={{ borderRadius: 12, textAlign: 'center' }} onClick={() => handleNavigate('/dashboard/regulations/usages')}>
                        <BookOutlined style={{ fontSize: 36, color: '#faad14' }} />
                        <Title level={5} style={{ marginTop: 16 }}>Quản lý Cách dùng</Title>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default RegulationPage;