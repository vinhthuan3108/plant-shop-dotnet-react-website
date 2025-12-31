import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; 

function Register() {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phoneNumber: ''
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); 

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phoneNumber') {
            if (!/^\d*$/.test(value)) {
                return; 
            }
        }

        setFormData({
            ...formData,
            [name]: value
        });

        if (error) setError('');
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isValidPassword = (password) => {
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return password.length >= 8 && hasSpecialChar;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Validation thủ công (dự phòng)
        if (!isValidEmail(formData.email)) {
            setError("Định dạng email không hợp lệ!");
            return;
        }

        if (!isValidPassword(formData.password)) {
            setError("Mật khẩu phải có tối thiểu 8 ký tự và chứa ít nhất 1 ký tự đặc biệt!");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp!");
            return;
        }

        if (formData.phoneNumber) {
            if (formData.phoneNumber.length < 10 || formData.phoneNumber.length > 11) {
                setError("Số điện thoại phải từ 10 đến 11 số!");
                return;
            }
        }

        setIsLoading(true); 
        try {
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

            const responseText = await res.text();

            if (res.ok) {
                toast.success('Đăng ký thành công! Hãy kiểm tra email để lấy mã OTP.');
                navigate('/verify-otp', { state: { email: formData.email } }); 
            } else {
                setError(responseText || "Đăng ký thất bại");
                toast.error(responseText || "Đăng ký thất bại");
            }
        } catch (err) {
            console.error(err);
            setError("Lỗi kết nối Server");
            toast.error("Không thể kết nối đến máy chủ");
        } finally {
            setIsLoading(false); 
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px' }}>
                <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Đăng Ký </h2>
                
                {error && (
                    <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', border: '1px solid #f5c6cb' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    {/* --- ĐOẠN ĐÃ SỬA: INPUT EMAIL --- */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{fontWeight: '500'}}>Email</label>
                        <input 
                            type="email" 
                            name="email" 
                            required
                            value={formData.email} 
                            // Sửa đổi onChange để vừa cập nhật state vừa reset validate message
                            onChange={(e) => {
                                handleChange(e); 
                                e.target.setCustomValidity(''); // Xóa lỗi cũ khi gõ
                                if (e.target.validity.typeMismatch) {
                                    e.target.setCustomValidity('Vui lòng nhập đúng định dạng email (ví dụ: abc@gmail.com)');
                                }
                            }}
                            // Thêm onInvalid để bắt sự kiện lỗi của trình duyệt
                            onInvalid={(e) => {
                                if (e.target.validity.valueMissing) {
                                    e.target.setCustomValidity('Vui lòng nhập email, không được để trống');
                                } else {
                                    e.target.setCustomValidity('Vui lòng nhập đúng định dạng email (ví dụ: abc@gmail.com)');
                                }
                            }}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>
                    {/* --------------------------------- */}

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{fontWeight: '500'}}>Họ và tên</label>
                        <input 
                            type="text" name="fullName" required
                            value={formData.fullName} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{fontWeight: '500'}}>Số điện thoại</label>
                        <input 
                            type="text" name="phoneNumber"
                            value={formData.phoneNumber} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{fontWeight: '500'}}>Mật khẩu</label>
                        <input 
                            type="password" name="password" required
                            placeholder="Tối thiểu 8 ký tự, có ký tự đặc biệt"
                            value={formData.password} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{fontWeight: '500'}}>Nhập lại mật khẩu</label>
                        <input 
                            type="password" name="confirmPassword" required
                            placeholder="Nhập lại mật khẩu trên"
                            value={formData.confirmPassword} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            backgroundColor: isLoading ? '#6c757d' : '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: isLoading ? 'not-allowed' : 'pointer', 
                            fontSize: '16px', 
                            fontWeight: 'bold',
                            transition: 'background 0.3s'
                        }}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                    <span>Đã có tài khoản? </span>
                    <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>Đăng nhập tại đây</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;