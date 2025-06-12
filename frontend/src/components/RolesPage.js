// frontend/src/RolesPage.js
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from './App';
import { getPermissionTranslation } from './utils/permissionTranslations';
import {
    Typography, Table, Button, Modal, Form, Input,
    Space, Popconfirm, message, Tooltip, Row, Col, Checkbox, Spin, Alert, Collapse, Empty, Tag
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

const PermissionAssignmentForm = ({ groupedPermissions, loading }) => {
    const modelToGroupTitle = {
        taikhoan: 'Quản trị: Tài khoản & Vai trò',
        group: 'Quản trị: Tài khoản & Vai trò',
        benhnhan: 'Nghiệp vụ: Khám chữa bệnh',
        dskham: 'Nghiệp vụ: Khám chữa bệnh',
        pkb: 'Nghiệp vụ: Khám chữa bệnh',
        chitietpkb: 'Nghiệp vụ: Khám chữa bệnh',
        hoadon: 'Nghiệp vụ: Thanh toán & Báo cáo',
        thuoc: 'Quản lý Dược & Kho',
        cachdung: 'Quản lý Dược & Kho',
        donvitinh: 'Quản lý Dược & Kho',
        loaibenh: 'Danh mục chung',
    };
    
    const collapseItems = useMemo(() => {
        if (loading || !groupedPermissions) return [];
        const permissionsByGroupTitle = Object.entries(groupedPermissions).reduce((acc, [modelName, perms]) => {
            const groupTitle = modelToGroupTitle[modelName] || `Chức năng khác: ${modelName}`;
            if (!acc[groupTitle]) acc[groupTitle] = [];
            acc[groupTitle].push(...perms);
            return acc;
        }, {});

        if (Object.keys(permissionsByGroupTitle).length === 0) return null;

        return Object.entries(permissionsByGroupTitle).map(([groupTitle, permsInGroup]) => ({
            key: groupTitle,
            label: <Typography.Text strong>{groupTitle}</Typography.Text>,
            children: (
                <Row gutter={[8, 16]}>
                    {permsInGroup.map(perm => (
                        <Col xs={24} sm={12} md={8} lg={6} key={perm.id}>
                            <Checkbox value={perm.id}>{getPermissionTranslation(perm.full_codename)}</Checkbox>
                        </Col>
                    ))}
                </Row>
            ),
        }));
    }, [groupedPermissions, loading]);

    if (loading) return <div style={{ textAlign: 'center', padding: '30px' }}><Spin tip="Đang tải danh sách quyền..." /></div>;
    if (!collapseItems) return <Empty description="Không tìm thấy quyền nào để gán." />;

    return (
        <Form.Item name="permission_ids" noStyle>
            <Checkbox.Group style={{ width: '100%' }}>
                <Collapse items={collapseItems} defaultActiveKey={collapseItems.map(item => item.key)} />
            </Checkbox.Group>
        </Form.Item>
    );
};

const RolesPage = () => {
    const { currentUser } = useContext(AuthContext);
    const [roles, setRoles] = useState([]);
    const [allSystemPermissions, setAllSystemPermissions] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
    const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [roleToAssign, setRoleToAssign] = useState(null);
    const [roleForm] = Form.useForm();
    const [permissionForm] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [searchText, setSearchText] = useState('');

    const canViewRoles = currentUser?.permissions?.includes('auth.view_group');
    const canAddRole = currentUser?.permissions?.includes('auth.add_group');
    const canChangeRole = currentUser?.permissions?.includes('auth.change_group');
    const canDeleteRole = currentUser?.permissions?.includes('auth.delete_group');
    const canAssignPermissions = canChangeRole;

    const groupedPermissionsForModal = useMemo(() => {
        const internalApps = ['admin', 'contenttypes', 'sessions'];
        const filtered = allSystemPermissions.filter(p => p.full_codename && !internalApps.some(app => p.full_codename.startsWith(app)));
        return filtered.reduce((acc, perm) => {
            const modelName = (perm.full_codename.split('.')[1] || '').split('_').pop();
            if (modelName) {
                if (!acc[modelName]) acc[modelName] = [];
                acc[modelName].push(perm);
            }
            return acc;
        }, {});
    }, [allSystemPermissions]);
    
    const filteredRoles = useMemo(() => {
        if (!searchText) return roles;
        const lowercasedSearchText = searchText.toLowerCase();
        return roles.filter(role => role.name.toLowerCase().includes(lowercasedSearchText));
    }, [roles, searchText]);

    const fetchData = async () => {
        if (!canViewRoles) return;
        setLoadingTable(true);
        try {
            const token = localStorage.getItem('authToken');
            const headers = { 'Authorization': `Bearer ${token}` };
            const [rolesRes, permsRes] = await Promise.all([fetch('/api/groups/', { headers }), fetch('/api/permissions/', { headers })]);
            const rolesData = rolesRes.ok ? await rolesRes.json() : [];
            const permsData = permsRes.ok ? await permsRes.json() : [];
            setRoles(rolesData.results || rolesData);
            setAllSystemPermissions(permsData.results || permsData);
            if (!rolesRes.ok) message.error(`Tải DS vai trò thất bại (Lỗi ${rolesRes.status})`);
            if (!permsRes.ok) message.error(`Tải DS quyền thất bại (Lỗi ${permsRes.status})`);
        } catch (error) { message.error('Lỗi khi tải dữ liệu: ' + error.message); }
        finally { setLoadingTable(false); }
    };

    useEffect(() => { if (canViewRoles) fetchData(); }, [canViewRoles]);
    
    const showRoleModal = (role = null) => {
        setEditingRole(role);
        roleForm.setFieldsValue(role ? { name: role.name } : { name: '' });
        setIsRoleModalVisible(true);
    };
    
    const handleRoleFormSubmit = async (values) => {
        setIsSubmitting(true);
        const method = editingRole ? 'PUT' : 'POST';
        const url = editingRole ? `/api/groups/${editingRole.id}/` : '/api/groups/';
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(values) });
            if (response.ok) {
                message.success(`Đã ${editingRole ? 'cập nhật' : 'tạo'} vai trò thành công!`);
                setIsRoleModalVisible(false);
                fetchData();
            } else {
                const errorData = await response.json().catch(() => ({}));
                message.error(`Lỗi: ${errorData.name?.[0] || errorData.detail || 'Thao tác thất bại'}`);
            }
        } catch (error) { message.error("Đã có lỗi xảy ra khi lưu vai trò."); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteRole = async (roleId) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/groups/${roleId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 204 || response.ok) {
                message.success('Đã xóa vai trò.');
                fetchData();
            } else { message.error('Lỗi khi xóa vai trò. Có thể vai trò này đang được gán cho người dùng.'); }
        } catch (error) { message.error('Lỗi kết nối khi xóa vai trò.'); }
        finally { setIsSubmitting(false); }
    };

    const showPermissionModal = (role) => {
        setRoleToAssign(role);
        const currentPermissionIds = role.permissions.map(p => p.id);
        permissionForm.setFieldsValue({ permission_ids: currentPermissionIds });
        setIsPermissionModalVisible(true);
    };

    const handlePermissionFormSubmit = async (values) => {
        if (!roleToAssign) return;
        setIsSubmitting(true);
        const token = localStorage.getItem('authToken');
        try {
            const payload = { permission_ids: values.permission_ids || [] };
            const response = await fetch(`/api/groups/${roleToAssign.id}/assign-permissions/`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
            });
            if (response.ok) {
                message.success('Cập nhật quyền cho vai trò thành công!');
                setIsPermissionModalVisible(false);
                fetchData();
            } else { message.error('Lỗi khi cập nhật quyền.'); }
        } catch (error) { message.error('Đã xảy ra lỗi khi lưu quyền.'); }
        finally { setIsSubmitting(false); }
    };

    const roleColumns = [
        { title: 'Tên Vai trò', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Số quyền', dataIndex: 'permissions', key: 'permissions_count', align: 'center', sorter: (a, b) => (a.permissions?.length || 0) - (b.permissions?.length || 0), render: p => <Tag color="blue">{p?.length || 0}</Tag> },
        {
            title: 'Hành động', key: 'action', width: 220, align: 'center',
            render: (_, role) => (
                <Space size="small">
                    {canAssignPermissions && <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => showPermissionModal(role)}>Phân quyền</Button>}
                    {canChangeRole && <Tooltip title="Sửa tên"><Button icon={<EditOutlined />} onClick={() => showRoleModal(role)} /></Tooltip>}
                    {canDeleteRole && <Popconfirm title={`Xóa vai trò "${role.name}"?`} onConfirm={() => handleDeleteRole(role.id)} okText="Xóa" cancelText="Hủy"><Tooltip title="Xóa"><Button danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm>}
                </Space>
            ),
        },
    ];

    if (!canViewRoles) return null; // Nếu không có quyền xem, không render gì cả

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Row justify="space-between" align="middle">
                <Col xs={24} md={12}>
                    <Search placeholder="Tìm theo tên vai trò..." onSearch={value => setSearchText(value)} onChange={e => !e.target.value && setSearchText('')} allowClear enterButton style={{ width: '90%' }} />
                </Col>
                <Col xs={24} md={12} style={{ textAlign: 'right', marginTop: '10px' }}>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loadingTable}>Tải lại</Button>
                        {canAddRole && <Button type="primary" icon={<PlusOutlined />} onClick={() => showRoleModal()}>Thêm Vai trò</Button>}
                    </Space>
                </Col>
            </Row>
            
            <Table columns={roleColumns} dataSource={filteredRoles} loading={loadingTable} rowKey="id" bordered />

            <Modal title={editingRole ? `Sửa tên vai trò` : "Thêm Vai trò mới"} open={isRoleModalVisible} onCancel={() => setIsRoleModalVisible(false)} destroyOnHidden footer={null}>
                <Form form={roleForm} layout="vertical" onFinish={handleRoleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="name" label="Tên Vai trò" rules={[{ required: true }]}><Input placeholder="Ví dụ: Bác sĩ, Lễ tân" /></Form.Item>
                    <Form.Item style={{ textAlign: 'right' }}><Space><Button onClick={() => setIsRoleModalVisible(false)}>Hủy</Button><Button type="primary" htmlType="submit" loading={isSubmitting}>Lưu</Button></Space></Form.Item>
                </Form>
            </Modal>

            {roleToAssign && (
                <Modal title={`Phân quyền cho vai trò: ${roleToAssign.name}`} open={isPermissionModalVisible} onCancel={() => setIsPermissionModalVisible(false)}
                    destroyOnHidden width={900}
                    footer={[
                        <Button key="back" onClick={() => setIsPermissionModalVisible(false)}>Hủy</Button>,
                        <Button key="submit" type="primary" loading={isSubmitting} onClick={() => permissionForm.submit()}>Lưu quyền</Button>,
                    ]}>
                    <Form form={permissionForm} onFinish={handlePermissionFormSubmit} layout="vertical" style={{ marginTop: '24px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '16px' }}>
                        <PermissionAssignmentForm groupedPermissions={groupedPermissionsForModal} loading={loadingPermissions} />
                    </Form>
                </Modal>
            )}
        </Space>
    );
};

export default RolesPage;