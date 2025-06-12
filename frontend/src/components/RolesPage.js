import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from './App';
// ✅ HÃY KIỂM TRA LẠI ĐƯỜNG DẪN NÀY! CÓ THỂ NÓ PHẢI LÀ '../utils/permissionTranslations'
import { getPermissionTranslation } from './utils/permissionTranslations';
import {
    Typography, Table, Button, Modal, Form, Input,
    Space, Popconfirm, message, Tooltip, Row, Col, Checkbox, Spin, Alert, Collapse, Empty
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';

const { Title } = Typography;

// ... Component PermissionAssignmentForm giữ nguyên như cũ ...
const PermissionAssignmentForm = ({ groupedPermissions, loading }) => {
    const modelTranslations = {
        taikhoan: 'Quản lý Tài khoản & Vai trò',
        group: 'Quản lý Tài khoản & Vai trò',
        benhnhan: 'Nghiệp vụ: Quản lý Bệnh nhân',
        dskham: 'Nghiệp vụ: Quản lý Lịch khám',
        pkb: 'Nghiệp vụ: Quản lý Phiếu khám',
        chitietpkb: 'Nghiệp vụ: Quản lý Phiếu khám',
        hoadon: 'Nghiệp vụ: Quản lý Hóa đơn',
        thuoc: 'Danh mục: Quản lý quy định',
        cachdung: 'Danh mục: Quản lý quy định',
        donvitinh: 'Danh mục: Quản lý quy định',
        loaibenh: 'Danh mục: Quản lý quy định',
    };
    
    const collapseItems = useMemo(() => {
        if (loading || !groupedPermissions) return [];
        
        const permissionsByGroupTitle = Object.entries(groupedPermissions).reduce((acc, [modelName, perms]) => {
            const groupTitle = modelTranslations[modelName] || `Khác: ${modelName}`;
            if (!acc[groupTitle]) {
                acc[groupTitle] = [];
            }
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
                        <Col xs={24} sm={12} key={perm.full_codename}>
                            <Checkbox value={perm.full_codename}>
                                {getPermissionTranslation(perm.full_codename)}
                            </Checkbox>
                        </Col>
                    ))}
                </Row>
            ),
        }));
    }, [groupedPermissions, loading]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '30px' }}><Spin tip="Đang tải danh sách quyền..." /></div>;
    }

    if (collapseItems === null) {
        return <Empty description="Không tìm thấy quyền nào để gán. Vui lòng kiểm tra lại cấu hình hệ thống." />;
    }

    return (
        <Form.Item name="permissions" label="Chọn các quyền cho vai trò này:">
            <Checkbox.Group style={{ width: '100%' }}>
                <Collapse items={collapseItems} defaultActiveKey={collapseItems.map(item => item.key)} />
            </Checkbox.Group>
        </Form.Item>
    );
};

