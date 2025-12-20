import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css'; // Nhớ tạo file CSS hoặc comment lại nếu chưa có

const ProfilePage = () => {
    // --- CẤU HÌNH ĐƯỜNG DẪN GỐC API (Sửa port tại đây) ---
    const API_BASE_URL = "https://localhost:7298"; 
    // -----------------------------------------------------

    const navigate = useNavigate();
    const userId = localStorage.getItem('userId'); 
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
    const [orders, setOrders] = useState([]);
    const [orderStatusTab, setOrderStatusTab] = useState('Completed');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false); 
    const ORDER_TABS = [
        { id: 'Pending', label: 'Chờ xác nhận' },
        { id: 'Processing', label: 'Đang đóng gói' },
        { id: 'Shipped', label: 'Đang vận chuyển' },
        { id: 'Completed', label: 'Hoàn thành' },
        { id: 'Cancelled', label: 'Đã hủy' },
    ];
    // Form data cho địa chỉ
    const [addressForm, setAddressForm] = useState({
        addressId: 0,
        recipientName: '',
        phoneNumber: '',
        addressDetail: '',
        province: '',
        district: '',
        ward: '',
        isDefault: false
    });

    // Location API Data
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // --- 1. LOAD DATA ---
    useEffect(() => {
        if (!userId) {
            alert("Vui lòng đăng nhập!");
            navigate('/login');
            return;
        }
        fetchProfile();
        fetchAddresses();
        fetchOrders();
        fetchLocationProvinces();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/Profile/${userId}`);
            // Format ngày sinh (YYYY-MM-DD) để hiển thị đúng trong input type="date"
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
        try {
            const res = await axios.get(`${API_BASE_URL}/api/Profile/${userId}/addresses`);
            setAddresses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // --- 2. LOCATION API HANDLERS (API Việt Nam) ---
    const fetchLocationProvinces = async () => {
        const res = await axios.get('https://provinces.open-api.vn/api/?depth=1');
        setProvinces(res.data);
    };
    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/Orders/user/${userId}`);
            setOrders(res.data);
        } catch (err) {
            console.error("Lỗi lấy đơn hàng:", err);
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <span className="badge badge-warning">Chờ xác nhận</span>;
            case 'Processing': return <span className="badge badge-info">Đang đóng gói</span>;
            case 'Shipped': return <span className="badge badge-primary">Đang vận chuyển</span>;
            case 'Delivered': return <span className="badge badge-success">Giao thành công</span>;
            case 'Cancelled': return <span className="badge badge-danger">Đã hủy</span>;
            default: return <span className="badge badge-secondary">{status}</span>;
        }
    };
    const handleProvinceChange = async (e) => {
        const provinceName = e.target.options[e.target.selectedIndex].text;
        const code = e.target.value;
        
        setAddressForm({...addressForm, province: provinceName, district: '', ward: ''});
        setDistricts([]); setWards([]);

        const res = await axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
        setDistricts(res.data.districts);
    };

    const handleDistrictChange = async (e) => {
        const districtName = e.target.options[e.target.selectedIndex].text;
        const code = e.target.value;

        setAddressForm({...addressForm, district: districtName, ward: ''});
        
        const res = await axios.get(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
        setWards(res.data.wards);
    };

    const handleWardChange = (e) => {
        const wardName = e.target.options[e.target.selectedIndex].text;
        setAddressForm({...addressForm, ward: wardName});
    };

    // --- 3. PROFILE ACTIONS ---
    const handleUpdateProfile = async () => {
        try {
            await axios.put(`${API_BASE_URL}/api/Profile/${userId}`, profile);
            alert("Cập nhật hồ sơ thành công!");
        } catch (err) {
            alert("Lỗi cập nhật!");
            console.error(err);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Gọi API Upload vào folder "users"
            const res = await axios.post(`${API_BASE_URL}/api/Upload/users`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Backend trả về đường dẫn (vd: /users/abc.jpg)
            // Cập nhật vào state profile ngay để hiện Preview
            setProfile({ ...profile, avatarUrl: res.data.url }); 
        } catch (err) {
            console.error("Lỗi upload ảnh:", err);
            alert("Có lỗi khi tải ảnh lên server");
        }
    };

    // --- HÀM HỖ TRỢ HIỂN THỊ ẢNH ---
    // Giúp nối domain backend vào đường dẫn tương đối
    const getAvatarSrc = (url) => {
        if (!url) return "https://via.placeholder.com/150";
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url}`;
    };

    // --- 4. ADDRESS ACTIONS ---
    const openAddAddress = () => {
        setAddressForm({
            addressId: 0, recipientName: '', phoneNumber: '', addressDetail: '',
            province: '', district: '', ward: '', isDefault: false
        });
        setIsEditingAddress(false);
        setShowAddressForm(true);
    };

    const openEditAddress = (addr) => {
        setAddressForm({
            addressId: addr.addressId,
            recipientName: addr.recipientName,
            phoneNumber: addr.phoneNumber,
            addressDetail: addr.addressDetail,
            province: addr.province,
            district: addr.district,
            ward: addr.ward,
            isDefault: addr.isDefault
        });
        setIsEditingAddress(true);
        setShowAddressForm(true);
    };

    const handleSaveAddress = async () => {
        if (!addressForm.recipientName || !addressForm.addressDetail || !addressForm.province) {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        try {
            if (isEditingAddress) {
                // UPDATE
                await axios.put(`${API_BASE_URL}/api/Profile/addresses/${addressForm.addressId}`, addressForm);
            } else {
                // ADD NEW
                await axios.post(`${API_BASE_URL}/api/Profile/${userId}/addresses`, addressForm);
            }
            alert("Thao tác thành công!");
            setShowAddressForm(false);
            fetchAddresses();
        } catch (err) {
            alert("Có lỗi xảy ra");
            console.error(err);
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
    const filteredOrders = orders.filter(o => o.orderStatus === orderStatusTab);
    return (
        <div className="container" style={{ marginTop: '30px', display: 'flex', gap: '20px' }}>
            
            {/* SIDEBAR */}
            <div className="profile-sidebar" style={{ width: '250px', background: '#f9f9f9', padding: '15px' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    {/* Sử dụng hàm getAvatarSrc để hiển thị ảnh đúng */}
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
                        className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Đơn mua
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
                                                {addr.addressDetail}
                                                <br/>
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
                            // FORM THÊM/SỬA
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
                {activeTab === 'orders' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>Lịch Sử Đơn Hàng</h2>
                        
                        {/* 1. THANH TAB TRẠNG THÁI */}
                        <div className="order-status-tabs">
                            {ORDER_TABS.map(tab => (
                                <div 
                                    key={tab.id}
                                    className={`status-tab-item ${orderStatusTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setOrderStatusTab(tab.id)}
                                >
                                    {tab.label}
                                    {/* (Tùy chọn) Hiển thị số lượng đơn bên cạnh */}
                                    <span style={{marginLeft: '5px', fontSize: '12px', background: '#eee', padding: '2px 6px', borderRadius: '10px'}}>
                                        {orders.filter(o => o.orderStatus === tab.id).length}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* 2. DANH SÁCH ĐƠN HÀNG ĐÃ LỌC */}
                        <div className="order-list-container" style={{ marginTop: '20px' }}>
                            {filteredOrders.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#888', padding: '50px', background: '#f9f9f9', borderRadius: '8px' }}>
                                    <img src="https://cdn-icons-png.flaticon.com/512/4076/4076432.png" alt="Empty" style={{width: '60px', opacity: 0.5, marginBottom: '10px'}}/>
                                    <p>Chưa có đơn hàng nào ở trạng thái này.</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <div key={order.orderId} className="order-card">
                                        {/* Header đơn hàng */}
                                        <div className="order-header">
                                            <div>
                                                <strong>#{order.orderId}</strong>
                                                <span className="order-date">
                                                    {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <div>
                                                {/* Gọi lại hàm getStatusBadge cũ của bạn */}
                                                {getStatusBadge(order.orderStatus)}
                                            </div>
                                        </div>

                                        {/* List sản phẩm */}
                                        <div className="order-items">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="order-item-row">
                                                    <img 
                                                        src={getAvatarSrc(item.productImage)} 
                                                        alt={item.productName}
                                                    />
                                                    <div className="item-info">
                                                        <div className="item-name">{item.productName}</div>
                                                        <div className="item-meta">x {item.quantity}</div>
                                                        <div className="item-price">{item.price.toLocaleString()}đ</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer: Tổng tiền & Nút thao tác */}
                                        <div className="order-footer">
                                            <div className="total-price">
                                                Thành tiền: <span>{order.totalAmount.toLocaleString()}đ</span>
                                            </div>
                                            
                                            {/* Nút hành động tùy theo Tab */}
                                            <div className="order-actions" style={{marginTop: '10px'}}>
                                                {orderStatusTab === 'Pending' && (
                                                    <button className="btn-cancel" onClick={() => alert("Tính năng hủy đang phát triển")}>Hủy đơn</button>
                                                )}
                                                {orderStatusTab === 'Delivered' && (
                                                    <button className="btn-buy-again">Mua lại</button>
                                                )}
                                                <button className="btn-detail">Xem chi tiết</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;