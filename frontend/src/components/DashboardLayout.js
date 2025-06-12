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

// --- CẤU HÌNH MENU GỐC (ĐÃ GỘP QUẢN LÝ VAI TRÒ VÀO QUẢN LÝ TÀI KHOẢN) ---
const rawMenuConfig = [
  { key: 'home', labelText: 'Trang chủ', path: '', icon: <HomeOutlined /> },

  // 1. Quản lý tài khoản & Vai trò - CHỈ CÓ MỘT MENU DUY NHẤT
  // Khi nhấp vào đây sẽ đến trang /dashboard/accounts, nơi chứa 2 tab
  { key: 'accounts', labelText: 'Quản lý tài khoản', path: 'accounts', icon: <UserOutlined />, permission: 'accounts.view_taikhoan' },

  // 2. Quản lý khám bệnh
  { key: 'medical', labelText: 'Quản lý khám bệnh', path: 'medical-records', icon: <BookOutlined />, permission: 'accounts.view_pkb' },

  // 3. Tra cứu thuốc
  { key: 'medication-search', labelText: 'Tra cứu thuốc', path: 'medications/search', icon: <SearchOutlined />, permission: 'accounts.view_thuoc' },

  // 4. Báo cáo & Thống kê
  { key: 'reports', labelText: 'Báo cáo & Thống kê', path: 'reports', icon: <BarChartOutlined />, permission: 'accounts.view_hoadon' },

  // 5. Quản lý quy định (Chứa Quản lý thuốc CRUD bên trong trang)
  { key: 'regulations', labelText: 'Quản lý quy định', path: 'regulations', icon: <SettingOutlined />, permission: 'accounts.change_thuoc' },
];


// --- HÀM TẠO MENU ITEMS (GIỮ NGUYÊN) ---
const generateMenuItems = (configItems, userPermissions = []) => {
  const buildItems = (items, basePath = '/dashboard/') => {
    return items.reduce((acc, item) => {
      const hasPermission = !item.permission || userPermissions.includes(item.permission);
      if (!item.children && hasPermission) {
        acc.push({
          key: item.key,
          icon: item.icon,
          label: <Link to={basePath + item.path}>{item.labelText}</Link>,
        });
      }
      return acc;
    }, []);
  };
  return buildItems(configItems);
};


// --- COMPONENT CHÍNH (LOGIC ĐÃ CẬP NHẬT ĐỂ HIGHLIGHT MENU ĐÚNG) ---
const DashboardLayout = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    if (!currentUser) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const userDropdownItems = [
        { key: 'profile', label: 'Thông tin cá nhân' },
        { type: 'divider' },
        { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, onClick: handleLogout },
    ];

    const menuItems = generateMenuItems(rawMenuConfig, currentUser.permissions);
    
    // Logic xác định key đang được chọn (đã được cập nhật)
    // Khi ở trang /roles-permissions (nay đã không còn), nó vẫn sẽ highlight menu 'accounts'
    const path = location.pathname;
    let currentKey = 'home';
    if (path.startsWith('/dashboard/accounts')) {
        currentKey = 'accounts';
    } else {
        const matchedItem = rawMenuConfig.find(item => path.startsWith(`/dashboard/${item.path}`) && item.path !== '');
        if (matchedItem) {
            currentKey = matchedItem.key;
        }
    }
    
    // Logic tạo Breadcrumb
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbItems = [
        { title: <Link to="/dashboard"><HomeOutlined /></Link>, key: 'home' },
        ...pathSnippets.slice(1).map((_, index) => {
            const url = `/${pathSnippets.slice(0, index + 2).join('/')}`;
            const menuItem = rawMenuConfig.find(item => `/dashboard/${item.path}` === url);
            const label = menuItem ? menuItem.labelText : pathSnippets[index + 1].charAt(0).toUpperCase() + pathSnippets[index + 1].slice(1);
            return { key: url, title: <Link to={url}>{label}</Link> };
        })
    ];

    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
          <div style={{ height: 64, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#001529' }}>
            <Typography.Title level={4} style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {collapsed ? 'PM' : 'Phòng Mạch XYZ'}
            </Typography.Title>
          </div>
          <Menu
            mode="inline"
            theme="light"
            selectedKeys={[currentKey]}
            items={menuItems}
          />
        </Sider>
        <Layout className="site-layout">
          <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <Content style={{ margin: '16px' }}>
            <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: '8px' }}>
              <Outlet />
            </div>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            Clinic Management System ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    );
};

export default DashboardLayout;