// ===================================================================
// == COMPONENT CHÍNH: RolesPage                                    ==
// ===================================================================
const RolesPage = () => {
    // ... các state khác giữ nguyên ...
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

    const canViewRoles = currentUser?.permissions?.includes('auth.view_group');
    const canAddRole = currentUser?.permissions?.includes('auth.add_group');
    const canChangeRole = currentUser?.permissions?.includes('auth.change_group');
    const canDeleteRole = currentUser?.permissions?.includes('auth.delete_group');
    const canAssignPermissions = canChangeRole;
    const canManageRoles = canViewRoles || canAddRole || canChangeRole || canDeleteRole;


    const groupedPermissionsForModal = useMemo(() => {
        const internalApps = ['admin', 'contenttypes', 'sessions', 'auth.permission'];
        
        const filtered = allSystemPermissions.filter(p => 
            p.full_codename && !internalApps.some(app => p.full_codename.startsWith(app))
        );

        return filtered.reduce((acc, perm) => {
            const codenamePart = perm.full_codename.split('.')[1] || '';
            const modelName = codenamePart.split('_').pop();

            if (modelName) {
                if (!acc[modelName]) {
                    acc[modelName] = [];
                }
                acc[modelName].push(perm);
            }
            return acc;
        }, {});
    }, [allSystemPermissions]);

    // ✅ BƯỚC GỠ LỖI QUAN TRỌNG
    useEffect(() => {
        if (allSystemPermissions.length > 0) {
            console.log("--- DEBUGGING ROLES PAGE ---");
            console.log("1. Dữ liệu quyền gốc từ API (allSystemPermissions):", allSystemPermissions);
            console.log("2. Dữ liệu sau khi gom nhóm (groupedPermissionsForModal):", groupedPermissionsForModal);
        }
    }, [allSystemPermissions, groupedPermissionsForModal]);

    // ... các hàm xử lý khác giữ nguyên ...
    const fetchData = async () => {
        if (!canViewRoles) return;
        setLoadingTable(true);
        try {
            const token = localStorage.getItem('authToken');
            const headers = { 'Authorization': `Bearer ${token}` };
            const [rolesRes, permsRes] = await Promise.all([
                fetch('/api/groups/', { headers }),
                fetch('/api/permissions/', { headers })
            ]);
            const rolesData = rolesRes.ok ? await rolesRes.json() : null;
            const permsData = permsRes.ok ? await permsRes.json() : null;
            setRoles(rolesData ? (Array.isArray(rolesData) ? rolesData : rolesData.results || []) : []);
            setAllSystemPermissions(permsData ? (Array.isArray(permsData) ? permsData : permsData.results || []) : []);
            if (!rolesRes.ok) message.error(`Tải DS vai trò thất bại (Lỗi ${rolesRes.status})`);
            if (!permsRes.ok) message.error(`Tải DS quyền thất bại (Lỗi ${permsRes.status})`);
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu: ' + error.message);
        } finally {
            setLoadingTable(false);
        }
    };

    useEffect(() => {
        if (canViewRoles) fetchData();
    }, [canViewRoles]);
    
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
                message.error(`Lỗi: ${errorData.name?.[0] || errorData.detail || 'Thao tác thất bại'}`);
            }
        } catch (error) {
            message.error("Đã có lỗi xảy ra khi lưu vai trò.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRole = async (roleId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/groups/${roleId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                message.success('Đã xóa vai trò.');
                fetchData();
            } else {
                message.error('Lỗi khi xóa vai trò. Có thể vai trò này đang được gán cho người dùng.');
            }
        } catch (error) {
            message.error('Lỗi kết nối khi xóa vai trò.');
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
                message.error('Lỗi khi tải các quyền hiện tại của vai trò.');
            }
        } catch (error) {
            message.error('Lỗi kết nối khi tải quyền.');
        } finally {
            setLoadingPermissions(false);
        }
    };

    const handlePermissionModalOk = () => permissionForm.submit();

    const handlePermissionFormSubmit = async (values) => {
        setIsSubmitting(true);
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`/api/groups/${roleToAssignPermissions.id}/assign-permissions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ permissions_codenames: values.permissions || [] }),
            });
            if (response.ok) {
                message.success('Cập nhật quyền cho vai trò thành công!');
                setIsPermissionModalVisible(false);
            } else {
                message.error('Lỗi khi cập nhật quyền cho vai trò.');
            }
        } catch (error) {
            message.error('Đã xảy ra lỗi khi lưu quyền.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80, sorter: (a, b) => a.id - b.id },
        { title: 'Tên Vai trò', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        {
            title: 'Hành động', key: 'action', width: 220, align: 'center',
            render: (_, role) => (
                <Space size="small">
                    {canAssignPermissions && <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => showPermissionModal(role)}>Phân quyền</Button>}
                    {canChangeRole && <Tooltip title="Sửa tên"><Button icon={<EditOutlined />} onClick={() => showRoleModal(role)} /></Tooltip>}
                    {canDeleteRole && <Popconfirm title={`Xóa vai trò "${role.name}"?`} onConfirm={() => handleDeleteRole(role.id)} okText="Xóa" cancelText="Hủy" okType="danger"><Tooltip title="Xóa"><Button danger icon={<DeleteOutlined />} /></Tooltip></Popconfirm>}
                </Space>
            ),
        },
    ];

    if (!canManageRoles) {
        return <Alert message="Truy cập bị từ chối" description="Bạn không có quyền quản lý vai trò và phân quyền." type="error" showIcon />;
    }

    return (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Row justify="space-between" align="middle">
                <Col><Title level={3} style={{ margin: 0 }}>Quản lý Vai trò & Phân quyền</Title></Col>
                <Col>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loadingTable}>Tải lại</Button>
                        {canAddRole && <Button type="primary" icon={<PlusOutlined />} onClick={() => showRoleModal()}>Thêm Vai trò</Button>}
                    </Space>
                </Col>
            </Row>
            <Alert message="Hướng dẫn" type="info" showIcon description="Tạo các vai trò (ví dụ: Bác sĩ, Lễ tân) -> Nhấn 'Phân quyền' để gán quyền cho vai trò -> Vào trang 'Quản lý Tài khoản' để gán người dùng vào các vai trò này." />
            <Table columns={roleColumns} dataSource={roles} loading={loadingTable} rowKey="id" bordered />

            <Modal title={editingRole ? `Sửa tên vai trò` : "Thêm Vai trò mới"} open={isRoleModalVisible} onCancel={() => setIsRoleModalVisible(false)} destroyOnHidden footer={null}>
                <Form form={roleForm} layout="vertical" onFinish={handleRoleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="name" label="Tên Vai trò" rules={[{ required: true, message: 'Vui lòng nhập tên vai trò!' }]}>
                        <Input placeholder="Ví dụ: Bác sĩ, Lễ tân, Kế toán" />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setIsRoleModalVisible(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={isSubmitting}>{editingRole ? 'Lưu' : 'Thêm'}</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {roleToAssignPermissions && (
                <Modal title={`Phân quyền cho vai trò: ${roleToAssignPermissions.name}`} open={isPermissionModalVisible} onCancel={() => setIsPermissionModalVisible(false)}
                    destroyOnHidden width={900}
                    footer={[
                        <Button key="back" onClick={() => setIsPermissionModalVisible(false)}>Hủy</Button>,
                        <Button key="submit" type="primary" loading={isSubmitting} onClick={handlePermissionModalOk}>Lưu quyền</Button>,
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