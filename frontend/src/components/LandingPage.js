// file: frontend/src/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom'; // Dùng Link của React Router để điều hướng nhanh hơn

// Import CSS và hình ảnh
import './LandingPage.css'; // Bạn sẽ cần tạo file này
import logo from './images/plus_sign.png';
import fbIcon from './images/fb icon.png';
import igIcon from './images/ig icon.png';
import phoneIcon from './images/phone icon.png';
import doctorImage from './images/doctor_image.png';


const LandingPage = () => {
    return (
        <div>
            <header className="header">
                <div className="container navbar">
                    <div className="logo">
                        <img src={logo} alt="Medical Clinic Logo" />
                    </div>
                    <nav className="nav-menu">
                        <ul>
                            <li><Link to="/" className="active">Trang chủ</Link></li>
                            <li><Link to="/services">Dịch vụ</Link></li>
                            <li><Link to="/about">Giới thiệu</Link></li>
                        </ul>
                    </nav>
                    <div className="auth-buttons">
                        <Link to="/login" className="btn btn-login">Đăng nhập</Link>
                        <Link to="/register-appointment" className="btn btn-register">Đăng ký khám bệnh</Link>
                    </div>
                </div>
            </header>

            <main className="main-section">
                <div className="container main-content">
                    <div className="text-content">
                        <p className="clinic-name">Medical Clinic</p>
                        <h1>Chữa bệnh bằng tâm<br />Nâng tầm y đức</h1>
                        <div className="social-links">
                            <a href="#" className="social-item">
                                <img src={fbIcon} alt="Facebook icon" />
                                <span>Medical Clinic</span>
                            </a>
                            <a href="#" className="social-item">
                                <img src={igIcon} alt="Instagram icon" />
                                <span>@medical_clinic</span>
                            </a>
                            <a href="#" className="social-item">
                                <img src={phoneIcon} alt="WhatsApp icon" />
                                <span>+84 355 644 805</span>
                            </a>
                        </div>
                    </div>
                    <div className="image-content">
                        <img src={doctorImage} alt="Doctor Illustration" />
                    </div>
                </div>
                <div className="decoration-lines">
                </div>
            </main>
        </div>
    );
};

export default LandingPage;