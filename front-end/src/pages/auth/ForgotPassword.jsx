import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
    // step 1: Nhập email, step 2: Nhập OTP & Pass mới
    const [step, setStep] = useState(1); 
    
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // 1. Thêm state mới
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    // Xử lý Gửi yêu cầu lấy mã OTP
    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('https://localhost:7298/api/Auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const text = await res.text(); 
            if (res.ok) {
                alert(text);
                setStep(2); 
            } else {
                alert(text);
            }
        } catch (error) {
            alert('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý Đặt lại mật khẩu
    const handleResetPassword = async (e) => {
        e.preventDefault();

        // 2. Thêm validation kiểm tra trùng khớp
        if (newPassword !== confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('https://localhost:7298/api/Auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email, 
                    otpCode: otp, 
                    newPassword: newPassword 
                })
            });

            const text = await res.text();
            if (res.ok) {
                alert("Thành công! Vui lòng đăng nhập lại.");
                navigate('/login'); 
            } else {
                alert(text);
            }
        } catch (error) {
            alert('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2 style={{textAlign: 'center'}}>Quên Mật Khẩu</h2>
            
            {step === 1 && (
                <form onSubmit={handleSendCode}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Nhập Email đã đăng ký:</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            placeholder="example@gmail.com"
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
                        />
                    </div>
                    <button disabled={loading} type="submit" style={{ width: '100%', padding: '10px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                        {loading ? 'Đang gửi...' : 'Lấy mã xác nhận'}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleResetPassword}>
                    <p style={{fontStyle: 'italic', fontSize: '14px'}}>Mã OTP đã được gửi tới: <b>{email}</b></p>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label>Nhập mã OTP (6 số):</label>
                        <input 
                            type="text" 
                            value={otp} 
                            onChange={e => setOtp(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Mật khẩu mới:</label>
                        <input 
                            type="password" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
                        />
                    </div>

                    {/* 3. Thêm ô nhập lại mật khẩu vào đây */}
                    <div style={{ marginBottom: '15px' }}>
                        <label>Nhập lại mật khẩu mới:</label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            required 
                            placeholder="Nhập lại mật khẩu mới"
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }} 
                        />
                    </div>

                    <button disabled={loading} type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                        {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        style={{ width: '100%', padding: '10px', marginTop: '10px', background: 'transparent', color: '#666', border: '1px solid #ccc', cursor: 'pointer' }}>
                        Quay lại
                    </button>
                </form>
            )}

            <div style={{marginTop: '20px', textAlign: 'center'}}>
                 <a href="/login" style={{textDecoration: 'none', color: '#007bff'}}>Quay về đăng nhập</a>
            </div>
        </div>
    );
}

export default ForgotPassword;