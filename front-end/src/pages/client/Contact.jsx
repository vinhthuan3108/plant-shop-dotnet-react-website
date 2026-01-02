import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_BASE } from '../../utils/apiConfig.jsx';
function Contact() {
    // State lưu dữ liệu form
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        message: ''
    });
    const [status, setStatus] = useState(''); 
    const [captchaToken, setCaptchaToken] = useState(null);
    
    // 1. State lưu SiteKey Recaptcha
    const [siteKey, setSiteKey] = useState(null);

    // 2. State lưu thông tin cửa hàng
    const [shopInfo, setShopInfo] = useState({
        storeName: 'Đang tải...',
        address: 'Đang tải...',
        email: 'Đang tải...',
        hotline: 'Đang tải...'
    });

    // 3. (MỚI) State lưu danh sách câu hỏi thường gặp
    const [qandas, setQandas] = useState([]);

    const recaptchaRef = useRef(null);
    //const BASE_URL = 'https://localhost:7298'; 

    // FETCH DỮ LIỆU TỪ BACKEND
    useEffect(() => {
        // Hàm lấy cấu hình hệ thống
        const fetchConfig = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
                const data = res.data; 

                const getValue = (key) => {
                    const item = data.find(x => x.configKey === key);
                    return item ? item.configValue : '';
                };

                setShopInfo({
                    storeName: getValue('StoreName'),
                    address: getValue('Address'),
                    email: getValue('Email'),
                    hotline: getValue('Hotline')
                });

                const recaptchaConfig = data.find(x => x.configKey === 'Recaptcha_SiteKey');
                if (recaptchaConfig && recaptchaConfig.configValue) {
                    setSiteKey(recaptchaConfig.configValue);
                }

            } catch (error) {
                console.error("Lỗi khi lấy cấu hình hệ thống:", error);
            }
        };

        // (MỚI) Hàm lấy danh sách câu hỏi thường gặp
        const fetchQandA = async () => {
            try {
                // Gọi API Active: Backend đã xử lý việc lọc IsActive=true và sắp xếp theo DisplayOrder
                const res = await axios.get(`${API_BASE}/api/QandA/Active`);
                setQandas(res.data);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách Q&A:", error);
            }
        };

        fetchConfig();
        fetchQandA(); // Gọi hàm lấy Q&A
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phoneNumber') {
            if (!/^\d*$/.test(value)) return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token);
        setStatus(''); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!captchaToken) {
            alert('Vui lòng xác nhận bạn không phải là robot!');
            return;
        }
        if (formData.phoneNumber.length < 10 || formData.phoneNumber.length > 11) {
            alert('Số điện thoại phải từ 10 đến 11 số!');
            return;
        }

        setStatus('sending');
        try {
            await axios.post(`${API_BASE}/api/Contacts`, {
                ...formData,
                subject: 'Liên hệ từ khách hàng',
                recaptchaToken: captchaToken
            });
            alert('Gửi tin nhắn thành công!');
            setStatus('success');
            setFormData({ fullName: '', email: '', phoneNumber: '', message: '' });
            if (recaptchaRef.current) recaptchaRef.current.reset();
            setCaptchaToken(null);
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra, vui lòng thử lại.');
            setStatus('error');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Arial, sans-serif' }}>
            
            {/* Phần Map */}
            <div style={{ marginBottom: '40px' }}>
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3528.4810863297434!2d109.17483147453608!3d12.241600130463471!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3170678749018e2f%3A0x4b0e1e18074eb956!2zQ8O0bmcgdHkgY-G7lSBwaOG6p24gU3dlZXRTb2Z0!5e1!3m2!1svi!2s!4v1766377102808!5m2!1svi!2s" 
                    width="100%" 
                    height="400" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy"
                    title="Map"
                ></iframe>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
                {/* Cột trái: Thông tin liên hệ */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ color: '#333', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Địa chỉ liên hệ</h3>
                    
                    <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2' }}>
                        <li>
                            <strong>Tên cửa hàng: </strong> {shopInfo.storeName}
                        </li>
                        <li>
                            <strong>Hotline: </strong> 
                            <a href={`tel:${shopInfo.hotline}`} style={{color: 'inherit', textDecoration: 'none'}}>
                                {shopInfo.hotline}
                            </a>
                        </li>
                        <li>
                            <strong>Email: </strong> 
                            <a href={`mailto:${shopInfo.email}`} style={{color: 'inherit', textDecoration: 'none'}}>
                                {shopInfo.email}
                            </a>
                        </li>
                        <li>
                            <strong>Địa chỉ: </strong> {shopInfo.address}
                        </li>
                    </ul>

                    {/* --- (MỚI) PHẦN CÂU HỎI THƯỜNG GẶP ĐỘNG --- */}
                    <div style={{ marginTop: '30px' }}>
                        <h4 style={{ marginBottom: '15px' }}>Câu hỏi thường gặp</h4>
                        
                        {qandas.length > 0 ? (
                            qandas.map((item) => (
                                <details key={item.id} style={{ marginBottom: '10px', cursor: 'pointer' }}>
                                    <summary style={{fontWeight: 'bold'}}>{item.question}</summary>
                                    <p style={{ paddingLeft: '20px', color: '#666', marginTop:'5px', lineHeight: '1.5' }}>
                                        {item.answer}
                                    </p>
                                </details>
                            ))
                        ) : (
                            <p style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
                                Đang cập nhật câu hỏi...
                            </p>
                        )}
                    </div>
                    {/* ------------------------------------------- */}
                </div>

                {/* Cột phải: Form liên hệ (Giữ nguyên không đổi) */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ color: '#333', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Form liên hệ</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tên của bạn</label>
                            <input 
                                type="text" 
                                name="fullName" 
                                value={formData.fullName}
                                onChange={(e) => {
                                    handleChange(e);
                                    e.target.setCustomValidity(''); 
                                }}
                                onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập họ và tên của bạn')}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Email của bạn</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email}
                                onChange={(e) => {
                                    handleChange(e);
                                    e.target.setCustomValidity(''); 
                                    if (e.target.validity.typeMismatch) {
                                        e.target.setCustomValidity('Vui lòng nhập đúng định dạng email (ví dụ: abc@gmail.com)');
                                    }
                                }}
                                onInvalid={(e) => {
                                    if (e.target.validity.valueMissing) {
                                        e.target.setCustomValidity('Vui lòng nhập email, không được để trống');
                                    } else {
                                        e.target.setCustomValidity('Vui lòng nhập đúng định dạng email (ví dụ: abc@gmail.com)');
                                    }
                                }}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Số điện thoại</label>
                            <input 
                                type="text" 
                                name="phoneNumber" 
                                value={formData.phoneNumber}
                                onChange={(e) => {
                                    handleChange(e);
                                    e.target.setCustomValidity(''); 
                                }} 
                                onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập số điện thoại')}
                                placeholder="Nhập số điện thoại (10-11 số)"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required 
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tin nhắn của bạn</label>
                            <textarea 
                                name="message" 
                                value={formData.message}
                                onChange={(e) => {
                                    handleChange(e);
                                    e.target.setCustomValidity('');
                                }}
                                onInvalid={(e) => e.target.setCustomValidity('Vui lòng nhập nội dung tin nhắn')}
                                rows="5"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required
                            ></textarea>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            {siteKey ? (
                                <ReCAPTCHA
                                    ref={recaptchaRef} 
                                    sitekey={siteKey} 
                                    onChange={handleCaptchaChange}
                                />
                            ) : (
                                <p style={{color: '#666', fontStyle: 'italic'}}>Đang tải mã bảo mật...</p>
                            )}
                        </div>
                        
                        <button 
                            type="submit" 
                            style={{ 
                                backgroundColor: '#4CAF50', 
                                color: 'white', 
                                padding: '10px 30px', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}
                            disabled={status === 'sending' || !siteKey}
                        >
                            {status === 'sending' ? 'Đang gửi...' : 'GỬI'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Contact;