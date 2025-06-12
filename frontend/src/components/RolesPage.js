import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './App';
import {
    Typography, Table, Button, Modal, Form, Input,
    Space, Popconfirm, message, Tooltip, Row, Col, Checkbox, Spin, Alert
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';

const { Title } = Typography;

const RolesPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [roles, setRoles] = useState([]);
    const [allSystemPermissions, setAllSystemPermissions] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleToAssignPermissions, setRoleToAssignPermissions] = useState(null);
    const [roleForm] = Form.useForm();
    const [permissionForm] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingPermissions, setLoadingPermissions] = useState(false);

    // Dùng permission chuẩn của Django
    const canViewRoles = currentUser?.permissions?.includes('auth.view_group');
    const canAddRole = currentUser?.permissions?.includes('auth.add_group');
    const canChangeRole = currentUser?.permissions?.includes('auth.change_group');
    const canDeleteRole = currentUser?.permissions?.includes('auth.delete_group');
    const canAssignPermissions = canChangeRole;

    // ✅ FIX: Thêm dòng này để tránh lỗi
    const canManageRoles = canViewRoles || canAddRole || canChangeRole || canDeleteRole;

    const fetchData = async () => {
        if (!canViewRoles) return;
        setLoadingTable(true);
        try {
            const token = localStorage.getItem('authToken');
            const headers = { 'Authorization': `Bearer ${token}` };
            const [rolesResponse, systemPermissionsResponse] = await Promise.all([
                fetch('/api/groups/', { headers }),
                fetch('/api/permissions/', { headers })
            ]);

            if (rolesResponse.ok) {
                const rolesData = await rolesResponse.json();
                setRoles(Array.isArray(rolesData) ? rolesData : rolesData.results || []);
            } else { message.error(`Tải DS vai trò thất bại (Lỗi ${rolesResponse.status})`); }

            if (systemPermissionsResponse.ok) {
                const permsData = await systemPermissionsResponse.json();
                setAllSystemPermissions(Array.isArray(permsData) ? permsData : permsData.results || []);
            } else { message.error(`Tải DS quyền thất bại (Lỗi ${systemPermissionsResponse.status})`); }
        } catch (error) { message.error('Lỗi khi tải dữ liệu: ' + error.message); }
        setLoadingTable(false);
    };

    useEffect(() => {
        if (canViewRoles) fetchData();
    }, [canViewRoles]);

    const showRoleModal = (role = null) => {
        setEditingRole(role);
        if (role) {
            roleForm.setFieldsValue({ name: role.name });
        } else {
            roleForm.resetFields();
        }
        setIsRoleModalVisible(true);
    };

    const handleRoleFormSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const method = editingRole ? 'PUT' : 'POST';
            let url = '/api/groups/';
            if (editingRole) url += `${editingRole.id}/`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(values)
            });

            if (response.ok) {
                message.success(`Đã ${editingRole ? 'cập nhật' : 'tạo'} vai trò thành công!`);
                setIsRoleModalVisible(false);
                fetchData();
            } else {
                const errorData = await response.json().catch(() => ({}));
                message.error(`Lỗi: ` + (errorData.name?.[0] || errorData.detail || 'Thao tác thất bại'));
            }
        } catch (error) {
            console.log('Role form submission error:', error);
            message.error("Đã có lỗi xảy ra.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleModalCancel = () => setIsRoleModalVisible(false);

    const handleDeleteRole = async (roleId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/groups/${roleId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 204 || response.ok) {
                message.success('Đã xóa vai trò.');
                fetchData();
            } else {
                message.error('Lỗi khi xóa vai trò. Có thể vai trò này đang được sử dụng.');
            }
        } catch (error) {
            message.error('Lỗi kết nối khi xóa.');
        }
    };

    const showPermissionModal = async (role) => {
        setRoleToAssignPermissions(role);
        permissionForm.resetFields();
        setIsPermissionModalVisible(true);
        setLoadingPermissions(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/groups/${role.id}/permissions/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const currentPermissionsCodenames = await response.json();
                permissionForm.setFieldsValue({ permissions: currentPermissionsCodenames });
            } else {
                message.error('Lỗi tải quyền hiện tại của vai trò.');
            }
        } catch (error) {
            message.error('Lỗi kết nối khi tải quyền.');
        }
        setLoadingPermissions(false);
    };

    const handlePermissionModalCancel = () => setIsPermissionModalVisible(false);

    const handlePermissionModalOk = async () => {
        setIsSubmitting(true);
        try {
            const values = await permissionForm.validateFields();
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/groups/${roleToAssignPermissions.id}/assign-permissions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ permissions_codenames: values.permissions }),
            });
            if (response.ok) {
                message.success('Cập nhật quyền cho vai trò thành công!');
                setIsPermissionModalVisible(false);
            } else {
                message.error('Lỗi khi cập nhật quyền cho vai trò.');
            }
        } catch (error) {
            console.log('Assign permissions error:', error);
        }
        setIsSubmitting(false);
    };

    const roleColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
        { title: 'Tên Vai trò (Group)', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        {
            title: 'Hành động', key: 'action', width: 220,
            render: (_, role) => (
                <Space size="middle">
                    {canAssignPermissions && (<Tooltip title="Phân quyền cho vai trò này"><Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => showPermissionModal(role)}>Phân quyền</Button></Tooltip>)}
                    {canChangeRole && (<Tooltip title="Sửa tên vai trò"><Button icon={<EditOutlined />} onClick={() => showRoleModal(role)} /></Tooltip>)}
                    {canDeleteRole && (<Popconfirm title={`Xóa vai trò "${role.name}"?`} onConfirm={() => handleDeleteRole(role.id)} okText="Xóa" cancelText="Hủy" okType="danger"><Tooltip title="Xóa vai trò"><Button danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm>)}
                </Space>
            ),
        },
    ];

    const permissionCheckboxOptions = allSystemPermissions.map(p => ({
        label: `${p.name} (${p.full_codename})`,
        value: p.full_codename,
    }));

    if (!canManageRoles) {
        return <Alert message="Truy cập bị từ chối" description="Bạn không có quyền quản lý vai trò và phân quyền." type="error" showIcon />;
    }

    return (
        <div>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col><Title level={3} style={{ margin: 0 }}>Quản lý Vai trò & Phân quyền</Title></Col>
                <Col>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loadingTable} />
                        {canAddRole && <Button type="primary" icon={<PlusOutlined />} onClick={() => showRoleModal()}>Thêm Vai trò</Button>}
                    </Space>
                </Col>
            </Row>

            <Alert message="Hướng dẫn" type="info" showIcon style={{ marginBottom: 24 }}
                description="Tại đây, bạn có thể tạo các vai trò (ví dụ: Bác sĩ, Lễ tân). Sau đó, nhấn nút 'Phân quyền' để gán các quyền cụ thể cho từng vai trò. Cuối cùng, vào trang 'Quản lý Tài khoản' để gán người dùng vào các vai trò này." />

            <Table columns={roleColumns} dataSource={roles} loading={loadingTable} rowKey="id" bordered />

            <Modal
                title={editingRole ? `Sửa tên vai trò` : "Thêm Vai trò mới"}
                open={isRoleModalVisible}
                onCancel={handleRoleModalCancel}
                destroyOnClose
                footer={[
                    <Button key="back" onClick={handleRoleModalCancel}>Hủy</Button>,
                    <Button key="submit" type="primary" loading={isSubmitting} onClick={() => roleForm.submit()}>
                        {editingRole ? 'Lưu' : 'Thêm'}
                    </Button>,
                ]}
            >
                <Form form={roleForm} layout="vertical" name="role_form" onFinish={handleRoleFormSubmit}>
                    <Form.Item name="name" label="Tên Vai trò" rules={[{ required: true, message: 'Vui lòng nhập tên vai trò!' }]}>
                        <Input placeholder="Ví dụ: Bác sĩ, Lễ tân, Kế toán" />
                    </Form.Item>
                </Form>
            </Modal>

            {roleToAssignPermissions && (
                <Modal
                    title={`Phân quyền cho vai trò: ${roleToAssignPermissions.name}`}
                    open={isPermissionModalVisible}
                    onOk={handlePermissionModalOk}
                    onCancel={handlePermissionModalCancel}
                    okText="Lưu quyền"
                    cancelText="Hủy"
                    destroyOnClose
                    width={800}
                    confirmLoading={isSubmitting}
                >
                    {loadingPermissions ? (
                        <div style={{ textAlign: 'center', padding: '30px' }}><Spin tip="Đang tải..." /></div>
                    ) : (
                        <Form form={permissionForm} layout="vertical">
                            <Form.Item name="permissions" label="Chọn các quyền cho vai trò này:">
                                <Checkbox.Group style={{ width: '100%' }}>
                                    <Row gutter={[8, 16]}>
                                        {permissionCheckboxOptions.map(option => (
                                            <Col xs={24} sm={12} key={option.value}>
                                                <Checkbox value={option.value}>{option.label}</Checkbox>
                                            </Col>
                                        ))}
                                    </Row>
                                </Checkbox.Group>
                            </Form.Item>
                        </Form>
                    )}
                </Modal>
            )}
        </div>
    );
};

export default RolesPage;
