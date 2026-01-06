import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import OrderModal from '../../components/admin/OrderModal';
import { API_BASE } from '../../utils/apiConfig.jsx';
import Swal from 'sweetalert2'; // [cite: 1] Import SweetAlert2

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
    
    // Xử lý thay đổi trạng thái với Swal
    const handleChange = async (e) => {
        const newStatus = e.target.value;
        if (newStatus === currentStatus) return;

        // Thay window.confirm bằng Swal
        const result = await Swal.fire({
            title: 'Xác nhận thay đổi?',
            text: `Bạn muốn đổi trạng thái đơn #${orderId} sang "${statusConfig[newStatus].label}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            onUpdate(orderId, newStatus);
            // Có thể thêm thông báo nhỏ thành công nếu muốn
            Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Đã cập nhật trạng thái",
                showConfirmButton: false,
                timer: 1000
            });
        } else {
            // Nếu hủy, React sẽ tự render lại value cũ do props chưa đổi
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
    
    // Filters & Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10; 
    
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // --- LOGIC SLIDER GIÁ TỰ ĐỘNG ---
    const [priceRange, setPriceRange] = useState([0, 1000000]);
    const [maxPriceBound, setMaxPriceBound] = useState(1000000);
    const isFirstLoad = useRef(true);
    const [filterTrigger, setFilterTrigger] = useState(0);

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
            const params = {
                page, pageSize: itemsPerPage, search, status: statusFilter,
                fromDate: fromDate || null, toDate: toDate || null,
            };
            if (!isFirstLoad.current) {
                params.minPrice = priceRange[0];
                params.maxPrice = priceRange[1];
            }

            const res = await axios.get(`${API_BASE}/api/Orders/admin/list`, { params });
            setOrders(res.data.data);
            setTotalPages(res.data.totalPages);

            // --- CẬP NHẬT SLIDER THEO GIÁ CAO NHẤT ---
            if (isFirstLoad.current) {
                const serverMaxPrice = res.data.maxPrice || 50000000;
                setMaxPriceBound(serverMaxPrice);
                setPriceRange([0, serverMaxPrice]);
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
    }, [page, statusFilter, filterTrigger]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setFilterTrigger(prev => prev + 1);
    };

    const handleSliderChange = (value) => {
        setPriceRange(value);
    };

    const handleViewDetail = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/api/Orders/admin/detail/${id}`);
            setSelectedOrder(res.data);
            setShowModal(true);
        } catch (error) {
            // Thay alert bằng Swal
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không thể tải chi tiết đơn hàng.'
            });
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        // Thay window.confirm bằng Swal
        const result = await Swal.fire({
            title: 'Xác nhận cập nhật',
            text: `Bạn muốn chuyển trạng thái đơn hàng sang: ${newStatus}?`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        setUpdating(true);
        try {
            await axios.put(`${API_BASE}/api/Orders/admin/update-status/${selectedOrder.orderId}`, {
                newStatus: newStatus
            });
            setSelectedOrder(prev => ({ ...prev, orderStatus: newStatus }));
            fetchOrders(); 
            setShowModal(false);
            
            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: 'Đã cập nhật trạng thái đơn hàng!',
                timer: 700,
                showConfirmButton: false
            });

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi cập nhật',
                text: error.response?.data?.message || error.message
            });
        }
        setUpdating(false);
    };

    const handleDelete = async (id, status) => {
        if (status !== 'Pending' && status !== 'Cancelled') {
            Swal.fire({
                icon: 'warning',
                title: 'Không thể xóa',
                text: "Chỉ có thể xóa đơn hàng 'Đã hủy' hoặc 'Chờ xác nhận'."
            });
            return;
        }

        // Cấu hình Swal giống Category [cite: 20]
        const result = await Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?',
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // Màu đỏ cho nút xóa
            cancelButtonColor: '#3085d6', // Màu xanh cho nút hủy
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy bỏ'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_BASE}/api/Orders/admin/delete/${id}`);
                
                // Thông báo thành công tự đóng [cite: 22, 23]
                Swal.fire({
                    title: 'Đã xóa!',
                    text: 'Đơn hàng đã được xóa thành công.',
                    icon: 'success',
                    timer: 700,
                    showConfirmButton: false
                });

                if (orders.length === 1 && page > 1) {
                    setPage(page - 1);
                } else {
                    fetchOrders();
                }
            } catch (error) {
                console.error("Lỗi xóa đơn", error);
                // Thông báo lỗi [cite: 25, 26]
                Swal.fire({
                    title: 'Không thể xóa!',
                    text: error.response?.data?.message || error.message,
                    icon: 'error',
                    confirmButtonText: 'Đã hiểu'
                });
            }
        }
    };

    const handleQuickUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`${API_BASE}/api/Orders/admin/update-status/${orderId}`, {
                newStatus: newStatus
            });
            setOrders(prevOrders => prevOrders.map(o => 
                o.orderId === orderId ? { ...o, orderStatus: newStatus } : o
            ));
        } catch (error) {
            console.error("Lỗi cập nhật", error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi cập nhật',
                text: error.response?.data?.message || error.message
            });
            fetchOrders();
        }
    };

    // Hàm đổi trang
    const paginate = (pageNumber) => setPage(pageNumber);

    return (
        <div style={{ padding: '24px', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản Lý Đơn Hàng</h2>

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
                                    max={maxPriceBound} 
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
                            {/* --- THÊM CỘT STT --- */}
                            <th style={{ padding: '16px', textAlign: 'center', color: '#495057', width: '50px' }}>STT</th>
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
                            <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Đang tải dữ liệu...</td></tr>
                        ) : orders.map((order, index) => {
                            // --- TÍNH TOÁN STT ---
                            const stt = (page - 1) * itemsPerPage + index + 1;
                            
                            return (
                                <tr 
                                    key={order.orderId} 
                                    style={{ borderBottom: '1px solid #f1f1f1', transition: 'background-color 0.2s' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    {/* HIỂN THỊ STT */}
                                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>
                                    
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
                            )
                        })}
                         {orders.length === 0 && !loading && (
                            <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Không tìm thấy đơn hàng nào.</td></tr>
                        )}
                    </tbody>
                </table>
              
                {/* --- UI PHÂN TRANG --- */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '5px', borderTop: '1px solid #eee' }}>
                        
                        {/* NHÓM NÚT TRÁI */}
                        {page > 1 && (
                            <>
                                <button 
                                    onClick={() => paginate(1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Về trang đầu"
                                >
                                    &#171; Đầu
                                </button>
                                <button 
                                    onClick={() => paginate(page - 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    &lsaquo; Trước
                                </button>
                            </>
                        )}

                        {/* DANH SÁCH SỐ TRANG */}
                        {(() => {
                            let startPage, endPage;
                            if (totalPages <= 10) {
                                startPage = 1;
                                endPage = totalPages;
                            } else {
                                if (page <= 6) {
                                    startPage = 1;
                                    endPage = 10;
                                } else if (page + 4 >= totalPages) {
                                    startPage = totalPages - 9;
                                    endPage = totalPages;
                                } else {
                                    startPage = page - 5;
                                    endPage = page + 4;
                                }
                            }

                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(i);
                            }

                            return pages.map(number => (
                                <button 
                                    key={number} 
                                    onClick={() => paginate(number)}
                                    style={{ 
                                        padding: '6px 12px', 
                                        border: '1px solid #ddd', 
                                        background: page === number ? '#4e73df' : 'white', 
                                        color: page === number ? 'white' : '#333',
                                        cursor: 'pointer', 
                                        borderRadius: '4px',
                                        fontWeight: page === number ? 'bold' : 'normal',
                                        fontSize: '13px',
                                        minWidth: '32px'
                                    }}
                                >
                                    {number}
                                </button>
                            ));
                        })()}

                        {/* NHÓM NÚT PHẢI */}
                        {page < totalPages && (
                            <>
                                <button 
                                    onClick={() => paginate(page + 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    Sau &rsaquo;
                                </button>
                                <button 
                                    onClick={() => paginate(totalPages)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Đến trang cuối"
                                >
                                    Cuối &#187;
                                </button>
                            </>
                        )}
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