import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { toast } from 'react-toastify'; 
import { API_BASE } from '../../utils/apiConfig.jsx';
function SystemIntegration() {
    // 1. Config Email
    const [mailConfig, setMailConfig] = useState({
        Email: '',
        Password: '' 
    });

    // 2. Config PayOS
    const [payOsConfig, setPayOsConfig] = useState({
        ClientId: '',
        ApiKey: '',
        ChecksumKey: ''
    });

    // 3. Config Recaptcha (THÊM MỚI)
    const [recaptchaConfig, setRecaptchaConfig] = useState({
        siteKey: '',
        secretKey: ''
    });

    // State phụ để hiển thị trạng thái đã có cấu hình hay chưa
    const [statusFlags, setStatusFlags] = useState({
        // PayOS
        hasClientId: false,
        hasApiKey: false,
        hasChecksumKey: false,
        // Recaptcha
        hasSiteKey: false,
        hasSecretKey: false
    });

    //const BASE_URL = 'https://localhost:7298'; 

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
            const data = res.data;
            
            // --- Xử lý Email ---
            const emailSetting = data.find(x => x.configKey === 'Mail_User');
            setMailConfig(prev => ({
                ...prev,
                Email: emailSetting ? emailSetting.configValue : '',
                Password: '' // Luôn ẩn password
            }));

            // --- Xử lý PayOS ---
            const hasClient = data.some(x => x.configKey === 'PayOS_ClientId' && x.configValue);
            const hasApi = data.some(x => x.configKey === 'PayOS_ApiKey' && x.configValue);
            const hasCheck = data.some(x => x.configKey === 'PayOS_ChecksumKey' && x.configValue);

            // --- Xử lý Recaptcha (THÊM MỚI) ---
            // SiteKey: Không mã hóa -> Lấy value hiển thị luôn
            const siteKeySetting = data.find(x => x.configKey === 'Recaptcha_SiteKey');
            const hasSecretRecaptcha = data.some(x => x.configKey === 'Recaptcha_SecretKey' && x.configValue);

            setStatusFlags({
                hasClientId: hasClient,
                hasApiKey: hasApi,
                hasChecksumKey: hasCheck,
                hasSiteKey: !!siteKeySetting,
                hasSecretKey: hasSecretRecaptcha
            });

            // Reset PayOS inputs
            setPayOsConfig({ ClientId: '', ApiKey: '', ChecksumKey: '' });

            // Set Recaptcha inputs (Hiển thị SiteKey cũ nếu có, SecretKey để rỗng)
            setRecaptchaConfig({
                siteKey: siteKeySetting ? siteKeySetting.configValue : '',
                secretKey: '' 
            });

        } catch (error) {
            console.error(error);
        }
    };

    // --- HANDLERS ---

    const handleChangeMail = (e) => {
        const { name, value } = e.target;
        setMailConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleChangePayOS = (e) => {
        const { name, value } = e.target;
        setPayOsConfig(prev => ({ ...prev, [name]: value }));
    };

    // Handler cho Recaptcha
    const handleChangeRecaptcha = (e) => {
        const { name, value } = e.target;
        setRecaptchaConfig(prev => ({ ...prev, [name]: value }));
    };

    // --- SAVE FUNCTIONS ---

    const handleSaveMail = async () => {
        if (!mailConfig.Email) {
            alert("Vui lòng nhập Email!");
            return;
        }
        try {
            await axios.post(`${API_BASE}/api/TblSystemConfig/UpdateMailSettings`, {
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

    const handleSavePayOs = async () => {
        const isFirstTime = !statusFlags.hasClientId || !statusFlags.hasApiKey || !statusFlags.hasChecksumKey;
        if (isFirstTime) {
             if (!payOsConfig.ClientId || !payOsConfig.ApiKey || !payOsConfig.ChecksumKey) {
                alert("Lần đầu cấu hình vui lòng nhập đủ 3 trường!");
                return;
             }
        }
        try {
            await axios.post(`${API_BASE}/api/TblSystemConfig/UpdatePayOsSettings`, {
                ClientId: payOsConfig.ClientId,
                ApiKey: payOsConfig.ApiKey,
                ChecksumKey: payOsConfig.ChecksumKey
            });
            alert('Cập nhật PayOS thành công!');
            fetchConfigs(); 
        } catch (error) {
            console.error(error);
            alert('Lỗi lưu cấu hình PayOS');
        }
    };

    // Lưu Recaptcha (THÊM MỚI)
    const handleSaveRecaptcha = async () => {
        // Validation: SiteKey bắt buộc phải có (hoặc đã có trong DB)
        if (!recaptchaConfig.siteKey) {
            alert("Vui lòng nhập Site Key!");
            return;
        }
        
        // Nếu chưa từng có Secret Key thì bắt buộc phải nhập
        if (!statusFlags.hasSecretKey && !recaptchaConfig.secretKey) {
            alert("Vui lòng nhập Secret Key (Lần đầu cấu hình)!");
            return;
        }

        try {
            await axios.post(`${API_BASE}/api/TblSystemConfig/UpdateRecaptchaSettings`, {
                SiteKey: recaptchaConfig.siteKey,
                SecretKey: recaptchaConfig.secretKey
            });
            alert('Cập nhật Recaptcha thành công!');
            fetchConfigs();
        } catch (error) {
            console.error(error);
            alert('Lỗi lưu cấu hình Recaptcha');
        }
    };

    // --- STYLES (Giữ nguyên như cũ) ---
    const containerStyle = { padding: '20px', maxWidth: '1000px', margin: '0 auto' };
    const sectionStyle = { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' };
    const headerStyle = { borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
    const formGroupStyle = { marginBottom: '15px' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '14px' };
    const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' };
    const buttonStyle = { padding: '8px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
    const noteStyle = { fontSize: '12px', color: '#666', marginTop: '5px', fontStyle: 'italic' };
    const statusBadge = { fontSize: '12px', color: '#155724', marginLeft: '10px', fontWeight: 'normal', background: '#d4edda', padding: '2px 8px', borderRadius: '10px', border: '1px solid #c3e6cb' };

    return (
        <div style={containerStyle}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Tích hợp hệ thống & Bảo mật</h2>
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
                            type="email" name="Email" 
                            value={mailConfig.Email} onChange={handleChangeMail} 
                            placeholder="vd: shopcaycanh@gmail.com"
                            style={inputStyle}
                        />
                    </div>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Mật khẩu ứng dụng (App Password)</label>
                        <input 
                            type="password" name="Password" 
                            value={mailConfig.Password} onChange={handleChangeMail} 
                            placeholder="Nhập để đổi mật khẩu mới..."
                            style={inputStyle}
                        />
                        <div style={noteStyle}>* Lưu ý: Đây là App Password (16 ký tự).</div>
                    </div>
                </div>
            </div>

            {/* KHỐI 2: CẤU HÌNH PAYOS */}
            <div style={sectionStyle}>
                <div style={headerStyle}>
                    <span>💳 Cấu hình Thanh toán (PayOS)</span>
                    <button onClick={handleSavePayOs} style={{...buttonStyle, background: '#28a745'}}>💾 Lưu PayOS</button>
                </div>
                
                {/* Client ID */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>
                        Client ID {statusFlags.hasClientId && <span style={statusBadge}>✓ Đã cấu hình</span>}
                    </label>
                    <input 
                        type="text" name="ClientId" 
                        value={payOsConfig.ClientId} onChange={handleChangePayOS} 
                        placeholder={statusFlags.hasClientId ? "************** (Nhập để thay đổi)" : "Nhập Client ID..."}
                        style={inputStyle}
                    />
                </div>

                {/* Api Key & Checksum Key */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>
                            API Key {statusFlags.hasApiKey && <span style={statusBadge}>✓ Đã cấu hình</span>}
                        </label>
                        <input 
                            type="password" name="ApiKey" 
                            value={payOsConfig.ApiKey} onChange={handleChangePayOS} 
                            placeholder={statusFlags.hasApiKey ? "************** (Nhập để thay đổi)" : "Nhập API Key..."}
                            style={inputStyle}
                        />
                    </div>
                    
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>
                            Checksum Key {statusFlags.hasChecksumKey && <span style={statusBadge}>✓ Đã cấu hình</span>}
                        </label>
                        <input 
                            type="password" name="ChecksumKey" 
                            value={payOsConfig.ChecksumKey} onChange={handleChangePayOS} 
                            placeholder={statusFlags.hasChecksumKey ? "************** (Nhập để thay đổi)" : "Nhập Checksum Key..."}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={noteStyle}>* Các Key PayOS sẽ được mã hóa trước khi lưu.</div>
            </div>

            {/* KHỐI 3: CẤU HÌNH GOOGLE RECAPTCHA (MỚI) */}
            <div style={sectionStyle}>
                <div style={headerStyle}>
                    <span>🤖 Cấu hình Google Recaptcha (Chống Spam)</span>
                    <button onClick={handleSaveRecaptcha} style={{...buttonStyle, background: '#ffc107', color: '#000'}}>💾 Lưu Key</button>
                </div>

                {/* Site Key (Public) */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>
                        Site Key (Public) 
                        {/* Site Key không cần giấu vì nó công khai trên frontend */}
                        {statusFlags.hasSiteKey && <span style={statusBadge}>✓ Đã cấu hình</span>}
                    </label>
                    <input 
                        type="text" 
                        name="siteKey"
                        value={recaptchaConfig.siteKey} 
                        onChange={handleChangeRecaptcha} 
                        placeholder="Nhập Site Key (Hiện công khai trên web)..."
                        style={inputStyle}
                    />
                     <div style={noteStyle}>* Key này dùng cho Frontend (React) để hiển thị Captcha.</div>
                </div>

                {/* Secret Key (Private) */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>
                        Secret Key (Private)
                        {statusFlags.hasSecretKey && <span style={statusBadge}>✓ Đã cấu hình</span>}
                    </label>
                    <input 
                        type="password" 
                        name="secretKey"
                        value={recaptchaConfig.secretKey} 
                        onChange={handleChangeRecaptcha} 
                        placeholder={statusFlags.hasSecretKey ? "************** (Nhập để thay đổi)" : "Nhập Secret Key..."}
                        style={inputStyle}
                    />
                    <div style={noteStyle}>
                        * Key này dùng cho Backend để xác thực với Google. Sẽ được <b>mã hóa</b> an toàn.
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SystemIntegration;