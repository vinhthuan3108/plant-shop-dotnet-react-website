import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import thư viện thông báo

function Register() {
    const navigate = useNavigate();
    
    // State chứa dữ liệu form
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phoneNumber: ''
    });

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Thêm trạng thái loading

    const handleChange = (e) => {
        const { name, value } = e.target;

        // --- LOGIC MỚI: CHỈ CHO NHẬP SỐ VÀO Ô PHONE ---
        if (name === 'phoneNumber') {
            // Regex: Nếu chuỗi nhập vào KHÔNG phải là số nguyên thì return luôn (không lưu state)
            if (!/^\d*$/.test(value)) {
                return; 
            }
        }
        // ----------------------------------------------

        setFormData({
            ...formData,
            [name]: value
        });

        if (error) setError('');
    };

    // Hàm kiểm tra định dạng email
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Hàm kiểm tra độ mạnh mật khẩu (>= 8 ký tự và có ký tự đặc biệt)
    const isValidPassword = (password) => {
        // Regex: Ít nhất 8 ký tự, có ít nhất 1 ký tự đặc biệt
        // Các ký tự đặc biệt ví dụ: ! @ # $ % ^ & *
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return password.length >= 8 && hasSpecialChar;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // --- 1. VALIDATION ---

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

        // --- LOGIC MỚI: KIỂM TRA ĐỘ DÀI SỐ ĐIỆN THOẠI ---
        if (formData.phoneNumber) {
            if (formData.phoneNumber.length < 10 || formData.phoneNumber.length > 11) {
                setError("Số điện thoại phải từ 10 đến 11 số!");
                return;
            }
        }

        // --- 2. GỌI API ---
        setIsLoading(true); // Bắt đầu loading
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
                // Thành công
                toast.success('Đăng ký thành công! Hãy kiểm tra email để lấy mã OTP.');
                // Chuyển hướng sang trang nhập OTP và mang theo email
                navigate('/verify-otp', { state: { email: formData.email } }); 
            } else {
                // Thất bại (Ví dụ: Email trùng)
                setError(responseText || "Đăng ký thất bại");
                toast.error(responseText || "Đăng ký thất bại");
            }
        } catch (err) {
            console.error(err);
            setError("Lỗi kết nối Server");
            toast.error("Không thể kết nối đến máy chủ");
        } finally {
            setIsLoading(false); // Kết thúc loading
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '400px' }}>
                <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Đăng Ký </h2>
                
                {/* Hiển thị lỗi nếu có */}
                {error && (
                    <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', border: '1px solid #f5c6cb' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{fontWeight: '500'}}>Email</label>
                        <input 
                            type="email" name="email" required
                            value={formData.email} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ddd', borderRadius: '4px' }} 
                        />
                    </div>

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
                        disabled={isLoading} // Khóa nút khi đang loading
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            backgroundColor: isLoading ? '#6c757d' : '#28a745', // Đổi màu khi loading
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