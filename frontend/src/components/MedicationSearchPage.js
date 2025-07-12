// frontend/src/components/MedicationSearchPage.js

import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
    Table, Button, Space, Typography, InputNumber, Row, Col, Card, Select, Input, message, Dropdown, Menu
} from 'antd';
import { ReloadOutlined, FilterOutlined, DownOutlined } from '@ant-design/icons';
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

    const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);

    const [selectedUnitIds, setSelectedUnitIds] = useState([]); // Lọc theo nhiều đơn vị tính
    const [minQuantity, setMinQuantity] = useState(null); // Lọc theo số lượng tồn tối thiểu
    const [maxQuantity, setMaxQuantity] = useState(null); // Lọc theo số lượng tồn tối đa
    const [minPrice, setMinPrice] = useState(null); // Lọc theo đơn giá tối thiểu
    const [maxPrice, setMaxPrice] = useState(null); // Lọc theo đơn giá tối đa

    const [sortOrder, setSortOrder] = useState(null); 

    const canView = currentUser?.permissions?.includes('accounts.view_thuoc');

    const fetchData = async () => {
        if (!canView) {
            message.warning('Bạn không có quyền xem thông tin thuốc.');
            return;
        }
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
            console.error("Lỗi khi tải dữ liệu:", error); 
            message.error('Lỗi kết nối khi tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [canView]);

    const processedMedicines = useMemo(() => {
        let currentFiltered = medicines;

        // Lọc theo tên thuốc
        if (searchText) {
            currentFiltered = currentFiltered.filter(med =>
                med.ten_thuoc?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Lọc theo đơn vị tính (nếu có lựa chọn)
        if (selectedUnitIds.length > 0) {
            currentFiltered = currentFiltered.filter(med =>
                selectedUnitIds.includes(med.don_vi_tinh?.id)
            );
        }

        // Lọc theo số lượng tồn
        if (minQuantity !== null && minQuantity !== undefined) {
            currentFiltered = currentFiltered.filter(med => med.so_luong_ton >= minQuantity);
        }
        if (maxQuantity !== null && maxQuantity !== undefined) {
            currentFiltered = currentFiltered.filter(med => med.so_luong_ton <= maxQuantity);
        }

        // Lọc theo đơn giá
        if (minPrice !== null && minPrice !== undefined) {
            currentFiltered = currentFiltered.filter(med => med.don_gia >= minPrice);
        }
        if (maxPrice !== null && maxPrice !== undefined) {
            currentFiltered = currentFiltered.filter(med => med.don_gia <= maxPrice);
        }

        // Sắp xếp
        if (sortOrder) {
            currentFiltered = [...currentFiltered].sort((a, b) => {
                switch (sortOrder) {
                    case 'name_asc':
                        return a.ten_thuoc.localeCompare(b.ten_thuoc);
                    case 'name_desc':
                        return b.ten_thuoc.localeCompare(a.ten_thuoc);
                    case 'quantity_asc':
                        return a.so_luong_ton - b.so_luong_ton;
                    case 'quantity_desc':
                        return b.so_luong_ton - a.so_luong_ton;
                    case 'price_asc':
                        return a.don_gia - b.don_gia;
                    case 'price_desc':
                        return b.don_gia - a.don_gia;
                    default:
                        return 0;
                }
            });
        }

        return currentFiltered;
    }, [medicines, searchText, selectedUnitIds, minQuantity, maxQuantity, minPrice, maxPrice, sortOrder]);

    const columns = [
        { title: 'STT', key: 'stt', render: (_, __, index) => index + 1, width: 60, align: 'center' },
        { title: 'Tên thuốc', dataIndex: 'ten_thuoc', sorter: (a, b) => a.ten_thuoc.localeCompare(b.ten_thuoc) },
        {
            title: 'Đơn vị tính',
            dataIndex: ['don_vi_tinh', 'ten_don_vi_tinh'],
        },
        { title: 'Cách dùng mặc định', dataIndex: ['cach_dung_mac_dinh', 'ten_cach_dung'] },
        {
            title: 'Số lượng tồn',
            dataIndex: 'so_luong_ton',
            sorter: (a, b) => a.so_luong_ton - b.so_luong_ton,
            align: 'right',
        },
        { title: 'Hạn sử dụng', dataIndex: 'han_su_dung', render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A' },
        {
            title: 'Đơn giá (VND)',
            dataIndex: 'don_gia',
            align: 'right',
            render: (price) => new Intl.NumberFormat('vi-VN').format(price),
            sorter: (a, b) => a.don_gia - b.don_gia,
        },
    ];

    const filterMenu = (
        <Menu>
            <Menu.Item key="unit-filter" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label>Đơn vị tính:</label>
                    <Select
                        mode="multiple" 
                        placeholder="Chọn đơn vị tính"
                        style={{ width: 200 }}
                        value={selectedUnitIds}
                        onChange={setSelectedUnitIds}
                        allowClear
                        onMouseDown={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()} 
                    >
                        {units.map(unit => (
                            <Option key={unit.id} value={unit.id}>
                                {unit.ten_don_vi_tinh}
                            </Option>
                        ))}
                    </Select>
                </div>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="quantity-filter" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label>Số lượng tồn:</label>
                    <Space>
                        <InputNumber
                            placeholder="Min"
                            style={{ width: 95 }}
                            value={minQuantity}
                            onChange={setMinQuantity}
                            min={0}
                            onMouseDown={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                            onClick={e => e.stopPropagation()}
                        />
                        <span>-</span>
                        <InputNumber
                            placeholder="Max"
                            style={{ width: 95 }}
                            value={maxQuantity}
                            onChange={setMaxQuantity}
                            min={0}
                            onMouseDown={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                            onClick={e => e.stopPropagation()}
                        />
                    </Space>
                </div>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="price-filter" style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label>Đơn giá (VND):</label>
                    <Space>
                        <InputNumber
                            placeholder="Min"
                            style={{ width: 95 }}
                            value={minPrice}
                            onChange={setMinPrice}
                            min={0}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/,/g, '')}
                            onMouseDown={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                            onClick={e => e.stopPropagation()}
                        />
                        <span>-</span>
                        <InputNumber
                            placeholder="Max"
                            style={{ width: 95 }}
                            value={maxPrice}
                            onChange={setMaxPrice}
                            min={0}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/,/g, '')}
                            onMouseDown={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                            onClick={e => e.stopPropagation()}
                        />
                    </Space>
                </div>
            </Menu.Item>
            <Menu.Divider />
            {}
            <Menu.Item key="action-buttons" style={{ padding: '8px 12px', textAlign: 'right' }}>
                <Space>
                    <Button
                        onClick={() => {
                            setSelectedUnitIds([]);
                            setMinQuantity(null);
                            setMaxQuantity(null);
                            setMinPrice(null);
                            setMaxPrice(null);
                        }}
                    >
                        Đặt lại
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => {
                            setFilterDropdownVisible(false);
                        }}
                    >
                        Áp dụng
                    </Button>
                </Space>
            </Menu.Item>
        </Menu>
    );

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Tra cứu thuốc</Title>
            <Card>
                <Row gutter={[16, 16]} justify="space-between" align="middle">
                    <Col>
                        <Space>
                            {}
                            <Dropdown
                                overlay={filterMenu}
                                trigger={['click']}
                                open={filterDropdownVisible} 
                                onOpenChange={setFilterDropdownVisible} 
                            >
                                <Button icon={<FilterOutlined />}>
                                    Lọc <DownOutlined />
                                </Button>
                            </Dropdown>
                            {}
                            <Select
                                placeholder="Sắp xếp"
                                style={{ width: 150 }}
                                value={sortOrder} 
                                onChange={setSortOrder} 
                                allowClear 
                            >
                                <Option value="name_asc">Tên thuốc A-Z</Option>
                                <Option value="name_desc">Tên thuốc Z-A</Option>
                                <Option value="quantity_asc">Số lượng tồn tăng dần</Option>
                                <Option value="quantity_desc">Số lượng tồn giảm dần</Option>
                                <Option value="price_asc">Đơn giá tăng dần</Option>
                                <Option value="price_desc">Đơn giá giảm dần</Option>
                            </Select>
                        </Space>
                    </Col>
                    <Col>
                        <Search
                            placeholder="Tra cứu tên thuốc..."
                            onSearch={setSearchText}
                            onChange={e => !e.target.value && setSearchText('')}
                            allowClear
                            style={{ width: 300 }}
                        />
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
                dataSource={processedMedicines} 
                rowKey="id"
                bordered
                loading={loading}
                style={{ marginTop: 16 }}
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 6 }} 
            />
        </div>
    );
};

export default MedicationSearchPage;