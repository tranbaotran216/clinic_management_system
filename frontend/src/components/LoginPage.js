import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
    const [tenDangNhap, setTenDangNhap] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await axios.post('/quan-ly-tai-khoan/login/', {
                ten_dang_nhap: tenDangNhap,
                password: password,
            });

            localStorage.setItem('access', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);
            localStorage.setItem('userRole', response.data.user.vai_tro); // Lưu vai trò

            // Chuyển hướng theo vai trò
            if (response.data.user.vai_tro === 'manager') {
                navigate('/managerdashboard');
            } else if (response.data.user.vai_tro === 'med_staff') {
                navigate('/staffdashboard');
            } else {
                navigate('/');
            }

        } catch (err) {
            if (err.response) {
                setError(err.response.data.detail || err.response.data.error || 'Tên đăng nhập hoặc mật khẩu không đúng.');
                console.error('Login API error:', err.response.data);
            } else if (err.request) {
                setError('Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối mạng.');
                console.error('No response received:', err.request);
            } else {
                setError('Lỗi khi gửi yêu cầu đăng nhập: ' + err.message);
                console.error('Request setup error:', err.message);
            }
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '60px auto', padding: 32, border: '1px solid #eee', borderRadius: 8 }}>
            <h2>Đăng nhập</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                    <input
                        type="text"
                        placeholder="Tên đăng nhập"
                        value={tenDangNhap}
                        onChange={e => setTenDangNhap(e.target.value)}
                        required
                        style={{ width: '100%', padding: 8 }}
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <input
                        type="password"
                        placeholder="Mật khẩu"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: 8 }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4 }}>
                    Đăng nhập
                </button>
                {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
            </form>
        </div>
    );
};

export default LoginPage;