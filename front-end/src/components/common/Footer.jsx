import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import './Footer.css';
import { API_BASE } from '../../utils/apiConfig.jsx';

const Footer = () => {
    // State lưu cấu hình
    const [config, setConfig] = useState({});
    // State lưu danh mục nổi bật (Cột 3)
    const [categories, setCategories] = useState([]); 
    // State lưu bài viết hướng dẫn (Cột 2)
    const [guidePosts, setGuidePosts] = useState([]);
    
    // State mới cho Tin tức (Cột 4)
    const [latestNews, setLatestNews] = useState([]);

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

        // 2. Hàm lấy danh mục nổi bật
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblCategories/best-selling`);
                if(res.data) setCategories(res.data);
            } catch (error) {
                console.error("Lỗi lấy danh mục:", error);
            }
        };

        // 3. Hàm lấy bài viết (Xử lý cho cả Hướng dẫn và Tin tức mới)
        const fetchPostsData = async () => {
            try {
                // Gọi API lấy tất cả bài đã Published
                const res = await axios.get(`${API_BASE}/api/TblPosts?status=Published`);
                
                if (res.data) {
                    // --- XỬ LÝ CỘT 2: BÀI HƯỚNG DẪN (Lấy 4 bài) ---
                    const guides = res.data.filter(p => 
                        p.categoryName && p.categoryName.toLowerCase().includes("hướng dẫn")
                    );
                    guides.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
                    setGuidePosts(guides.slice(0, 4));

                    // --- XỬ LÝ CỘT 4: BÀI VIẾT MỚI NHẤT (Lọc category & Lấy 2 bài) ---
                    const news = res.data.filter(p => {
                        const catName = p.categoryName ? p.categoryName.toLowerCase() : "";
                        // Logic lọc giống BlogPage: bỏ "giới thiệu" và "hướng dẫn"
                        return !catName.includes("giới thiệu") && !catName.includes("hướng dẫn");
                    });

                    // Sắp xếp giảm dần theo ngày
                    news.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
                    
                    // ==> CHỈ LẤY 2 BÀI <==
                    setLatestNews(news.slice(0, 2));
                }
            } catch (error) {
                console.error("Lỗi lấy dữ liệu bài viết footer:", error);
            }
        };

        fetchConfig();
        fetchCategories();
        fetchPostsData(); 
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

                {/* Cột 2: Hỗ trợ khách hàng */}
                <div className="footer-col">
                    <h3>Hỗ trợ khách hàng</h3>
                    <ul className="footer-links">
                        {guidePosts.length > 0 ? (
                            guidePosts.map(post => (
                                <li key={post.postId}>
                                    <Link to={`/blog/${post.postId}`}>
                                        {post.title}
                                    </Link>
                                </li>
                            ))
                        ) : (
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
                                    <Link to={`/shop?category=${cat.categoryId || cat.CategoryId}`}>
                                        {cat.categoryName || cat.CategoryName}
                                    </Link>
                                </li>
                            ))
                        ) : (
                            <li><Link to="/shop">Đang tải danh mục...</Link></li>
                        )}
                    </ul>
                </div>

                {/* Cột 4: Tin tức mới nhất (Hiển thị 2 bài) */}
                <div className="footer-col">
                    <h3>Tin tức mới nhất</h3>
                    <ul className="footer-links">
                        {latestNews.length > 0 ? (
                            latestNews.map(post => (
                                <li key={post.postId} style={{marginBottom: '15px'}}> {/* Tăng khoảng cách vì chỉ có 2 bài */}
                                    <Link to={`/blog/${post.postId}`} style={{display: 'block', lineHeight: '1.4', fontWeight: '500'}}>
                                        {post.title}
                                    </Link>
                                    <span style={{fontSize: '12px', color: '#999', display: 'block', marginTop: '4px'}}>
                                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <li><span style={{color: '#ccc'}}>Đang cập nhật tin tức...</span></li>
                        )}
                    </ul>
                </div>
            </div>

            <div className="copyright">
                {config.Copyright || "© 2025 Copyright by Plant Shop."}
            </div>
        </footer>
    );
};

export default Footer;