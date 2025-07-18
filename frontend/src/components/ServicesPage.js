// file: frontend/src/ServicesPage.js

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

// Import CSS và hình ảnh
// Giả sử bạn dùng chung file style với LandingPage hoặc tạo file mới
import './LandingPage.css'; 

// Import hình ảnh từ thư mục `src/images`
import logo from './images/plus_sign.png';
import backArrow from './images/back.png';
import nextArrow from './images/next.png';
import serviceImg1 from './images/xetnghiemmau.png';
import serviceImg2 from './images/captoathuoc.png';
import serviceImg3 from './images/dohuyetap.png';
import serviceImg4 from './images/medicalcheckup.png';
import serviceImg5 from './images/vaccination.png';
import serviceImg6 from './images/nutritionplan.png';


const ServicesPage = () => {
    // useRef là "cách của React" để lấy một tham chiếu trực tiếp đến một phần tử HTML
    // thay vì dùng document.getElementById
    const gridRef = useRef(null);

    const scrollServices = (direction) => {
        if (gridRef.current) {
            const grid = gridRef.current;
            const cardWidth = grid.querySelector('.service-card')?.offsetWidth || 0;
            const gap = parseFloat(window.getComputedStyle(grid).getPropertyValue('grid-gap')) || 0;
            const scrollAmount = (cardWidth + gap) * 3; // Cuộn 3 card mỗi lần

            grid.scrollTo({
                left: grid.scrollLeft + (direction * scrollAmount),
                behavior: 'smooth'
            });
        }
    };

    return (
        <div>
            {/* Header được tái sử dụng từ LandingPage, bạn có thể tách ra thành component riêng sau */}
            <header className="header">
                <div className="container navbar">
                    <div className="logo">
                        <img src={logo} alt="Medical Clinic Logo" />
                    </div>
                    <nav className="nav-menu">
                        <ul>
                            <li><Link to="/">Trang chủ</Link></li>
                            <li><Link to="/services" className="active">Dịch vụ</Link></li>
                            <li><Link to="/about">Giới thiệu</Link></li>
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
                    <h2>Dịch vụ</h2>
                </div>
            </section>

            <section className="services-content-wrapper">
                <div className="container services-container">
                    <button className="nav-arrow left-arrow" onClick={() => scrollServices(-1)}>
                        <img src={backArrow} alt="Previous" />
                    </button>

                    {/* Gắn ref vào đây để có thể điều khiển nó */}
                    <div className="service-grid" ref={gridRef}>
                        <div className="service-card">
                            <div className="service-image-wrapper">
                                <img src={serviceImg1} alt="Xét nghiệm máu icon" />
                            </div>
                            <h3>Xét nghiệm máu</h3>
                            <p>Đánh giá sức khỏe tổng quát, phát hiện sớm các bệnh lý như thiếu máu, tiểu đường, nhiễm trùng, mỡ máu,...</p>
                        </div>

                        <div className="service-card">
                            <div className="service-image-wrapper">
                                <img src={serviceImg2} alt="Đo huyết áp và nhịp tim icon" />
                            </div>
                            <h3>Đo huyết áp và nhịp tim</h3>
                            <p>Theo dõi các chỉ số tim mạch, hỗ trợ phát hiện sớm các bất thường về huyết áp hoặc rối loạn nhịp tim.</p>
                        </div>
                        
                        {/* Thêm các service card còn lại tương tự */}
                        <div className="service-card">
                            <div className="service-image-wrapper"><img src={serviceImg3} alt="Cấp toa thuốc"/></div>
                            <h3>Cấp toa thuốc định kỳ</h3>
                            <p>Hỗ trợ cấp lại đơn thuốc cho bệnh nhân mắc các bệnh mãn tính như tăng huyết áp, tiểu đường, viêm khớp.</p>
                        </div>
                        <div className="service-card">
                            <div className="service-image-wrapper"><img src={serviceImg4} alt="Khám tổng quát"/></div>
                            <h3>Khám tổng quát</h3>
                            <p>Kiểm tra toàn diện sức khỏe, phát hiện sớm các vấn đề tiềm ẩn và tư vấn lối sống lành mạnh.</p>
                        </div>
                        <div className="service-card">
                            <div className="service-image-wrapper"><img src={serviceImg5} alt="Tiêm phòng"/></div>
                            <h3>Tiêm phòng</h3>
                            <p>Cung cấp các loại vắc-xin cần thiết cho trẻ em và người lớn, giúp phòng ngừa bệnh truyền nhiễm.</p>
                        </div>
                        <div className="service-card">
                            <div className="service-image-wrapper"><img src={serviceImg6} alt="Tư vấn dinh dưỡng"/></div>
                            <h3>Tư vấn dinh dưỡng</h3>
                            <p>Chuyên gia dinh dưỡng sẽ tư vấn chế độ ăn uống phù hợp với từng tình trạng sức khỏe và mục tiêu của bạn.</p>
                        </div>

                    </div>

                    <button className="nav-arrow right-arrow" onClick={() => scrollServices(1)}>
                        <img src={nextArrow} alt="Next" />
                    </button>
                </div>
            </section>
        </div>
    );
};

export default ServicesPage;