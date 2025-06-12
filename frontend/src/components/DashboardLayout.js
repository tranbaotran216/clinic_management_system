import React, { useContext, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './App.js'; // Đảm bảo đường dẫn đúng

import {
  Layout, Menu, Avatar, Dropdown, Space, Breadcrumb, Typography
} from 'antd';
import {
  HomeOutlined, UserOutlined, TeamOutlined, MedicineBoxOutlined,
  BarChartOutlined, SettingOutlined, LogoutOutlined, BookOutlined,
  FileTextOutlined, ExperimentOutlined, SearchOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';

const { Header, Content, Sider, Footer } = Layout;

// --- CẤU HÌNH MENU GỐC ---
// --- CẤU HÌNH MENU GỐC (ĐÃ CẬP NHẬT CHÍNH XÁC THEO DANH SÁCH QUYỀN) ---
const rawMenuConfig = [
  // 1. Trang chủ - Thường không cần quyền
  { key: 'home', labelText: 'Trang chủ', path: '', icon: <HomeOutlined /> },
  
  // 2. Quản lý Vai trò & Quyền
  // Quyền 'auth.view_group' đã nằm trong danh sách của bạn và đúng app_label là 'auth' cho model Group mặc định
  { key: 'roles-permissions', labelText: 'Quản lý Vai trò', path: 'roles-permissions', icon: <SafetyCertificateOutlined />, permission: 'auth.view_group' },

  // 3. Quản lý tài khoản
  // Tương ứng với model 'TaiKhoan'
  { key: 'accounts', labelText: 'Quản lý tài khoản', path: 'accounts', icon: <UserOutlined />, permission: 'accounts.view_taikhoan' },

  // 4. Quản lý danh sách khám (DSKham)
  // Tương ứng với model 'DSKham'
  { key: 'appointments', labelText: 'Quản lý danh sách khám', path: 'appointments', icon: <TeamOutlined />, permission: 'accounts.view_dskham' },

  // 5. Quản lý phiếu khám bệnh (PKB)
  // Tương ứng với model 'PKB'
  { key: 'medical-records', labelText: 'Quản lý phiếu khám bệnh', path: 'medical-records', icon: <BookOutlined />, permission: 'accounts.view_pkb' },
  
  // 6. Quản lý Thuốc - Menu có các mục con
  {
    key: 'medications',
    labelText: 'Quản lý Thuốc',
    icon: <MedicineBoxOutlined />,
    // Menu cha không cần permission, nó sẽ hiện nếu có con hiện
    children: [
      // Quản lý kho thuốc (model Thuoc)
      { key: 'medications-inventory', labelText: 'QL Kho Thuốc', path: 'medications/inventory', icon: <MedicineBoxOutlined />, permission: 'accounts.view_thuoc' },
      
      // Kê sử dụng thuốc (liên quan đến ChiTietPKB)
      // Để tạo một đơn thuốc, người dùng cần quyền thêm ChiTietPKB
      { key: 'medications-usage', labelText: 'Kê đơn thuốc', path: 'medications/usage', icon: <ExperimentOutlined />, permission: 'accounts.add_chitietpkb' },
      
      // Tra cứu thuốc (model Thuoc)
      { key: 'medications-search', labelText: 'Tra cứu thuốc', path: 'medications/search', icon: <SearchOutlined />, permission: 'accounts.view_thuoc' },
    ]
  },

  // 7. Xem hóa đơn (HoaDon)
  { key: 'billing', labelText: 'Xem hóa đơn', path: 'billing', icon: <FileTextOutlined />, permission: 'accounts.view_hoadon' },
  
  // 8. Báo cáo & Thống kê
  // Thường sẽ dựa trên quyền xem hóa đơn hoặc một quyền tùy chỉnh khác. Ta dùng tạm quyền xem hóa đơn.
  { key: 'reports', labelText: 'Báo cáo & Thống kê', path: 'reports', icon: <BarChartOutlined />, permission: 'accounts.view_hoadon' },
  
  // 9. Quản lý quy định / danh mục
  // Đây có thể là một menu cha chứa các mục quản lý nhỏ hơn
  {
    key: 'regulations',
    labelText: 'Quản lý Danh mục',
    icon: <SettingOutlined />,
    // Yêu cầu ít nhất một quyền xem danh mục con để hiển thị
    permission: 'accounts.view_loaibenh', // Hoặc 'accounts.view_donvitinh' v.v.
    children: [
      { key: 'regulations-diseases', labelText: 'QL Loại Bệnh', path: 'regulations/diseases', permission: 'accounts.view_loaibenh' },
      { key: 'regulations-units', labelText: 'QL Đơn Vị Tính', path: 'regulations/units', permission: 'accounts.view_donvitinh' },
      { key: 'regulations-usages', labelText: 'QL Cách Dùng', path: 'regulations/usages', permission: 'accounts.view_cachdung' },
    ]
  },
];

// --- HÀM TẠO ITEMS CHO MENU DỰA TRÊN QUYỀN (TỐI ƯU HÓA) ---
const generateMenuItems = (configItems, userPermissions = []) => {
  const buildItems = (items, basePath = '/dashboard/') => {
    return items.reduce((acc, item) => {
      // Kiểm tra quyền
      const hasPermission = !item.permission || userPermissions.includes(item.permission);
      
      if (item.children) {
        // Nếu là menu cha, đệ quy để lọc các menu con
        const filteredChildren = buildItems(item.children, basePath);
        if (filteredChildren.length > 0) {
          // Chỉ thêm menu cha nếu có ít nhất 1 menu con được phép
          acc.push({
            key: item.key,
            icon: item.icon,
            label: item.labelText, // Label của menu cha chỉ là text
            children: filteredChildren,
          });
        }
      } else if (hasPermission) {
        // Nếu là menu đơn và có quyền
        acc.push({
          key: item.key,
          icon: item.icon,
          label: <Link to={basePath + item.path}>{item.labelText}</Link>, // Label của menu con là Link
        });
      }
      return acc;
    }, []);
  };
  return buildItems(configItems);
};


// --- COMPONENT CHÍNH ---
const DashboardLayout = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) {
    // RequireAuth sẽ xử lý việc redirect, nên đây là một fallback
    return null;
  }

  // --- XỬ LÝ SỰ KIỆN LOGOUT ---
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- MENU CHO DROPDOWN CỦA USER ---
  const userDropdownItems = [
    { key: 'profile', label: 'Thông tin cá nhân' /*, onClick: () => navigate('/dashboard/profile') */ },
    { type: 'divider' }, // Thêm đường kẻ phân cách
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, onClick: handleLogout },
  ];

  // --- TẠO MENU ITEMS CHO SIDEBAR ---
  const menuItems = generateMenuItems(rawMenuConfig, currentUser.permissions);

  // --- LOGIC XÁC ĐỊNH KEY CỦA MENU ĐANG ĐƯỢC CHỌN ---
  // Ví dụ: /dashboard/accounts -> 'accounts'
  // Ví dụ: /dashboard/medications/inventory -> 'medications-inventory'
  const pathParts = location.pathname.split('/').filter(Boolean); // ['dashboard', 'medications', 'inventory']
  let currentKey = 'home'; // Mặc định là trang chủ
  if (pathParts.length > 1) {
    // Ưu tiên khớp với key của menu con trước
    let potentialKey = pathParts.slice(1).join('-');
    const findKey = (items, key) => items.some(item => item.key === key || (item.children && findKey(item.children, key)));
    if (findKey(rawMenuConfig, potentialKey)) {
        currentKey = potentialKey;
    } else {
        currentKey = pathParts[1] || 'home'; // Fallback về key của menu cha
    }
  }


  // --- LOGIC TẠO BREADCRUMB ---
  // (Giữ nguyên logic breadcrumb cũ của bạn vì nó khá ổn)
  const breadcrumbItems = [
      { title: <Link to="/dashboard"><HomeOutlined /></Link>, key: 'home' },
      ...location.pathname.split('/').filter(i => i && i !== 'dashboard').map((seg, idx, arr) => {
        const path = `/dashboard/${arr.slice(0, idx + 1).join('/')}`;
        // Viết hoa chữ cái đầu cho thân thiện
        const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
        return { title: <Link to={path}>{label}</Link>, key: path };
      })
  ];


  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
        <div style={{ height: 64, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Title level={4} style={{ color: '#001529', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {collapsed ? 'PM' : 'Phòng Mạch XYZ'}
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={[currentKey]}
          defaultOpenKeys={[currentKey.split('-')[0]]}
          items={menuItems}
        />
      </Sider>

      <Layout className="site-layout">
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Breadcrumb items={breadcrumbItems} />
          <Space>
            {/* ĐÃ SỬA DROPDOWN */}
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
          {/* ĐÃ SỬA LỖI bodyStyle CỦA CARD (nếu có) bằng cách dùng div thường */}
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