import React from "react";
import { Link } from "react-router-dom";

// dùg Function Component
const HomePage = () => {
    // giao dien tra ve tu component
    return (
        // ko bik JS =)))
        // phan nd nay dung tam cua GPT
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <header style={{ backgroundColor: '#2c3e50', padding: '15px', color: 'white' }}>
                <h1>Phòng Mạch Tư</h1>
                <nav style={{ marginTop: '10px' }}>
                <Link to="/" style={{ marginRight: '20px', color: 'white' }}>Trang chủ</Link>
                <Link to="/services" style={{ marginRight: '20px', color: 'white' }}>Dịch vụ</Link>
                <Link to="/intro" style={{ color: 'white' }}>Giới thiệu</Link>
                </nav>
            </header>

            {/* Nội dung chính */}
            <main style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Chào mừng đến với hệ thống quản lý phòng mạch tư</h2>
                <p>Đặt lịch khám, tra cứu thông tin, và nhiều chức năng khác.</p>
                
                {/* Nút hành động */}
                <div style={{ marginTop: '30px' }}>
                    <button
                        onClick={() => alert('Đi tới trang đăng nhập')}
                        style={{ marginRight: '20px', padding: '10px 20px' }}
                    >
                        🔐 Đăng nhập
                    </button>
                    
                    <button
                        onClick={() => alert('Đi tới trang đăng ký khám bệnh')}
                        style={{ padding: '10px 20px' }}
                    >
                        📝 Đăng ký khám bệnh
                    </button>
                </div>
            </main>
        </div>
    );
};

// nhớ export để mấy file khác còn dùng
export default HomePage;