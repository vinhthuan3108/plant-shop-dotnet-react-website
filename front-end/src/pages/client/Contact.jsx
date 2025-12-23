import React, { useState } from 'react';
import axios from 'axios';

function Contact() {
    // State lưu dữ liệu form
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        message: ''
    });

    const [status, setStatus] = useState(''); // Thông báo thành công/thất bại

    // Xử lý khi nhập liệu
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Xử lý gửi form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        try {
            // Gọi API CreateContact mà chúng ta đã viết ở Backend
            await axios.post('https://localhost:7298/api/Contacts', {
                ...formData,
                subject: 'Liên hệ từ khách hàng' // Mặc định subject nếu form không có
            });

            alert('Gửi tin nhắn thành công!');
            setStatus('success');
            // Reset form
            setFormData({ fullName: '', email: '', phoneNumber: '', message: '' });
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra, vui lòng thử lại.');
            setStatus('error');
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Arial, sans-serif' }}>
            
            {/* Phần Map (Ảnh minh họa hoặc iframe Google Map) */}
            <div style={{ marginBottom: '40px' }}>
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.517627449557!2d106.70134531480082!3d10.77160026222774!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f40a3b49e59%3A0xa1bd14e483a602db!2zVHLGsOG7nW5nIENhbyDEkOG6s25nIEvhu7kgdGh14bqtdCBDYW8gVGjhuq9uZw!5e0!3m2!1svi!2s!4v1647850232499!5m2!1svi!2s" 
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
                        <li><strong>Vườn Cây Việt:</strong> Chuyên cung cấp các loại cây cảnh...</li>
                        <li><strong>Hotline:</strong> 0987.654.321</li>
                        <li><strong>Email:</strong> lienhe@plantsh.com</li>
                        <li><strong>Địa chỉ:</strong> 15 đường số 3, Khu dân cư Gia Hòa, TP.HCM</li>
                    </ul>

                    <div style={{ marginTop: '30px' }}>
                        <h4 style={{ marginBottom: '15px' }}>Câu hỏi thường gặp</h4>
                        <details style={{ marginBottom: '10px', cursor: 'pointer' }}>
                            <summary>Vườn Cây Việt có bán sỉ cây cảnh không?</summary>
                            <p style={{ paddingLeft: '20px', color: '#666' }}>Có, chúng tôi có chính sách giá sỉ hấp dẫn.</p>
                        </details>
                        <details style={{ marginBottom: '10px', cursor: 'pointer' }}>
                            <summary>Có giao hàng toàn quốc không?</summary>
                            <p style={{ paddingLeft: '20px', color: '#666' }}>Chúng tôi hỗ trợ giao hàng trên toàn quốc.</p>
                        </details>
                    </div>
                </div>

                {/* Cột phải: Form liên hệ */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{ color: '#333', marginBottom: '20px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Form liên hệ</h3>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tên của bạn</label>
                            <input 
                                type="text" 
                                name="fullName" 
                                value={formData.fullName}
                                onChange={handleChange}
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
                                onChange={handleChange}
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
                                onChange={handleChange}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tin nhắn của bạn</label>
                            <textarea 
                                name="message" 
                                value={formData.message}
                                onChange={handleChange}
                                rows="5"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                required
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            style={{ 
                                backgroundColor: '#4CAF50', // Màu xanh lá giống hình mẫu
                                color: 'white', 
                                padding: '10px 30px', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}
                            disabled={status === 'sending'}
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