import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { toast } from 'react-toastify'; 
import { API_BASE } from '../../utils/apiConfig.jsx';
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
        FaviconUrl: ''
    });

    //const BASE_URL = 'https://localhost:7298'; 

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfigs(prev => ({ ...prev, [name]: value }));
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
            alert('Upload ảnh thất bại');
        }
    };

    const handleSave = async () => {
        const payload = Object.keys(configs).map(key => ({
            configKey: key,
            configValue: configs[key]
        }));

        try {
            await axios.post(`${API_BASE}/api/TblSystemConfig/BulkUpdate`, payload);
            alert('Cập nhật thành công!');
        } catch (error) {
            alert('Lỗi khi lưu cấu hình');
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
        gridTemplateColumns: '1fr 1fr', // Chia 2 cột
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
        boxSizing: 'border-box' // Quan trọng để padding không làm vỡ layout
    };

    // Style cho khung upload ảnh để tránh vỡ giao diện
    const imageBoxStyle = {
        border: '2px dashed #ddd',
        borderRadius: '6px',
        padding: '10px',
        textAlign: 'center',
        backgroundColor: '#fafafa',
        height: '180px', // Chiều cao cố định
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    };

    const imgPreviewStyle = {
        maxWidth: '100%',
        maxHeight: '100px', // Giới hạn chiều cao ảnh
        objectFit: 'contain',
        marginBottom: '10px'
    };

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Cấu hình hệ thống</h2>
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
                <div style={headerStyle}>🏠 Thông tin cửa hàng</div>
                <div style={gridStyle}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Tên cửa hàng</label>
                        <input type="text" name="StoreName" value={configs.StoreName} onChange={handleChange} style={inputStyle}/>
                    </div>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Hotline</label>
                        <input type="text" name="Hotline" value={configs.Hotline} onChange={handleChange} style={inputStyle}/>
                    </div>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Email</label>
                        <input type="email" name="Email" value={configs.Email} onChange={handleChange} style={inputStyle}/>
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
                <div style={{ ...gridStyle, gridTemplateColumns: '1fr 1fr 1fr' }}> {/* Chia 3 cột */}
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
        </div>
    );
};

export default ShopInfo;