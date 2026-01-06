import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUserCircle, FaSignOutAlt, FaChevronDown, FaTools, FaTimes, FaBars } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import axios from 'axios'; 
import './Header.css';
import defaultLogo from '../../assets/images/logo.png';
import { API_BASE } from '../../utils/apiConfig.jsx';
// Component hỗ trợ in đậm từ khóa tìm kiếm
// Thêm hàm này vào trên cùng hoặc trong file utils
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Thêm dấu \ trước các ký tự đặc biệt
};

const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    
    // SỬA DÒNG 121: Bọc highlight bằng hàm escapeRegExp
    // const regex = new RegExp(`(${highlight})`, 'gi');  <-- Cũ (Lỗi)
    const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi'); // <-- Mới (An toàn)

    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? <strong key={i} style={{ color: '#2e7d32', fontWeight: '800' }}>{part}</strong> : <span key={i}>{part}</span>
            )}
        </span>
    );
};

const Header = () => {
    // --- STATE & CONTEXT ---
    const [user, setUser] = useState(null); 
    const [config, setConfig] = useState({});
    const [categories, setCategories] = useState([]); 
    
    // State cho Mobile Menu
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // State tìm kiếm
    const [keyword, setKeyword] = useState("");
    const [searchCate, setSearchCate] = useState("");
    const [searchResults, setSearchResults] = useState([]); 
    const [showSuggestions, setShowSuggestions] = useState(false); 
    
    const navigate = useNavigate();
    const { cartCount, refreshCart, cartItems, removeFromCart, totalAmount } = useContext(CartContext);
    //const API_BASE = 'https://localhost:7298'; 
    const searchRef = useRef(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // --- EFFECTS ---
    useEffect(() => {
        // Lấy thông tin user
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));
        else {
            const oldName = localStorage.getItem('userName');
            if (oldName) setUser({ fullName: oldName, roleId: 2 });
        }

        // Lấy cấu hình hệ thống
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
                const configData = res.data.reduce((acc, item) => {
                    acc[item.configKey] = item.configValue;
                    return acc;
                }, {});
                setConfig(configData);
            } catch (error) { console.error(error); }
        };
        fetchConfig();

        // Lấy danh mục
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblCategories/active`);
                setCategories(res.data);
            } catch (error) { console.error(error); }
        };
        fetchCategories();

        // Click ra ngoài thì đóng gợi ý tìm kiếm
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Logic tìm kiếm (Debounce)
    useEffect(() => {
        if (keyword.length < 2) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            try {
                let productUrl = `${API_BASE}/api/TblProducts/shop?keyword=${encodeURIComponent(keyword)}&pageSize=5`;
                if(searchCate) productUrl += `&categoryId=${searchCate}`;
                let postUrl = `${API_BASE}/api/TblPosts/search?keyword=${encodeURIComponent(keyword)}`;

                const [prodRes, postRes] = await Promise.all([
                    axios.get(productUrl),
                    axios.get(postUrl).catch(() => ({ data: [] }))
                ]);
                
                const products = (prodRes.data.data || prodRes.data).map(p => ({ ...p, type: 'product' })); 
                const posts = (postRes.data || []).map(p => ({ ...p, type: 'blog' })); 
                
                const combinedResults = [...products, ...posts];
                
                if (combinedResults.length > 0) {
                    setSearchResults(combinedResults);
                    setShowSuggestions(true);
                } else {
                    setSearchResults([]);
                    setShowSuggestions(true);
                }
            } catch (error) { console.error("Lỗi tìm kiếm:", error); }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [keyword, searchCate]);

    // --- HANDLERS ---
    const handleSearchSubmit = () => {
        setShowSuggestions(false);
        let url = `/shop?keyword=${encodeURIComponent(keyword)}`;
        if (searchCate) url += `&category=${searchCate}`;
        navigate(url);
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') handleSearchSubmit(); };

    const handleLogout = () => {
        if (window.confirm("Bạn muốn đăng xuất?")) {
            localStorage.clear();
            setUser(null);
            refreshCart(); 
            navigate('/login');
        }
    };

    const isAdmin = user?.roleId === 1 || user?.roleId === 3 || user?.roleId === 4;
    const logoSrc = config.LogoUrl ? `${API_BASE}${config.LogoUrl}` : defaultLogo;

    // --- RENDER ---
    return (
        <header className="header-wrapper">
            {/* 1. HEADER TOP (Logo, Search, User/Cart) */}
            <div className="header-top">
                {/* Nút Hamburger (Chỉ hiện trên Mobile) */}
                <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(true)}>
                    <FaBars />
                </button>

                {/* Logo */}
                <Link to="/" className="logo-link">
                    <img src={logoSrc} alt="Logo" className="logo-img" />
                    <div className="logo-text-group">
                        <span className="logo-title">{config.StoreName || "Plant Shop"}</span>
                        <span className="logo-slogan">Thoả đam mê cây cảnh</span>
                    </div>
                </Link>

                {/* Thanh tìm kiếm */}
                <div className="search-container" ref={searchRef}>
                    <select className="search-select" value={searchCate} onChange={(e) => setSearchCate(e.target.value)}>
                        <option value="">Tất cả</option>
                        {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                    </select>
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="Tìm kiếm cây, bài viết..." 
                        value={keyword} 
                        onChange={(e) => setKeyword(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        onFocus={() => keyword.length >= 2 && setSearchResults.length > 0 && setShowSuggestions(true)} 
                    />
                    <button className="search-btn" onClick={handleSearchSubmit}><FaSearch /></button>

                    {/* Gợi ý tìm kiếm Dropdown */}
                    {showSuggestions && (
                        <div className="search-results-dropdown">
                            {searchResults.length > 0 ? (
                                <>
                                    {searchResults.map((item) => {
                                        if (item.type === 'product') {
                                            return (
                                                <Link to={`/product/${item.productId}`} key={`p-${item.productId}`} className="search-item" onClick={() => setShowSuggestions(false)}>
                                                    <img src={item.thumbnail && item.thumbnail.startsWith('http') ? item.thumbnail : `${API_BASE}${item.thumbnail}`} alt={item.productName} className="search-item-img" />
                                                    <div className="search-item-info">
                                                        <span className="search-item-name"><HighlightText text={item.productName} highlight={keyword} /></span>
                                                        <span className="search-item-price">{formatCurrency(item.salePrice || item.originalPrice)}</span>
                                                    </div>
                                                </Link>
                                            );
                                        } else {
                                            return (
                                                <Link to={`/blog/${item.id}`} key={`b-${item.id}`} className="search-item" onClick={() => setShowSuggestions(false)} style={{backgroundColor: '#fffdf5'}}>
                                                    <img src={item.image && item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`} alt={item.title} className="search-item-img" style={{borderRadius: '0'}}/>
                                                    <div className="search-item-info">
                                                        <span className="search-item-name" style={{fontSize: '13px', lineHeight: '1.4'}}>
                                                            <span style={{color: '#ff9800', marginRight: '5px', fontSize: '10px', border: '1px solid #ff9800', padding: '1px 4px', borderRadius: '3px', fontWeight:'bold'}}>BÀI VIẾT</span>
                                                            <HighlightText text={item.title} highlight={keyword} />
                                                        </span>
                                                    </div>
                                                </Link>
                                            );
                                        }
                                    })}
                                    <div className="search-view-all" onClick={handleSearchSubmit}>Xem tất cả kết quả cho "{keyword}"</div>
                                </>
                            ) : (
                                <div className="search-no-result">Không tìm thấy kết quả nào cho "{keyword}"</div>
                            )}
                        </div>
                    )}
                </div>

                {/* User & Cart Actions */}
                <div className="header-actions">
                    {/* Phần User (Sẽ ẩn trên Mobile bằng CSS .auth-links) */}
                    <div className="auth-links">
                        {user ? (
                            <div className="user-logged-in">
                                {isAdmin && <Link to="/admin/products" style={{marginRight: '15px', color: '#e67e22', textDecoration:'none', display:'flex', alignItems:'center', gap:'5px'}}><FaTools /> Admin</Link>}
                                <div className="user-info" onClick={() => navigate('/profile')}>
                                    <FaUserCircle style={{fontSize: '16px'}} />
                                    <span>{user.fullName || 'User'}</span>
                                </div>
                                <button className="logout-btn" onClick={handleLogout}><FaSignOutAlt style={{fontSize: '14px'}} /> Đăng xuất</button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login">ĐĂNG NHẬP</Link> <span style={{margin:'0 8px', color:'#ccc'}}>/</span> <Link to="/register">ĐĂNG KÝ</Link>
                            </>
                        )}
                    </div>

                    {/* Giỏ hàng & Mini Cart (Luôn hiện) */}
                    {!isAdmin && (
                        <div className="cart-wrapper">
                            <Link to="/cart" className="cart-box">
                                <div className="cart-icon-wrap">
                                    <FaShoppingCart className="cart-icon" />
                                    {cartCount > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: 'red', color: 'white', borderRadius: '50%', padding: '1px 5px', fontSize: '10px', fontWeight: 'bold' }}>{cartCount}</span>}
                                </div>
                                <div className="cart-info"><span className="cart-label">GIỎ HÀNG</span></div>
                            </Link>

                            {/* Dropdown Mini Cart */}
                            <div className="mini-cart-dropdown">
                                {cartItems && cartItems.length > 0 ? (
                                    <>
                                        <div className="mini-cart-list">
                                            {cartItems.map((item, idx) => (
                                                <div key={idx} className="mini-cart-item">
                                                    <img src={item.image && item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`} alt={item.productName} className="mini-cart-img" />
                                                    <div className="mini-cart-info">
                                                        <Link to={`/product/${item.productId}`} className="mini-cart-name">{item.productName}</Link>
                                                        <div className="mini-cart-price">{item.quantity} x {formatCurrency(item.salePrice || item.originalPrice)}</div>
                                                    </div>
                                                    <button className="mini-cart-remove" onClick={(e) => { e.preventDefault(); removeFromCart(item.variantId); }}>
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mini-cart-total">
                                            <span>Tổng tiền:</span>
                                            <span className="total-price">{formatCurrency(totalAmount)}</span>
                                        </div>
                                        <div className="mini-cart-actions">
                                            <Link to="/cart" className="btn-view-cart">XEM GIỎ HÀNG</Link>
                                            <Link to="/checkout" className="btn-checkout">THANH TOÁN</Link>
                                        </div>
                                    </>
                                ) : (
                                    <div className="mini-cart-empty"><p>Chưa có sản phẩm nào trong giỏ.</p></div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. NAVIGATION BAR (Desktop Only - Hidden on Mobile via CSS) */}
            <nav className="nav-bar">
                <div className="nav-container">
                     <ul className="nav-list">
                        <li><Link to="/">TRANG CHỦ</Link></li>
                        <li><Link to="/intro">GIỚI THIỆU</Link></li>
                        <li className="has-dropdown">
                            <Link to="/shop" className="dropdown-toggle" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                CÂY CẢNH 
                            </Link>
                             <ul className="dropdown-menu">
                                <li><Link to="/shop">Xem tất cả</Link></li>
                                {categories.map(c => <li key={c.categoryId}><Link to={`/shop?category=${c.categoryId}`}>{c.categoryName}</Link></li>)}
                             </ul>
                        </li>
                        <li><Link to="/guide">HƯỚNG DẪN</Link></li>
                        <li><Link to="/blog">BÀI VIẾT</Link></li>
                        <li><Link to="/contact">LIÊN HỆ</Link></li>
                    </ul>
                </div>
            </nav>

            {/* 3. MOBILE MENU (Sidebar & Overlay) */}
            <div 
                className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
                onClick={closeMobileMenu}
            ></div>

            <div className={`mobile-menu-container ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-header">
                    <span className="mobile-menu-title">MENU</span>
                    <button className="mobile-menu-close" onClick={closeMobileMenu}>
                        <FaTimes />
                    </button>
                </div>

                <ul className="mobile-menu-list">
                    {/* --- A. PHẦN TÀI KHOẢN (Đưa lên đầu) --- */}
                    {user ? (
                        <>
                            <li className="mobile-auth-item">
                                <Link to="/profile" onClick={closeMobileMenu} style={{color: '#2e7d32', display: 'flex', alignItems: 'center'}}>
                                    <FaUserCircle style={{marginRight: '8px', fontSize: '20px'}}/> 
                                    <span>Chào, <strong>{user.fullName}</strong></span>
                                </Link>
                            </li>
                            <li className="mobile-auth-item">
                                <div onClick={() => { handleLogout(); closeMobileMenu(); }} style={{cursor: 'pointer', color: '#d32f2f', display: 'flex', alignItems: 'center', padding: '12px 20px', fontWeight: '600'}}>
                                    <FaSignOutAlt style={{marginRight: '8px'}}/> Đăng xuất
                                </div>
                            </li>
                            <li style={{height: '1px', background: '#eee', margin: '5px 0'}}></li>
                        </>
                    ) : (
                        <>
                            <li className="mobile-auth-item">
                                <Link to="/login" onClick={closeMobileMenu} style={{display: 'flex', alignItems: 'center'}}>
                                    <FaUserCircle style={{marginRight: '8px', color: '#888'}}/> 
                                    ĐĂNG NHẬP
                                </Link>
                            </li>
                            <li className="mobile-auth-item">
                                <Link to="/register" onClick={closeMobileMenu} style={{paddingLeft: '45px'}}>
                                    ĐĂNG KÝ
                                </Link>
                            </li>
                            <li style={{height: '1px', background: '#eee', margin: '5px 0'}}></li>
                        </>
                    )}

                    {/* --- B. CÁC LINK ĐIỀU HƯỚNG --- */}
                    <li><Link to="/" onClick={closeMobileMenu}>TRANG CHỦ</Link></li>
                    <li><Link to="/intro" onClick={closeMobileMenu}>GIỚI THIỆU</Link></li>
                    
                    {/* Dropdown Cây cảnh Mobile */}
                    <li className="mobile-has-submenu">
                        <div className="mobile-submenu-title">
                            CÂY CẢNH <FaChevronDown size={10} />
                        </div>
                        <ul className="mobile-submenu">
                            <li><Link to="/shop" onClick={closeMobileMenu}>Xem tất cả</Link></li>
                            {categories.map(c => (
                                <li key={c.categoryId}>
                                    <Link to={`/shop?category=${c.categoryId}`} onClick={closeMobileMenu}>
                                        {c.categoryName}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>

                    <li><Link to="/guide" onClick={closeMobileMenu}>HƯỚNG DẪN</Link></li>
                    <li><Link to="/blog" onClick={closeMobileMenu}>BÀI VIẾT</Link></li>
                    <li><Link to="/contact" onClick={closeMobileMenu}>LIÊN HỆ</Link></li>
                    
                    {/* Admin Link Mobile */}
                    {isAdmin && (
                        <li style={{borderTop: '1px solid #eee', marginTop: '10px'}}>
                            <Link to="/admin/products" style={{color: '#e67e22', display: 'flex', alignItems: 'center', gap: '8px'}} onClick={closeMobileMenu}>
                                <FaTools /> QUẢN TRỊ VIÊN
                            </Link>
                        </li>
                    )}
                </ul>
            </div>
        </header>
    );
};

export default Header;