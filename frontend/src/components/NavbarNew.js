import React from 'react';
// Thay Link bằng NavLink để style active link
import { NavLink } from 'react-router-dom';
import './HomePageNew.css';
import logoIcon from '../asset/logo_icon.png';

const NavbarNew = () => {
  return (
    <nav className="navbar-new">
      <div className="navbar-new-logo">
        {/* Logo của bạn - cân nhắc kích thước, 80x80 có thể lớn */}
        <img src={logoIcon} alt="Logo" width={90} height={90} />
        {/* Tôi giảm kích thước logo xuống 50x50 để cân đối hơn, bạn có thể điều chỉnh */}
      </div>
      <div className="navbar-new-menu">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "navbar-new-item active" : "navbar-new-item"
          }
          end // Thêm 'end' cho NavLink trang chủ để nó không match các sub-route
        >
          Trang chủ
        </NavLink>
        <NavLink
          to="/services"
          className={({ isActive }) =>
            isActive ? "navbar-new-item active" : "navbar-new-item"
          }
        >
          Dịch vụ
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive ? "navbar-new-item active" : "navbar-new-item"
          }
        >
          Giới thiệu
        </NavLink>
      </div>
      <div className="navbar-new-actions">
        {/* Sử dụng Link bình thường cho các nút actions nếu không cần trạng thái active đặc biệt */}
        <NavLink to="/login" className="navbar-new-button login-button">
          Đăng nhập
        </NavLink>
        <NavLink to="/register-appointment" className="navbar-new-button register-button">
          Đăng ký khám bệnh
        </NavLink>
      </div>
    </nav>
  );
};

export default NavbarNew;