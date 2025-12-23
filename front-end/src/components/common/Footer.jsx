import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebook, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
    // State lưu cấu hình
    const [config, setConfig] = useState({});
    // State lưu danh mục nổi bật (Cột 3)
    const [categories, setCategories] = useState([]); 
    // State lưu bài viết hướng dẫn (Cột 2 - Mới thêm)
    const [guidePosts, setGuidePosts] = useState([]);

    const API_BASE = 'https://localhost:7298'; // Cổng backend

    useEffect(() => {
        // 1. Hàm lấy cấu hình hệ thống
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
                const configData = res.data.reduce((acc, item) => {
                    const key = item.ConfigKey || item.configKey; 
                    const value = item.ConfigValue || item.configValue;
                    if (key) acc[key] = value;
                    return acc;
                }, {});
                setConfig(configData);
            } catch (error) {
                console.error("Lỗi lấy Config:", error);
            }
        };

        // 2. Hàm lấy 4 danh mục nổi bật (Code cũ)
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblCategories/get-featured`);
                if(res.data) setCategories(res.data);
            } catch (error) {
                console.error("Lỗi lấy danh mục:", error);
            }
        };

        // 3. Hàm lấy 4 bài viết Hướng dẫn (Code MỚI THÊM)
        const fetchGuidePosts = async () => {
            try {
                // Gọi API lấy bài viết (tái sử dụng logic của bạn)
                const res = await axios.get(`${API_BASE}/api/TblPosts?status=Published`);
                
                if (res.data) {
                    // Lọc bài có danh mục chứa chữ "hướng dẫn" (không phân biệt hoa thường)
                    const guides = res.data.filter(p => 
                        p.categoryName && p.categoryName.toLowerCase().includes("hướng dẫn")
                    );

                    // Sắp xếp bài mới nhất lên đầu (dựa vào ngày PublishedAt hoặc CreatedAt)
                    // (Nếu API chưa sắp xếp thì dùng đoạn sort này, nếu có rồi thì bỏ qua)
                    guides.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));

                    // Chỉ lấy 4 bài đầu tiên
                    setGuidePosts(guides.slice(0, 4));
                }
            } catch (error) {
                console.error("Lỗi lấy bài hướng dẫn:", error);
            }
        };

        fetchConfig();
        fetchCategories();
        fetchGuidePosts(); // Gọi hàm mới
    }, []);

    return (
        <footer className="footer-wrapper">
            
            <div className="footer-container">
                {/* Cột 1: Thông tin cửa hàng */}
                <div className="footer-col">
                    <h3>{config.StoreName ? config.StoreName.toUpperCase() : "PLANT SHOP"}</h3>
                    
                    <div className="contact-info-block" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'start', color: '#ccc' }}>
                            <FaMapMarkerAlt style={{ color: '#2e7d32', marginRight: '10px', marginTop: '3px', flexShrink: 0 }} />
                            <span style={{ lineHeight: '1.4' }}>{config.Address || "Đang tải địa chỉ..."}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>
                            <FaPhoneAlt style={{ color: '#2e7d32', marginRight: '10px', flexShrink: 0 }} />
                            <span>{config.Hotline || "Đang tải SĐT..."}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', color: '#ccc' }}>
                            <FaEnvelope style={{ color: '#2e7d32', marginRight: '10px', flexShrink: 0 }} />
                            <span>{config.Email || "Đang tải Email..."}</span>
                        </div>
                    </div>
                </div>

                {/* Cột 2: Hỗ trợ khách hàng (Đã sửa thành Dynamic) */}
                <div className="footer-col">
                    <h3>Hỗ trợ khách hàng</h3>
                    <ul className="footer-links">
                        {guidePosts.length > 0 ? (
                            guidePosts.map(post => (
                                <li key={post.postId}>
                                    {/* Link bay sang trang chi tiết bài viết */}
                                    <Link to={`/blog/${post.postId}`}>
                                        {post.title}
                                    </Link>
                                </li>
                            ))
                        ) : (
                            // Fallback nếu chưa có bài hướng dẫn nào
                            <>
                                <li><Link to="#">Hướng dẫn mua hàng</Link></li>
                                <li><Link to="#">Chính sách đổi trả</Link></li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Cột 3: Danh mục nổi bật */}
                <div className="footer-col">
                    <h3>Danh mục nổi bật</h3>
                    <ul className="footer-links">
                        {categories.length > 0 ? (
                            categories.map((cat) => (
                                <li key={cat.categoryId || cat.CategoryId}>
                                    <Link to={`/shop?categoryId=${cat.categoryId || cat.CategoryId}`}>
                                        {cat.categoryName || cat.CategoryName}
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <li><Link to="/shop">Đang tải danh mục...</Link></li>
                        )}
                    </ul>
                </div>

                {/* Cột 4: Kết nối MXH */}
                <div className="footer-col">

                    <h3>Đăng ký nhận tin</h3>
                    <p style={{marginBottom: '15px'}}>Nhận thông tin khuyến mãi mới nhất.</p>
                    <div style={{display: 'flex'}}>
                        <input type="email" placeholder="Email của bạn..." style={{padding: '8px', border:'none', outline:'none', flex:1}} />
                        <button style={{background:'#2e7d32', color:'white', border:'none', padding:'8px 15px', fontWeight:'bold'}}>GỬI</button>
                    </div>
                </div>
            </div>

            <div className="copyright">
                {config.Copyright || "© 2025 Copyright by Plant Shop."}
            </div>
        </footer>
    );
};

export default Footer;