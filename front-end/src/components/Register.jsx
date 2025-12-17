import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
    const navigate = useNavigate();
    
    // State chứa dữ liệu form
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '', // Thêm xác nhận mật khẩu
        fullName: '',
        phoneNumber: ''
    });

    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // 1. Validate cơ bản ở Client
        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            // 2. Gọi API (Lưu ý: API RegisterDto không có confirmPassword nên ta loại bỏ nó ra)
            const payload = {
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber
            };

            const res = await fetch('https://localhost:7298/api/Auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Đăng ký thành công! Vui lòng kiểm tra email lấy mã OTP.');
                
                
                navigate('/verify-otp', { state: { email: formData.email } }); 
            } else {
                
                const errText = await res.text();
                setError(errText || "Đăng ký thất bại");
            }
        } catch (err) {
            console.error(err);
            setError("Lỗi kết nối Server");
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '400px' }}>
                <h2 style={{ textAlign: 'center', color: '#333' }}>Đăng Ký Tài Khoản</h2>
                
                {error && <p style={{ color: 'red', textAlign: 'center', background: '#ffe6e6', padding: '5px' }}>{error}</p>}

                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Email (*)</label>
                        <input 
                            type="email" name="email" required
                            value={formData.email} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Họ và tên (*)</label>
                        <input 
                            type="text" name="fullName" required
                            value={formData.fullName} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Số điện thoại</label>
                        <input 
                            type="text" name="phoneNumber"
                            value={formData.phoneNumber} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Mật khẩu (*)</label>
                        <input 
                            type="password" name="password" required
                            value={formData.password} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label>Nhập lại mật khẩu (*)</label>
                        <input 
                            type="password" name="confirmPassword" required
                            value={formData.confirmPassword} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

                    <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                        Đăng Ký Ngay
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <span>Đã có tài khoản? </span>
                    <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>Đăng nhập tại đây</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;