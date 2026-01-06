import React from 'react';

// Định nghĩa Icon Close dùng riêng cho Modal
const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const OrderModal = ({ isOpen, onClose, order, onUpdateStatus, updating }) => {
    if (!isOpen || !order) return null;

    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1050
    };

    const modalStyle = {
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '800px',
        maxWidth: '95%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.3s ease-out'
    };

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

    // --- HÀM MỚI: Dịch phương thức thanh toán sang tiếng Việt ---
    const getPaymentMethodText = (method) => {
        if (!method) return 'Chưa xác định';
        const m = method.toUpperCase();
        if (m === 'COD') return 'Thanh toán khi nhận hàng (COD)';
        if (m === 'PAYOS' || m === 'BANKING' || m === 'VNPAY') return 'Thanh toán điện tử (Chuyển khoản)';
        return method; // Nếu khác thì hiện nguyên gốc
    };

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
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                        <CloseIcon />
                    </button>
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
                            
                            {/* --- PHẦN THANH TOÁN (ĐÃ SỬA) --- */}
                            <div style={{ marginTop: '12px', borderTop: '1px dashed #ced4da', paddingTop: '8px' }}>
                                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                                    Hình thức: <strong>{getPaymentMethodText(order.paymentMethod)}</strong>
                                </p>

                            </div>
                            {/* --------------------------------- */}

                        </div>
                    </div>

                    {/* Bảng sản phẩm */}
                    <h6 style={{ fontWeight: 'bold', marginBottom: '12px' }}>Danh sách sản phẩm</h6>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '20px' }}>
                        <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #dee2e6' }}>
                            <tr>
                                <th style={{ padding: '10px', textAlign: 'left' }}>Sản phẩm</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>Phân loại</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Đơn giá</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>SL</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{item.productName}</td>
                                    <td style={{ padding: '10px', textAlign: 'center', color: '#666' }}>{item.variantName}</td>
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
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default OrderModal;