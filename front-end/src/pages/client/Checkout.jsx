import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../../context/CartContext';

const Checkout = () => {
    // SỬA 1: Đổi cartTotal -> totalAmount để khớp với Context
    const { cartItems, totalAmount, refreshCart } = useContext(CartContext);
    const navigate = useNavigate();
    
    // Config URL Backend
    const BASE_URL = 'https://localhost:7298';

    // --- HELPER: LẤY USER TỪ LOCALSTORAGE ---
    const getUserData = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { return JSON.parse(userStr); } catch (e) { return null; }
        }
        return null;
    };

    const currentUser = getUserData();
    // --- STATE FORM DATA ---
    const [formData, setFormData] = useState({
        recipientName: '',
        recipientPhone: '',
        addressDetail: '',
        province: '', 
        district: '', 
        ward: '', 
        note: '',
        paymentMethod: 'COD'
    });

    // --- STATE LOCATION (API) ---
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // --- STATE KHÁC ---
    const [shippingFee, setShippingFee] = useState(0);
    const [voucherCode, setVoucherCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [loading, setLoading] = useState(false);

    // =========================================================================
    // 1. LOAD DỮ LIỆU BAN ĐẦU
    // =========================================================================
    useEffect(() => {
    const fetchData = async () => {
        try {
            const userId = currentUser?.userId;
            
            // 1.1 Load danh sách Tỉnh/Thành (Public API)
            const provinceReq = axios.get('https://provinces.open-api.vn/api/?depth=1');

            // Chuẩn bị các Promise
            let addrReq = null;
            let profileReq = null;

            if (userId) {
                // 1.2 Gọi API lấy sổ địa chỉ
                addrReq = axios.get(`${BASE_URL}/api/Profile/${userId}/addresses`);
                
                // 1.3 Gọi API lấy thông tin cá nhân (để lấy SĐT gốc từ bảng User)
                // LƯU Ý: Bạn cần thay đường dẫn này đúng với API lấy chi tiết User của bạn
                // Ví dụ: api/Users/detail/5 hoặc api/Profile/info/5
                profileReq = axios.get(`${BASE_URL}/api/Users/${userId}`); 
            }

            // Chạy song song các request để tối ưu tốc độ
            const [provinceRes, addrRes, profileRes] = await Promise.all([
                provinceReq,
                addrReq ? addrReq.catch(err => ({ data: [] })) : Promise.resolve({ data: [] }), // Nếu lỗi thì trả mảng rỗng
                profileReq ? profileReq.catch(err => ({ data: null })) : Promise.resolve({ data: null }) // Nếu lỗi thì trả null
            ]);

            setProvinces(provinceRes.data);
            const provinceList = provinceRes.data;

            // --- XỬ LÝ DỮ LIỆU USER ---
            if (userId) {
                const addresses = Array.isArray(addrRes.data) ? addrRes.data : [];
                const userProfile = profileRes.data; // Dữ liệu lấy từ bảng User/Customer
                
                // Ưu tiên 1: Địa chỉ mặc định trong sổ địa chỉ
                const defaultAddr = addresses.find(a => a.isDefault === true);

                if (defaultAddr) {
                    setFormData(prev => ({
                        ...prev,
                        recipientName: defaultAddr.recipientName || userProfile?.fullName || currentUser?.fullName || '',
                        recipientPhone: defaultAddr.phoneNumber || userProfile?.phoneNumber || currentUser?.phoneNumber || '',
                        addressDetail: defaultAddr.addressDetail || '',
                        province: defaultAddr.province || '',
                        district: defaultAddr.district || '',
                        ward: defaultAddr.ward || '',
                    }));

                    // Logic auto-load Huyện/Xã khi có địa chỉ mặc định (Giữ nguyên code cũ của bạn)
                    if (defaultAddr.province) {
                        const selectedProv = provinceList.find(p => p.name === defaultAddr.province);
                        if (selectedProv) {
                            const distRes = await axios.get(`https://provinces.open-api.vn/api/p/${selectedProv.code}?depth=2`);
                            setDistricts(distRes.data.districts);

                            if (defaultAddr.district) {
                                const selectedDist = distRes.data.districts.find(d => d.name === defaultAddr.district);
                                if (selectedDist) {
                                    const wardRes = await axios.get(`https://provinces.open-api.vn/api/d/${selectedDist.code}?depth=2`);
                                    setWards(wardRes.data.wards);
                                }
                            }
                        }
                    }

                } else {
                    // Ưu tiên 2: Nếu KHÔNG có địa chỉ mặc định -> Lấy SĐT từ bảng User (Database)
                    // userProfile lấy từ API sẽ chính xác hơn localStorage
                    setFormData(prev => ({
                        ...prev,
                        recipientName: userProfile?.fullName || currentUser?.fullName || '',
                        recipientPhone: userProfile?.phoneNumber || userProfile?.phone || currentUser?.phoneNumber || '' // Check kỹ case (hoa/thường) backend trả về
                    }));
                }
            }
        } catch (err) {
            console.error("Lỗi khởi tạo:", err);
        }
    };

    fetchData();
}, []);

    // --- CÁC HÀM XỬ LÝ LOCATION ---
    const handleProvinceChange = async (e) => {
        const index = e.target.selectedIndex;
        const provinceName = e.target.options[index].text;
        const provinceCode = e.target.value; 

        setFormData({ ...formData, province: provinceName, district: '', ward: '' });
        setDistricts([]); setWards([]);
        
        if (provinceCode) {
            const res = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            setDistricts(res.data.districts);
        }
    };

    const handleDistrictChange = async (e) => {
        const index = e.target.selectedIndex;
        const districtName = e.target.options[index].text;
        const districtCode = e.target.value;

        setFormData({ ...formData, district: districtName, ward: '' });
        setWards([]);

        if (districtCode) {
            const res = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            setWards(res.data.wards);
        }
    };

    const handleWardChange = (e) => {
        const index = e.target.selectedIndex;
        const wardName = e.target.options[index].text;
        setFormData({ ...formData, ward: wardName });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Tính phí ship
    useEffect(() => {
        const p = formData.province ? formData.province.toLowerCase() : '';
        if (!p) {
            setShippingFee(0);
        } else if (p.includes('hồ chí minh') || p.includes('sài gòn')) {
            setShippingFee(15000); 
        } else if (p.includes('bình dương') || p.includes('đồng nai') || p.includes('long an')) {
            setShippingFee(30000);
        } else {
            setShippingFee(30000);
        }
    }, [formData.province]);

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return alert("Vui lòng nhập mã!");
        try {
            // SỬA 2: Dùng totalAmount để check điều kiện voucher
            const res = await axios.get(`${BASE_URL}/api/Orders/validate-voucher?code=${voucherCode}&orderValue=${totalAmount}`);
            setDiscountAmount(res.data.discountAmount);
            alert(`Áp dụng mã thành công! Giảm: ${res.data.discountAmount.toLocaleString()}đ`);
        } catch (err) {
            setDiscountAmount(0);
            alert(err.response?.data || "Mã không hợp lệ");
        }
    };

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) return alert("Giỏ hàng trống!");
        if (!formData.recipientName || !formData.recipientPhone || !formData.addressDetail || !formData.province || !formData.district || !formData.ward) {
            return alert("Vui lòng điền đầy đủ thông tin giao hàng.");
        }

        setLoading(true);
        const userId = currentUser?.userId;
        const finalAddressDetail = `${formData.addressDetail}, ${formData.ward}`;

        const payload = {
            userId: userId ? parseInt(userId) : null,
            recipientName: formData.recipientName,
            recipientPhone: formData.recipientPhone,
            shippingAddress: finalAddressDetail, 
            province: formData.province,
            district: formData.district,
            voucherCode: voucherCode || null,
            paymentMethod: formData.paymentMethod,
            note: formData.note,
            items: cartItems.map(item => ({
                variantId: item.variantId,
                quantity: item.quantity
            }))
        };

        try {
            const res = await axios.post(`${BASE_URL}/api/Orders/checkout`, payload);
            const data = res.data;
            const newOrderId = data.orderId;

            if (formData.paymentMethod === 'PAYOS') {
                const payRes = await axios.post(`${BASE_URL}/api/Payment/create-payment-link`, { orderId: newOrderId });
                if (payRes.data.checkoutUrl) {
                    window.location.href = payRes.data.checkoutUrl;
                } else {
                    alert("Lỗi tạo link thanh toán.");
                    navigate('/order-success', { state: { orderId: newOrderId } });
                }
            } else {
                alert("Đặt hàng thành công!");
                await refreshCart();
                navigate('/order-success', { state: { orderId: newOrderId } });
            }
        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            alert("Lỗi đặt hàng: " + (error.response?.data?.message || "Có lỗi xảy ra"));
        } finally {
            setLoading(false);
        }
    };

    // SỬA 3: Dùng totalAmount để tính tổng cuối
    const finalTotal = (totalAmount || 0) + shippingFee - discountAmount;

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            
            {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN */}
            <div style={{ flex: 1, minWidth: '350px' }}>
                <h2 style={{ color: '#2e7d32', marginBottom: '20px' }}>Thông tin giao hàng</h2>
                <div style={{ display: 'grid', gap: '15px' }}>
                    <input type="text" name="recipientName" placeholder="Họ tên người nhận (*)" value={formData.recipientName} onChange={handleChange} style={inputStyle} />
                    <input type="text" name="recipientPhone" placeholder="Số điện thoại (*)" value={formData.recipientPhone} onChange={handleChange} style={inputStyle} />
                    
                    <div style={{ display: 'grid', gap: '10px' }}>
                        <select style={inputStyle} onChange={handleProvinceChange} value={provinces.find(p => p.name === formData.province)?.code || ""}>
                            <option value="">-- Chọn Tỉnh/Thành --</option>
                            {provinces.map(p => (<option key={p.code} value={p.code}>{p.name}</option>))}
                        </select>

                        <div style={{display: 'flex', gap: '10px'}}>
                            <select style={{...inputStyle, flex: 1}} onChange={handleDistrictChange} disabled={!formData.province} value={districts.find(d => d.name === formData.district)?.code || ""}>
                                <option value="">-- Chọn Quận/Huyện --</option>
                                {districts.map(d => (<option key={d.code} value={d.code}>{d.name}</option>))}
                            </select>

                            <select style={{...inputStyle, flex: 1}} onChange={handleWardChange} disabled={!formData.district} value={wards.find(w => w.name === formData.ward)?.code || ""}>
                                <option value="">-- Chọn Phường/Xã --</option>
                                {wards.map(w => (<option key={w.code} value={w.code}>{w.name}</option>))}
                            </select>
                        </div>
                    </div>

                    <input type="text" name="addressDetail" placeholder="Địa chỉ chi tiết (Số nhà, tên đường...) (*)" value={formData.addressDetail} onChange={handleChange} style={inputStyle} />
                    <textarea name="note" placeholder="Ghi chú đơn hàng (VD: Giao giờ hành chính)" value={formData.note} onChange={handleChange} style={{...inputStyle, height: '80px'}} />
                </div>
            </div>

            {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
            <div style={{ flex: 1, minWidth: '350px', backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '8px', height: 'fit-content' }}>
                <h3 style={{ marginBottom: '15px' }}>Đơn hàng ({cartItems.length} sản phẩm)</h3>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                    {cartItems.map(item => (
                        <div key={item.variantId || item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div>
                                <span>{item.productName} <strong>x {item.quantity}</strong></span>
                                {item.variantName && item.variantName !== 'Tiêu chuẩn' && (
                                    <div style={{fontSize:'12px', color:'#666'}}>({item.variantName})</div>
                                )}
                            </div>
                            <span>{(item.price * item.quantity).toLocaleString()}đ</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <input type="text" placeholder="Mã giảm giá" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} style={{ flex: 1, padding: '8px' }} />
                    <button onClick={handleApplyVoucher} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}>Áp dụng</button>
                </div>

                <div style={{ display: 'grid', gap: '10px', fontSize: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tạm tính:</span>
                        {/* SỬA 4: Hiển thị totalAmount */}
                        <span>{(totalAmount || 0).toLocaleString()}đ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Phí vận chuyển:</span>
                        <span>{shippingFee.toLocaleString()}đ</span>
                    </div>
                    {discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green' }}>
                            <span>Giảm giá:</span>
                            <span>- {discountAmount.toLocaleString()}đ</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
                        <span>Tổng cộng:</span>
                        <span style={{ color: '#d32f2f' }}>{(finalTotal > 0 ? finalTotal : 0).toLocaleString()}đ</span>
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Phương thức thanh toán:</p>
                    <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer' }}>
                        <input type="radio" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} /> 
                        <span style={{ marginLeft: '10px' }}>Thanh toán khi nhận hàng (COD)</span>
                    </label>
                    <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer' }}>
                        <input type="radio" name="paymentMethod" value="PAYOS" checked={formData.paymentMethod === 'PAYOS'} onChange={handleChange} /> 
                        <span style={{ marginLeft: '10px' }}>Thanh toán điện tử (VietQR - PayOS)</span>
                    </label>
                </div>

                <button 
                    onClick={handlePlaceOrder} 
                    disabled={loading}
                    style={{ width: '100%', padding: '15px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '16px', marginTop: '20px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG'}
                </button>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ccc'
};

export default Checkout;