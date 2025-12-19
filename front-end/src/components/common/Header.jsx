import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import './Header.css';
import logo from '../../assets/images/logo.png'; // Đảm bảo đường dẫn đúng

const Header = () => {
    const [userFullName, setUserFullName] = useState(null);
    const navigate = useNavigate();

    const { cartCount, refreshCart } = useContext(CartContext);
    
    useEffect(() => {
        const savedName = localStorage.getItem('userName');
        if (savedName) {
            setUserFullName(savedName);
        }
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

    return (
        <header className="header-wrapper">
            <div className="header-top">
                {/* --- 1. SỬA PHẦN LOGO: ẢNH + CHỮ --- */}
                <Link to="/" className="logo-link">
                    {/* Ảnh Logo bên trái */}
                    <img src={logo} alt="Logo" className="logo-img" />
                    
                    {/* Khối chữ bên phải */}
                    <div className="logo-text-group">
                        <span className="logo-title">Plant Shop</span>
                        <span className="logo-slogan">Thoả đam mê cây cảnh</span>
                    </div>
                </Link>

                {/* 2. Thanh tìm kiếm */}
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

                {/* 3. Khu vực Đăng nhập & Giỏ hàng */}
                <div className="header-actions">
                    <div className="auth-links">
                        {userFullName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
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

            {/* --- PHẦN DƯỚI: MENU MÀU XANH --- */}
            <nav className="nav-bar">
                <div className="nav-container">
                    <ul className="nav-list">
                        <li><Link to="/">TRANG CHỦ</Link></li>
                        <li><Link to="/intro">GIỚI THIỆU</Link></li>
                        <li><Link to="/shop">CÂY CẢNH</Link></li>
                        <li><Link to="/service">DỊCH VỤ</Link></li>
                        <li><Link to="/blog">BLOG</Link></li>
                        <li><Link to="/contact">LIÊN HỆ</Link></li>
                        <li><Link to="/admin/products" style={{ color: '#ffd700' }}>QUẢN TRỊ</Link></li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Header;