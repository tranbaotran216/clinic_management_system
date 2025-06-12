// frontend/src/components/HomePageNew.js
import React from 'react';
import NavbarNew from './NavbarNew';
import HeroSectionNew from './HeroSectionNew';
import './HomePageNew.css'; // File CSS để style chung

const HomePageNew = () => {
  return (
    <div className="homepage-new-container">
      <NavbarNew />
      <HeroSectionNew />
      {/* Các sections khác của trang chủ mới có thể thêm vào đây */}
    </div>
  );
};

export default HomePageNew;