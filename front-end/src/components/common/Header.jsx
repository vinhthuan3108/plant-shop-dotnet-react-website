import React from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaShoppingCart } from 'react-icons/fa';
import './Header.css'; // Gọi file CSS bạn đã tạo

const Header = () => {
  return (
    <header className="header-wrapper">
      {/* --- PHẦN TRÊN: LOGO, TÌM KIẾM, GIỎ HÀNG --- */}
      <div className="header-top">
        
        {/* 1. Logo */}
        <Link to="/" className="logo-link">
           {/* Bạn có thể thay bằng thẻ <img> nếu có file ảnh logo */}
           <span style={{fontSize: '30px', textTransform: 'uppercase'}}>Vườn Cây Việt</span>
           <span className="logo-slogan">Không Chỉ Là Cây Cảnh</span>
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
            
            {/* Link Đăng nhập / Đăng ký */}
            <div className="auth-links">
                <Link to="/login">ĐĂNG NHẬP</Link> 
                <span style={{color: '#ccc', margin: '0 5px'}}>/</span>
                <Link to="/register">ĐĂNG KÝ</Link>
            </div>

            {/* Giỏ hàng */}
            <Link to="/cart" className="cart-box">
                <div className="cart-icon-wrap">
                    <FaShoppingCart className="cart-icon" />
                    
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
            
            {/* Ví dụ menu có mũi tên trỏ xuống nếu muốn làm dropdown sau này */}
            <li><Link to="/shop">CÂY CẢNH</Link></li>
            <li><Link to="/pots">CHẬU CẢNH</Link></li>
            <li><Link to="/accessories">PHỤ KIỆN CÂY CẢNH</Link></li>
            <li><Link to="/service">DỊCH VỤ</Link></li>
            <li><Link to="/blog">BLOG</Link></li>
            <li><Link to="/contact">LIÊN HỆ</Link></li>
            
            {/* Link tạm để vào trang Admin */}
            <li><Link to="/admin/products" style={{color: '#ffd700'}}>QUẢN TRỊ</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;