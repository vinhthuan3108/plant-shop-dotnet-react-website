import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link để chuyển trang
import axios from 'axios';
import './FloatingContact.css';

// Import các icon từ react-icons (cho nhẹ và nét)
import { FaHome, FaFacebookF, FaArrowUp } from 'react-icons/fa';

// Import ảnh icon cũ (cho Zalo/Messenger nếu muốn giữ màu gốc)
import iconZalo from '../../assets/images/zalo.jpg';
import iconMessenger from '../../assets/images/messenger.jpg';
import { API_BASE } from '../../utils/apiConfig.jsx';
const FloatingContact = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [showScroll, setShowScroll] = useState(false);
    const [links, setLinks] = useState({
        zalo: '',
        facebook: '',
        messenger: ''
    });

    //const BASE_URL = 'https://localhost:7298';

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
                const data = res.data;
                const getVal = (key) => data.find(x => x.configKey === key)?.configValue || '';

                setLinks({
                    zalo: getVal('SocialZalo'),
                    facebook: getVal('SocialFacebook'),
                    messenger: getVal('SocialMessenger')
                });
            } catch (error) {
                console.error("Failed to load configs");
            }
        };
        fetchConfigs();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) setShowScroll(true);
            else setShowScroll(false);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getZaloLink = (input) => {
        if (!input) return '#';
        if (/^\d+$/.test(input)) return `https://zalo.me/${input}`;
        return input;
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- GIAO DIỆN 1: FLOATING BUTTON (Dành cho PC) ---
    const renderDesktopFloating = () => (
        <div className="floating-contact-container desktop-only">
            <div className={`contact-list ${isOpen ? 'show' : 'hide'}`}>
                {links.zalo && (
                    <a href={getZaloLink(links.zalo)} target="_blank" rel="noreferrer" className="contact-btn item-shake" title="Chat Zalo">
                        <img src={iconZalo} alt="Zalo" />
                    </a>
                )}
                {links.messenger && (
                    <a href={links.messenger} target="_blank" rel="noreferrer" className="contact-btn item-shake" title="Messenger">
                        <img src={iconMessenger} alt="Messenger" />
                    </a>
                )}
                {links.facebook && (
                    <a href={links.facebook} target="_blank" rel="noreferrer" className="contact-btn item-shake" title="Facebook">
                        <FaFacebookF style={{color:'#1877F2', fontSize:'24px'}} />
                    </a>
                )}
            </div>

            <button className={`main-toggle-btn ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span className="plus-icon"></span>
            </button>

            <button className={`scroll-top-btn ${showScroll ? 'visible' : ''}`} onClick={scrollToTop}>
                <FaArrowUp />
            </button>
        </div>
    );

    // --- GIAO DIỆN 2: BOTTOM BAR (Dành cho Mobile/Tablet dọc) ---
    const renderMobileBottomBar = () => (
        <div className="mobile-bottom-bar mobile-only">
            {/* 1. Trang chủ */}
            <Link to="/" className="bottom-item">
                <div className="bottom-icon-circle" style={{backgroundColor: '#ff6b00'}}>
                    <FaHome />
                </div>
                <span className="bottom-label">Trang chủ</span>
            </Link>

            {/* 2. Fanpage (Thay cho Gọi điện) */}
            {links.facebook && (
                <a href={links.facebook} target="_blank" rel="noreferrer" className="bottom-item">
                    <div className="bottom-icon-circle" style={{backgroundColor: '#1877f2'}}>
                        <FaFacebookF />
                    </div>
                    <span className="bottom-label">Fanpage</span>
                </a>
            )}

            {/* 3. Zalo */}
            {links.zalo && (
                <a href={getZaloLink(links.zalo)} target="_blank" rel="noreferrer" className="bottom-item">
                     {/* Giữ nguyên icon ảnh Zalo nhưng bo tròn */}
                    <div className="bottom-icon-img">
                         <img src={iconZalo} alt="Zalo" />
                    </div>
                    <span className="bottom-label">Zalo</span>
                </a>
            )}

            {/* 4. Messenger */}
            {links.messenger && (
                <a href={links.messenger} target="_blank" rel="noreferrer" className="bottom-item">
                    <div className="bottom-icon-img">
                        <img src={iconMessenger} alt="Mess" />
                    </div>
                    <span className="bottom-label">Messenger</span>
                </a>
            )}
        </div>
    );

    return (
        <>
            {renderDesktopFloating()}
            {renderMobileBottomBar()}
        </>
    );
};

export default FloatingContact;