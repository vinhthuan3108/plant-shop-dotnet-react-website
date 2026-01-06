// [THÊM] import useContext
import React, { useState, useEffect, useContext } from 'react'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import { API_BASE } from '../../utils/apiConfig.jsx';
import Swal from 'sweetalert2';

// [THÊM] Import CartContext
import { CartContext } from '../../context/CartContext';
// --- KHAI BÁO MAPPING TRẠNG THÁI ---
    // Giúp map id của Tab (Tiếng Anh) sang các text lưu trong Database (Có thể là Việt hoặc Anh)
    const STATUS_MAPPING = {
        'Pending': ['Chờ xác nhận', 'Pending'],
        'Processing': ['Đang đóng gói', 'Processing', 'Confirmed'],
        'Shipped': ['Đang vận chuyển', 'Shipping', 'Shipped'],
        'Completed': ['Hoàn thành', 'Completed', 'Success'],
        'Cancelled': ['Đã hủy', 'Cancelled']
    };
// --- COMPONENT MODAL CHI TIẾT ĐƠN HÀNG (DÀNH CHO USER) ---
const UserOrderDetailModal = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    };
    // Style modal đã được chuyển class 'modal-content-responsive' ở dưới để responsive
    const modalStyle = {
        backgroundColor: 'white', padding: '25px', borderRadius: '8px',
        width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)', position: 'relative'
    };
    return (
        <div style={overlayStyle} onClick={onClose}>
            <div className="modal-content-responsive" style={modalStyle} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{position: 'absolute', top: '10px', right: '15px', border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#666'}}>✕</button>
                
                <h3 style={{color: '#2e7d32', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px', paddingRight: '30px'}}>
                    Chi tiết đơn #{order.orderId}
                </h3>

                {/* Grid này sẽ thành 1 cột trên mobile nhờ class modal-grid-responsive */}
                <div className="modal-grid-responsive" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '14px'}}>
                    <div>
                        <strong style={{display:'block', marginBottom:'5px', color:'#555'}}>Địa chỉ nhận hàng</strong>
                        <div style={{fontWeight:'bold'}}>{order.recipientName}</div>
                        <div style={{color: '#666', fontSize:'13px'}}>{order.recipientPhone}</div>
                        <div style={{color: '#666', fontSize:'13px', lineHeight: '1.4'}}>{order.shippingAddress}</div>
                    </div>
                    <div>
                        <strong style={{display:'block', marginBottom:'5px', color:'#555'}}>Thông tin đơn</strong>
                        <div>Ngày đặt: {new Date(order.orderDate).toLocaleDateString('vi-VN')}</div>
                        <div>Trạng thái: <span style={{fontWeight:'bold'}}>{order.orderStatus}</span></div>
                        <div>Thanh toán: {order.paymentStatus === 'Paid' ?
                            <span style={{color:'green', fontWeight:'bold'}}>Đã thanh toán</span> : <span style={{color:'orange', fontWeight:'bold'}}>Chưa thanh toán</span>}</div>
                    </div>
                </div>

                <div style={{marginBottom: '20px'}}>
                    <strong style={{display:'block', marginBottom:'10px', color:'#555'}}>Sản phẩm</strong>
                    <div style={{border: '1px solid #eee', borderRadius: '4px'}}>
                        {order.items.map((item, idx) => (
                            <div key={idx} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom: idx !== order.items.length-1 ? '1px solid #eee' : 'none', alignItems:'center'}}>
                                <div>
                                    <div style={{fontWeight:'500'}}>{item.productName}</div>
                                    {item.variantName && item.variantName !== 'Tiêu chuẩn' && (
                                        <div style={{fontSize: '12px', color: '#888'}}>Phân loại: {item.variantName}</div>
                                    )}
                                    <div style={{fontSize: '12px', color: '#888'}}>x{item.quantity}</div>
                                </div>
                                <div style={{fontWeight:'bold', color: '#2e7d32'}}>{(item.price * item.quantity).toLocaleString()}đ</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{textAlign: 'right', fontSize: '14px', background:'#f9f9f9', padding:'10px', borderRadius:'4px'}}>
                    <div style={{marginBottom:'5px', display:'flex', justify:'space-between'}}><span>Tạm tính:</span> <span>{(order.subTotal || 0).toLocaleString()}đ</span></div>
                    <div style={{marginBottom:'5px', display:'flex', justify:'space-between'}}><span>Phí vận chuyển:</span> <span>{(order.shippingFee || 0).toLocaleString()}đ</span></div>
                    {order.discountAmount > 0 && <div style={{marginBottom:'5px', color:'green', display:'flex', justify:'space-between'}}><span>Giảm giá:</span> <span>-{(order.discountAmount).toLocaleString()}đ</span></div>}
                    <div style={{fontSize: '18px', fontWeight: 'bold', color: '#d32f2f', marginTop:'10px', borderTop:'1px solid #ddd', paddingTop:'10px', display:'flex', justify:'space-between'}}>
                        <span>Tổng cộng:</span>
                        <span>{(order.totalAmount || 0).toLocaleString()}đ</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProfilePage = () => {
    //const API_BASE_URL = "https://localhost:7298";
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const getUserData = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { return JSON.parse(userStr);
            } catch (e) { return null; }
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
    const [orderStatusTab, setOrderStatusTab] = useState('Pending');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const ORDER_TABS = [
        { id: 'Pending', label: 'Chờ xác nhận' },
        { id: 'Processing', label: 'Đang đóng gói' },
        { id: 'Shipped', label: 'Đang vận chuyển' }, 
        { id: 'Completed', label: 'Hoàn thành' },
        { id: 'Cancelled', label: 'Đã hủy' },
    ];
    // --- STATE CHANGE PASSWORD ---
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    const isValidPassword = (password) => {
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        return password.length >= 8 && hasSpecialChar;
    };

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // --- LOAD DATA ---
    useEffect(() => {
        if (!userId) {
            const oldUserId = localStorage.getItem('userId');
            if(!oldUserId) {
                // Thay alert bằng Swal
                Swal.fire({
                    icon: 'warning',
                    title: 'Chưa đăng nhập',
                    text: 'Vui lòng đăng nhập để xem hồ sơ!'
                }).then(() => {
                    navigate('/login');
                });
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
            const res = await axios.get(`${API_BASE}/api/Profile/${effectiveId}`);
            let formattedDob = '';
            if (res.data.dateofBirth) { formattedDob = res.data.dateofBirth.split('T')[0]; }
            setProfile({ ...res.data, dateofBirth: formattedDob });
        } catch (err) { console.error(err); }
    };
    const fetchAddresses = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        try {
            const res = await axios.get(`${API_BASE}/api/Profile/${effectiveId}/addresses`);
            setAddresses(res.data);
        } catch (err) { console.error(err); }
    };
    const fetchOrders = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        try {
            const res = await axios.get(`${API_BASE}/api/Orders/user/${effectiveId}`);
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
        // Chuẩn hóa về chữ thường để so sánh cho dễ
        const s = status ? status.toLowerCase() : ''; 

        if (s === 'pending' || s === 'chờ xác nhận') return <span className="badge badge-warning">Chờ xác nhận</span>;
        if (s === 'processing' || s === 'đang đóng gói') return <span className="badge badge-info">Đang đóng gói</span>;
        if (s === 'shipping' || s === 'shipped' || s === 'đang vận chuyển') return <span className="badge badge-primary">Đang vận chuyển</span>;
        if (s === 'completed' || s === 'hoàn thành') return <span className="badge badge-success">Hoàn thành</span>;
        if (s === 'cancelled' || s === 'đã hủy') return <span className="badge badge-danger">Đã hủy</span>;
        
        return <span className="badge badge-secondary">{status}</span>;
    };

    const getAvatarSrc = (url) => {
        if (!url) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        if (url.startsWith('http')) return url;
        return `${API_BASE}${url}`;
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
            await axios.put(`${API_BASE}/api/Profile/${effectiveId}`, payload);
            
            // Thay alert thành công
            await Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: 'Cập nhật hồ sơ thành công!',
                timer: 700,
                showConfirmButton: false
            });

            if(currentUser) {
                currentUser.fullName = profile.fullName;
                localStorage.setItem('user', JSON.stringify(currentUser));
                window.location.reload();
            }
        } catch (err) {
            console.error("Lỗi update:", err);
            // Thay alert lỗi
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Lỗi cập nhật! Vui lòng kiểm tra lại thông tin.'
            });
        }
    };
    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await axios.post(`${API_BASE}/api/Upload/users`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile({ ...profile, avatarUrl: res.data.url }); 
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Có lỗi khi tải ảnh lên server'
            });
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
            Swal.fire({
                icon: 'warning',
                title: 'Thiếu thông tin',
                text: 'Vui lòng điền đầy đủ thông tin!'
            });
            return;
        }
        try {
            if (isEditingAddress) {
                await axios.put(`${API_BASE}/api/Profile/addresses/${addressForm.addressId}`, addressForm);
            } else {
                await axios.post(`${API_BASE}/api/Profile/${effectiveId}/addresses`, addressForm);
            }
            
            await Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: 'Lưu địa chỉ thành công!',
                timer: 700,
                showConfirmButton: false
            });

            setShowAddressForm(false);
            fetchAddresses();
        } catch (err) { 
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Có lỗi xảy ra khi lưu địa chỉ'
            });
        }
    };
    const handleDeleteAddress = async (id, isDefault) => {
        if (isDefault) { 
            Swal.fire({
                icon: 'warning',
                title: 'Không thể xóa',
                text: 'Không thể xóa địa chỉ mặc định!'
            });
            return; 
        }

        // Thay window.confirm bằng Swal
        const result = await Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?',
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_BASE}/api/Profile/addresses/${id}`);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Đã xóa!',
                    text: 'Địa chỉ đã được xóa thành công.',
                    timer: 1000,
                    showConfirmButton: false
                });

                fetchAddresses();
            } catch (err) { 
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Lỗi xóa địa chỉ'
                });
            }
        }
    };
    // --- XỬ LÝ: HỦY ĐƠN HÀNG ---
    const handleCancelOrder = async (orderId) => {
        // Hỏi lại cho chắc
        const result = await Swal.fire({
            title: 'Hủy đơn hàng?',
            text: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Đồng ý hủy',
            cancelButtonText: 'Không'
        });

        if (result.isConfirmed) {
            try {
                // Gọi API Hủy (đã có trong controller của bạn)
                await axios.put(`${API_BASE}/api/Orders/cancel-order/${orderId}`);
                
                await Swal.fire('Đã hủy!', 'Đơn hàng đã được hủy thành công.', 'success');
                
                // Tải lại danh sách đơn hàng
                fetchOrders(); 
            } catch (err) {
                Swal.fire('Lỗi!', err.response?.data || 'Không thể hủy đơn hàng.', 'error');
            }
        }
    };

    // --- XỬ LÝ: MUA LẠI ---
    // [TRONG ProfilePage.jsx]

    const handleBuyAgain = async (order) => {
        // 1. Hiện Loading
        Swal.fire({
            title: 'Đang xử lý...',
            text: 'Đang thêm sản phẩm vào giỏ hàng',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        let countSuccess = 0;

        // 2. Duyệt qua từng sản phẩm và thêm vào giỏ (chạy tuần tự để tránh lỗi DB)
        for (const item of order.items) {
            const productToAdd = {
                variantId: item.variantId, // Cần Bước 1 backend mới có cái này
                productName: item.productName,
                price: item.price,
                imageUrl: item.productImage,
                quantity: item.quantity
            };

            // Gọi addToCart với tham số false để KHÔNG hiện popup lẻ tẻ
            const result = await addToCart(productToAdd, false);
            if (result) countSuccess++;
        }

        // 3. Xử lý sau khi chạy xong
        if (countSuccess > 0) {
            await Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: `Đã thêm ${countSuccess} sản phẩm vào giỏ hàng!`,
                timer: 1500,
                showConfirmButton: false
            });
            navigate('/checkout');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Thất bại',
                text: 'Không thể thêm sản phẩm nào vào giỏ hàng. Có thể sản phẩm đã ngừng kinh doanh.'
            });
        }
    };
    const handleChangePassword = async () => {
        const effectiveId = userId || localStorage.getItem('userId');
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            Swal.fire({
                icon: 'warning',
                title: 'Thiếu thông tin',
                text: 'Vui lòng nhập đầy đủ thông tin!'
            });
            return;
        }
        if (!isValidPassword(passwordForm.newPassword)) {
            Swal.fire({
                icon: 'warning',
                title: 'Mật khẩu yếu',
                text: 'Mật khẩu mới phải có tối thiểu 8 ký tự và chứa ít nhất 1 ký tự đặc biệt!'
            });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            Swal.fire({
                icon: 'error',
                title: 'Không khớp',
                text: 'Mật khẩu xác nhận không khớp!'
            });
            return;
        }
        try {
            const payload = {
                userId: parseInt(effectiveId),
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            };
            await axios.post(`${API_BASE}/api/Auth/change-password`, payload);
            
            await Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: 'Đổi mật khẩu thành công!',
                timer: 700,
                showConfirmButton: false
            });

            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Lỗi đổi mật khẩu! Vui lòng kiểm tra lại mật khẩu hiện tại.'
            });
        }
    };

    const filteredOrders = orders.filter(o => {
        // Lấy danh sách các từ khóa cho Tab hiện tại
        const validStatuses = STATUS_MAPPING[orderStatusTab] || [];
        return validStatuses.includes(o.orderStatus);
    });
    // Hàm đếm số đơn theo từng tab
    const getOrderCount = (tabId) => {
        const validStatuses = STATUS_MAPPING[tabId] || [];
        return orders.filter(o => validStatuses.includes(o.orderStatus)).length;
    };
    return (
        // Sử dụng class 'profile-container' thay vì style inline để responsive
        <div className="container profile-container">
            
            {/* SIDEBAR */}
            <div className="profile-sidebar">
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                     <img 
                        src={getAvatarSrc(profile.avatarUrl)} 
                        alt="Avatar" 
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }} 
                     />
                    <div style={{ fontWeight: 'bold', marginTop: '10px' }}>{profile.fullName}</div>
                </div>
                {/* Menu Item dùng class để có hover và responsive ngang trên mobile */}
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li className={`menu-item ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Hồ sơ của tôi</li>
                    <li className={`menu-item ${activeTab === 'address' ? 'active' : ''}`} onClick={() => setActiveTab('address')}>Sổ địa chỉ</li>
                    <li className={`menu-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Đơn mua</li>
                    <li className={`menu-item ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>Đổi mật khẩu</li>
                </ul>
            </div>

            {/* CONTENT */}
            <div className="profile-content">
                
                {/* --- TAB HỒ SƠ --- */}
                {activeTab === 'info' && (
                    <div>
                        <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px'}}>Hồ Sơ Của Tôi</h2>

                        {/* HÀNG 1: HỌ TÊN & EMAIL (Dùng class responsive) */}
                        <div className="form-row-responsive">
                            <div className="form-col">
                                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Họ và tên:</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={profile.fullName} 
                                    onChange={(e) => setProfile({...profile, fullName: e.target.value})} 
                                />
                            </div>
                            <div className="form-col">
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
                        <div className="form-row-responsive">
                            <div className="form-col">
                                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Số điện thoại:</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={profile.phoneNumber} 
                                    onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})} 
                                />
                            </div>
                            <div className="form-col">
                                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Ngày sinh:</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={profile.dateofBirth || ''} 
                                    onChange={(e) => setProfile({...profile, dateofBirth: e.target.value})} 
                                />
                            </div>
                        </div>

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
                            <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px', border: '1px dashed #ccc', padding: '15px', borderRadius: '8px', flexWrap: 'wrap'}}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', alignItems: 'center' }}>
                            <h2 style={{margin: 0}}>Địa Chỉ</h2>
                            {!showAddressForm && <button className="btn btn-primary" onClick={openAddAddress} style={{fontSize: '13px'}}>+ Thêm mới</button>}
                        </div>

                        {!showAddressForm ? (
                            <div className="address-list" style={{ marginTop: '20px' }}>
                                {addresses.map(addr => (
                                    <div key={addr.addressId} style={{ borderBottom: '1px solid #eee', padding: '15px 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                        <div style={{flex: 1, minWidth: '200px'}}>
                                            <strong>{addr.recipientName}</strong> <span style={{color: '#888'}}>| {addr.phoneNumber}</span>
                                            <div style={{fontSize: '14px', color: '#555', marginTop: '5px'}}>
                                                {addr.addressDetail}<br/>
                                                {addr.ward}, {addr.district}, {addr.province}
                                            </div>
                                            {addr.isDefault && <span style={{ border: '1px solid red', color: 'red', fontSize: '12px', padding: '2px 5px', marginTop: '5px', display: 'inline-block' }}>Mặc định</span>}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end', justifyContent: 'center' }}>
                                            <button className="btn-link" onClick={() => openEditAddress(addr)} style={{color: 'blue', border: 'none', background: 'none', cursor: 'pointer'}}>Cập nhật</button>
                                            {!addr.isDefault && (
                                                <button className="btn-link" onClick={() => handleDeleteAddress(addr.addressId, addr.isDefault)} style={{color: 'red', border: 'none', background: 'none', cursor: 'pointer'}}>Xóa</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="address-form" style={{ marginTop: '20px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                                <h4 style={{marginBottom: '20px', color: '#00796b', borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
                                    {isEditingAddress ? "Cập Nhật Địa Chỉ" : "Thêm Địa Chỉ Mới"}
                                </h4>

                                <div className="form-row-responsive">
                                    <div className="form-col">
                                        <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px'}}>Họ và tên</label>
                                        <input placeholder="Tên người nhận" className="form-control" value={addressForm.recipientName} onChange={e => setAddressForm({...addressForm, recipientName: e.target.value})} />
                                    </div>
                                    <div className="form-col">
                                        <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px'}}>Số điện thoại</label>
                                        <input placeholder="SĐT liên lạc" className="form-control" value={addressForm.phoneNumber} onChange={e => setAddressForm({...addressForm, phoneNumber: e.target.value})} />
                                    </div>
                                </div>

                                {/* Khu vực: Trên mobile sẽ tự xếp dọc */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px'}}>Khu vực</label>
                                    <div className="form-row-responsive" style={{gap: '10px'}}>
                                        <select className="form-control form-col" onChange={handleProvinceChange}>
                                            <option value="">{addressForm.province || "Tỉnh/Thành"}</option>
                                            {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                        </select>
                                        <select className="form-control form-col" onChange={handleDistrictChange}>
                                            <option value="">{addressForm.district || "Quận/Huyện"}</option>
                                            {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                        </select>
                                        <select className="form-control form-col" onChange={handleWardChange}>
                                            <option value="">{addressForm.ward || "Phường/Xã"}</option>
                                            {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '15px' }}>
                                    <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block', fontSize: '14px'}}>Địa chỉ chi tiết</label>
                                    <input placeholder="Số nhà, tên đường..." className="form-control" value={addressForm.addressDetail} onChange={e => setAddressForm({...addressForm, addressDetail: e.target.value})} />
                                </div>

                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} style={{width: '18px', height: '18px'}}/> 
                                        Đặt làm địa chỉ mặc định
                                    </label>
                                </div>

                                <div style={{marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'right'}}>
                                    <button className="btn btn-secondary" onClick={() => setShowAddressForm(false)} style={{marginRight: '10px'}}>Trở lại</button>
                                    <button className="btn btn-success" onClick={handleSaveAddress}>Hoàn thành</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB ĐƠN HÀNG (Đã Responsive hóa) --- */}
                {activeTab === 'orders' && (
                    <div>
                        <h2 style={{ marginBottom: '20px' }}>Lịch Sử Đơn Hàng</h2>
                        <div className="order-status-tabs">
                            {ORDER_TABS.map(tab => {
                                const count = getOrderCount(tab.id); // Lấy số lượng
                                return (
                                    <div 
                                        key={tab.id} 
                                        className={`status-tab-item ${orderStatusTab === tab.id ? 'active' : ''}`} 
                                        onClick={() => setOrderStatusTab(tab.id)}
                                        style={{ position: 'relative' }} // Để căn chỉnh nếu cần
                                    >
                                        {tab.label}
                                        {/* Chỉ hiện số nếu > 0 */}
                                        {count > 0 && (
                                            <span style={{
                                                marginLeft: '5px',
                                                backgroundColor: '#d32f2f', // Màu đỏ nổi bật
                                                color: 'white',
                                                borderRadius: '50%',
                                                padding: '2px 6px',
                                                fontSize: '11px',
                                                verticalAlign: 'middle'
                                            }}>
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="order-list-container" style={{ marginTop: '20px' }}>
                            {filteredOrders.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#888', padding: '50px', background: '#f9f9f9', borderRadius: '8px' }}>
                                    <p>Chưa có đơn hàng nào.</p>
                                </div>
                            ) : (
                                filteredOrders.map(order => (
                                    <div key={order.orderId} className="order-card">
                                        <div className="order-header">
                                            {/* Header responsive tự ngắt dòng */}
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
                                                        {item.variantName && item.variantName !== 'Tiêu chuẩn' && (
                                                            <div style={{fontSize:'12px', color:'#777'}}>Phân loại: {item.variantName}</div>
                                                        )}
                                                        <div className="item-meta">x {item.quantity}</div>
                                                        <div className="item-price">{item.price.toLocaleString()}đ</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* ... đoạn render items cũ ... */}

                                        <div className="order-footer">
                                            <div className="total-price">
                                                Thành tiền: <span>{order.totalAmount.toLocaleString()}đ</span>
                                            </div>
                                            
                                            {/* [SỬA] Khu vực nút bấm hành động */}
                                            <div className="order-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                
                                                {/* Nút Xem chi tiết (Cũ) */}
                                                <button className="btn-detail" onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}>
                                                    Xem chi tiết
                                                </button>

                                                {/* [THÊM] Nút Hủy đơn - Chỉ hiện khi Pending */}
                                                {(order.orderStatus === 'Pending' || order.orderStatus === 'Chờ xác nhận') && (
                                                    <button 
                                                        className="btn btn-danger" 
                                                        style={{ padding: '5px 15px', borderRadius: '4px', fontSize: '14px' }}
                                                        onClick={() => handleCancelOrder(order.orderId)}
                                                    >
                                                        Hủy đơn
                                                    </button>
                                                )}

                                                {/* [THÊM] Nút Mua lại - Chỉ hiện khi Completed */}
                                                {(order.orderStatus === 'Completed' || order.orderStatus === 'Hoàn thành') && (
                                                    <button 
                                                        className="btn btn-primary" 
                                                        style={{ padding: '5px 15px', borderRadius: '4px', fontSize: '14px', backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}
                                                        onClick={() => handleBuyAgain(order)}
                                                    >
                                                        Mua lại
                                                    </button>
                                                )}

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
                    <div className="password-form-container">
                        <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px'}}>
                            Đổi Mật Khẩu
                        </h2>
                        
                        <div>
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>
                                    Mật khẩu hiện tại (*)
                                </label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={passwordForm.currentPassword} 
                                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} 
                                    placeholder="Nhập mật khẩu cũ" 
                                    style={{ padding: '10px' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>
                                    Mật khẩu mới (*)
                                </label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={passwordForm.newPassword} 
                                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} 
                                    placeholder="Nhập mật khẩu mới" 
                                    style={{ padding: '10px' }}
                                />
                                <small style={{display: 'block', marginTop: '5px', color: '#666', fontStyle: 'italic'}}>
                                    * Tối thiểu 8 ký tự và chứa ít nhất 1 ký tự đặc biệt
                                </small>
                            </div>

                            <div className="form-group" style={{ marginBottom: '25px' }}>
                                <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>
                                    Xác nhận mật khẩu (*)
                                </label>
                                <input 
                                    type="password" 
                                    className="form-control" 
                                    value={passwordForm.confirmPassword} 
                                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} 
                                    placeholder="Nhập lại mật khẩu mới" 
                                    style={{ padding: '10px' }}
                                />
                            </div>

                            <div style={{ textAlign: 'right', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleChangePassword} 
                                    style={{ padding: '10px 25px', fontWeight: 'bold' }}
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        
            </div>

            {/* HIỂN THỊ MODAL */}
            <UserOrderDetailModal 
                isOpen={showOrderModal} 
                onClose={() => setShowOrderModal(false)} 
                order={selectedOrder} 
            />
        </div>
    );
};

export default ProfilePage;