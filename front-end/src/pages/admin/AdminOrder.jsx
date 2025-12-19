import React, { useState, useEffect } from 'react';
import axios from 'axios'; 

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

    // Modal Details (Tự code logic popup đơn giản)
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [updating, setUpdating] = useState(false);

    // Load data
    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Sửa lại URL API cho đúng với port backend của bạn
            const res = await axios.get(`https://localhost:7298/api/Orders/admin/list`, {
                params: {
                    page,
                    pageSize: 10,
                    search,
                    status: statusFilter,
                    fromDate: fromDate || null,
                    toDate: toDate || null
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
            alert("Cập nhật thành công!");
            setShowModal(false);
            fetchOrders(); 
        } catch (error) {
            alert("Lỗi cập nhật: " + (error.response?.data?.message || error.message));
        }
        setUpdating(false);
    };

    // Render Badge bằng class HTML thường
    const renderStatusBadge = (status) => {
        let badgeClass = "badge ";
        let text = status;
        switch (status) {
            case 'Pending': 
                badgeClass += "bg-warning text-dark"; 
                text = "Chờ xác nhận"; 
                break;
            case 'Processing': 
                badgeClass += "bg-info text-dark"; 
                text = "Đang đóng gói"; 
                break;
            case 'Shipping': 
                badgeClass += "bg-primary"; 
                text = "Đang giao"; 
                break;
            case 'Completed': 
                badgeClass += "bg-success"; 
                text = "Hoàn thành"; 
                break;
            case 'Cancelled': 
                badgeClass += "bg-danger"; 
                text = "Đã hủy"; 
                break;
            default: 
                badgeClass += "bg-secondary"; 
                break;
        }
        return <span className={badgeClass}>{text}</span>;
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    return (
        <div className="container-fluid p-4">
            <h2 className="mb-4">Quản lý Đơn hàng</h2>

            {/* Filter Section */}
            <div className="card mb-4 p-3 shadow-sm">
                <form onSubmit={handleSearch}>
                    <div className="row g-3">
                        <div className="col-md-3">
                            <input 
                                type="text" 
                                className="form-control"
                                placeholder="Mã đơn / Tên / SĐT..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                <option value="">Tất cả trạng thái</option>
                                <option value="Pending">Chờ xác nhận</option>
                                <option value="Processing">Đang đóng gói</option>
                                <option value="Shipping">Đang giao hàng</option>
                                <option value="Completed">Hoàn thành</option>
                                <option value="Cancelled">Đã hủy</option>
                            </select>
                        </div>
                        <div className="col-md-2">
                            <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} />
                        </div>
                        <div className="col-md-2">
                            <button type="submit" className="btn btn-primary w-100">Lọc / Tìm</button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Table Section */}
            <div className="card shadow-sm">
                <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Khách hàng</th>
                                <th>Ngày đặt</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-3">Đang tải...</td></tr>
                            ) : orders.map(order => (
                                <tr key={order.orderId}>
                                    <td>#{order.orderId}</td>
                                    <td>
                                        <div className="fw-bold">{order.customerName}</div>
                                        <small className="text-muted">{order.phone}</small>
                                    </td>
                                    <td>{new Date(order.orderDate).toLocaleString('vi-VN')}</td>
                                    <td className="text-primary fw-bold">{formatMoney(order.totalAmount)}</td>
                                    <td>{renderStatusBadge(order.orderStatus)}</td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewDetail(order.orderId)}>
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && !loading && (
                                <tr><td colSpan="6" className="text-center p-3">Không tìm thấy đơn hàng nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="d-flex justify-content-end p-3 gap-2">
                    <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Trước</button>
                    <span className="align-self-center px-2">Trang {page} / {totalPages}</span>
                    <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sau</button>
                </div>
            </div>

            {/* CUSTOM MODAL (Không dùng thư viện) */}
            {showModal && selectedOrder && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Chi tiết đơn hàng #{selectedOrder.orderId}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <h6 className="text-uppercase text-muted small fw-bold">Thông tin người nhận</h6>
                                        <p className="mb-1"><strong>Tên:</strong> {selectedOrder.recipientName}</p>
                                        <p className="mb-1"><strong>SĐT:</strong> {selectedOrder.recipientPhone}</p>
                                        <p className="mb-1"><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress}</p>
                                        <p className="mb-1"><strong>Ghi chú:</strong> {selectedOrder.note || "Không có"}</p>
                                    </div>
                                    <div className="col-md-6 text-md-end">
                                        <h6 className="text-uppercase text-muted small fw-bold">Trạng thái</h6>
                                        <div className="mb-2">{renderStatusBadge(selectedOrder.orderStatus)}</div>
                                        <p>Thanh toán: <strong className={selectedOrder.paymentStatus === 'Paid' ? 'text-success' : 'text-danger'}>{selectedOrder.paymentStatus}</strong></p>
                                    </div>
                                </div>

                                <table className="table table-bordered">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>Size</th>
                                            <th>Đơn giá</th>
                                            <th>SL</th>
                                            <th>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.productName}</td>
                                                <td>{item.size}</td>
                                                <td>{formatMoney(item.price)}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatMoney(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="row justify-content-end">
                                    <div className="col-md-5">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span>Tạm tính:</span>
                                            <span>{formatMoney(selectedOrder.subTotal)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1">
                                            <span>Phí ship:</span>
                                            <span>{formatMoney(selectedOrder.shippingFee)}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1 text-success">
                                            <span>Giảm giá:</span>
                                            <span>-{formatMoney(selectedOrder.discountAmount)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between fw-bold fs-5 text-danger">
                                            <span>TỔNG CỘNG:</span>
                                            <span>{formatMoney(selectedOrder.totalAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                {selectedOrder.orderStatus !== 'Cancelled' && selectedOrder.orderStatus !== 'Completed' && (
                                    <>
                                        {selectedOrder.orderStatus === 'Pending' && (
                                            <button className="btn btn-info text-white" disabled={updating} onClick={() => handleUpdateStatus('Processing')}>
                                                Xác nhận & Đóng gói
                                            </button>
                                        )}
                                        {selectedOrder.orderStatus === 'Processing' && (
                                            <button className="btn btn-primary" disabled={updating} onClick={() => handleUpdateStatus('Shipping')}>
                                                Giao Shipper
                                            </button>
                                        )}
                                        {selectedOrder.orderStatus === 'Shipping' && (
                                            <button className="btn btn-success" disabled={updating} onClick={() => handleUpdateStatus('Completed')}>
                                                Hoàn thành
                                            </button>
                                        )}
                                        
                                        <button className="btn btn-danger ms-auto" disabled={updating} onClick={() => handleUpdateStatus('Cancelled')}>
                                            Hủy Đơn
                                        </button>
                                    </>
                                )}
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;