import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../../context/CartContext';

const Checkout = () => {
    // 1. Lấy thêm clearCart từ Context để xử lý sau khi đặt hàng
    const { cartItems, totalAmount, clearCart } = useContext(CartContext);
    const navigate = useNavigate();
    
    const BASE_URL = 'https://localhost:7298';

    // --- HELPER: LẤY USER ---
    const getUserData = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { return JSON.parse(userStr); } catch (e) { return null; }
        }
        return null;
    };
    const currentUser = getUserData();

    // --- STATE ---
    const [formData, setFormData] = useState({
        recipientName: '',
        recipientPhone: '',
        addressDetail: '',
        province: '', 
        provinceCode: '',
        district: '', 
        ward: '', 
        note: '',
        paymentMethod: 'COD'
    });

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [shippingFee, setShippingFee] = useState(0);
    const [voucherCode, setVoucherCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const [loading, setLoading] = useState(false);

    // =========================================================================
    // 1. LOAD DỮ LIỆU BAN ĐẦU (Tỉnh thành & Thông tin User)
    // =========================================================================
    // =========================================================================
    // 1. LOAD DỮ LIỆU BAN ĐẦU (Tỉnh thành & Thông tin User)
    // =========================================================================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userId = currentUser?.userId;
                
                // 1. Load danh sách Tỉnh/Thành về trước
                const provinceReq = axios.get('https://provinces.open-api.vn/api/?depth=1');
                
                let addrReq = Promise.resolve({ data: [] });
                let profileReq = Promise.resolve({ data: null });

                // Sửa đường dẫn API thành Profile cho đúng
                if (userId) {
                    addrReq = axios.get(`${BASE_URL}/api/Profile/${userId}/addresses`).catch(() => ({ data: [] }));
                    profileReq = axios.get(`${BASE_URL}/api/Profile/${userId}`).catch(() => ({ data: null }));
                }

                const [provinceRes, addrRes, profileRes] = await Promise.all([provinceReq, addrReq, profileReq]);
                
                const provinceList = provinceRes.data; 
                setProvinces(provinceList);
                
                // 2. Auto fill dữ liệu User vào Form
                if (userId) {
                    const addresses = Array.isArray(addrRes.data) ? addrRes.data : [];
                    const userProfile = profileRes.data;
                    const defaultAddr = addresses.find(a => a.isDefault === true);

                    if (defaultAddr) {
                        // --- LOGIC TÌM TỈNH CHUẨN ---
                        const normalize = (str) => str ? str.toLowerCase().trim() : '';
                        const dbProvName = normalize(defaultAddr.province);

                        // Tìm tỉnh trong list API khớp với tỉnh trong DB
                        const foundProv = provinceList.find(p => {
                            const apiName = normalize(p.name);
                            return apiName === dbProvName || apiName.includes(dbProvName) || dbProvName.includes(apiName);
                        });
                        
                        // Lấy Code và Name CHUẨN từ API (để Dropdown nhận diện được)
                        const recoveredCode = foundProv ? String(foundProv.code) : ''; 
                        const recoveredName = foundProv ? foundProv.name : (defaultAddr.province || '');

                        setFormData(prev => ({
                            ...prev,
                            recipientName: defaultAddr.recipientName || userProfile?.fullName || '',
                            recipientPhone: defaultAddr.phoneNumber || userProfile?.phoneNumber || '',
                            addressDetail: defaultAddr.addressDetail || '',
                            
                            // QUAN TRỌNG: Dùng tên từ API để Dropdown hiển thị đúng
                            province: recoveredName, 
                            provinceCode: recoveredCode,
                            
                            district: defaultAddr.district || '',
                            ward: defaultAddr.ward || '',
                        }));
                        
                        // Load tiếp Huyện/Xã nếu tìm được Code
                        if (recoveredCode) {
                             await loadLocationForDefaultAddress({ ...defaultAddr, province: recoveredName }, provinceList);
                        }
                    } else {
                        // Không có địa chỉ mặc định
                        setFormData(prev => ({
                            ...prev,
                            recipientName: userProfile?.fullName || currentUser?.fullName || '',
                            recipientPhone: userProfile?.phoneNumber || currentUser?.phoneNumber || ''
                        }));
                    }
                }
            } catch (err) {
                console.error("Lỗi khởi tạo Checkout:", err);
            }
        };

        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper load lại huyện/xã khi có địa chỉ có sẵn
    const loadLocationForDefaultAddress = async (addr, provinceList) => {
        if (!addr.province) return;
        const prov = provinceList.find(p => p.name === addr.province);
        if (!prov) return;

        try {
            const distRes = await axios.get(`https://provinces.open-api.vn/api/p/${prov.code}?depth=2`);
            setDistricts(distRes.data.districts);

            if (addr.district) {
                const dist = distRes.data.districts.find(d => d.name === addr.district);
                if (dist) {
                    const wardRes = await axios.get(`https://provinces.open-api.vn/api/d/${dist.code}?depth=2`);
                    setWards(wardRes.data.wards);
                }
            }
        } catch (e) { console.error(e); }
    };

    // =========================================================================
    // 2. XỬ LÝ SỰ KIỆN FORM
    // =========================================================================
    const handleProvinceChange = async (e) => {
    const code = e.target.value; // Lấy Mã (VD: 79)
    const index = e.target.selectedIndex;
    const name = index > 0 ? e.target.options[index].text : ''; // Lấy Tên

    // Lưu cả Name và Code vào state
    setFormData({ 
        ...formData, 
        province: name, 
        provinceCode: code, // <--- CẬP NHẬT MÃ TỈNH
        district: '', 
        ward: '' 
    });
    
    setDistricts([]); 
    setWards([]);

    if (code) {
        const res = await axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
        setDistricts(res.data.districts);
    }
};

    const handleDistrictChange = async (e) => {
        const districtCode = e.target.value;
        const districtName = e.target.options[e.target.selectedIndex].text;

        setFormData({ ...formData, district: districtName, ward: '' });
        setWards([]);

        if (districtCode) {
            const res = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            setWards(res.data.wards);
        }
    };

    const handleWardChange = (e) => {
        const wardName = e.target.options[e.target.selectedIndex].text;
        setFormData({ ...formData, ward: wardName });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Tính phí ship
    // --- TÍNH PHÍ SHIP TỰ ĐỘNG TỪ SERVER ---
useEffect(() => {
    const getShippingFee = async () => {
        // Chỉ tính khi đã có Mã Tỉnh và Giỏ hàng có đồ
        if (!formData.provinceCode || cartItems.length === 0) {
            setShippingFee(0);
            return;
        }

        try {
            // Gọi API tính phí "xem trước" mà ta vừa viết ở Backend
            const payload = {
                provinceCode: String(formData.provinceCode), // Gửi mã tỉnh
                items: cartItems.map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity
                }))
            };

            const res = await axios.post(`${BASE_URL}/api/Orders/calculate-fee`, payload);
            setShippingFee(res.data.shippingFee);
        } catch (err) {
            console.error("Lỗi tính phí ship:", err);
            // Nếu lỗi, có thể fallback về 0 hoặc một mức phí tượng trưng
            setShippingFee(0); 
        }
    };

    // Debounce nhẹ (chờ 500ms sau khi chọn xong mới gọi API để đỡ spam server)
    const timeoutId = setTimeout(() => {
        getShippingFee();
    }, 500);

    return () => clearTimeout(timeoutId);
}, [formData.provinceCode, cartItems]); // Chạy lại khi đổi Tỉnh hoặc đổi Giỏ hàng

    // Áp dụng Voucher
    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return alert("Vui lòng nhập mã!");
        try {
            const res = await axios.get(`${BASE_URL}/api/Orders/validate-voucher?code=${voucherCode}&orderValue=${totalAmount}`);
            setDiscountAmount(res.data.discountAmount);
            alert(`Áp dụng mã thành công! Giảm: ${res.data.discountAmount.toLocaleString()}đ`);
        } catch (err) {
            setDiscountAmount(0);
            alert(err.response?.data || "Mã không hợp lệ");
        }
    };

    // =========================================================================
    // 3. XỬ LÝ ĐẶT HÀNG (QUAN TRỌNG)
    // =========================================================================
    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) return alert("Giỏ hàng trống!");
        const { recipientName, recipientPhone, addressDetail, province, district, ward } = formData;
        
        if (!recipientName || !recipientPhone || !addressDetail || !province || !district || !ward) {
            return alert("Vui lòng điền đầy đủ thông tin giao hàng.");
        }

        setLoading(true);
        const userId = currentUser?.userId;
        const finalAddress = `${addressDetail}, ${ward}, ${district}, ${province}`;

        const payload = {
    userId: userId ? parseInt(userId) : null,
    recipientName,
    recipientPhone,
    shippingAddress: addressDetail, // Chỉ gửi số nhà/tên đường (ví dụ: "123 Nguyễn Trãi")
    province: formData.province,    // "Hà Nội"
    provinceCode: formData.provinceCode, // "01"
    district: formData.district,    // "Thanh Xuân"
    ward: formData.ward, // Lưu ý: Backend DTO có thể chưa có Ward, nếu cần lưu Ward riêng thì thêm vào DTO sau
    voucherCode: voucherCode || null,
    paymentMethod: formData.paymentMethod,
    note: formData.note,
    items: cartItems.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity
    }))
};

        try {
            // 1. Tạo đơn hàng
            const res = await axios.post(`${BASE_URL}/api/Orders/checkout`, payload);
            const newOrderId = res.data.orderId;

            // 2. QUAN TRỌNG: Xóa giỏ hàng ngay lập tức (UI + LocalStorage)
            clearCart(); 

            // 3. Xử lý thanh toán
            if (formData.paymentMethod === 'PAYOS') {
                const payRes = await axios.post(`${BASE_URL}/api/Payment/create-payment-link`, { orderId: newOrderId });
                if (payRes.data.checkoutUrl) {
                    window.location.href = payRes.data.checkoutUrl;
                } else {
                    alert("Lỗi tạo link thanh toán, vui lòng thanh toán sau trong 'Đơn hàng của tôi'.");
                    navigate('/order-success', { state: { orderId: newOrderId } });
                }
            } else {
                // COD
                alert("Đặt hàng thành công!");
                navigate('/order-success', { state: { orderId: newOrderId } });
            }

        } catch (error) {
            console.error("Lỗi đặt hàng:", error);
            alert("Lỗi đặt hàng: " + (error.response?.data?.message || "Có lỗi xảy ra"));
        } finally {
            setLoading(false);
        }
    };

    const finalTotal = (totalAmount || 0) + shippingFee - discountAmount;

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            
            {/* CỘT TRÁI: FORM */}
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

                    <input type="text" name="addressDetail" placeholder="Số nhà, tên đường... (*)" value={formData.addressDetail} onChange={handleChange} style={inputStyle} />
                    <textarea name="note" placeholder="Ghi chú đơn hàng" value={formData.note} onChange={handleChange} style={{...inputStyle, height: '80px'}} />
                </div>
            </div>

            {/* CỘT PHẢI: BILL */}
            <div style={{ flex: 1, minWidth: '350px', backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '8px', height: 'fit-content' }}>
                <h3 style={{ marginBottom: '15px' }}>Đơn hàng ({cartItems.length} sản phẩm)</h3>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                    {cartItems.map(item => (
                        <div key={item.variantId || item.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div>
                                <div>{item.productName} <strong>x {item.quantity}</strong></div>
                                {item.variantName && item.variantName !== 'Tiêu chuẩn' && <small style={{color:'#666'}}>({item.variantName})</small>}
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