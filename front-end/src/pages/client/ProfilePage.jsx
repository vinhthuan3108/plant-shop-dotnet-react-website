import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css'; 

const ProfilePage = () => {
    // 1. CẤU HÌNH URL BACKEND
    // Lưu ý: Đảm bảo không có khoảng trắng thừa
    const API_BASE_URL = "https://localhost:7298"; 

    const navigate = useNavigate();

    // 2. SỬA LỖI LẤY USER ID
    // Code cũ: const userId = localStorage.getItem('userId'); (Sai vì login mới lưu dạng object)
    // Code mới: Lấy từ object 'user'
    const getUserData = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    };
    
    const currentUser = getUserData();
    const userId = currentUser?.userId;

    // Thêm tab 'password' vào state activeTab
    const [activeTab, setActiveTab] = useState('info'); 

    // --- STATE PROFILE ---
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        avatarUrl: '',
        dateofBirth: '',
        gender: 'Nam'
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
    const [orderStatusTab, setOrderStatusTab] = useState('Completed');
    const ORDER_TABS = [
        { id: 'Pending', label: 'Chờ xác nhận' },
        { id: 'Processing', label: 'Đang đóng gói' },
        { id: 'Shipped', label: 'Đang vận chuyển' },
        { id: 'Completed', label: 'Hoàn thành' },
        { id: 'Cancelled', label: 'Đã hủy' },
    ];

    // --- STATE CHANGE PASSWORD (MỚI) ---
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Location API Data
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // --- LOAD DATA ---
    useEffect(() => {
        // Kiểm tra userId, nếu không có thì đá về trang login
        if (!userId) {
            // Kiểm tra thêm một lần nữa fallback code cũ (nếu lỡ user cũ chưa clear cache)
            const oldUserId = localStorage.getItem('userId');
            if(!oldUserId) {
                alert("Vui lòng đăng nhập để xem hồ sơ!");
                navigate('/login');
                return;
            }
        }
        
        // Nếu có ID thì gọi API
        fetchProfile();
        fetchAddresses();
        fetchOrders();
        fetchLocationProvinces();
    }, [userId]);

    const fetchProfile = async () => {
        // Sử dụng userId từ state hoặc fallback cũ
        const effectiveId = userId || localStorage.getItem('userId');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/Profile/${effectiveId}`);
            let formattedDob = '';
            if (res.data.dateofBirth) {
                formattedDob = res.data.dateofBirth.split('T')[0];
            }
            setProfile({ ...res.data, dateofBirth: formattedDob });
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAddresses = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/Profile/${effectiveId}/addresses`);
            setAddresses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchOrders = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/Orders/user/${effectiveId}`);
            setOrders(res.data);
        } catch (err) {
            console.error("Lỗi lấy đơn hàng:", err);
        }
    };

    const fetchLocationProvinces = async () => {
        try {
            const res = await axios.get('https://provinces.open-api.vn/api/?depth=1');
            setProvinces(res.data);
        } catch (err) {
            console.error("Lỗi lấy tỉnh thành:", err);
        }
    };

    // --- HELPER FUNCTIONS ---
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <span className="badge badge-warning" style={{padding:'5px', background:'#ffc107', borderRadius:'4px'}}>Chờ xác nhận</span>;
            case 'Processing': return <span className="badge badge-info" style={{padding:'5px', background:'#17a2b8', color:'white', borderRadius:'4px'}}>Đang đóng gói</span>;
            case 'Shipped': return <span className="badge badge-primary" style={{padding:'5px', background:'#007bff', color:'white', borderRadius:'4px'}}>Đang vận chuyển</span>;
            case 'Completed': return <span className="badge badge-success" style={{padding:'5px', background:'#28a745', color:'white', borderRadius:'4px'}}>Hoàn thành</span>;
            case 'Cancelled': return <span className="badge badge-danger" style={{padding:'5px', background:'#dc3545', color:'white', borderRadius:'4px'}}>Đã hủy</span>;
            default: return <span className="badge badge-secondary">{status}</span>;
        }
    };

    // 3. SỬA LỖI ẢNH AVATAR (Fix ERR_NAME_NOT_RESOLVED)
    const getAvatarSrc = (url) => {
        // Dùng ảnh từ server khác ổn định hơn thay vì via.placeholder.com
        if (!url) return "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 
        
        if (url.startsWith('http')) return url;
        
        // Đảm bảo đường dẫn đúng
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
            
            // Cập nhật lại thông tin hiển thị trên Header bằng cách update localStorage
            if(currentUser) {
                currentUser.fullName = profile.fullName;
                localStorage.setItem('user', JSON.stringify(currentUser));
                // Reload trang để Header cập nhật tên mới
                window.location.reload(); 
            }
            
        } catch (err) {
            console.error("Lỗi update:", err);
            if (err.response && err.response.data && err.response.data.errors) {
                 const errorMsg = JSON.stringify(err.response.data.errors);
                 alert("Lỗi dữ liệu: " + errorMsg);
            } else {
                alert("Lỗi cập nhật! Vui lòng kiểm tra lại thông tin.");
            }
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
        setAddressForm({ addressId: 0, recipientName: '', phoneNumber: '', addressDetail: '', province: '', district: '', ward: '', isDefault: false });
        setIsEditingAddress(false);
        setShowAddressForm(true);
    };

    const openEditAddress = (addr) => {
        setAddressForm({
            addressId: addr.addressId, recipientName: addr.recipientName, phoneNumber: addr.phoneNumber,
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
        
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        const isValidPassword = (pass) => {
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
            return pass.length >= 8 && hasSpecialChar;
        };

        if (!isValidPassword(passwordForm.newPassword)) {
            alert("Mật khẩu mới phải có tối thiểu 8 ký tự và chứa ít nhất 1 ký tự đặc biệt!");
            return;
        }

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
            if (err.response && err.response.data) {
                alert(typeof err.response.data === 'string' ? err.response.data : "Lỗi đổi mật khẩu");
            } else {
                alert("Lỗi đổi mật khẩu! Vui lòng kiểm tra lại.");
            }
        }
    };

    const filteredOrders = orders.filter(o => o.orderStatus === orderStatusTab);

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
                    <li 
                        style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'info' ? '#e0f2f1' : 'transparent', color: activeTab === 'info' ? '#00796b' : '#333' }}
                        onClick={() => setActiveTab('info')}
                    >
                        Hồ sơ của tôi
                    </li>
                    <li 
                        style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'address' ? '#e0f2f1' : 'transparent', color: activeTab === 'address' ? '#00796b' : '#333' }}
                        onClick={() => setActiveTab('address')}
                    >
                        Sổ địa chỉ
                    </li>
                    <li 
                        style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'orders' ? '#e0f2f1' : 'transparent', color: activeTab === 'orders' ? '#00796b' : '#333' }}
                        onClick={() => setActiveTab('orders')}
                    >
                        Đơn mua
                    </li>
                    <li 
                        style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'password' ? '#e0f2f1' : 'transparent', color: activeTab === 'password' ? '#00796b' : '#333' }}
                        onClick={() => setActiveTab('password')}
                    >
                        Đổi mật khẩu
                    </li>
                </ul>
            </div>

            {/* CONTENT */}
            <div className="profile-content" style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '5px', boxShadow: '0 0 10px rgba(0,0,0,0.05)' }}>
                
                {/* --- TAB HỒ SƠ --- */}
                {activeTab === 'info' && (
                    <div>
                        <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '10px'}}>Hồ Sơ Của Tôi</h2>
                        
                        <div className="form-group" style={{marginTop: '20px'}}>
                            <label>Họ và tên:</label>
                            <input type="text" className="form-control" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} />
                        </div>
                        
                        <div className="form-group">
                            <label>Email:</label>
                            <input type="text" className="form-control" value={profile.email} disabled style={{ background: '#eee', cursor: 'not-allowed' }} />
                        </div>

                        <div className="form-group">
                            <label>Số điện thoại:</label>
                            <input type="text" className="form-control" value={profile.phoneNumber} onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})} />
                        </div>

                        <div className="form-group">
                            <label>Ngày sinh:</label>
                            <input type="date" className="form-control" value={profile.dateofBirth || ''} onChange={(e) => setProfile({...profile, dateofBirth: e.target.value})} />
                        </div>

                        <div className="form-group">
                            <label>Giới tính:</label>
                            <div style={{display: 'flex', gap: '20px'}}>
                                <label><input type="radio" name="gender" value="Nam" checked={profile.gender === 'Nam'} onChange={() => setProfile({...profile, gender: 'Nam'})} /> Nam</label>
                                <label><input type="radio" name="gender" value="Nữ" checked={profile.gender === 'Nữ'} onChange={() => setProfile({...profile, gender: 'Nữ'})} /> Nữ</label>
                                <label><input type="radio" name="gender" value="Khác" checked={profile.gender === 'Khác'} onChange={() => setProfile({...profile, gender: 'Khác'})} /> Khác</label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Thay đổi Avatar:</label>
                            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px'}}>
                                <img 
                                    src={getAvatarSrc(profile.avatarUrl)} 
                                    style={{width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover'}}
                                    alt="Preview"
                                />
                                <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                            </div>
                        </div>

                        <button className="btn btn-success" onClick={handleUpdateProfile} style={{marginTop: '20px'}}>Lưu Thay Đổi</button>
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
                            <div className="address-form" style={{ marginTop: '20px' }}>
                                <div className="form-group">
                                    <input placeholder="Họ và tên" className="form-control" value={addressForm.recipientName} onChange={e => setAddressForm({...addressForm, recipientName: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <input placeholder="Số điện thoại" className="form-control" value={addressForm.phoneNumber} onChange={e => setAddressForm({...addressForm, phoneNumber: e.target.value})} />
                                </div>
                                
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <select className="form-control" onChange={handleProvinceChange}>
                                        <option value="">{addressForm.province || "Chọn Tỉnh/Thành"}</option>
                                        {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                    </select>
                                    <select className="form-control" onChange={handleDistrictChange}>
                                        <option value="">{addressForm.district || "Chọn Quận/Huyện"}</option>
                                        {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                    </select>
                                    <select className="form-control" onChange={handleWardChange}>
                                        <option value="">{addressForm.ward || "Chọn Phường/Xã"}</option>
                                        {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <input placeholder="Địa chỉ cụ thể" className="form-control" value={addressForm.addressDetail} onChange={e => setAddressForm({...addressForm, addressDetail: e.target.value})} />
                                </div>

                                <div className="form-group">
                                    <label>
                                        <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} /> Đặt làm mặc định
                                    </label>
                                </div>

                                <div style={{marginTop: '20px'}}>
                                    <button className="btn btn-success" onClick={handleSaveAddress} style={{marginRight: '10px'}}>Hoàn thành</button>
                                    <button className="btn btn-secondary" onClick={() => setShowAddressForm(false)}>Trở lại</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB ĐƠN HÀNG --- */}
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
                                    <span style={{marginLeft: '5px', fontSize: '12px', background: '#eee', padding: '2px 6px', borderRadius: '10px'}}>
                                        {orders.filter(o => o.orderStatus === tab.id).length}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="order-list-container" style={{ marginTop: '20px' }}>
                            {filteredOrders.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#888', padding: '50px', background: '#f9f9f9', borderRadius: '8px' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/4076/4076432.png" alt="Empty" style={{width: '60px', opacity: 0.5, marginBottom: '10px'}}/>
                                    <p>Chưa có đơn hàng nào ở trạng thái này.</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <div key={order.orderId} className="order-card">
                                        <div className="order-header">
                                            <div>
                                                <strong>#{order.orderId}</strong>
                                                <span className="order-date">
                                                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <div>{getStatusBadge(order.orderStatus)}</div>
                                        </div>
                                        <div className="order-items">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="order-item-row">
                                                    <img src={getAvatarSrc(item.productImage)} alt={item.productName}/>
                                                    <div className="item-info">
                                                        <div className="item-name">{item.productName}</div>
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
                                                <button className="btn-detail">Xem chi tiết</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB ĐỔI MẬT KHẨU (MỚI) --- */}
                {activeTab === 'password' && (
                    <div>
                        <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '10px'}}>Đổi Mật Khẩu</h2>
                        
                        <div style={{ maxWidth: '500px', marginTop: '20px' }}>
                            <div className="form-group">
                                <label>Mật khẩu hiện tại (*)</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={passwordForm.currentPassword} 
                                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                    placeholder="Nhập mật khẩu đang dùng"
                                />
                            </div>

                            <div className="form-group">
                                <label>Mật khẩu mới (*)</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={passwordForm.newPassword} 
                                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                    placeholder="Tối thiểu 8 ký tự, có ký tự đặc biệt"
                                />
                            </div>

                            <div className="form-group">
                                <label>Nhập lại mật khẩu mới (*)</label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={passwordForm.confirmPassword} 
                                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                    placeholder="Xác nhận mật khẩu mới"
                                />
                            </div>

                            <button className="btn btn-primary" onClick={handleChangePassword} style={{marginTop: '20px'}}>
                                Xác nhận đổi mật khẩu
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProfilePage;