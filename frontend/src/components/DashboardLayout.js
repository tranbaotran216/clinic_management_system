// frontend/src/DashboardLayout.js

import React, { useContext, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './App.js';
import {
  Layout, Menu, Avatar, Dropdown, Space, Breadcrumb, Typography
} from 'antd';
import {
  HomeOutlined, UserOutlined, BookOutlined, SearchOutlined, BarChartOutlined,
  SettingOutlined, LogoutOutlined
} from '@ant-design/icons';

const { Header, Content, Sider, Footer } = Layout;

const rawMenuConfig = [
  { key: 'home', labelText: 'Trang chủ', path: '', icon: <HomeOutlined /> },
  { key: 'accounts', labelText: 'Quản lý tài khoản', path: 'accounts', icon: <UserOutlined />, permission: 'accounts.view_taikhoan' },
  { key: 'medical-records', labelText: 'Quản lý khám bệnh', path: 'medical-records', icon: <BookOutlined />, permission: 'accounts.view_pkb' },
  { key: 'medications-search', labelText: 'Tra cứu thuốc', path: 'medications/search', icon: <SearchOutlined />, permission: 'accounts.view_thuoc' },
  { key: 'reports', labelText: 'Báo cáo & Thống kê', path: 'reports', icon: <BarChartOutlined />, permission: 'accounts.view_hoadon' },
  { key: 'regulations', labelText: 'Quản lý quy định', path: 'regulations', icon: <SettingOutlined />, permission: 'accounts.change_thuoc' },
];

const generateMenuItems = (configItems, userPermissions = []) => {
    return configItems
        .filter(item => !item.permission || userPermissions.includes(item.permission))
        .map(item => ({
            key: item.path || 'home',
            icon: item.icon,
            label: <Link to={`/dashboard/${item.path}`}>{item.labelText}</Link>,
        }));
};

const DashboardLayout = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate(); // Vẫn giữ navigate để dùng cho các chức năng khác
    const location = useLocation();

    if (!currentUser) { return null; }

    const handleLogout = async () => {
        await logout(); // Hàm này trong AuthContext sẽ xóa token khỏi localStorage
        
        // ================== THAY ĐỔI TẠI ĐÂY ==================
        // Thực hiện một lần tải lại trang hoàn toàn và điều hướng về trang chủ gốc
        window.location.href = '/';
        // =======================================================
    };

    const userDropdownItems = [
      {
        key: 'profile',
        label: <span onClick={() => navigate('profile')}>Thông tin tài khoản</span>, 
        icon: <UserOutlined />,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: <span onClick={handleLogout}>Đăng xuất</span>,
        icon: <LogoutOutlined />,
      },
    ];

    const menuItems = generateMenuItems(rawMenuConfig, currentUser.permissions);
    
    // Tạo Breadcrumb dựa trên location
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbNameMap = {
      'dashboard': 'Dashboard',
      'accounts': 'Quản lý tài khoản',
      'medical-records': 'Quản lý khám bệnh',
      'medications': 'Tra cứu thuốc',
      'search': 'Tìm kiếm',
      'reports': 'Báo cáo & Thống kê',
      'regulations': 'Quản lý quy định',
      'profile': 'Thông tin cá nhân',
    };

    const breadcrumbItems = [
        { title: <Link to="/dashboard"><HomeOutlined /></Link> }
    ].concat(pathSnippets.map((_, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        const name = breadcrumbNameMap[pathSnippets[index]] || pathSnippets[index];
        const isLast = index === pathSnippets.length - 1;
        return isLast ? { title: name } : { title: <Link to={url}>{name}</Link> };
    }));

    // Lấy key cho menu đang active
    const currentKey = pathSnippets.length > 1 ? pathSnippets.slice(1).join('/') : 'home';

    return (
      <Layout style={{ height: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <Typography.Title 
                level={4} 
                style={{ 
                  margin: 0, 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  color: '#002140',
                  transition: 'color 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1890ff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#002140'}
              >
                {collapsed ? 'G9' : 'Medical Clinic'}
              </Typography.Title>
            </a>
          </div>
          <Menu mode="inline" theme="light" selectedKeys={[currentKey]} items={menuItems} />
        </Sider>
       
        <Layout style={{ display: 'flex', flexDirection: 'column' }}>
          <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <Breadcrumb items={breadcrumbItems} />
            <Space>
              <Dropdown menu={{ items: userDropdownItems }} trigger={['click']}>
                <a onClick={e => e.preventDefault()} href="!#">
                  <Space style={{ cursor: 'pointer' }}>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span>{currentUser.ho_ten || currentUser.ten_dang_nhap}</span>
                  </Space>
                </a>
              </Dropdown>
            </Space>
          </Header>
          
          <Content style={{ margin: '16px', overflow: 'auto', flex: '1 1 0' }}>
            <div style={{ padding: 24, background: '#fff', borderRadius: '8px', minHeight: '100%' }}>
              <Outlet />
            </div>
          </Content>
          
          <Footer style={{ textAlign: 'center', flexShrink: 0 }}>
            Clinic Management System ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    );
};

export default DashboardLayout;