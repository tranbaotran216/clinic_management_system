// frontend/src/components/MedicationSearchPage.js

import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
    Table, Button, Space, Typography, InputNumber, Row, Col, Card, Select, Input
} from 'antd';
import { ReloadOutlined, FilterOutlined } from '@ant-design/icons';
import { AuthContext } from './App';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
};

const MedicationSearchPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [medicines, setMedicines] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const canView = currentUser?.permissions?.includes('accounts.view_thuoc');

    const fetchData = async () => {
        if (!canView) return;
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            const [medicinesRes, unitsRes] = await Promise.all([
                fetch('/api/thuoc/', { headers }),
                fetch('/api/don-vi-tinh/', { headers })
            ]);

            if (medicinesRes.ok && unitsRes.ok) {
                const medicinesData = await medicinesRes.json();
                const unitsData = await unitsRes.json();
                setMedicines(Array.isArray(medicinesData) ? medicinesData : (medicinesData.results || []));
                setUnits(Array.isArray(unitsData) ? unitsData : (unitsData.results || []));
            } else {
                message.error('Lỗi khi tải dữ liệu từ máy chủ.');
            }
        } catch (error) {
            message.error('Lỗi kết nối khi tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [canView]);
    
    const filteredMedicines = useMemo(() => {
        if (!searchText) return medicines;
        return medicines.filter(med => med.ten_thuoc?.toLowerCase().includes(searchText.toLowerCase()));
    }, [medicines, searchText]);

    const columns = [
        { title: 'STT', key: 'stt', render: (_, __, index) => index + 1, width: 60, align: 'center' },
        { title: 'Tên thuốc', dataIndex: 'ten_thuoc', sorter: (a, b) => a.ten_thuoc.localeCompare(b.ten_thuoc) },
        { title: 'Đơn vị tính', dataIndex: ['don_vi_tinh', 'ten_don_vi_tinh'], filters: units.map(u => ({ text: u.ten_don_vi_tinh, value: u.id })), onFilter: (value, record) => record.don_vi_tinh.id === value },
        { title: 'Cách dùng mặc định', dataIndex: ['cach_dung_mac_dinh', 'ten_cach_dung'] },
        { title: 'Số lượng tồn', dataIndex: 'so_luong_ton', sorter: (a, b) => a.so_luong_ton - b.so_luong_ton, align: 'right' },
        { title: 'Hạn sử dụng', dataIndex: 'han_su_dung', render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A' },
        { title: 'Đơn giá (VND)', dataIndex: 'don_gia', align: 'right', render: (price) => new Intl.NumberFormat('vi-VN').format(price), sorter: (a, b) => a.don_gia - b.don_gia },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Tra cứu thông tin thuốc</Title>
            <Card>
                <Row gutter={[16, 16]} justify="space-between">
                    <Col>
                        <Space>
                            <Button icon={<FilterOutlined />}>Lọc</Button>
                            <Select placeholder="Sắp xếp" style={{ width: 150 }}><Option value="name_asc">Tên thuốc A-Z</Option></Select>
                        </Space>
                    </Col>
                    <Col>
                        <Search placeholder="Tra cứu tên thuốc..." onSearch={setSearchText} onChange={e => !e.target.value && setSearchText('')} allowClear style={{ width: 300 }} />
                    </Col>
                    <Col>
                        <Space>
                             <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} />
                        </Space>
                    </Col>
                </Row>
            </Card>
            <Table
                columns={columns}
                dataSource={filteredMedicines}
                rowKey="id"
                bordered
                loading={loading}
                style={{ marginTop: 16 }}
                scroll={{ x: 'max-content' }}
            />
        </div>
    );
};

export default MedicationSearchPage;