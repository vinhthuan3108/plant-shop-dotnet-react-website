import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './FloatingContact.css';

// Import ảnh icon mạng xã hội (Giữ nguyên của bạn)
import iconZalo from '../../assets/images/zalo.jpg';
import iconFacebook from '../../assets/images/facebook.jpg';
import iconMessenger from '../../assets/images/messenger.jpg';

// Icon Mũi tên lên (Vẽ bằng SVG cho nét)
const ArrowUpIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5"></path>
        <path d="M5 12L12 5L19 12"></path>
    </svg>
);

const FloatingContact = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [showScroll, setShowScroll] = useState(false); // State để ẩn hiện nút Scroll
    
    const [links, setLinks] = useState({
        zalo: '',
        facebook: '',
        messenger: ''
    });

    const BASE_URL = 'https://localhost:7298';

    // 1. Lấy cấu hình link
    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/TblSystemConfig`);
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

    // 2. Lắng nghe sự kiện cuộn chuột
    useEffect(() => {
        const handleScroll = () => {
            // Nếu cuộn quá 300px thì hiện nút
            if (window.scrollY > 300) {
                setShowScroll(true);
            } else {
                setShowScroll(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        // Dọn dẹp sự kiện khi component bị hủy
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const getZaloLink = (input) => {
        if (!input) return '#';
        if (/^\d+$/.test(input)) return `https://zalo.me/${input}`;
        return input;
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    // Hàm cuộn lên đầu trang
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Cuộn mượt
        });
    };

    if (!links.zalo && !links.facebook && !links.messenger) return null;

    return (
        <div className="floating-contact-container">
            {/* Danh sách nút con */}
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
                        <img src={iconFacebook} alt="Facebook" />
                    </a>
                )}
            </div>

            {/* Nút Toggle (X / +) */}
            <button className={`main-toggle-btn ${isOpen ? 'open' : ''}`} onClick={handleToggle}>
                <span className="plus-icon"></span>
            </button>

            {/* Nút Scroll To Top (Chỉ hiện khi showScroll = true) */}
            <button 
                className={`scroll-top-btn ${showScroll ? 'visible' : ''}`} 
                onClick={scrollToTop}
                title="Lên đầu trang"
            >
                <ArrowUpIcon />
            </button>
        </div>
    );
};

export default FloatingContact;