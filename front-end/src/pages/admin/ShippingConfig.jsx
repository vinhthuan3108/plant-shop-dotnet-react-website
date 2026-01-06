import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; // Nếu bạn dùng thư viện toast, hoặc thay bằng alert
import { API_BASE } from '../../utils/apiConfig.jsx';
const ShippingConfig = () => {
    //const BASE_URL = 'https://localhost:7298'; // Cập nhật port của bạn
    const [loading, setLoading] = useState(false);
    const [provinces, setProvinces] = useState([]);

    // State lưu cấu hình giống hệt DTO Backend
    const [config, setConfig] = useState({
        storeProvinceCode: '',
        baseRule: {
            weightCriteria: 0,
            priceInnerProvince: 0,
            priceInnerRegion: 0,
            priceInterRegion: 0
        },
        stepRule: {
            weightCriteria: 0,
            priceInnerProvince: 0,
            priceInnerRegion: 0,
            priceInterRegion: 0
        }
    });

    // 1. Load dữ liệu ban đầu
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Load danh sách tỉnh thành (OpenAPI)
                const provRes = await axios.get('https://provinces.open-api.vn/api/?depth=1');
                setProvinces(provRes.data);

                // Load cấu hình hiện tại từ Server
                const configRes = await axios.get(`${API_BASE}/api/ShippingRule`);
                
                // Nếu server trả về dữ liệu, fill vào state
                if (configRes.data) {
                    setConfig(prev => ({
                        ...prev,
                        storeProvinceCode: configRes.data.storeProvinceCode || '',
                        // Cần check null vì lần đầu chạy DB có thể chưa có dữ liệu
                        baseRule: configRes.data.baseRule || prev.baseRule,
                        stepRule: configRes.data.stepRule || prev.stepRule
                    }));
                }
            } catch (err) {
                console.error("Lỗi tải cấu hình:", err);
                toast.error("Không tải được cấu hình vận chuyển.");
            }
        };
        fetchData();
    }, []);

    // 2. Xử lý thay đổi input
    const handleBaseChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            baseRule: { ...prev.baseRule, [name]: parseFloat(value) || 0 }
        }));
    };

    const handleStepChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            stepRule: { ...prev.stepRule, [name]: parseFloat(value) || 0 }
        }));
    };

    // 3. Lưu cấu hình
    const handleSave = async () => {
        if (!config.storeProvinceCode) {
            return toast.warning("Vui lòng chọn Tỉnh/Thành phố của cửa hàng!");
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE}/api/ShippingRule`, config);
            toast.success("Cập nhật cấu hình thành công!");
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu cấu hình.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Cấu Hình Phí Vận Chuyển (Theo Kg)</h2>

            {/* PHẦN 1: VỊ TRÍ KHO */}
            <div style={cardStyle}>
                <h4 style={{ color: '#d35400' }}>1. Vị trí Cửa hàng / Kho hàng</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Hệ thống sẽ dựa vào vị trí này để xác định khách hàng ở Nội miền hay Liên miền.</p>
                <div style={{ marginTop: '15px' }}>
                    <label style={{ fontWeight: 'bold' }}>Tỉnh/Thành phố gốc:</label>
                    <select 
                        style={inputStyle}
                        value={config.storeProvinceCode}
                        onChange={(e) => setConfig({ ...config, storeProvinceCode: e.target.value })}
                    >
                        <option value="">-- Chọn vị trí kho --</option>
                        {provinces.map(p => (
                            <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* PHẦN 2: GIÁ CƯỚC CƠ BẢN */}
            <div style={cardStyle}>
                <h4 style={{ color: '#2980b9' }}>2. Giá cước tiêu chuẩn (Khởi điểm)</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Áp dụng cho đơn hàng có trọng lượng nằm trong khoảng này.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div>
                        <label>Mốc cân nặng (Kg):</label>
                        <input type="number" name="weightCriteria" value={config.baseRule.weightCriteria} onChange={handleBaseChange} style={inputStyle} placeholder="VD: 10" />
                        <small style={{display:'block', color:'#888', marginTop:'5px'}}>Ví dụ: 10kg đầu tiên</small>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div>
                        <label>Nội Tỉnh (VNĐ):</label>
                        <input type="number" name="priceInnerProvince" value={config.baseRule.priceInnerProvince} onChange={handleBaseChange} style={inputStyle} />
                    </div>
                    <div>
                        <label>Nội Miền (VNĐ):</label>
                        <input type="number" name="priceInnerRegion" value={config.baseRule.priceInnerRegion} onChange={handleBaseChange} style={inputStyle} />
                    </div>
                    <div>
                        <label>Liên Miền (VNĐ):</label>
                        <input type="number" name="priceInterRegion" value={config.baseRule.priceInterRegion} onChange={handleBaseChange} style={inputStyle} />
                    </div>
                </div>
            </div>

            {/* PHẦN 3: GIÁ CƯỚC LŨY TIẾN */}
            <div style={cardStyle}>
                <h4 style={{ color: '#27ae60' }}>3. Giá cước lũy tiến (Tính thêm)</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>Nếu vượt quá mốc tiêu chuẩn, mỗi [X] kg tiếp theo sẽ cộng thêm số tiền này.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div>
                        <label>Mỗi (Kg) tiếp theo:</label>
                        <input type="number" name="weightCriteria" value={config.stepRule.weightCriteria} onChange={handleStepChange} style={inputStyle} placeholder="VD: 5" />
                        <small style={{display:'block', color:'#888', marginTop:'5px'}}>Ví dụ: Cứ mỗi 5kg tiếp theo</small>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '15px' }}>
                    <div>
                        <label>+ Thêm (Nội Tỉnh):</label>
                        <input type="number" name="priceInnerProvince" value={config.stepRule.priceInnerProvince} onChange={handleStepChange} style={inputStyle} />
                    </div>
                    <div>
                        <label>+ Thêm (Nội Miền):</label>
                        <input type="number" name="priceInnerRegion" value={config.stepRule.priceInnerRegion} onChange={handleStepChange} style={inputStyle} />
                    </div>
                    <div>
                        <label>+ Thêm (Liên Miền):</label>
                        <input type="number" name="priceInterRegion" value={config.stepRule.priceInterRegion} onChange={handleStepChange} style={inputStyle} />
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSave} 
                disabled={loading}
                style={{ 
                    padding: '15px 30px', 
                    backgroundColor: '#2c3e50', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    fontSize: '16px', 
                    cursor: 'pointer',
                    marginTop: '20px',
                    float: 'right'
                }}
            >
                {loading ? 'Đang lưu...' : 'LƯU CẤU HÌNH'}
            </button>
        </div>
    );
};

// CSS in JS đơn giản
const cardStyle = {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    marginBottom: '25px',
    border: '1px solid #eee'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc'
};

export default ShippingConfig;