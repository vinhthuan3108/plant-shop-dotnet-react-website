import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { toast } from 'react-toastify'; 

function SystemIntegration() {
    // 1. Config Email
    const [mailConfig, setMailConfig] = useState({
        Email: '',
        Password: '' 
    });

    // 2. Config PayOS (THÊM MỚI)
    const [payOsConfig, setPayOsConfig] = useState({
        ClientId: '',
        ApiKey: '',
        ChecksumKey: ''
    });

    // State phụ để hiển thị trạng thái đã có cấu hình hay chưa (UX tốt hơn)
    const [payOsStatus, setPayOsStatus] = useState({
        hasClientId: false,
        hasApiKey: false,
        hasChecksumKey: false
    });

    const BASE_URL = 'https://localhost:7298'; 

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/TblSystemConfig`);
            const data = res.data;
            
            // --- Xử lý Email ---
            const emailSetting = data.find(x => x.configKey === 'Mail_User');
            setMailConfig(prev => ({
                ...prev,
                Email: emailSetting ? emailSetting.configValue : '',
                Password: '' // Luôn ẩn password
            }));

            // --- Xử lý PayOS ---
            // Kiểm tra xem trong DB đã có các key này chưa (để hiện dấu tích xanh)
            // Lưu ý: ConfigValue lúc này là chuỗi mã hóa, nên ta không load vào ô input
            const hasClient = data.some(x => x.configKey === 'PayOS_ClientId' && x.configValue);
            const hasApi = data.some(x => x.configKey === 'PayOS_ApiKey' && x.configValue);
            const hasCheck = data.some(x => x.configKey === 'PayOS_ChecksumKey' && x.configValue);

            setPayOsStatus({
                hasClientId: hasClient,
                hasApiKey: hasApi,
                hasChecksumKey: hasCheck
            });

            // Reset form về rỗng để bảo mật tuyệt đối
            setPayOsConfig({ ClientId: '', ApiKey: '', ChecksumKey: '' });

        } catch (error) {
            console.error(error);
        }
    };

    // Handler cho Email
    const handleChangeMail = (e) => {
        const { name, value } = e.target;
        setMailConfig(prev => ({ ...prev, [name]: value }));
    };

    // Handler cho PayOS (THÊM MỚI)
    const handleChangePayOS = (e) => {
        const { name, value } = e.target;
        setPayOsConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveMail = async () => {
        if (!mailConfig.Email) {
            alert("Vui lòng nhập Email!");
            return;
        }

        try {
            await axios.post(`${BASE_URL}/api/TblSystemConfig/UpdateMailSettings`, {
                Email: mailConfig.Email,
                Password: mailConfig.Password 
            });
            alert('Cập nhật cấu hình Email thành công!');
            setMailConfig(prev => ({ ...prev, Password: '' }));
        } catch (error) {
            console.error(error);
            alert('Lỗi khi lưu cấu hình Email');
        }
    };

    // Hàm lưu PayOS (THÊM MỚI)
    const handleSavePayOs = async () => {
        // Validation: Nếu chưa từng cấu hình (lần đầu) thì bắt buộc nhập đủ 3 cái
        const isFirstTime = !payOsStatus.hasClientId || !payOsStatus.hasApiKey || !payOsStatus.hasChecksumKey;
        if (isFirstTime) {
             if (!payOsConfig.ClientId || !payOsConfig.ApiKey || !payOsConfig.ChecksumKey) {
                alert("Đây là lần cấu hình đầu tiên, vui lòng nhập đầy đủ Client ID, API Key và Checksum Key!");
                return;
             }
        }

        try {
            // Gửi dữ liệu lên API (Backend sẽ tự lo việc mã hóa cả 3 trường)
            await axios.post(`${BASE_URL}/api/TblSystemConfig/UpdatePayOsSettings`, {
                ClientId: payOsConfig.ClientId,
                ApiKey: payOsConfig.ApiKey,
                ChecksumKey: payOsConfig.ChecksumKey
            });
            alert('Cập nhật cấu hình PayOS thành công!');
            
            // Reload lại để cập nhật trạng thái (dấu tích xanh)
            fetchConfigs(); 
        } catch (error) {
            console.error(error);
            alert('Lỗi lưu cấu hình PayOS');
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
        color: '#333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    };

    const formGroupStyle = {
        marginBottom: '15px'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '5px',
        fontWeight: '500',
        fontSize: '14px'
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    const buttonStyle = {
        padding: '8px 20px', 
        background: '#007bff', 
        color: 'white', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer', 
        fontWeight: 'bold',
        fontSize: '14px'
    };

    const noteStyle = {
        fontSize: '12px',
        color: '#666',
        marginTop: '5px',
        fontStyle: 'italic'
    };

    // Style cho badge trạng thái (Đã cấu hình)
    const statusBadge = {
        fontSize: '12px',
        color: '#155724',
        marginLeft: '10px',
        fontWeight: 'normal',
        background: '#d4edda',
        padding: '2px 8px',
        borderRadius: '10px',
        border: '1px solid #c3e6cb'
    };

    return (
        <div style={containerStyle}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Tích hợp hệ thống & Bảo mật</h2>
            
            {/* KHỐI 1: CẤU HÌNH EMAIL (SMTP) */}
            <div style={sectionStyle}>
                <div style={headerStyle}>
                    <span>📧 Cấu hình gửi Mail (SMTP Gmail)</span>
                    <button onClick={handleSaveMail} style={buttonStyle}>💾 Lưu Email</button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Email gửi hệ thống (Gmail)</label>
                        <input 
                            type="email" 
                            name="Email" 
                            value={mailConfig.Email} 
                            onChange={handleChangeMail} 
                            placeholder="vd: shopcaycanh@gmail.com"
                            style={inputStyle}
                        />
                    </div>
                    
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Mật khẩu ứng dụng (App Password)</label>
                        <input 
                            type="password" 
                            name="Password" 
                            value={mailConfig.Password} 
                            onChange={handleChangeMail} 
                            placeholder="Chỉ nhập nếu muốn đổi mật khẩu mới..."
                            style={inputStyle}
                        />
                        <div style={noteStyle}>
                            * Lưu ý: Đây là App Password (16 ký tự), không phải mật khẩu đăng nhập Gmail.
                        </div>
                    </div>
                </div>
            </div>

            {/* KHỐI 2: CẤU HÌNH PAYOS (ĐÃ HOÀN THIỆN) */}
            <div style={sectionStyle}>
                <div style={headerStyle}>
                    <span>💳 Cấu hình Thanh toán (PayOS)</span>
                    {/* Nút lưu màu xanh lá để phân biệt */}
                    <button onClick={handleSavePayOs} style={{...buttonStyle, background: '#28a745'}}>💾 Lưu PayOS</button>
                </div>
                
                {/* Client ID */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>
                        Client ID
                        {payOsStatus.hasClientId && <span style={statusBadge}>✓ Đã được cấu hình</span>}
                    </label>
                    <input 
                        type="text" 
                        name="ClientId" 
                        value={payOsConfig.ClientId} 
                        onChange={handleChangePayOS} 
                        placeholder={payOsStatus.hasClientId ? "************** (Nhập để thay đổi)" : "Nhập Client ID..."}
                        style={inputStyle}
                    />
                </div>

                {/* Api Key & Checksum Key */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>
                            API Key
                            {payOsStatus.hasApiKey && <span style={statusBadge}>✓ Đã được cấu hình</span>}
                        </label>
                        <input 
                            type="password" 
                            name="ApiKey" 
                            value={payOsConfig.ApiKey} 
                            onChange={handleChangePayOS} 
                            placeholder={payOsStatus.hasApiKey ? "************** (Nhập để thay đổi)" : "Nhập API Key..."}
                            style={inputStyle}
                        />
                    </div>
                    
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>
                            Checksum Key
                            {payOsStatus.hasChecksumKey && <span style={statusBadge}>✓ Đã được cấu hình</span>}
                        </label>
                        <input 
                            type="password" 
                            name="ChecksumKey" 
                            value={payOsConfig.ChecksumKey} 
                            onChange={handleChangePayOS} 
                            placeholder={payOsStatus.hasChecksumKey ? "************** (Nhập để thay đổi)" : "Nhập Checksum Key..."}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={noteStyle}>
                    * Bảo mật: ClientID, API Key và Checksum Key sẽ được <b>mã hóa</b> trước khi lưu vào cơ sở dữ liệu.
                    <br/>
                    * Để bảo mật, hệ thống sẽ không hiển thị lại các khóa này sau khi lưu.
                </div>
            </div>
        </div>
    );
};

export default SystemIntegration;