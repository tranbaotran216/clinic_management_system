// frontend/src/AccountsPage.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './App';
import {
    Typography, Table, Button, Modal, Form, Input, Select,
    Space, Popconfirm, message, Tag, Tooltip, Row, Col, Tabs, Alert
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined
} from '@ant-design/icons';
import RolesPage from './RolesPage'; // Import trang quản lý vai trò

const { Option } = Select;
const { Title } = Typography;

// --- Component con cho Tab Quản lý Người dùng ---
const UserManagementTab = () => {
    const { currentUser } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();

    const canAddAccounts = currentUser?.permissions?.includes('accounts.add_taikhoan');
    const canChangeAccounts = currentUser?.permissions?.includes('accounts.change_taikhoan');
    const canDeleteAccounts = currentUser?.permissions?.includes('accounts.delete_taikhoan');

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const headers = { 'Authorization': `Bearer ${token}` };
            const [usersRes, groupsRes] = await Promise.all([
                fetch('/api/users/', { headers }),
                fetch('/api/groups/', { headers })
            ]);

            if (usersRes.ok && groupsRes.ok) {
                const usersData = await usersRes.json();
                const groupsData = await groupsRes.json();
                setUsers(usersData.results || usersData);
                setGroups(groupsData.results || groupsData);
            } else {
                message.error('Tải dữ liệu người dùng hoặc vai trò thất bại.');
            }
        } catch (error) {
            message.error('Lỗi kết nối khi tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const showModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            form.setFieldsValue({ ...user, groups: user.groups.map(g => g.id) });
        } else {
            form.resetFields();
            form.setFieldsValue({ is_active: true });
        }
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem('authToken');
            const method = editingUser ? 'PUT' : 'POST';
            let url = '/api/users/';
            if (editingUser) url += `${editingUser.id}/`;

            let payload = { ...values };
            if (editingUser && (!values.password || values.password.trim() === '')) {
                delete payload.password;
                delete payload.password2;
            }

            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (response.ok) {
                message.success(`Đã ${editingUser ? 'cập nhật' : 'tạo'} tài khoản thành công!`);
                setIsModalVisible(false);
                fetchData();
            } else {
                const errorData = await response.json().catch(() => ({}));
                message.error(`Lỗi: ${errorData.detail || Object.values(errorData).flat().join(' ')}`, 7);
            }
        } catch (errorInfo) { console.log('Validation/API error:', errorInfo); }
    };

    const handleCancel = () => { setIsModalVisible(false); };

    const handleDelete = async (userId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/users/${userId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 204 || response.ok) {
                message.success('Xóa tài khoản thành công!');
                fetchData();
            } else { message.error((await response.json().catch(() => ({}))).detail || 'Lỗi khi xóa tài khoản.'); }
        } catch (error) { message.error('Lỗi kết nối khi xóa.'); }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id, width: 80 },
        { title: 'Họ tên', dataIndex: 'ho_ten', key: 'ho_ten' },
        { title: 'Tên đăng nhập', dataIndex: 'ten_dang_nhap', key: 'ten_dang_nhap' },
        {
            title: 'Vai trò', key: 'groups', dataIndex: 'groups',
            render: (groups) => <Space wrap>{groups?.map(g => <Tag color="blue" key={g.id}>{g.name}</Tag>)}</Space>,
        },
        {
            title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active',
            render: isActive => <Tag color={isActive ? 'success' : 'error'}>{isActive ? 'Hoạt động' : 'Đã khóa'}</Tag>,
        },
        {
            title: 'Hành động', key: 'action', width: 120,
            render: (_, record) => (
                <Space>
                    {canChangeAccounts && <Tooltip title="Sửa"><Button shape="circle" icon={<EditOutlined />} onClick={() => showModal(record)} /></Tooltip>}
                    {canDeleteAccounts && currentUser && record.id !== currentUser.id && (
                        <Popconfirm title="Xóa tài khoản này?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
                            <Tooltip title="Xóa"><Button shape="circle" danger icon={<DeleteOutlined />} /></Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Row justify="end" style={{ marginBottom: 16 }}>
                <Space>
                    <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Tải lại</Button>
                    {canAddAccounts && <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>Thêm người dùng</Button>}
                </Space>
            </Row>
            <Table columns={columns} dataSource={users} loading={loading} rowKey="id" bordered />
            <Modal title={editingUser ? `Sửa: ${editingUser.ten_dang_nhap}` : "Thêm người dùng"} open={isModalVisible} onOk={handleOk} onCancel={handleCancel} destroyOnClose>
                <Form form={form} layout="vertical">
                    <Form.Item name="ho_ten" label="Họ tên" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                    <Form.Item name="ten_dang_nhap" label="Tên đăng nhập" rules={[{ required: true }]}><Input disabled={!!editingUser} /></Form.Item>
                    <Form.Item name="groups" label="Vai trò" rules={[{ required: true }]}>
                        <Select mode="multiple" placeholder="Chọn vai trò">{groups.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}</Select>
                    </Form.Item>
                    <Form.Item name="is_active" label="Trạng thái" initialValue={true}><Select><Option value={true}>Hoạt động</Option><Option value={false}>Khóa</Option></Select></Form.Item>
                    <Form.Item name="password" label={editingUser ? "Mật khẩu mới (bỏ trống nếu không đổi)" : "Mật khẩu"} rules={editingUser ? [] : [{ required: true }]} hasFeedback><Input.Password /></Form.Item>
                    <Form.Item name="password2" label="Xác nhận mật khẩu" dependencies={['password']} hasFeedback rules={[({ getFieldValue }) => ({ required: !!getFieldValue('password'), validator: (_, value) => !value || getFieldValue('password') === value ? Promise.resolve() : Promise.reject(new Error('Mật khẩu không khớp!')) })]}><Input.Password /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// --- Component Cha chính, chứa Tabs ---
const AccountsPage = () => {
    const { currentUser } = useContext(AuthContext);

    // Kiểm tra quyền để quyết định có hiển thị Tab Vai trò hay không
    const canViewRoles = currentUser?.permissions?.includes('auth.view_group');

    const tabItems = [
        {
            key: 'users',
            label: `Quản lý Người dùng`,
            children: <UserManagementTab />,
        },
    ];

    if (canViewRoles) {
        tabItems.push({
            key: 'roles',
            label: `Quản lý Vai trò & Phân quyền`,
            children: <RolesPage />,
        });
    }

    return (
        <div>
            <Title level={3} style={{ marginBottom: 24 }}>
                Quản lý Hệ thống
            </Title>
            <Tabs defaultActiveKey="users" type="card" items={tabItems} />
        </div>
    );
};

export default AccountsPage;