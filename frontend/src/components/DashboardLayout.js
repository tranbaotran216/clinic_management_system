// frontend/src/components/DashboardLayout.js

import React, { useContext, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext, ThemeContext } from './App.js';
import {
  Layout, Menu, Avatar, Dropdown, Space, Breadcrumb, Typography, Switch, theme, Spin
} from 'antd';
import {
  HomeOutlined, UserOutlined, BookOutlined, SearchOutlined, BarChartOutlined,
  SettingOutlined, LogoutOutlined, MoonOutlined, SunOutlined
} from '@ant-design/icons';

const { Header, Content, Sider, Footer } = Layout;
const { Title } = Typography;

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
            key: item.path || 'home', // Dùng path làm key
            icon: item.icon,
            label: <Link to={item.path}>{item.labelText}</Link>,
        }));
};

const DashboardLayout = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const { currentTheme, toggleTheme } = useContext(ThemeContext);
    const { token } = theme.useToken();
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    if (!currentUser) { return null; }

    const handleLogout = () => {
        logout();
    };

    const userDropdownItems = [
      {
        key: 'profile',
        label: <span onClick={() => navigate('profile')}>Thông tin tài khoản</span>, 
        icon: <UserOutlined />,
      },
      { type: 'divider' },
      {
        key: 'logout',
        label: <span onClick={handleLogout}>Đăng xuất</span>,
        icon: <LogoutOutlined />,
      },
    ];

    const menuItems = generateMenuItems(rawMenuConfig, currentUser.permissions);
    
    // Logic tạo Breadcrumb và activeMenuKey
    const pathSnippets = location.pathname.split('/').filter(i => i && i !== 'app' && i !== 'dashboard');
    const breadcrumbNameMap = {
      'accounts': 'Quản lý tài khoản', 'medical-records': 'Quản lý khám bệnh', 'medications': 'Thuốc', 'search': 'Tra cứu',
      'reports': 'Báo cáo & Thống kê', 'regulations': 'Quản lý quy định', 'profile': 'Thông tin cá nhân',
    };
    const breadcrumbItems = [ { title: <Link to=""><HomeOutlined /></Link> } ]
        .concat(pathSnippets.map((snippet, index) => {
            const url = `${pathSnippets.slice(0, index + 1).join('/')}`;
            const name = breadcrumbNameMap[snippet] || snippet;
            return { title: <Link to={url}>{name}</Link> };
        }));
    const activeMenuKey = pathSnippets.join('/') || 'home';


    return (
      <Layout style={{ minHeight: '100vh' }}>
        {/* ================== SỬA LỖI TẠI ĐÂY ================== */}
        <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme={currentTheme}>
            <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <a href="/" style={{ textDecoration: 'none' }}>
                    <Title level={4} style={{ margin: 0, color: currentTheme === 'dark' ? 'white' : '#002140' }}>
                        {collapsed ? 'G9' : 'Medical Clinic'}
                    </Title>
                </a>
            </div>
            <Menu theme={currentTheme} mode="inline" selectedKeys={[activeMenuKey]} items={menuItems} />
        </Sider>
        {/* ======================================================= */}
       
        <Layout>
          <Header style={{ padding: '0 24px', background: token.colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Breadcrumb items={breadcrumbItems} />
            <Space align="center">
                <Switch
                    checkedChildren={<MoonOutlined />}
                    unCheckedChildren={<SunOutlined />}
                    checked={currentTheme === 'dark'}
                    onChange={toggleTheme}
                />
                <Dropdown menu={{ items: userDropdownItems }} trigger={['click']}>
                    <a onClick={e => e.preventDefault()} href="!#">
                        <Space style={{ cursor: 'pointer' }}>
                            <Avatar size="small" src={currentUser.avatar}  icon={!currentUser.avatar && <UserOutlined />}  />
                            <span style={{ color: token.colorText }}>{currentUser.ho_ten || currentUser.ten_dang_nhap}</span>
                        </Space>
                    </a>
                </Dropdown>
            </Space>
          </Header>
          
          <Content style={{ margin: '16px' }}>
            <div style={{ padding: 24, background: token.colorBgContainer, borderRadius: token.borderRadiusLG, minHeight: '100%' }}>
              <Outlet />
            </div>
          </Content>
          
          <Footer style={{ textAlign: 'center' }}>
            Clinic Management System Created By SE104.P23 Group 9 ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    );
};

export default DashboardLayout;