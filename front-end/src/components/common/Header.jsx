import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUserCircle, FaSignOutAlt, FaChevronDown, FaTools } from 'react-icons/fa'; 
import { CartContext } from '../../context/CartContext';
import axios from 'axios'; 
import './Header.css';

// Ảnh dự phòng
import defaultLogo from '../../assets/images/logo.png'; 

const Header = () => {
    // State quản lý
    const [user, setUser] = useState(null); // Lưu nguyên object user
    const [config, setConfig] = useState({}); 
    const [categories, setCategories] = useState([]); 
    
    const navigate = useNavigate();
    const { cartCount, refreshCart } = useContext(CartContext);
    
    const API_BASE = 'https://localhost:7298'; 

    useEffect(() => {
        // 1. LẤY THÔNG TIN USER (Logic chuẩn để tránh lỗi đăng nhập lại)
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const parsedUser = JSON.parse(userStr);
            setUser(parsedUser);
        } else {
            // Fallback: Kiểm tra xem có lưu kiểu cũ không để hiển thị tạm
            const oldName = localStorage.getItem('userName');
            if (oldName) {
                setUser({ fullName: oldName, roleId: 2 }); // Giả định là khách
            }
        }

        // 2. LẤY CONFIG
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
                const configData = res.data.reduce((acc, item) => {
                    acc[item.configKey] = item.configValue;
                    return acc;
                }, {});
                setConfig(configData);
            } catch (error) {
                console.error("Lỗi config:", error);
            }
        };
        fetchConfig();

        // 3. LẤY DANH MỤC
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblCategories/active`);
                setCategories(res.data);
            } catch (error) {
                console.error("Lỗi danh mục:", error);
            }
        };
        fetchCategories();
    }, []);
    
    const handleLogout = () => {
        if (window.confirm("Bạn muốn đăng xuất?")) {
            // Xóa sạch mọi thứ liên quan
            localStorage.removeItem('token');
            localStorage.removeItem('user'); 
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');

            setUser(null);
            refreshCart(); 

            alert("Đã đăng xuất!");
            navigate('/login');
        }
    };

    // LOGIC CHECK ADMIN
    // Role 2 là khách hàng (hoặc null). Còn lại (1,3,4) là quản trị.
    // Dùng toán tử optional chaining (?.) để không lỗi nếu user null
    const isAdmin = user?.roleId === 1 || user?.roleId === 3 || user?.roleId === 4;

    const logoSrc = config.LogoUrl ? `${API_BASE}${config.LogoUrl}` : defaultLogo;

    return (
        <header className="header-wrapper">
            <div className="header-top">
                {/* --- 1. LOGO --- */}
                <Link to="/" className="logo-link">
                    <img src={logoSrc} alt="Logo" className="logo-img" style={{ objectFit: 'contain' }} />
                    <div className="logo-text-group">
                        <span className="logo-title">{config.StoreName || "Plant Shop"}</span>
                        <span className="logo-slogan">Thoả đam mê cây cảnh</span>
                    </div>
                </Link>

                {/* --- 2. TÌM KIẾM --- */}
                <div className="search-container">
                    <select className="search-select">
                        <option>Tất cả</option>
                        <option>Cây cảnh</option>
                        <option>Chậu cảnh</option>
                    </select>
                    <input type="text" className="search-input" placeholder="Tìm kiếm..." />
                    <button className="search-btn"><FaSearch /></button>
                </div>

                {/* --- 3. KHU VỰC TÀI KHOẢN & GIỎ HÀNG --- */}
                <div className="header-actions">
                    <div className="auth-links">
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                
                                {/* A. GIAO DIỆN CHO ADMIN (Nút cam) */}
                                {isAdmin && (
                                    <Link 
                                        to="/admin/products" 
                                        style={{ 
                                            display: 'flex', alignItems: 'center', gap: '5px', 
                                            color: '#e67e22', fontWeight: 'bold', textDecoration: 'none',
                                            border: '1px solid #e67e22', padding: '4px 8px', borderRadius: '4px',
                                            fontSize: '13px'
                                        }}
                                        title="Quay lại trang quản trị"
                                    >
                                        <FaTools /> Quản trị
                                    </Link>
                                )}

                                {/* B. GIAO DIỆN TÊN USER (Dùng lại style cũ của bạn) */}
                                <span 
                                    onClick={() => navigate('/profile')} 
                                    style={{ 
                                        // Style cũ màu xanh lá cây đậm đà
                                        color: '#2e7d32', 
                                        fontWeight: 'bold', 
                                        fontSize: '13px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '5px',
                                        cursor: 'pointer' 
                                    }}
                                    title="Xem hồ sơ cá nhân"
                                >
                                    <FaUserCircle /> {user.fullName ? user.fullName.toUpperCase() : 'USER'}
                                </span>

                                {/* Nút đăng xuất chung */}
                                <button 
                                    onClick={handleLogout} 
                                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}
                                >
                                    <FaSignOutAlt /> ĐĂNG XUẤT
                                </button>
                            </div>
                        ) : (
                            /* C. CHƯA ĐĂNG NHẬP */
                            <>
                                <Link to="/login">ĐĂNG NHẬP</Link> 
                                <span style={{ margin: '0 5px', color: '#ccc' }}>/</span>
                                <Link to="/register">ĐĂNG KÝ</Link>
                            </>
                        )}
                    </div>

                    {/* GIỎ HÀNG (Admin ẩn, Khách hiện style cũ) */}
                    {!isAdmin && (
                        <Link to="/cart" className="cart-box" style={{ position: 'relative' }}>
                            <div className="cart-icon-wrap">
                                <FaShoppingCart className="cart-icon" />
                                {cartCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-8px',
                                        backgroundColor: 'red',
                                        color: 'white',
                                        borderRadius: '50%',
                                        padding: '2px 6px',
                                        fontSize: '10px',
                                        fontWeight: 'bold'
                                    }}>
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <div className="cart-info">
                                <span className="cart-label">GIỎ HÀNG</span>
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* --- MENU NAV (Giữ nguyên style cũ) --- */}
            <nav className="nav-bar">
                <div className="nav-container">
                     <ul className="nav-list">
                        <li><Link to="/">TRANG CHỦ</Link></li>
                        <li><Link to="/intro">GIỚI THIỆU</Link></li>
                        
                        <li className="has-dropdown">
                            <Link to="/shop" className="dropdown-toggle" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                CÂY CẢNH <FaChevronDown style={{ fontSize: '10px' }}/>
                            </Link>
                             <ul className="dropdown-menu">
                                <li><Link to="/shop">Xem tất cả</Link></li>
                                {categories.map(c => (
                                    <li key={c.categoryId}><Link to={`/shop?cate=${c.categoryId}`}>{c.categoryName}</Link></li>
                                ))}
                             </ul>
                        </li>
                        <li><Link to="/guide">HƯỚNG DẪN</Link></li>
                        <li><Link to="/blog">BÀI VIẾT</Link></li>
                        <li><Link to="/contact">LIÊN HỆ</Link></li>
                     </ul>
                </div>
            </nav>
        </header>
    );
};

export default Header;