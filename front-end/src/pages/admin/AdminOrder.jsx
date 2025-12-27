import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- ICONS SVG (Giống trang Category) ---
const Icons = {
    Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Filter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
    // --- MỚI THÊM: Icon Thùng rác ---
    Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
};

// --- COMPONENT MODAL CHI TIẾT ĐƠN HÀNG (Style giống CategoryModal) ---
const OrderDetailModal = ({ isOpen, onClose, order, onUpdateStatus, updating }) => {
    if (!isOpen || !order) return null;

    // Style cho Modal
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)', 
        backdropFilter: 'blur(4px)', // Hiệu ứng mờ nền
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1050
    };

    const modalStyle = {
        backgroundColor: 'white', 
        borderRadius: '12px', 
        width: '800px', // Rộng hơn chút để chứa thông tin đơn hàng
        maxWidth: '95%',
        maxHeight: '90vh', // Giới hạn chiều cao
        overflowY: 'auto', // Cho phép cuộn nếu dài
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.3s ease-out'
    };

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

    // Badge trong Modal
    const renderBadge = (status) => {
        const styles = {
            Pending: { bg: '#fff3cd', color: '#856404', border: '#ffeeba' },
            Processing: { bg: '#cff4fc', color: '#055160', border: '#b6effb' },
            Shipping: { bg: '#cfe2ff', color: '#084298', border: '#b6d4fe' },
            Completed: { bg: '#d1e7dd', color: '#0f5132', border: '#badbcc' },
            Cancelled: { bg: '#f8d7da', color: '#842029', border: '#f5c2c7' },
        }[status] || { bg: '#eee', color: '#333', border: '#ddd' };

        return (
            <span style={{ 
                backgroundColor: styles.bg, color: styles.color, border: `1px solid ${styles.border}`,
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' 
            }}>
                {status}
            </span>
        );
    };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>Chi tiết đơn hàng #{order.orderId}</h4>
                        <small style={{ color: '#6c757d' }}>Ngày đặt: {new Date(order.orderDate).toLocaleString('vi-VN')}</small>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><Icons.Close /></button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px' }}>
                    {/* Thông tin chung */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h6 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#495057', textTransform: 'uppercase', fontSize: '12px' }}>Người nhận hàng</h6>
                            <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Tên:</strong> {order.recipientName}</p>
                            <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>SĐT:</strong> {order.recipientPhone}</p>
                            <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Địa chỉ:</strong> {order.shippingAddress}</p>
                            {order.note && <p style={{ margin: '4px 0', fontSize: '14px', color: '#dc3545' }}><em>Ghi chú: {order.note}</em></p>}
                        </div>
                        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h6 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#495057', textTransform: 'uppercase', fontSize: '12px' }}>Trạng thái đơn</h6>
                            <div style={{ marginBottom: '10px' }}>{renderBadge(order.orderStatus)}</div>
                            <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                Thanh toán: <strong style={{ color: order.paymentStatus === 'Paid' ? '#198754' : '#dc3545' }}>{order.paymentStatus}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Bảng sản phẩm */}
                    <h6 style={{ fontWeight: 'bold', marginBottom: '12px' }}>Danh sách sản phẩm</h6>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '20px' }}>
                        <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #dee2e6' }}>
                            <tr>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Sản phẩm</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Size</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Đơn giá</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>SL</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{item.productName}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>{item.size}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatMoney(item.price)}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Tổng kết tiền */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                                <span>Tạm tính:</span> <span>{formatMoney(order.subTotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                                <span>Phí ship:</span> <span>{formatMoney(order.shippingFee)}</span>
                            </div>
                            {order.discountAmount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#198754' }}>
                                    <span>Giảm giá:</span> <span>-{formatMoney(order.discountAmount)}</span>
                                </div>
                            )}
                            <div style={{ borderTop: '1px solid #ddd', margin: '10px 0' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#0d6efd' }}>
                                <span>TỔNG CỘNG:</span> <span>{formatMoney(order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f9fafb', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                    <button onClick={onClose} style={{ padding: '8px 16px', background: 'white', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Đóng</button>
                    
                    {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Completed' && (
                        <>
                            {order.orderStatus === 'Pending' && (
                                <button onClick={() => onUpdateStatus('Processing')} disabled={updating} style={{ padding: '8px 16px', background: '#0dcaf0', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                    Xác nhận & Đóng gói
                                </button>
                            )}
                            {order.orderStatus === 'Processing' && (
                                <button onClick={() => onUpdateStatus('Shipping')} disabled={updating} style={{ padding: '8px 16px', background: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                    Giao Shipper
                                </button>
                            )}
                            {order.orderStatus === 'Shipping' && (
                                <button onClick={() => onUpdateStatus('Completed')} disabled={updating} style={{ padding: '8px 16px', background: '#198754', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                    Hoàn thành
                                </button>
                            )}
                            <button onClick={() => onUpdateStatus('Cancelled')} disabled={updating} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                Hủy đơn
                            </button>
                        </>
                    )}
                </div>
            </div>
             {/* CSS cho Animation của Modal */}
             <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

// --- COMPONENT DROPDOWN TRẠNG THÁI ---
const StatusSelect = ({ orderId, currentStatus, onUpdate }) => {
    // Cấu hình màu sắc và nhãn hiển thị
    const statusConfig = {
        Pending: { color: '#856404', bg: '#fff3cd', label: 'Chờ xác nhận' },
        Processing: { color: '#055160', bg: '#cff4fc', label: 'Đang đóng gói' },
        Shipping: { color: '#084298', bg: '#cfe2ff', label: 'Đang giao hàng' },
        Completed: { color: '#0f5132', bg: '#d1e7dd', label: 'Hoàn thành' },
        Cancelled: { color: '#842029', bg: '#f8d7da', label: 'Đã hủy' }
    };

    const config = statusConfig[currentStatus] || { color: '#333', bg: '#eee' };

    const handleChange = (e) => {
        const newStatus = e.target.value;
        if (newStatus === currentStatus) return;

        // Hỏi xác nhận trước khi đổi (để tránh bấm nhầm)
        const confirmMsg = `Bạn muốn đổi trạng thái đơn #${orderId} sang "${statusConfig[newStatus].label}"?`;
        if (window.confirm(confirmMsg)) {
            onUpdate(orderId, newStatus);
        } else {
            // Reset lại select nếu user bấm Cancel (để UI không bị đổi ảo)
            e.target.value = currentStatus; 
        }
    };

    return (
        <select
            value={currentStatus}
            onChange={handleChange}
            style={{
                backgroundColor: config.bg,
                color: config.color,
                border: `1px solid ${config.color}`,
                padding: '4px 8px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none', // Ẩn mũi tên mặc định của trình duyệt cho đẹp (tùy chọn)
                textAlign: 'center',
                width: '130px'
            }}
        >
            <option value="Pending">Chờ xác nhận</option>
            <option value="Processing">Đang đóng gói</option>
            <option value="Shipping">Đang giao hàng</option>
            <option value="Completed">Hoàn thành</option>
            <option value="Cancelled">Đã hủy</option>
        </select>
    );
};
// --- MAIN COMPONENT ---
const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Load data
    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`https://localhost:7298/api/Orders/admin/list`, {
                params: {
                    page, pageSize: 10, search, status: statusFilter,
                    fromDate: fromDate || null, toDate: toDate || null
                }
            });
            setOrders(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error("Lỗi tải đơn hàng", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, [page, statusFilter]); 

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchOrders();
    };

    const handleViewDetail = async (id) => {
        try {
            const res = await axios.get(`https://localhost:7298/api/Orders/admin/detail/${id}`);
            setSelectedOrder(res.data);
            setShowModal(true);
        } catch (error) {
            alert("Lỗi tải chi tiết đơn hàng");
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!window.confirm(`Xác nhận chuyển trạng thái sang: ${newStatus}?`)) return;
        
        setUpdating(true);
        try {
            await axios.put(`https://localhost:7298/api/Orders/admin/update-status/${selectedOrder.orderId}`, {
                newStatus: newStatus
            });
            // Update local state để UI phản hồi ngay
            setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
            fetchOrders(); 
            // Không tắt modal ngay để user xem kết quả, hoặc tắt tùy bạn
             setShowModal(false); 
        } catch (error) {
            alert("Lỗi cập nhật: " + (error.response?.data?.message || error.message));
        }
        setUpdating(false);
    };
    const handleDelete = async (id, status) => {
        // 1. Kiểm tra trạng thái hợp lệ ngay tại Client
        // Chỉ cho phép xóa nếu là "Pending" (Chờ xác nhận) hoặc "Cancelled" (Đã hủy)
        if (status !== 'Pending' && status !== 'Cancelled') {
            alert("Chỉ có thể xóa đơn hàng 'Đã hủy' hoặc 'Chờ xác nhận'.");
            return; // Dừng lại ngay, không hiện confirm, không gọi API
        }

        // 2. Nếu hợp lệ thì mới hiện Confirm
        if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác!")) {
            return;
        }

        // 3. Gọi API xóa
        try {
            await axios.delete(`https://localhost:7298/api/Orders/admin/delete/${id}`);
            alert("Đã xóa đơn hàng thành công!");
            
            if (orders.length === 1 && page > 1) {
                setPage(page - 1);
            } else {
                fetchOrders();
            }
        } catch (error) {
            console.error("Lỗi xóa đơn", error);
            alert("Lỗi xóa: " + (error.response?.data?.message || error.message));
        }
    };

    // Render Badge Status (Cho bảng bên ngoài)
    const StatusBadge = ({ status }) => {
        const styles = {
            Pending: { bg: '#fff3cd', color: '#856404', border: '#ffeeba', label: 'Chờ xác nhận' },
            Processing: { bg: '#cff4fc', color: '#055160', border: '#b6effb', label: 'Đang đóng gói' },
            Shipping: { bg: '#cfe2ff', color: '#084298', border: '#b6d4fe', label: 'Đang giao' },
            Completed: { bg: '#d1e7dd', color: '#0f5132', border: '#badbcc', label: 'Hoàn thành' },
            Cancelled: { bg: '#f8d7da', color: '#842029', border: '#f5c2c7', label: 'Đã hủy' },
        }[status] || { bg: '#eee', color: '#333', border: '#ddd', label: status };

        return (
            <span style={{ 
                backgroundColor: styles.bg, color: styles.color, border: `1px solid ${styles.border}`,
                padding: '6px 12px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold'
            }}>
                {styles.label}
            </span>
        );
    };
    const handleQuickUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`https://localhost:7298/api/Orders/admin/update-status/${orderId}`, {
                newStatus: newStatus
            });
            
            // Cập nhật lại danh sách orders ở client ngay lập tức (không cần load lại API)
            setOrders(prevOrders => prevOrders.map(o => 
                o.orderId === orderId ? { ...o, orderStatus: newStatus } : o
            ));

            // (Optional) Có thể hiện thông báo nhỏ ở góc (Toast)
            // alert("Cập nhật thành công!"); 

        } catch (error) {
            console.error("Lỗi cập nhật", error);
            alert("Lỗi cập nhật: " + (error.response?.data?.message || error.message));
            
            // Nếu lỗi, nên load lại danh sách để đồng bộ dữ liệu chuẩn
            fetchOrders(); 
        }
    };
    return (
        <div style={{ padding: '24px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#2c3e50', fontWeight: 'bold' }}>Quản Lý Đơn Hàng</h2>
                <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Theo dõi trạng thái và xử lý đơn hàng</p>
            </div>

            {/* Filter Section - Card Style giống Category */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ced4da', borderRadius: '6px', padding: '0 10px', backgroundColor: 'white' }}>
                            <Icons.Search />
                            <input 
                                type="text" 
                                placeholder="Tìm mã đơn, tên khách, SĐT..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ border: 'none', padding: '10px', width: '100%', outline: 'none' }}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <select 
                            value={statusFilter} 
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', outline: 'none' }}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="Pending">Chờ xác nhận</option>
                            <option value="Processing">Đang đóng gói</option>
                            <option value="Shipping">Đang giao hàng</option>
                            <option value="Completed">Hoàn thành</option>
                            <option value="Cancelled">Đã hủy</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ced4da' }} />
                    </div>
                    <button type="submit" style={{ padding: '0 20px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display:'flex', alignItems:'center', gap:'5px' }}>
                        <Icons.Filter /> Lọc
                    </button>
                </form>
            </div>

            {/* Table Section */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#495057' }}>ID</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#495057' }}>Khách hàng</th>
                            <th style={{ padding: '16px', textAlign: 'left', color: '#495057' }}>Ngày đặt</th>
                            <th style={{ padding: '16px', textAlign: 'right', color: '#495057' }}>Tổng tiền</th>
                            <th style={{ padding: '16px', textAlign: 'center', color: '#495057' }}>Trạng thái</th>
                            <th style={{ padding: '16px', textAlign: 'center', color: '#495057' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải dữ liệu...</td></tr>
                        ) : orders.map(order => (
                            <tr 
                                key={order.orderId} 
                                style={{ borderBottom: '1px solid #f1f1f1', transition: 'background-color 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <td style={{ padding: '16px', fontWeight: 'bold', color: '#0d6efd' }}>#{order.orderId}</td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: '600', color: '#333' }}>{order.customerName}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>{order.phone}</div>
                                </td>
                                <td style={{ padding: '16px' }}>{new Date(order.orderDate).toLocaleString('vi-VN')}</td>
                                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#198754' }}>
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    {/* Thay thế StatusBadge cũ bằng StatusSelect */}
                                    <StatusSelect 
                                        orderId={order.orderId}
                                        currentStatus={order.orderStatus}
                                        onUpdate={handleQuickUpdateStatus}
                                    />
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        {/* Nút Xem Chi Tiết */}
                                        <button 
                                            onClick={() => handleViewDetail(order.orderId)}
                                            /* ... style cũ giữ nguyên ... */
                                        >
                                            <Icons.Eye />
                                        </button>

                                        {/* --- NÚT XÓA (CẬP NHẬT) --- */}
                                        <button 
                                            // CẬP NHẬT DÒNG NÀY: Truyền thêm order.orderStatus
                                            onClick={() => handleDelete(order.orderId, order.orderStatus)} 
                                            title="Xóa đơn hàng"
                                            style={{ 
                                                width: '36px', height: '36px', 
                                                border: '1px solid #f5c2c7', borderRadius: '6px',
                                                // Mẹo nhỏ: Nếu không được xóa thì làm mờ nút đi một chút cho trực quan (optional)
                                                opacity: (order.orderStatus === 'Pending' || order.orderStatus === 'Cancelled') ? 1 : 0.5,
                                                backgroundColor: 'white', color: '#dc3545', cursor: 'pointer',
                                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <Icons.Trash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {orders.length === 0 && !loading && (
                            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Không tìm thấy đơn hàng nào.</td></tr>
                        )}
                    </tbody>
                </table>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', borderTop: '1px solid #eee' }}>
                         <span style={{ fontSize: '14px', color: '#666', marginRight: '10px' }}>Trang {page} / {totalPages}</span>
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(page - 1)}
                            style={{ padding: '6px 12px', background: 'white', border: '1px solid #dee2e6', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#ccc' : '#333' }}
                        >
                            Trước
                        </button>
                        <button 
                            disabled={page === totalPages} 
                            onClick={() => setPage(page + 1)}
                            style={{ padding: '6px 12px', background: 'white', border: '1px solid #dee2e6', borderRadius: '4px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#ccc' : '#333' }}
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL COMPONENT */}
            <OrderDetailModal 
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                order={selectedOrder}
                onUpdateStatus={handleUpdateStatus}
                updating={updating}
            />

        </div>
    );
};

export default AdminOrders;