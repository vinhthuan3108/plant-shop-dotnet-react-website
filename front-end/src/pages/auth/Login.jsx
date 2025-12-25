import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const { refreshCart } = useContext(CartContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('https://localhost:7298/api/Auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                const userSave = {
                    userId: data.userId,
                    email: email,
                    fullName: data.fullName,
                    roleId: data.role,
                    token: data.token
                };

                localStorage.setItem('user', JSON.stringify(userSave));
                localStorage.setItem('token', data.token);

                await refreshCart(); 

                if (data.role === 1 || data.role === 3 || data.role === 4) {
                    navigate('/admin/products');
                } else {
                    navigate('/'); 
                }
            } else {
                alert(data.message || "Đăng nhập thất bại"); 
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối server');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Đăng Nhập</h2>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }} 
                    />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <label>Mật khẩu:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }} 
                    />
                    
                    <div style={{ textAlign: 'right', marginTop: '5px' }}>
                        <span 
                            onClick={() => navigate('/forgot-password')} 
                            style={{ color: '#007bff', cursor: 'pointer', fontSize: '14px' }}
                        >
                            Quên mật khẩu?
                        </span>
                    </div>
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
                    Đăng nhập
                </button>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                    <span>Chưa có tài khoản? </span>
                    <span 
                        onClick={() => navigate('/register')} 
                        style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px' }}
                    >
                        Đăng ký ngay
                    </span>
                </div>

                {/* --- MỚI THÊM: Tiếp tục mà không đăng nhập --- */}
                <div style={{ marginTop: '15px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                    <span 
                        onClick={() => navigate('/')} 
                        style={{ 
                            color: '#6c757d', // Màu xám nhẹ để không nổi bật bằng nút Đăng nhập
                            cursor: 'pointer', 
                            fontSize: '14px',
                            textDecoration: 'underline'
                        }}
                        title="Về trang chủ với tư cách khách"
                    >
                        ← Tiếp tục mà không đăng nhập
                    </span>
                </div>

            </form>
        </div>
    );
}

export default Login;