// frontend/src/components/AccountsPage.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './App'; // Đảm bảo đường dẫn đúng
import {
    Typography, Table, Button, Modal, Form, Input, Select,
    Space, Popconfirm, message, Tag, Tooltip, Row, Col, Alert
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { Search } = Input;
const { Title } = Typography;

const AccountsPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]); // Danh sách các vai trò (Django Groups)
    const [loading, setLoading] = useState(false);
    const [isUserModalVisible, setIsUserModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm] = Form.useForm();
    const [globalSearchText, setGlobalSearchText] = useState('');

    // --- QUYỀN HẠN (ĐÃ SỬA LẠI TÊN QUYỀN CHO ĐÚNG) ---
    const canViewAccounts = currentUser?.permissions?.includes('accounts.view_taikhoan');
    const canAddAccounts = currentUser?.permissions?.includes('accounts.add_taikhoan');
    const canChangeAccounts = currentUser?.permissions?.includes('accounts.change_taikhoan');
    const canDeleteAccounts = currentUser?.permissions?.includes('accounts.delete_taikhoan');

    // --- FETCH DATA ---
    const fetchData = async () => {
        // Điều kiện if này đã đúng, không cần thay đổi
        if (!canViewAccounts) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            // Dùng Promise.all để gọi 2 API song song cho hiệu quả
            const [usersResponse, groupsResponse] = await Promise.all([
                fetch('/api/users/', { headers }),
                fetch('/api/groups/', { headers })
            ]);

            // Xử lý kết quả trả về từ API users
            if (usersResponse.ok) {
                const usersData = await usersResponse.json();
                // API của DRF ViewSet thường trả về một object có key 'results' nếu có phân trang
                setUsers(Array.isArray(usersData) ? usersData : usersData.results || []);
            } else { 
                message.error(`Tải DS tài khoản thất bại (Lỗi ${usersResponse.status})`); 
            }

            // Xử lý kết quả trả về từ API groups
            if (groupsResponse.ok) {
                const groupsData = await groupsResponse.json();
                setGroups(Array.isArray(groupsData) ? groupsData : groupsData.results || []);
            } else { 
                message.error(`Tải DS vai trò thất bại (Lỗi ${groupsResponse.status})`); 
            }
        } catch (error) { 
            message.error('Lỗi khi tải dữ liệu: ' + error.message); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Chỉ gọi fetchData nếu user có quyền xem
        if (canViewAccounts) {
            fetchData();
        }
    }, [canViewAccounts]); // Dependency array đã đúng

    // --- XỬ LÝ MODAL THÊM/SỬA USER ---
    const showUserModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            // Khi sửa, điền thông tin user vào form
            userForm.setFieldsValue({
                ho_ten: user.ho_ten,
                email: user.email,
                ten_dang_nhap: user.ten_dang_nhap,
                groups: user.groups.map(g => g.id), // Lấy mảng ID của các group
                is_active: user.is_active,
            });
        } else {
            // Khi thêm mới, reset form và đặt trạng thái mặc định
            userForm.resetFields();
            userForm.setFieldsValue({ is_active: true });
        }
        setIsUserModalVisible(true);
    };

    const handleUserModalOk = async () => {
        try {
            const values = await userForm.validateFields();
            const token = localStorage.getItem('authToken');
            const method = editingUser ? 'PUT' : 'POST';
            let url = '/api/users/';
            if (editingUser) url += `${editingUser.id}/`;

            let payload = { ...values };
            // Nếu đang sửa và không nhập mật khẩu mới, thì không gửi trường password
            if (editingUser && (!values.password || values.password.trim() === '')) {
                delete payload.password;
                delete payload.password2;
            }

            const response = await fetch(url, { 
                method, 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                body: JSON.stringify(payload) 
            });

            if (response.ok) {
                message.success(`Đã ${editingUser ? 'cập nhật' : 'tạo'} tài khoản thành công!`);
                setIsUserModalVisible(false);
                fetchData(); // Tải lại dữ liệu mới
            } else {
                // Hiển thị lỗi từ backend một cách chi tiết hơn
                const errorData = await response.json().catch(() => ({}));
                message.error(`Lỗi: ` + (errorData.detail || Object.values(errorData).flat().join(' ')), 7);
            }
        } catch (errorInfo) { 
            console.log('Lỗi validation hoặc API:', errorInfo); 
        }
    };

    const handleUserModalCancel = () => { 
        setIsUserModalVisible(false); 
        userForm.resetFields(); 
    };

    // --- XỬ LÝ XÓA USER ---
    const handleDeleteUser = async (userId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/users/${userId}/`, { 
                method: 'DELETE', 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (response.status === 204 || response.ok) { // 204 No Content là response thành công cho DELETE
                message.success('Xóa tài khoản thành công!');
                fetchData();
            } else { 
                const errorData = await response.json().catch(() => ({}));
                message.error(errorData.detail || 'Lỗi khi xóa tài khoản.'); 
            }
        } catch (error) { 
            message.error('Lỗi kết nối khi xóa.'); 
        }
    };

    // --- LỌC DỮ LIỆU ĐỂ HIỂN THỊ TRÊN BẢNG ---
    const filteredDataSource = users.filter(user => {
        if (!globalSearchText) return true;
        const searchTextLower = globalSearchText.toLowerCase();
        return (
            user.ho_ten?.toLowerCase().includes(searchTextLower) ||
            user.ten_dang_nhap?.toLowerCase().includes(searchTextLower) ||
            user.email?.toLowerCase().includes(searchTextLower)
        );
    });

    // --- ĐỊNH NGHĨA CÁC CỘT CHO BẢNG ---
    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id, width: 80, fixed: 'left' },
        { title: 'Họ tên', dataIndex: 'ho_ten', key: 'ho_ten', sorter: (a, b) => a.ho_ten.localeCompare(b.ho_ten) },
        { title: 'Tên đăng nhập', dataIndex: 'ten_dang_nhap', key: 'ten_dang_nhap' },
        {
            title: 'Vai trò (Groups)', key: 'groups', dataIndex: 'groups',
            render: (groups) => (<Space wrap>{groups?.map(g => <Tag color="blue" key={g.id}>{g.name}</Tag>)}</Space>),
            filters: groups.map(role => ({ text: role.name, value: role.id })),
            onFilter: (value, record) => record.groups.some(g => g.id === value),
        },
        {
            title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', width: 120,
            render: isActive => <Tag color={isActive ? 'success' : 'error'}>{isActive ? 'Hoạt động' : 'Đã khóa'}</Tag>,
            filters: [{ text: 'Hoạt động', value: true }, { text: 'Khóa', value: false }],
            onFilter: (value, record) => record.is_active === value,
        },
        {
            title: 'Hành động', key: 'action', width: 120, fixed: 'right',
            render: (_, record) => (
                <Space size="middle">
                    {canChangeAccounts && (<Tooltip title="Sửa"><Button type="link" icon={<EditOutlined />} onClick={() => showUserModal(record)} /></Tooltip>)}
                    {/* Không cho phép user tự xóa chính mình */}
                    {canDeleteAccounts && currentUser && record.id !== currentUser.id && (
                        <Popconfirm title="Xóa tài khoản?" description={`Xóa "${record.ten_dang_nhap}"?`} onConfirm={() => handleDeleteUser(record.id)} okText="Xóa" okType="danger" cancelText="Hủy">
                            <Tooltip title="Xóa"><Button type="link" danger icon={<DeleteOutlined />} /></Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    // Nếu không có quyền xem, hiển thị thông báo lỗi
    if (!canViewAccounts) {
        return <Alert message="Truy cập bị từ chối" description="Bạn không có quyền quản lý tài khoản." type="error" showIcon />;
    }

    // Nếu có quyền, render ra giao diện quản lý
    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col><Title level={3} style={{ margin: 0 }}>Quản lý Tài khoản</Title></Col>
                <Col>
                    <Space>
                        <Search placeholder="Tìm kiếm..." allowClear onSearch={setGlobalSearchText} onChange={e => !e.target.value && setGlobalSearchText('')} style={{ width: 300 }} enterButton />
                        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Tải lại</Button>
                        {canAddAccounts && <Button type="primary" icon={<PlusOutlined />} onClick={() => showUserModal()}>Thêm tài khoản</Button>}
                    </Space>
                </Col>
            </Row>

            <Table
                columns={columns} dataSource={filteredDataSource} loading={loading}
                rowKey="id" bordered scroll={{ x: 'max-content' }}
                pagination={{ showSizeChanger: true, defaultPageSize: 10, showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục` }}
            />

            <Modal
                title={editingUser ? `Cập nhật: ${editingUser.ten_dang_nhap}` : "Thêm tài khoản mới"}
                open={isUserModalVisible} onOk={handleUserModalOk} onCancel={handleUserModalCancel}
                okText={editingUser ? "Lưu" : "Tạo mới"} cancelText="Hủy" destroyOnClose
            >
                <Form form={userForm} layout="vertical" name="user_form">
                    <Form.Item name="ho_ten" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                    <Form.Item name="ten_dang_nhap" label="Tên đăng nhập" rules={[{ required: true }]}><Input disabled={!!editingUser} /></Form.Item>
                    <Form.Item name="groups" label="Vai trò (Groups)" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một vai trò!' }]}>
                        <Select mode="multiple" allowClear placeholder="Chọn vai trò">
                            {groups.map(group => (<Option key={group.id} value={group.id}>{group.name}</Option>))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="is_active" label="Trạng thái" initialValue={true}>
                        <Select><Option value={true}>Hoạt động</Option><Option value={false}>Khóa</Option></Select>
                    </Form.Item>
                    <Form.Item name="password" label={editingUser ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"} rules={editingUser ? [{ min: 6, message: 'Mật khẩu ít nhất 6 ký tự nếu nhập!'}] : [{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Mật khẩu ít nhất 6 ký tự!'}]} hasFeedback><Input.Password /></Form.Item>
                    <Form.Item name="password2" label="Xác nhận mật khẩu" dependencies={['password']} hasFeedback rules={[
                        ({ getFieldValue }) => ({
                            // Chỉ yêu cầu xác nhận nếu có nhập mật khẩu mới
                            required: !!getFieldValue('password'),
                            message: 'Vui lòng xác nhận mật khẩu!'
                        }),
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!getFieldValue('password') || !value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                            }
                        })
                    ]}><Input.Password /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AccountsPage;