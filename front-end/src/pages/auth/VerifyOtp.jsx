import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function VerifyOtp() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Lấy email được truyền từ trang Register sang (nếu có)
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [msg, setMsg] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('https://localhost:7298/api/Auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email, 
                    otpCode: otp 
                })
            });

            if (res.ok) {
                alert("Kích hoạt thành công! Hãy đăng nhập.");
                navigate('/login');
            } else {
                const text = await res.text();
                setMsg(text || "Mã xác thực không đúng");
            }
        } catch (err) {
            console.error(err);
            setMsg("Lỗi kết nối");
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <div style={{ background: 'white', padding: 30, borderRadius: 8, width: 400, textAlign: 'center' }}>
                <h3>Nhập Mã Xác Thực</h3>
                <p>Mã OTP đã được gửi đến email:</p>
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Email của bạn"
                    disabled={!!location.state?.email} // Nếu có email truyền sang thì khóa lại cho đỡ sửa
                    style={{ width: '100%', padding: 10, marginBottom: 10, background: '#eee', border: '1px solid #ddd' }}
                />
                
                <input 
                    type="text" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value)} 
                    placeholder="Nhập mã 6 số"
                    maxLength={6}
                    style={{ width: '100%', padding: 10, marginBottom: 15, fontSize: 20, textAlign: 'center', letterSpacing: 5 }}
                />

                {msg && <p style={{ color: 'red' }}>{msg}</p>}

                <button onClick={handleVerify} style={{ width: '100%', padding: 10, background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    Xác nhận
                </button>
            </div>
        </div>
    );
}

export default VerifyOtp;