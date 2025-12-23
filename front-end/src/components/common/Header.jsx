import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUserCircle, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import axios from 'axios'; 
import './Header.css';

// Ảnh dự phòng khi chưa upload logo trong admin
import defaultLogo from '../../assets/images/logo.png'; 

const Header = () => {
    const [userFullName, setUserFullName] = useState(null);
    const [config, setConfig] = useState({}); // State lưu cấu hình
    const [categories, setCategories] = useState([]); // State lưu danh mục
    
    const navigate = useNavigate();
    const { cartCount, refreshCart } = useContext(CartContext);
    
    // Cổng backend của bạn (hãy đổi nếu khác port 7000)
    const API_BASE = 'https://localhost:7298'; 

    useEffect(() => {
        // 1. Lấy thông tin User từ LocalStorage
        const savedName = localStorage.getItem('userName');
        if (savedName) {
            setUserFullName(savedName);
        }

        // 2. Gọi API lấy thông tin cấu hình (Logo, Tên shop...)
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
                // Chuyển mảng [{configKey: 'A', configValue: 'B'}] -> object { A: 'B' }
                const configData = res.data.reduce((acc, item) => {
                    acc[item.configKey] = item.configValue;
                    return acc;
                }, {});
                setConfig(configData);
            } catch (error) {
                console.error("Lỗi lấy cấu hình header:", error);
            }
        };
        fetchConfig();
        // --- THÊM ĐOẠN CODE NÀY VÀO TRONG USEEFFECT ---
        // Gọi API lấy danh mục (Lưu ý: Bạn phải đã làm Bước 1 ở phần hướng dẫn Backend rồi nhé)
        const fetchCategories = async () => {
            try {
                // Gọi endpoint lấy danh mục đang hoạt động
                const res = await axios.get(`${API_BASE}/api/TblCategories/active`);
                setCategories(res.data);
            } catch (error) {
                console.error("Lỗi lấy danh mục:", error);
            }
        };
        fetchCategories();
    }, []);
    
    const handleLogout = () => {
        if (window.confirm("Bạn muốn đăng xuất?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');

            setUserFullName(null);
            refreshCart(); 

            alert("Đã đăng xuất!");
            navigate('/login');
        }
    };

    // LOGIC HIỂN THỊ LOGO:
    // Nếu có config.LogoUrl (từ folder configs) thì dùng, không thì dùng defaultLogo
    const logoSrc = config.LogoUrl ? `${API_BASE}${config.LogoUrl}` : defaultLogo;

    return (
        <header className="header-wrapper">
            <div className="header-top">
                {/* --- 1. LOGO & TÊN SHOP --- */}
                <Link to="/" className="logo-link">
                    <img 
                        src={logoSrc} 
                        alt="Logo" 
                        className="logo-img" 
                        style={{ objectFit: 'contain' }} 
                    />
                    
                    <div className="logo-text-group">
                        <span className="logo-title">
                            {config.StoreName || "Plant Shop"}
                        </span>
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
                    <button className="search-btn">
                        <FaSearch />
                    </button>
                </div>

                {/* --- 3. ĐĂNG NHẬP & GIỎ HÀNG --- */}
                <div className="header-actions">
                    <div className="auth-links">
                        {userFullName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span 
                                    onClick={() => navigate('/profile')} 
                                    style={{ 
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
                                    <FaUserCircle /> {userFullName.toUpperCase()}
                                </span>

                                <button 
                                    onClick={handleLogout}
                                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}
                                >
                                    <FaSignOutAlt /> ĐĂNG XUẤT
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login">ĐĂNG NHẬP</Link> 
                                <span style={{ color: '#ccc', margin: '0 5px' }}>/</span>
                                <Link to="/register">ĐĂNG KÝ</Link>
                            </>
                        )}
                    </div>

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
                </div>
            </div>

            {/* --- MENU NAV --- */}
            <nav className="nav-bar">
                <div className="nav-container">
                    <ul className="nav-list">
                        <li><Link to="/">TRANG CHỦ</Link></li>
                        <li><Link to="/intro">GIỚI THIỆU</Link></li>
                        <li className="has-dropdown">
                <Link to="/shop" className="dropdown-toggle" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    CÂY CẢNH <FaChevronDown style={{ fontSize: '10px' }}/>
                </Link>
                {/* Menu con xổ xuống */}
                <ul className="dropdown-menu">
                    <li><Link to="/shop">Xem tất cả</Link></li>
                    {categories.map((cate) => (
                        <li key={cate.categoryId}>
                            {/* Truyền ID danh mục lên URL */}
                            <Link to={`/shop?category=${cate.categoryId}`}>
                                {cate.categoryName}
                            </Link>
                        </li>
                    ))}
                </ul>
            </li>
                        <li><Link to="/guide">HƯỚNG DẪN</Link></li>
                        <li><Link to="/blog">BÀI ĐĂNG</Link></li>
                        <li><Link to="/contact">LIÊN HỆ</Link></li>
                        {/* <li><Link to="/admin/products" style={{ color: '#ffd700' }}>QUẢN TRỊ</Link></li> */}
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Header;