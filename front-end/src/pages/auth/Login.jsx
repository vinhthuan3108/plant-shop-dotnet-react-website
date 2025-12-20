import { useState, useContext } from 'react'; // 1. Thêm useContext
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext'; // 2. Import Context

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    // 3. Lấy hàm refreshCart từ Context
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
                alert('Xin chào: ' + data.fullName);
                
                // Lưu thông tin vào LocalStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.role);
                localStorage.setItem('userName', data.fullName);
                localStorage.setItem('userId', data.userId); // Quan trọng

                // 4. GỌI HÀM NÀY ĐỂ CẬP NHẬT GIỎ HÀNG NGAY LẬP TỨC
                // Nó sẽ lấy userId vừa lưu để tải giỏ hàng từ DB về
                await refreshCart(); 

                // Chuyển hướng
                if (data.role === 1 || data.role === 3 || data.role === 4) {
                    navigate('/admin/products');
                } else {
                    navigate('/products');
                }
            } else {
                alert(data); 
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối server');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Đăng Nhập</h2>
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Email:</label>
                    <div></div>
                    <label>c3lttrong.2a2.vthuan@gmail.com</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Mật khẩu:</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>Đăng nhập</button>
            </form>
        </div>
    );
}

export default Login;