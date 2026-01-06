import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../../utils/apiConfig.jsx';
import Swal from 'sweetalert2'; // Import SweetAlert2

function ShopInfo() {
    // State lưu trữ giá trị các cấu hình
    const [configs, setConfigs] = useState({
        StoreName: '',
        Hotline: '',
        Email: '',
        Address: '',
        Copyright: '',
        SocialZalo: '',
        SocialFacebook: '',
        SocialMessenger: '',
        LogoUrl: '',
        FaviconUrl: '',
        GoogleMapEmbed: ''
    });
    // State lưu lỗi validate (Mới thêm)
    const [errors, setErrors] = useState({});
    
    useEffect(() => {
        fetchConfigs();
    }, []);
    
    const fetchConfigs = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
            const data = res.data;
            
            const newConfig = { ...configs };
            data.forEach(item => {
                if (newConfig.hasOwnProperty(item.configKey)) {
                    newConfig[item.configKey] = item.configValue;
                }
            });
            setConfigs(newConfig);
        } catch (error) {
            console.error(error);
        }
    };

    // --- LOGIC VALIDATE ---
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // 1. Chặn nhập ký tự chữ vào Hotline
        if (name === 'Hotline') {
            if (!/^\d*$/.test(value)) {
                return;
            }
        }

        setConfigs(prev => ({ ...prev, [name]: value }));
        // 2. Xóa lỗi hiển thị khi người dùng bắt đầu sửa lại
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleUpload = async (e, keyName) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post(`${API_BASE}/api/Upload/configs`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.url) {
                setConfigs(prev => ({ ...prev, [keyName]: res.data.url }));
            }
        } catch (error) {
            console.error(error);
            // Thay alert lỗi upload
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Upload ảnh thất bại'
            });
        }
    };

    const handleSave = async () => {
        // --- BƯỚC KIỂM TRA DỮ LIỆU TRƯỚC KHI LƯU ---
        const newErrors = {};
        // Validate Email
        if (configs.Email && !isValidEmail(configs.Email)) {
            newErrors.Email = "Định dạng email không hợp lệ!";
        }

        // Validate Hotline (10-11 số)
        if (configs.Hotline) {
            if (configs.Hotline.length < 10 || configs.Hotline.length > 11) {
                newErrors.Hotline = "Số điện thoại phải từ 10 đến 11 số!";
            }
        }

        // Nếu có lỗi thì set state lỗi và dừng hàm Save
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Thay alert cảnh báo
            Swal.fire({
                icon: 'warning',
                title: 'Dữ liệu không hợp lệ',
                text: 'Vui lòng kiểm tra lại thông tin nhập lỗi!'
            });
            return;
        }

        // --- NẾU KHÔNG CÓ LỖI THÌ TIẾP TỤC LƯU ---
        const payload = Object.keys(configs).map(key => ({
            configKey: key,
            configValue: configs[key]
        }));
        try {
            await axios.post(`${API_BASE}/api/TblSystemConfig/BulkUpdate`, payload);
            
            // Thay alert thành công
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: 'Cập nhật cấu hình cửa hàng thành công!',
                timer: 700,
                showConfirmButton: false
            });
        } catch (error) {
            // Thay alert lỗi server
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Có lỗi xảy ra khi lưu cấu hình'
            });
        }
    };

    // --- STYLES ---
    const containerStyle = {
        padding: '20px',
        maxWidth: '1000px',
        margin: '0 auto'
    };
    const sectionStyle = {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
    };
    const headerStyle = {
        borderBottom: '1px solid #eee',
        paddingBottom: '10px',
        marginBottom: '15px',
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333'
    };
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
    };
    const formGroupStyle = {
        marginBottom: '1px'
    };
    const labelStyle = {
        display: 'block',
        marginBottom: '1px',
        fontWeight: '500',
        fontSize: '14px'
    };
    const inputStyle = {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '14px',
        boxSizing: 'border-box'
    };
    // Style hiển thị lỗi màu đỏ
    const errorStyle = {
        color: '#dc3545',
        fontSize: '12px',
        marginTop: '4px',
        display: 'block'
    };
    const imageBoxStyle = {
        border: '2px dashed #ddd',
        borderRadius: '6px',
        padding: '10px',
        textAlign: 'center',
        backgroundColor: '#fafafa',
        height: '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    };
    const imgPreviewStyle = {
        maxWidth: '100%',
        maxHeight: '100px',
        objectFit: 'contain',
        marginBottom: '10px'
    };
    
    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Cấu hình thông tin cửa hàng</h2>
                <button 
                    onClick={handleSave} 
                    style={{ 
                        padding: '10px 25px', 
                        background: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}
                >
                    💾 Lưu Cấu Hình
                </button>
            </div>
            
            {/* KHỐI 1: THÔNG TIN CHUNG */}
            <div style={sectionStyle}>
                <div style={headerStyle}>🏠 Thông tin cửa hàng (footer)</div>
                <div style={gridStyle}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Tên cửa hàng</label>
                        <input type="text" name="StoreName" value={configs.StoreName} onChange={handleChange} style={inputStyle}/>
                    </div>
                    
                    {/* --- HOTLINE ĐÃ CÓ VALIDATE --- */}
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Hotline</label>
                        <input 
                            type="text" 
                            name="Hotline" 
                            value={configs.Hotline} 
                            onChange={handleChange} 
                            style={{
                                ...inputStyle,
                                borderColor: errors.Hotline ? '#dc3545' : '#ccc'
                            }}
                        />
                        {errors.Hotline && <span style={errorStyle}>{errors.Hotline}</span>}
                    </div>

                    {/* --- EMAIL ĐÃ CÓ VALIDATE --- */}
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Email</label>
                        <input 
                            type="email" 
                            name="Email" 
                            value={configs.Email} 
                            onChange={handleChange} 
                            style={{
                                ...inputStyle,
                                borderColor: errors.Email ? '#dc3545' : '#ccc'
                            }}
                        />
                        {errors.Email && <span style={errorStyle}>{errors.Email}</span>}
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Địa chỉ</label>
                        <input type="text" name="Address" value={configs.Address} onChange={handleChange} style={inputStyle}/>
                    </div>
                    <div style={{ ...formGroupStyle, gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Copyright Footer</label>
                        <input type="text" name="Copyright" value={configs.Copyright} onChange={handleChange} style={inputStyle}/>
                    </div>
                </div>
            </div>

            {/* KHỐI 2: MẠNG XÃ HỘI */}
            <div style={sectionStyle}>
                <div style={headerStyle}>🌐 Mạng xã hội</div>
                <div style={{ ...gridStyle, gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Zalo (SĐT/Link)</label>
                        <input type="text" name="SocialZalo" value={configs.SocialZalo} onChange={handleChange} style={inputStyle}/>
                    </div>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Facebook Fanpage</label>
                        <input type="text" name="SocialFacebook" value={configs.SocialFacebook} onChange={handleChange} style={inputStyle}/>
                    </div>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Messenger Link</label>
                        <input type="text" name="SocialMessenger" value={configs.SocialMessenger} onChange={handleChange} style={inputStyle}/>
                    </div>
                </div>
            </div>

            {/* KHỐI 3: LOGO & FAVICON */}
            <div style={sectionStyle}>
                <div style={headerStyle}>🖼️ Hình ảnh thương hiệu</div>
                <div style={gridStyle}>
                    
                    {/* Upload Logo */}
                    <div>
                        <label style={labelStyle}>Logo Website</label>
                        <div style={imageBoxStyle}>
                            {configs.LogoUrl ? (
                                <img src={`${API_BASE}${configs.LogoUrl}`} alt="Logo" style={imgPreviewStyle}/>
                            ) : (
                                <span style={{color: '#999', fontSize: '12px', marginBottom:'10px'}}>Chưa có Logo</span>
                            )}
                            <input type="file" onChange={(e) => handleUpload(e, 'LogoUrl')} style={{ fontSize: '12px' }}/>
                        </div>
                    </div>

                    {/* Upload Favicon */}
                    <div>
                        <label style={labelStyle}>Favicon (Icon trên tab)</label>
                        <div style={imageBoxStyle}>
                            {configs.FaviconUrl ? (
                                <img src={`${API_BASE}${configs.FaviconUrl}`} alt="Favicon" style={{...imgPreviewStyle, width: '32px', height: '32px'}}/> 
                            ) : (
                                <span style={{color: '#999', fontSize: '12px', marginBottom:'10px'}}>Chưa có Favicon</span>
                            )}
                            <input type="file" onChange={(e) => handleUpload(e, 'FaviconUrl')} style={{ fontSize: '12px' }}/>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* KHỐI 4: BẢN ĐỒ */}
            <div style={sectionStyle}>
                <div style={headerStyle}>🗺️ Cấu hình Bản đồ (Google Map)</div>
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Đường dẫn nhúng (Link trong src="")</label>
                    <textarea 
                        name="GoogleMapEmbed" 
                        value={configs.GoogleMapEmbed} 
                        onChange={handleChange} 
                        style={{
                            ...inputStyle,
                            height: '80px',
                            resize: 'vertical',
                            fontFamily: 'monospace'
                        }}
                        placeholder="Paste link bản đồ vào đây (Ví dụ: https://www.google.com/maps/embed?...)"
                    />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        * Hướng dẫn: Vào Google Maps - Chia sẻ - Nhúng bản đồ - Copy đoạn link trong thẻ <b>src="..."</b> (bỏ thẻ iframe đi).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShopInfo;