import React, { useState, useEffect, useRef } from 'react'; // Thêm useRef
import axios from 'axios';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import OrderModal from '../../components/admin/OrderModal';

// --- ICONS SVG ---
const Icons = {
    Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
    Filter: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
    Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
};

// --- COMPONENT DROPDOWN TRẠNG THÁI ---
const StatusSelect = ({ orderId, currentStatus, onUpdate }) => {
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
        const confirmMsg = `Bạn muốn đổi trạng thái đơn #${orderId} sang "${statusConfig[newStatus].label}"?`;
        if (window.confirm(confirmMsg)) {
            onUpdate(orderId, newStatus);
        } else {
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
                appearance: 'none',
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

    // --- LOGIC SLIDER GIÁ TỰ ĐỘNG ---
    const [priceRange, setPriceRange] = useState([0, 1000000]); // Mặc định tạm
    const [maxPriceBound, setMaxPriceBound] = useState(1000000); // Giới hạn max của slider
    const isFirstLoad = useRef(true); // Check lần đầu load trang
    const [filterTrigger, setFilterTrigger] = useState(0); // Biến để kích hoạt fetch khi bấm nút Lọc

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Format tiền tệ
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    // Load data
    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Chỉ gửi minPrice/maxPrice nếu không phải là lần load đầu (để lấy maxPrice gốc về trước)
            // Hoặc gửi luôn, backend sẽ xử lý maxPrice toàn cục trả về
            const params = {
                page, pageSize: 10, search, status: statusFilter,
                fromDate: fromDate || null, toDate: toDate || null,
            };

            // Nếu không phải lần đầu mới gửi kèm bộ lọc giá (để tránh lọc sai khi chưa biết max)
            if (!isFirstLoad.current) {
                params.minPrice = priceRange[0];
                params.maxPrice = priceRange[1];
            }

            const res = await axios.get(`https://localhost:7298/api/Orders/admin/list`, { params });
            
            setOrders(res.data.data);
            setTotalPages(res.data.totalPages);

            // --- CẬP NHẬT SLIDER THEO GIÁ CAO NHẤT ---
            if (isFirstLoad.current) {
                const serverMaxPrice = res.data.maxPrice || 50000000; // Lấy MaxPrice từ API trả về
                setMaxPriceBound(serverMaxPrice); // Set giới hạn thanh trượt
                setPriceRange([0, serverMaxPrice]); // Set khoảng chọn full
                isFirstLoad.current = false;
            }
        } catch (error) {
            console.error("Lỗi tải đơn hàng", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter, filterTrigger]); // filterTrigger thay đổi khi bấm nút Lọc

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setFilterTrigger(prev => prev + 1); // Trigger useEffect gọi lại API
    };

    const handleSliderChange = (value) => {
        setPriceRange(value);
    };

    // ... (Giữ nguyên các hàm handleViewDetail, handleUpdateStatus...)
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
            setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
            fetchOrders(); 
            setShowModal(false);
        } catch (error) {
            alert("Lỗi cập nhật: " + (error.response?.data?.message || error.message));
        }
        setUpdating(false);
    };

    const handleDelete = async (id, status) => {
        if (status !== 'Pending' && status !== 'Cancelled') {
            alert("Chỉ có thể xóa đơn hàng 'Đã hủy' hoặc 'Chờ xác nhận'.");
            return;
        }
        if (!window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác!")) {
            return;
        }
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

    const handleQuickUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`https://localhost:7298/api/Orders/admin/update-status/${orderId}`, {
                newStatus: newStatus
            });
            setOrders(prevOrders => prevOrders.map(o => 
                o.orderId === orderId ? { ...o, orderStatus: newStatus } : o
            ));
        } catch (error) {
            console.error("Lỗi cập nhật", error);
            alert("Lỗi cập nhật: " + (error.response?.data?.message || error.message));
            fetchOrders();
        }
    };

    return (
        <div style={{ padding: '24px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: 0, color: '#2c3e50', fontWeight: 'bold' }}>Quản Lý Đơn Hàng</h2>
                <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Theo dõi trạng thái và xử lý đơn hàng</p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                <form onSubmit={handleSearch}>
                    {/* DÒNG 1 */}
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
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
                    </div>

                    {/* DÒNG 2: SLIDER */}
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px', color: '#4e73df' }}>
                                KHOẢNG GIÁ ĐƠN HÀNG
                            </label>
                            <div style={{ padding: '0 10px' }}>
                                <Slider 
                                    range 
                                    min={0} 
                                    max={maxPriceBound} // Sử dụng Max Price động từ API
                                    step={50000} 
                                    value={priceRange} 
                                    onChange={handleSliderChange} 
                                    trackStyle={[{ backgroundColor: '#4e73df', height: 6 }]} 
                                    handleStyle={[
                                        { borderColor: '#4e73df', backgroundColor: '#fff', opacity: 1, marginTop: -4 }, 
                                        { borderColor: '#4e73df', backgroundColor: '#fff', opacity: 1, marginTop: -4 }
                                    ]} 
                                    railStyle={{ backgroundColor: '#e9ecef', height: 6 }} 
                                />
                            </div>
                            <div style={{ marginTop: '8px', textAlign: 'center', fontWeight: '500', fontSize: '13px', color: '#666' }}>
                                {formatCurrency(priceRange[0])} — {formatCurrency(priceRange[1])}
                            </div>
                        </div>

                        <div style={{ width: '150px', display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" style={{ width: '100%', padding: '10px 0', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display:'flex', alignItems:'center', justifyContent: 'center', gap:'5px', height: '42px' }}>
                                <Icons.Filter /> Lọc Đơn
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* BẢNG DỮ LIỆU */}
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
                                    {formatCurrency(order.totalAmount)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <StatusSelect 
                                        orderId={order.orderId}
                                        currentStatus={order.orderStatus}
                                        onUpdate={handleQuickUpdateStatus}
                                    />
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <button 
                                            onClick={() => handleViewDetail(order.orderId)}
                                            style={{ width: '36px', height: '36px', border: '1px solid #4e73df', borderRadius: '6px', backgroundColor: 'white', color: '#4e73df', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                        >
                                            <Icons.Eye />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(order.orderId, order.orderStatus)} 
                                            title="Xóa đơn hàng"
                                            style={{ 
                                                width: '36px', height: '36px', 
                                                border: '1px solid #f5c2c7', borderRadius: '6px',
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

            <OrderModal 
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