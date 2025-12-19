import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Dùng axios cho tiện
import { CartContext } from '../../context/CartContext';

const Checkout = () => {
    const { cartItems, cartTotal, refreshCart } = useContext(CartContext);
    const navigate = useNavigate();
    const BASE_URL = 'https://localhost:7298';

    // --- STATE FORM DATA ---
    const [formData, setFormData] = useState({
        recipientName: '',
        recipientPhone: '',
        addressDetail: '',
        province: '', 
        district: '', 
        ward: '', // Thêm phường/xã
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
    // 1. LOAD DỮ LIỆU BAN ĐẦU (TỈNH THÀNH & ĐỊA CHỈ MẶC ĐỊNH)
    // =========================================================================
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1.1 Load danh sách Tỉnh/Thành trước
                const provinceRes = await axios.get('https://provinces.open-api.vn/api/?depth=1');
                setProvinces(provinceRes.data);
                const provinceList = provinceRes.data;

                // 1.2 Sau đó load địa chỉ mặc định của User
                const userId = localStorage.getItem('userId');
                const storedName = localStorage.getItem('userName');
                
                if (userId) {
                    const addrRes = await axios.get(`${BASE_URL}/api/Profile/${userId}/addresses`);
                    const addresses = addrRes.data;
                    const defaultAddr = addresses.find(a => a.isDefault === true);

                    if (defaultAddr) {
                        // Fill thông tin cơ bản
                        setFormData(prev => ({
                            ...prev,
                            recipientName: defaultAddr.recipientName || storedName,
                            recipientPhone: defaultAddr.phoneNumber || '',
                            addressDetail: defaultAddr.addressDetail || '',
                            province: defaultAddr.province || '',
                            district: defaultAddr.district || '',
                            ward: defaultAddr.ward || '',
                        }));

                        // --- LOGIC PHỨC TẠP: AUTO-LOAD HUYỆN/XÃ DỰA TRÊN TÊN ---
                        // Vì DB lưu "Tên" (Hà Nội), nhưng API cần "Code" (1) để load huyện
                        if (defaultAddr.province) {
                            const selectedProv = provinceList.find(p => p.name === defaultAddr.province);
                            if (selectedProv) {
                                // Load Quận/Huyện của Tỉnh mặc định
                                const distRes = await axios.get(`https://provinces.open-api.vn/api/p/${selectedProv.code}?depth=2`);
                                setDistricts(distRes.data.districts);

                                // Nếu có District -> Load Xã
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
                        // Không có địa chỉ mặc định -> Chỉ điền tên
                        setFormData(prev => ({ ...prev, recipientName: storedName || '' }));
                    }
                }
            } catch (err) {
                console.error("Lỗi khởi tạo:", err);
            }
        };

        fetchData();
    }, []);


    
    // Chọn Tỉnh -> Load Huyện
    const handleProvinceChange = async (e) => {
        const index = e.target.selectedIndex;
        const provinceName = e.target.options[index].text;
        const provinceCode = e.target.value; 

        setFormData({ ...formData, province: provinceName, district: '', ward: '' });
        setDistricts([]); 
        setWards([]);

        if (provinceCode) {
            const res = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            setDistricts(res.data.districts);
        }
    };

    // Chọn Huyện -> Load Xã
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

    // Chọn Xã
    const handleWardChange = (e) => {
        const index = e.target.selectedIndex;
        const wardName = e.target.options[index].text;
        setFormData({ ...formData, ward: wardName });
    };


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    useEffect(() => {
        const p = formData.province ? formData.province.toLowerCase() : '';
        if (!p) {
            setShippingFee(0);
        } else if (p.includes('hồ chí minh') || p.includes('sài gòn')) {
            setShippingFee(30000); 
        } else if (p.includes('bình dương') || p.includes('đồng nai') || p.includes('long an')) {
            setShippingFee(40000);
        } else {
            setShippingFee(50000);
        }
    }, [formData.province]);


    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return alert("Vui lòng nhập mã!");
        try {
            const res = await axios.get(`${BASE_URL}/api/Orders/validate-voucher?code=${voucherCode}&orderValue=${cartTotal}`);
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
        const userId = localStorage.getItem('userId');

        // Gộp Phường/Xã vào địa chỉ chi tiết hoặc District để gửi xuống Backend
        // Backend hiện tại có: ShippingAddress, District, Province.
        // Ta sẽ nối: ShippingAddress = "Số nhà..., Phường X"
        const finalAddressDetail = `${formData.addressDetail}, ${formData.ward}`;

        const payload = {
            userId: userId ? parseInt(userId) : null,
            recipientName: formData.recipientName,
            recipientPhone: formData.recipientPhone,
            shippingAddress: finalAddressDetail, // Đã gộp ward vào đây
            province: formData.province,
            district: formData.district,
            voucherCode: voucherCode || null,
            paymentMethod: formData.paymentMethod,
            note: formData.note,
            items: cartItems.map(item => ({
                productId: item.productId,
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
            alert("Lỗi đặt hàng: " + (error.response?.data?.message || "Có lỗi xảy ra"));
        } finally {
            setLoading(false);
        }
    };

    const finalTotal = cartTotal + shippingFee - discountAmount;

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            
            {/* CỘT TRÁI: FORM ĐIỀN THÔNG TIN */}
            <div style={{ flex: 1, minWidth: '350px' }}>
                <h2 style={{ color: '#2e7d32', marginBottom: '20px' }}>Thông tin giao hàng</h2>
                <div style={{ display: 'grid', gap: '15px' }}>
                    
                    {/* HỌ TÊN & SĐT */}
                    <input type="text" name="recipientName" placeholder="Họ tên người nhận (*)" value={formData.recipientName} onChange={handleChange} style={inputStyle} />
                    <input type="text" name="recipientPhone" placeholder="Số điện thoại (*)" value={formData.recipientPhone} onChange={handleChange} style={inputStyle} />
                    
                    {/* DROPDOWN LOCATION (FULL 3 CẤP) */}
                    <div style={{ display: 'grid', gap: '10px' }}>
                        
                        {/* 1. Tỉnh / Thành */}
                        <select 
                            style={inputStyle} 
                            onChange={handleProvinceChange}
                            /* Value ở đây hơi trick: Nếu đang load dữ liệu tự động thì phải hiển thị đúng.
                               Tuy nhiên select cần value là CODE để match với option.
                               Do đó ta dùng find để tìm code dựa trên tên đang lưu trong formData
                            */
                            value={provinces.find(p => p.name === formData.province)?.code || ""}
                        >
                            <option value="">-- Chọn Tỉnh/Thành --</option>
                            {provinces.map(p => (
                                <option key={p.code} value={p.code}>{p.name}</option>
                            ))}
                        </select>

                        {/* 2. Quận / Huyện */}
                        <div style={{display: 'flex', gap: '10px'}}>
                            <select 
                                style={{...inputStyle, flex: 1}} 
                                onChange={handleDistrictChange}
                                disabled={!formData.province}
                                value={districts.find(d => d.name === formData.district)?.code || ""}
                            >
                                <option value="">-- Chọn Quận/Huyện --</option>
                                {districts.map(d => (
                                    <option key={d.code} value={d.code}>{d.name}</option>
                                ))}
                            </select>

                        {/* 3. Phường / Xã */}
                            <select 
                                style={{...inputStyle, flex: 1}} 
                                onChange={handleWardChange}
                                disabled={!formData.district}
                                value={wards.find(w => w.name === formData.ward)?.code || ""}
                            >
                                <option value="">-- Chọn Phường/Xã --</option>
                                {wards.map(w => (
                                    <option key={w.code} value={w.code}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ĐỊA CHỈ CHI TIẾT & GHI CHÚ */}
                    <input type="text" name="addressDetail" placeholder="Địa chỉ chi tiết (Số nhà, tên đường...) (*)" value={formData.addressDetail} onChange={handleChange} style={inputStyle} />
                    <textarea name="note" placeholder="Ghi chú đơn hàng (VD: Giao giờ hành chính)" value={formData.note} onChange={handleChange} style={{...inputStyle, height: '80px'}} />
                </div>
            </div>

            {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (Giữ nguyên giao diện) */}
            <div style={{ flex: 1, minWidth: '350px', backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '8px', height: 'fit-content' }}>
                <h3 style={{ marginBottom: '15px' }}>Đơn hàng ({cartItems.length} sản phẩm)</h3>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                    {cartItems.map(item => (
                        <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>{item.productName} <strong>x {item.quantity}</strong></span>
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
                        <span>{cartTotal.toLocaleString()}đ</span>
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
                        <span style={{ color: '#d32f2f' }}>{finalTotal > 0 ? finalTotal.toLocaleString() : 0}đ</span>
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
                        <span style={{ marginLeft: '10px' }}>Thanh toán qua Ngân hàng (VietQR - PayOS)</span>
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