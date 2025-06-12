// frontend/src/components/HeroSectionNew.js
import React from 'react';
import './HomePageNew.css'; // File CSS chung
import doctorImage from '../asset/homepage1.png'; // Hình ảnh bác sĩ
import facebookIcon from '../asset/facebook.png'; // Import icon trực tiếp
import instagramIcon from '../asset/instagram.png';
import phoneIcon from '../asset/phone.png';

const HeroSectionNew = () => {
return (
    <section className="hero-section-new">
        <div className="hero-content">
            <div className="hero-text">
                <h1 className="hero-title-main">Medical Clinic</h1>
                <h2 className="hero-tagline">Chữa bệnh bằng tâm<br />Nâng tầm y đức</h2>
                {/* Loại bỏ inline styles ở đây */}
                <div className="hero-contact-info">
                    <div className="contact-item">
                        <img
                            src={facebookIcon} // Sử dụng biến đã import
                            alt="Facebook"
                            className="contact-icon"
                        />
                        <span>Medical Clinic</span>
                    </div>
                    <div className="contact-item">
                        <img
                            src={instagramIcon} // Sử dụng biến đã import
                            alt="Instagram"
                            className="contact-icon"
                        />
                        <span>@medical_clinic</span>
                    </div>
                    <div className="contact-item">
                        <img
                            src={phoneIcon} // Sử dụng biến đã import
                            alt="Phone"
                            className="contact-icon"
                        />
                        <span>+84 355 644 805</span>
                    </div>
                </div>
            </div>
            <div className="hero-image-container">
                {/* Loại bỏ inline styles ở đây */}
                <img src={doctorImage} alt="Doctor and Patient" className="hero-image" />
            </div>
        </div>
    </section>
);
};

export default HeroSectionNew;