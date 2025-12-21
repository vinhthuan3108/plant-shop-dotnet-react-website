import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; 
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebook, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
    const [config, setConfig] = useState({});
    const API_BASE = 'https://localhost:7298'; // Cổng backend

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
                const configData = res.data.reduce((acc, item) => {
                    acc[item.configKey] = item.configValue;
                    return acc;
                }, {});
                setConfig(configData);
            } catch (error) {
                console.error("Lỗi lấy cấu hình footer:", error);
            }
        };
        fetchConfig();
    }, []);

    return (
        <footer className="footer-wrapper">
            <div className="footer-container">
                {/* Cột 1: Thông tin cửa hàng */}
                <div className="footer-col">
                    <h3>{config.StoreName ? config.StoreName.toUpperCase() : "PLANT SHOP"}</h3>
                    <ul className="footer-links contact-list">
                        <li>
                            <FaMapMarkerAlt className="contact-icon" />
                            <span>{config.Address || "Đang cập nhật địa chỉ..."}</span>
                        </li>
                        <li>
                            <FaPhoneAlt className="contact-icon" />
                            <span>{config.Hotline || "Đang cập nhật SĐT..."}</span>
                        </li>
                        <li>
                            <FaEnvelope className="contact-icon" />
                            <span>{config.Email || "lienhe@plantshop.com"}</span>
                        </li>
                    </ul>
                </div>

                {/* Cột 2 */}
                <div className="footer-col">
                    <h3>Hỗ trợ khách hàng</h3>
                    <ul className="footer-links">
                        <li><Link to="#">Hướng dẫn mua hàng</Link></li>
                        <li><Link to="#">Chính sách đổi trả</Link></li>
                        <li><Link to="#">Chính sách bảo hành</Link></li>
                        <li><Link to="#">Hình thức thanh toán</Link></li>
                    </ul>
                </div>

                {/* Cột 3 */}
                <div className="footer-col">
                    <h3>Danh mục nổi bật</h3>
                    <ul className="footer-links">
                        <li><Link to="/shop">Cây nội thất</Link></li>
                        <li><Link to="/shop">Cây để bàn</Link></li>
                        <li><Link to="/shop">Cây thủy sinh</Link></li>
                        <li><Link to="/shop">Sen đá - Xương rồng</Link></li>
                    </ul>
                </div>

                {/* Cột 4: Kết nối MXH */}
                <div className="footer-col">
                    <h3>Kết nối với chúng tôi</h3>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        
                        {/* Facebook - Lấy link từ DB */}
                        <a 
                            href={config.SocialFacebook || "#"} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ fontSize: '24px', color: '#1877f2' }}
                        >
                            <FaFacebook />
                        </a>

                        {/* Youtube - Giả sử chưa có config thì để # */}
                        <a href="#" style={{ fontSize: '24px', color: '#ff0000' }}>
                            <FaYoutube />
                        </a>
                        
                        {/* Các icon liên hệ nhanh */}
                        <a href={`tel:${config.Hotline}`} style={{ fontSize: '24px', color: '#ff0000' }}>
                            <FaPhoneAlt />
                        </a>
                        <a href={`mailto:${config.Email}`} style={{ fontSize: '24px', color: '#ff0000' }}>
                            <FaEnvelope />
                        </a>
                    </div>

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