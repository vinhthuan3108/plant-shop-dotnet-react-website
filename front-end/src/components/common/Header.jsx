import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaShoppingCart, FaUserCircle, FaSignOutAlt, FaChevronDown, FaTools } from 'react-icons/fa'; 
import { CartContext } from '../../context/CartContext';
import axios from 'axios'; 
import './Header.css';
import defaultLogo from '../../assets/images/logo.png'; 

// --- 1. COMPONENT HỖ TRỢ IN ĐẬM TỪ KHÓA ---
const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, i) => 
                regex.test(part) ? (
                    <strong key={i} style={{ color: '#2e7d32', fontWeight: '800' }}>{part}</strong>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

const Header = () => {
    const [user, setUser] = useState(null); 
    const [config, setConfig] = useState({}); 
    const [categories, setCategories] = useState([]); 
    
    // --- STATE TÌM KIẾM ---
    const [keyword, setKeyword] = useState("");
    const [searchCate, setSearchCate] = useState(""); 
    const [searchResults, setSearchResults] = useState([]); 
    const [showSuggestions, setShowSuggestions] = useState(false); 
    
    const navigate = useNavigate();
    const { cartCount, refreshCart } = useContext(CartContext);
    const API_BASE = 'https://localhost:7298'; 
    const searchRef = useRef(null);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setUser(JSON.parse(userStr));
        else {
            const oldName = localStorage.getItem('userName');
            if (oldName) setUser({ fullName: oldName, roleId: 2 });
        }

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

        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblCategories/active`);
                setCategories(res.data);
            } catch (error) { console.error(error); }
        };
        fetchCategories();

        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    // --- LOGIC TÌM KIẾM ---
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
            } catch (error) {
                console.error("Lỗi tìm kiếm:", error);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [keyword, searchCate]);

    const handleSearchSubmit = () => {
        setShowSuggestions(false);
        let url = `/shop?keyword=${encodeURIComponent(keyword)}`;
        if (searchCate) url += `&category=${searchCate}`;
        navigate(url);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearchSubmit();
    };

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

    return (
        <header className="header-wrapper">
            <div className="header-top">
                <Link to="/" className="logo-link">
                    <img src={logoSrc} alt="Logo" className="logo-img" style={{ objectFit: 'contain' }} />
                    <div className="logo-text-group">
                        <span className="logo-title">{config.StoreName || "Plant Shop"}</span>
                        <span className="logo-slogan">Thoả đam mê cây cảnh</span>
                    </div>
                </Link>

                <div className="search-container" ref={searchRef}>
                    <select className="search-select" value={searchCate} onChange={(e) => setSearchCate(e.target.value)}>
                        <option value="">Tất cả</option>
                        {categories.map(c => (
                            <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                        ))}
                    </select>
                    
                    <input 
                        type="text" className="search-input" placeholder="Tìm kiếm cây, bài viết..." 
                        value={keyword} onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => keyword.length >= 2 && setSearchResults.length > 0 && setShowSuggestions(true)}
                    />
                    
                    <button className="search-btn" onClick={handleSearchSubmit}><FaSearch /></button>

                    {showSuggestions && (
                        <div className="search-results-dropdown">
                            {searchResults.length > 0 ? (
                                <>
                                    {searchResults.map((item, index) => {
                                        if (item.type === 'product') {
                                            return (
                                                <Link to={`/product/${item.productId}`} key={`p-${item.productId}`} className="search-item" onClick={() => setShowSuggestions(false)}>
                                                    <img src={item.thumbnail && item.thumbnail.startsWith('http') ? item.thumbnail : `${API_BASE}${item.thumbnail}`} 
                                                         alt={item.productName} className="search-item-img" />
                                                    <div className="search-item-info">
                                                        <span className="search-item-name">
                                                            <HighlightText text={item.productName} highlight={keyword} />
                                                        </span>
                                                        <span className="search-item-price">{formatCurrency(item.salePrice || item.originalPrice)}</span>
                                                    </div>
                                                </Link>
                                            );
                                        } 
                                        else {
                                            return (
                                                <Link to={`/blog/${item.id}`} key={`b-${item.id}`} className="search-item" onClick={() => setShowSuggestions(false)} style={{backgroundColor: '#fffdf5'}}>
                                                    <img src={item.image && item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`} 
                                                         alt={item.title} className="search-item-img" style={{borderRadius: '0'}}/>
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
                                    <div className="search-view-all" onClick={handleSearchSubmit}>
                                        Xem tất cả kết quả cho "{keyword}"
                                    </div>
                                </>
                            ) : (
                                <div className="search-no-result">Không tìm thấy kết quả nào cho "{keyword}"</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="header-actions">
                    <div className="auth-links">
                        {user ? (
                            /* --- GIAO DIỆN KHI ĐÃ ĐĂNG NHẬP --- */
                            <div className="user-logged-in">
                                {isAdmin && (
                                    <Link to="/admin/products" style={{marginRight: '15px', color: '#e67e22', textDecoration:'none', display:'flex', alignItems:'center', gap:'5px'}}>
                                        <FaTools /> Admin
                                    </Link>
                                )}
                                
                                {/* Tên người dùng */}
                                <div className="user-info" onClick={() => navigate('/profile')}>
                                    <FaUserCircle style={{fontSize: '16px'}} /> {/* Giảm xuống 16px */}
                                    <span>{user.fullName ? user.fullName : 'User'}</span>
                                </div>

                                {/* Nút Đăng xuất */}
                                <button className="logout-btn" onClick={handleLogout}>
                                    <FaSignOutAlt style={{fontSize: '14px'}} /> Đăng xuất {/* Giảm xuống 14px */}
                                </button>
                            </div>
                        ) : (
                            /* Giao diện khi chưa đăng nhập */
                            <>
                                <Link to="/login">ĐĂNG NHẬP</Link> 
                                <span style={{ margin: '0 8px', color: '#ccc' }}>/</span>
                                <Link to="/register">ĐĂNG KÝ</Link>
                            </>
                        )}
                    </div>

                    {/* 3. GIỎ HÀNG */}
                    {!isAdmin && (
                        <Link to="/cart" className="cart-box">
                            <div className="cart-icon-wrap">
                                <FaShoppingCart className="cart-icon" />
                                {cartCount > 0 && (
                                    <span style={{ 
                                        position: 'absolute', top: '-8px', right: '-8px', 
                                        backgroundColor: 'red', color: 'white', borderRadius: '50%', 
                                        padding: '1px 5px', fontSize: '10px', fontWeight: 'bold' 
                                    }}>
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <div className="cart-info"><span className="cart-label">GIỎ HÀNG</span></div>
                        </Link>
                    )}
                </div>
            </div>

            {/* NAV BAR GIỮ NGUYÊN */}
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
                                    <li key={c.categoryId}><Link to={`/shop?category=${c.categoryId}`}>{c.categoryName}</Link></li>
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