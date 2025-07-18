// file: frontend/src/AboutPage.js

import React from 'react';
import { Link } from 'react-router-dom';

// Import CSS và hình ảnh
// Dùng chung CSS với các trang tĩnh khác
import './LandingPage.css'; 

// Import hình ảnh từ thư mục `src/images`
import logo from './images/plus_sign.png';
import clinicImage from './images/clinic.png';


const AboutPage = () => {
    return (
        <div>
            {/* Header - Phần này có thể tách ra thành component riêng để tái sử dụng */}
            <header className="header">
                <div className="container navbar">
                    <div className="logo">
                        <img src={logo} alt="Medical Clinic Logo" />
                    </div>
                    <nav className="nav-menu">
                        <ul>
                            <li><Link to="/">Trang chủ</Link></li>
                            <li><Link to="/services">Dịch vụ</Link></li>
                            <li><Link to="/about" className="active">Giới thiệu</Link></li>
                        </ul>
                    </nav>
                    <div className="auth-buttons">
                        <Link to="/login" className="btn btn-login">Đăng nhập</Link>
                        <Link to="/register-appointment" className="btn btn-register">Đăng ký khám bệnh</Link>
                    </div>
                </div>
            </header>

            <section className="page-title-section">
                <div className="container">
                    <h2>Giới thiệu</h2>
                </div>
            </section>

            <section className="about-us-section">
                <div className="container">
                    <div className="about-card">
                        <div className="about-intro-paragraph">
                            <p className="about-clinic-intro-text">
                                <span style={{ color: '#007bff', fontWeight: 600 }}>Medical Clinic</span> là phòng khám tư nhân cung cấp dịch vụ khám chữa bệnh uy tín, an toàn và tận tâm. Với đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị hiện đại, chúng tôi cam kết mang đến trải nghiệm y tế chất lượng, nhanh chóng và hiệu quả cho mọi bệnh nhân.
                            </p>
                        </div>

                        <div className="about-details-container">
                            <div className="about-contact-info">
                                <h4 className="about-heading">Giờ làm việc:</h4>
                                <ul className="working-hours-list">
                                    <li>Thứ 2 – Thứ 6: 8:00 – 17:00</li>
                                    <li>Thứ 7: 8:00 – 12:00</li>
                                    <li>Chủ nhật & ngày lễ: Nghỉ</li>
                                </ul>

                                <h4 className="about-heading">Số điện thoại: <span style={{ color: '#007bff' }}>0355 644 805</span></h4>
                                <h4 className="about-heading">Địa chỉ: Khu phố 12, Linh Trung, TP. Thủ Đức</h4>
                            </div>
                            <div className="about-image-content">
                                <img src={clinicImage} alt="Hình ảnh tòa nhà phòng khám" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;