import React, { useContext, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './App.js';

import {
  Layout, Menu, Avatar, Dropdown, Space, Breadcrumb, Typography
} from 'antd';
import {
  HomeOutlined, UserOutlined, TeamOutlined, MedicineBoxOutlined,
  BarChartOutlined, SettingOutlined, LogoutOutlined, BookOutlined,
  FileTextOutlined, ExperimentOutlined, SearchOutlined
} from '@ant-design/icons';

const { Header, Content, Sider, Footer } = Layout;
const { Title } = Typography;

// --- CẤU HÌNH MENU GỐC ---
const rawMenuConfig = [
  { key: 'home', label: 'Trang chủ', path: '', icon: <HomeOutlined /> },
  { key: 'accounts', label: 'Quản lý tài khoản', path: 'accounts', icon: <UserOutlined />, permission: 'accounts.manage_accounts' },
  { key: 'appointments', label: 'Quản lý khám bệnh', path: 'appointments', icon: <TeamOutlined />, permission: 'patients.manage_patient_waiting_list' },
  { key: 'medical-records', label: 'Quản lý phiếu khám', path: 'medical-records', icon: <BookOutlined />, permission: 'medrecords.manage_medical_records' },
  {
    key: 'medications',
    label: 'Quản lý Thuốc',
    icon: <MedicineBoxOutlined />,
    children: [
      { key: 'medications-inventory', label: 'Quản lý Kho Thuốc', path: 'medications/inventory', icon: <MedicineBoxOutlined />, permission: 'medications.manage_inventory' },
      { key: 'medications-usage', label: 'Thống kê sử dụng thuốc', path: 'medications/usage', icon: <ExperimentOutlined />, permission: 'medications.view_usage_reports' },
      { key: 'medications-search', label: 'Tra cứu thuốc', path: 'medications/search', icon: <SearchOutlined />, permission: 'medications.search_inventory' },
    ]
  },
  { key: 'billing', label: 'Xem hóa đơn', path: 'billing', icon: <FileTextOutlined />, permission: 'billing.view_invoices' },
  { key: 'reports', label: 'Báo cáo & Thống kê', path: 'reports', icon: <BarChartOutlined />, permission: 'reports.view_revenue_statistics' },
  { key: 'regulations', label: 'Quản lý quy định', path: 'regulations', icon: <SettingOutlined />, permission: 'clinic.manage_regulations' },
];

// --- HÀM LỌC MENU THEO QUYỀN ---
const filterMenuByPermission = (items, permissions = []) => {
  return items.reduce((acc, item) => {
    if (item.children) {
      const filteredChildren = filterMenuByPermission(item.children, permissions);
      if (filteredChildren.length > 0) {
        acc.push({ ...item, children: filteredChildren });
      }
    } else if (!item.permission || permissions.includes(item.permission)) {
      acc.push({ ...item });
    }
    return acc;
  }, []);
};

// --- COMPONENT CHÍNH ---
const DashboardLayout = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return null;

  const menuItems = filterMenuByPermission(rawMenuConfig, currentUser.permissions);

  const userDropdown = (
    <Menu
      items={[
        { key: 'profile', label: 'Thông tin cá nhân' },
        { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', onClick: logout }
      ]}
    />
  );

  const currentKey = location.pathname.split('/dashboard/')[1]?.split('/')[0] || 'home';

  const breadcrumbItems = [
    { title: <Link to="/dashboard"><HomeOutlined /></Link>, key: 'home' },
    ...location.pathname.split('/').filter(i => i !== 'dashboard' && i).map((seg, idx, arr) => {
      const path = `/dashboard/${arr.slice(0, idx + 1).join('/')}`;
      return { title: <Link to={path}>{seg}</Link>, key: path };
    })
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 16
        }}>
          {collapsed ? 'PM' : 'Phòng Mạch XYZ'}
        </div>
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={[currentKey]}
          items={menuItems.map(item => ({
            ...item,
            label: item.path ? <Link to={`/dashboard/${item.path}`}>{item.label}</Link> : item.label,
            children: item.children?.map(child => ({
              ...child,
              label: <Link to={`/dashboard/${child.path}`}>{child.label}</Link>
            }))
          }))}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px',
            height: 64
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <Space>
            <Dropdown overlay={userDropdown} trigger={['click']}>
              <a onClick={e => e.preventDefault()} href="!#">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {currentUser.ho_ten || currentUser.ten_dang_nhap}
                </Space>
              </a>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: 16 }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
            <Outlet />
          </div>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          Clinic Management System ©{new Date().getFullYear()} Created by Your Team
        </Footer>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
