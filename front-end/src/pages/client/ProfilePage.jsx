import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

// --- COMPONENT MODAL CHI TIẾT ĐƠN HÀNG (DÀNH CHO USER) ---
const UserOrderDetailModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    };
    const modalStyle = {
        backgroundColor: 'white', padding: '25px', borderRadius: '8px',
        width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)', position: 'relative'
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#666'}}>✕</button>
                
                <h3 style={{color: '#2e7d32', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px'}}>
                    Chi tiết đơn hàng #{order.orderId}
                </h3>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '14px'}}>
                    <div>
                        <strong style={{display:'block', marginBottom:'5px', color:'#555'}}>Địa chỉ nhận hàng</strong>
                        <div>{order.recipientName}</div>
                        <div style={{color: '#666', fontSize:'13px'}}>{order.recipientPhone}</div>
                        <div style={{color: '#666', fontSize:'13px'}}>{order.shippingAddress}</div>
                    </div>
                    <div>
                        <strong style={{display:'block', marginBottom:'5px', color:'#555'}}>Thông tin đơn</strong>
                        <div>Ngày đặt: {new Date(order.orderDate).toLocaleDateString('vi-VN')}</div>
                        <div>Trạng thái: <span style={{fontWeight:'bold'}}>{order.orderStatus}</span></div>
                        <div>Thanh toán: {order.paymentStatus === 'Paid' ? <span style={{color:'green'}}>Đã thanh toán</span> : <span style={{color:'orange'}}>Chưa thanh toán</span>}</div>
                    </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                    <strong style={{display:'block', marginBottom:'10px', color:'#555'}}>Sản phẩm</strong>
                    <div style={{border: '1px solid #eee', borderRadius: '4px'}}>
                        {order.items.map((item, idx) => (
                            <div key={idx} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom: idx !== order.items.length-1 ? '1px solid #eee' : 'none'}}>
                                <div>
                                    <div>{item.productName}</div>
                                    {item.variantName && item.variantName !== 'Tiêu chuẩn' && (
                                        <div style={{fontSize: '12px', color: '#888'}}>Phân loại: {item.variantName}</div>
                                    )}
                                    <div style={{fontSize: '12px', color: '#888'}}>x{item.quantity}</div>
                                </div>
                                <div>{(item.price * item.quantity).toLocaleString()}đ</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{textAlign: 'right', fontSize: '14px'}}>
                    <div style={{marginBottom:'5px'}}>Tạm tính: {(order.subTotal || 0).toLocaleString()}đ</div>
                    <div style={{marginBottom:'5px'}}>Phí vận chuyển: {(order.shippingFee || 0).toLocaleString()}đ</div>
                    {order.discountAmount > 0 && <div style={{marginBottom:'5px', color:'green'}}>Giảm giá: -{(order.discountAmount).toLocaleString()}đ</div>}
                    <div style={{fontSize: '18px', fontWeight: 'bold', color: '#d32f2f', marginTop:'10px', borderTop:'1px solid #eee', paddingTop:'10px'}}>
                        Tổng cộng: {(order.totalAmount || 0).toLocaleString()}đ
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    const API_BASE_URL = "https://localhost:7298";
    const navigate = useNavigate();

    const getUserData = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { return JSON.parse(userStr); } catch (e) { return null; }
        }
        return null;
    };
    
    const currentUser = getUserData();
    const userId = currentUser?.userId;

    const [activeTab, setActiveTab] = useState('info');
    
    // --- STATE PROFILE ---
    const [profile, setProfile] = useState({
        fullName: '', email: '', phoneNumber: '', avatarUrl: '', dateofBirth: '', gender: 'Nam'
    });

    // --- STATE ADDRESS ---
    const [addresses, setAddresses] = useState([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false); 
    const [addressForm, setAddressForm] = useState({
        addressId: 0, recipientName: '', phoneNumber: '', addressDetail: '',
        province: '', district: '', ward: '', isDefault: false
    });

    // --- STATE ORDERS ---
    const [orders, setOrders] = useState([]);
    const [orderStatusTab, setOrderStatusTab] = useState('Pending'); // Mặc định hiển thị tab Chờ xác nhận
    
    // State cho Modal Chi tiết đơn hàng
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    const ORDER_TABS = [
        { id: 'Pending', label: 'Chờ xác nhận' },
        { id: 'Processing', label: 'Đang đóng gói' },
        { id: 'Shipped', label: 'Đang vận chuyển' }, // Lưu ý: Code cũ là Shipped, check lại DB xem lưu Shipping hay Shipped
        { id: 'Completed', label: 'Hoàn thành' },
        { id: 'Cancelled', label: 'Đã hủy' },
    ];

    // --- STATE CHANGE PASSWORD ---
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    const isValidPassword = (password) => {
        // Ít nhất 8 ký tự, có ít nhất 1 ký tự đặc biệt
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return password.length >= 8 && hasSpecialChar;
    };
    // Location API Data
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // --- LOAD DATA ---
    useEffect(() => {
        if (!userId) {
            const oldUserId = localStorage.getItem('userId');
            if(!oldUserId) {
                alert("Vui lòng đăng nhập để xem hồ sơ!");
                navigate('/login');
                return;
            }
        }
        fetchProfile();
        fetchAddresses();
        fetchOrders();
        fetchLocationProvinces();
    }, [userId]);

    const fetchProfile = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/Profile/${effectiveId}`);
            let formattedDob = '';
            if (res.data.dateofBirth) { formattedDob = res.data.dateofBirth.split('T')[0]; }
            setProfile({ ...res.data, dateofBirth: formattedDob });
        } catch (err) { console.error(err); }
    };

    const fetchAddresses = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/Profile/${effectiveId}/addresses`);
            setAddresses(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchOrders = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/Orders/user/${effectiveId}`);
            setOrders(res.data);
        } catch (err) { console.error("Lỗi lấy đơn hàng:", err); }
    };

    const fetchLocationProvinces = async () => {
        try {
            const res = await axios.get('https://provinces.open-api.vn/api/?depth=1');
            setProvinces(res.data);
        } catch (err) { console.error("Lỗi lấy tỉnh thành:", err); }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <span className="badge badge-warning" style={{padding:'5px', background:'#ffc107', borderRadius:'4px'}}>Chờ xác nhận</span>;
            case 'Processing': return <span className="badge badge-info" style={{padding:'5px', background:'#17a2b8', color:'white', borderRadius:'4px'}}>Đang đóng gói</span>;
            case 'Shipping': // Backend có thể trả về Shipping hoặc Shipped
            case 'Shipped': return <span className="badge badge-primary" style={{padding:'5px', background:'#007bff', color:'white', borderRadius:'4px'}}>Đang vận chuyển</span>;
            case 'Completed': return <span className="badge badge-success" style={{padding:'5px', background:'#28a745', color:'white', borderRadius:'4px'}}>Hoàn thành</span>;
            case 'Cancelled': return <span className="badge badge-danger" style={{padding:'5px', background:'#dc3545', color:'white', borderRadius:'4px'}}>Đã hủy</span>;
            default: return <span className="badge badge-secondary">{status}</span>;
        }
    };

    const getAvatarSrc = (url) => {
        if (!url) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url}`;
    };

    // --- LOCATION HANDLERS ---
    const handleProvinceChange = async (e) => {
        const provinceName = e.target.options[e.target.selectedIndex].text;
        const code = e.target.value;
        setAddressForm({...addressForm, province: provinceName, district: '', ward: ''});
        setDistricts([]); setWards([]);
        if(code) {
             const res = await axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
             setDistricts(res.data.districts);
        }
    };

    const handleDistrictChange = async (e) => {
        const districtName = e.target.options[e.target.selectedIndex].text;
        const code = e.target.value;
        setAddressForm({...addressForm, district: districtName, ward: ''});
        if(code) {
            const res = await axios.get(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
            setWards(res.data.wards);
        }
    };

    const handleWardChange = (e) => {
        const wardName = e.target.options[e.target.selectedIndex].text;
        setAddressForm({...addressForm, ward: wardName});
    };

    // --- ACTIONS: PROFILE ---
    const handleUpdateProfile = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        try {
            const payload = {
                fullName: profile.fullName,
                phoneNumber: profile.phoneNumber,
                gender: profile.gender,
                avatarUrl: profile.avatarUrl,
                dateofBirth: profile.dateofBirth ? profile.dateofBirth : null
            };
            await axios.put(`${API_BASE_URL}/api/Profile/${effectiveId}`, payload);
            alert("Cập nhật hồ sơ thành công!");
            if(currentUser) {
                currentUser.fullName = profile.fullName;
                localStorage.setItem('user', JSON.stringify(currentUser));
                window.location.reload();
            }
        } catch (err) {
            console.error("Lỗi update:", err);
            alert("Lỗi cập nhật! Vui lòng kiểm tra lại thông tin.");
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/Upload/users`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile({ ...profile, avatarUrl: res.data.url }); 
        } catch (err) {
            alert("Có lỗi khi tải ảnh lên server");
        }
    };

    // --- ACTIONS: ADDRESS ---
    const openAddAddress = () => {
        setAddressForm({ addressId: 0, recipientName: profile.fullName || '', phoneNumber: profile.phoneNumber || '', addressDetail: '', province: '', district: '', ward: '', isDefault: false });
        setIsEditingAddress(false);
        setShowAddressForm(true);
    };

    const openEditAddress = (addr) => {
        setAddressForm({
            addressId: addr.addressId, recipientName: addr.recipientName || profile.fullName || '', phoneNumber: addr.phoneNumber || profile.phoneNumber || '',
            addressDetail: addr.addressDetail, province: addr.province, district: addr.district, ward: addr.ward, isDefault: addr.isDefault
        });
        setIsEditingAddress(true);
        setShowAddressForm(true);
    };

    const handleSaveAddress = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        if (!addressForm.recipientName || !addressForm.addressDetail || !addressForm.province) {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
        }
        try {
            if (isEditingAddress) {
                await axios.put(`${API_BASE_URL}/api/Profile/addresses/${addressForm.addressId}`, addressForm);
            } else {
                await axios.post(`${API_BASE_URL}/api/Profile/${effectiveId}/addresses`, addressForm);
            }
            alert("Thao tác thành công!");
            setShowAddressForm(false);
            fetchAddresses();
        } catch (err) {
            alert("Có lỗi xảy ra");
        }
    };

    const handleDeleteAddress = async (id, isDefault) => {
        if (isDefault) {
            alert("Không thể xóa địa chỉ mặc định!");
            return;
        }
        if (window.confirm("Bạn chắc chắn muốn xóa?")) {
            try {
                await axios.delete(`${API_BASE_URL}/api/Profile/addresses/${id}`);
                fetchAddresses();
            } catch (err) {
                alert("Lỗi xóa địa chỉ");
            }
        }
    };

    // --- ACTIONS: CHANGE PASSWORD ---
    const handleChangePassword = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        
        // 1. Kiểm tra rỗng
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        // 2. Kiểm tra độ mạnh mật khẩu (MỚI THÊM)
        if (!isValidPassword(passwordForm.newPassword)) {
            alert("Mật khẩu mới phải có tối thiểu 8 ký tự và chứa ít nhất 1 ký tự đặc biệt!");
            return;
        }

        // 3. Kiểm tra trùng khớp
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            const payload = {
                userId: parseInt(effectiveId),
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            };
            await axios.post(`${API_BASE_URL}/api/Auth/change-password`, payload);
            alert("Đổi mật khẩu thành công!");
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            // Kiểm tra nếu server trả về lỗi sai mật khẩu cũ (thường là 400 hoặc 401)
            alert("Lỗi đổi mật khẩu! Vui lòng kiểm tra lại mật khẩu hiện tại.");
        }
    };

    // Filter đơn hàng (Fix logic để map cả 'Shipping' và 'Shipped')
    const filteredOrders = orders.filter(o => {
        if (orderStatusTab === 'Shipped') return o.orderStatus === 'Shipping' || o.orderStatus === 'Shipped';
        return o.orderStatus === orderStatusTab;
    });

    return (
        <div className="container" style={{ marginTop: '30px', display: 'flex', gap: '20px' }}>
            
            {/* SIDEBAR */}
            <div className="profile-sidebar" style={{ width: '250px', background: '#f9f9f9', padding: '15px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <img 
                        src={getAvatarSrc(profile.avatarUrl)} 
                        alt="Avatar" 
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }} 
                    />
                    <div style={{ fontWeight: 'bold', marginTop: '10px' }}>{profile.fullName}</div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'info' ? '#e0f2f1' : 'transparent', color: activeTab === 'info' ? '#00796b' : '#333' }} onClick={() => setActiveTab('info')}>Hồ sơ của tôi</li>
                    <li style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'address' ? '#e0f2f1' : 'transparent', color: activeTab === 'address' ? '#00796b' : '#333' }} onClick={() => setActiveTab('address')}>Sổ địa chỉ</li>
                    <li style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'orders' ? '#e0f2f1' : 'transparent', color: activeTab === 'orders' ? '#00796b' : '#333' }} onClick={() => setActiveTab('orders')}>Đơn mua</li>
                    <li style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'password' ? '#e0f2f1' : 'transparent', color: activeTab === 'password' ? '#00796b' : '#333' }} onClick={() => setActiveTab('password')}>Đổi mật khẩu</li>
                </ul>
            </div>

            {/* CONTENT */}
            <div className="profile-content" style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '5px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
                
                {/* --- TAB HỒ SƠ --- */}
            {activeTab === 'info' && (
                <div>
                    <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px'}}>Hồ Sơ Của Tôi</h2>

                    {/* HÀNG 1: HỌ TÊN & EMAIL */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Họ và tên:</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={profile.fullName} 
                                onChange={(e) => setProfile({...profile, fullName: e.target.value})} 
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Email:</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={profile.email} 
                                disabled 
                                style={{ background: '#f5f5f5', cursor: 'not-allowed', color: '#666' }} 
                            />
                        </div>
                    </div>

                    {/* HÀNG 2: SỐ ĐIỆN THOẠI & NGÀY SINH */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Số điện thoại:</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={profile.phoneNumber} 
                                onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})} 
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Ngày sinh:</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={profile.dateofBirth || ''} 
                                onChange={(e) => setProfile({...profile, dateofBirth: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* CÁC PHẦN CÒN LẠI (GIỚI TÍNH, AVATAR...) GIỮ NGUYÊN */}
                    <div className="form-group" style={{marginBottom: '15px'}}>
                        <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Giới tính:</label>
                        <div style={{display: 'flex', gap: '30px', alignItems: 'center', padding: '10px 0'}}>
                            <label style={{cursor: 'pointer'}}><input type="radio" name="gender" value="Nam" checked={profile.gender === 'Nam'} onChange={() => setProfile({...profile, gender: 'Nam'})} style={{marginRight: '5px'}} /> Nam</label>
                            <label style={{cursor: 'pointer'}}><input type="radio" name="gender" value="Nữ" checked={profile.gender === 'Nữ'} onChange={() => setProfile({...profile, gender: 'Nữ'})} style={{marginRight: '5px'}} /> Nữ</label>
                            <label style={{cursor: 'pointer'}}><input type="radio" name="gender" value="Khác" checked={profile.gender === 'Khác'} onChange={() => setProfile({...profile, gender: 'Khác'})} style={{marginRight: '5px'}} /> Khác</label>
                        </div>
                    </div>

                    <div className="form-group" style={{marginBottom: '20px'}}>
                        <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Thay đổi Avatar:</label>
                        <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px', border: '1px dashed #ccc', padding: '15px', borderRadius: '8px'}}>
                            <img src={getAvatarSrc(profile.avatarUrl)} style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}} alt="Preview" />
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                        </div>
                    </div>

                    <div style={{textAlign: 'right'}}>
                        <button className="btn btn-success" onClick={handleUpdateProfile} style={{padding: '10px 30px', fontWeight: 'bold'}}>Lưu Thay Đổi</button>
                    </div>
                </div>
            )}

                {/* --- TAB ĐỊA CHỈ --- */}
                {activeTab === 'address' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h2>Địa Chỉ Của Tôi</h2>
                            {!showAddressForm && <button className="btn btn-primary" onClick={openAddAddress}>+ Thêm địa chỉ mới</button>}
                        </div>
                        {!showAddressForm ? (
                            <div className="address-list" style={{ marginTop: '20px' }}>
                                {addresses.map(addr => (
                                    <div key={addr.addressId} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <strong>{addr.recipientName}</strong> <span style={{color: '#888'}}>| {addr.phoneNumber}</span>
                                            <div style={{fontSize: '14px', color: '#555', marginTop: '5px'}}>
                                                {addr.addressDetail}<br/>
                                                {addr.ward}, {addr.district}, {addr.province}
                                            </div>
                                            {addr.isDefault && <span style={{ border: '1px solid red', color: 'red', fontSize: '12px', padding: '2px 5px', marginTop: '5px', display: 'inline-block' }}>Mặc định</span>}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                                            <button className="btn-link" onClick={() => openEditAddress(addr)} style={{color: 'blue', border: 'none', background: 'none', cursor: 'pointer'}}>Cập nhật</button>
                                            {!addr.isDefault && (
                                                <button className="btn-link" onClick={() => handleDeleteAddress(addr.addressId, addr.isDefault)} style={{color: 'red', border: 'none', background: 'none', cursor: 'pointer'}}>Xóa</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="address-form" style={{ marginTop: '20px', background: '#f8f9fa', padding: '25px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                                <h4 style={{marginBottom: '20px', color: '#00796b', borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
                                    {isEditingAddress ? "Cập Nhật Địa Chỉ" : "Thêm Địa Chỉ Mới"}
                                </h4>

                                {/* --- HÀNG 1: HỌ TÊN & SỐ ĐIỆN THOẠI (GỘP HÀNG) --- */}
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px'}}>Họ và tên</label>
                                        <input 
                                            placeholder="Tên người nhận hàng" 
                                            className="form-control" 
                                            value={addressForm.recipientName} 
                                            onChange={e => setAddressForm({...addressForm, recipientName: e.target.value})} 
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px'}}>Số điện thoại</label>
                                        <input 
                                            placeholder="Số điện thoại liên lạc" 
                                            className="form-control" 
                                            value={addressForm.phoneNumber} 
                                            onChange={e => setAddressForm({...addressForm, phoneNumber: e.target.value})} 
                                        />
                                    </div>
                                </div>

                                {/* --- HÀNG 2: CHỌN TỈNH/THÀNH (GIỮ NGUYÊN LOGIC) --- */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px'}}>Khu vực</label>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <select className="form-control" onChange={handleProvinceChange} style={{flex: 1}}>
                                            <option value="">{addressForm.province || "Tỉnh/Thành phố"}</option>
                                            {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                        </select>
                                        <select className="form-control" onChange={handleDistrictChange} style={{flex: 1}}>
                                            <option value="">{addressForm.district || "Quận/Huyện"}</option>
                                            {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                        </select>
                                        <select className="form-control" onChange={handleWardChange} style={{flex: 1}}>
                                            <option value="">{addressForm.ward || "Phường/Xã"}</option>
                                            {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* --- HÀNG 3: ĐỊA CHỈ CỤ THỂ --- */}
                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px'}}>Địa chỉ chi tiết</label>
                                    <input 
                                        placeholder="Số nhà, tên đường, tòa nhà..." 
                                        className="form-control" 
                                        value={addressForm.addressDetail} 
                                        onChange={e => setAddressForm({...addressForm, addressDetail: e.target.value})} 
                                    />
                                </div>

                                {/* --- CHECKBOX MẶC ĐỊNH --- */}
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <input 
                                            type="checkbox" 
                                            checked={addressForm.isDefault} 
                                            onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} 
                                            style={{width: '18px', height: '18px'}}
                                        /> 
                                        Đặt làm địa chỉ mặc định
                                    </label>
                                </div>

                                {/* --- BUTTONS --- */}
                                <div style={{marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'right'}}>
                                    <button className="btn btn-secondary" onClick={() => setShowAddressForm(false)} style={{marginRight: '10px'}}>Trở lại</button>
                                    <button className="btn btn-success" onClick={handleSaveAddress}>Hoàn thành</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB ĐƠN HÀNG (Đã Sửa) --- */}
                {activeTab === 'orders' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>Lịch Sử Đơn Hàng</h2>
                        <div className="order-status-tabs">
                            {ORDER_TABS.map(tab => (
                                <div 
                                    key={tab.id}
                                    className={`status-tab-item ${orderStatusTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setOrderStatusTab(tab.id)}
                                >
                                    {tab.label}
                                    {/* <span style={{marginLeft: '5px', fontSize: '12px', background: '#eee', padding: '2px 6px', borderRadius: '10px'}}>
                                        {orders.filter(o => o.orderStatus === tab.id).length}
                                    </span> */}
                                </div>
                            ))}
                        </div>
                        <div className="order-list-container" style={{ marginTop: '20px' }}>
                            {filteredOrders.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#888', padding: '50px', background: '#f9f9f9', borderRadius: '8px' }}>
                                    <p>Chưa có đơn hàng nào ở trạng thái này.</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <div key={order.orderId} className="order-card">
                                        <div className="order-header">
                                            <div>
                                                <strong>#{order.orderId}</strong>
                                                <span className="order-date">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div>{getStatusBadge(order.orderStatus)}</div>
                                        </div>
                                        <div className="order-items">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="order-item-row">
                                                    <img src={getAvatarSrc(item.productImage)} alt={item.productName}/>
                                                    <div className="item-info">
                                                        <div className="item-name">{item.productName}</div>
                                                        {/* HIỂN THỊ PHÂN LOẠI */}
                                                        {item.variantName && item.variantName !== 'Tiêu chuẩn' && (
                                                            <div style={{fontSize:'12px', color:'#777'}}>Phân loại: {item.variantName}</div>
                                                        )}
                                                        <div className="item-meta">x {item.quantity}</div>
                                                        <div className="item-price">{item.price.toLocaleString()}đ</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="order-footer">
                                            <div className="total-price">
                                                Thành tiền: <span>{order.totalAmount.toLocaleString()}đ</span>
                                            </div>
                                            <div className="order-actions" style={{marginTop: '10px'}}>
                                                {/* NÚT XEM CHI TIẾT (Đã Fix) */}
                                                <button 
                                                    className="btn-detail" 
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowOrderModal(true);
                                                    }}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB ĐỔI MẬT KHẨU --- */}
                {activeTab === 'password' && (
                <div style={{ maxWidth: '600px' }}>
                    <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px'}}>Đổi Mật Khẩu</h2>
                    
                    <div>
                        
                        {/* Mật khẩu hiện tại */}
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Mật khẩu hiện tại (*)</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={passwordForm.currentPassword} 
                                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                                placeholder="Nhập mật khẩu đang sử dụng"
                                style={{ padding: '10px' }}
                            />
                        </div>

                        {/* Mật khẩu mới */}
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Mật khẩu mới (*)</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={passwordForm.newPassword} 
                                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                                placeholder="Nhập mật khẩu mới" 
                                style={{ padding: '10px' }}
                            />
                            <small style={{display: 'block', marginTop: '5px', color: '#666', fontStyle: 'italic'}}>
                                * Tối thiểu 8 ký tự và chứa ít nhất 1 ký tự đặc biệt (!@#$%...)
                            </small>
                        </div>

                        {/* Nhập lại mật khẩu */}
                        <div className="form-group" style={{ marginBottom: '25px' }}>
                            <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Xác nhận mật khẩu mới (*)</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                value={passwordForm.confirmPassword} 
                                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                                placeholder="Nhập lại mật khẩu mới" 
                                style={{ padding: '10px' }}
                            />
                        </div>

                        {/* Nút hành động */}
                        <div style={{ textAlign: 'right', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleChangePassword}
                                style={{ padding: '10px 25px', fontWeight: 'bold' }}
                            >
                                Cập nhật mật khẩu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </div>

            {/* HIỂN THỊ MODAL KHI CLICK */}
            <UserOrderDetailModal 
                isOpen={showOrderModal} 
                onClose={() => setShowOrderModal(false)} 
                order={selectedOrder} 
            />
        </div>
    );
};

export default ProfilePage;