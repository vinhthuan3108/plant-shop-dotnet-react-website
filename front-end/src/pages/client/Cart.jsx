import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft, FaTimes } from 'react-icons/fa';
import './Cart.css';
import { API_BASE } from '../../utils/apiConfig.jsx';

const Cart = () => {
    // 1. Lấy thêm hàm clearCart từ Context
    const { cartItems, removeFromCart, updateQuantity, totalAmount, clearCart } = useContext(CartContext);
    const navigate = useNavigate();

    // Xử lý khi giỏ hàng trống
    if (!cartItems || cartItems.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <img 
                    src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" 
                    alt="Empty Cart" 
                    style={{width: '100px', marginBottom: '20px', opacity: 0.5}}
                />
                <h2>Giỏ hàng của bạn đang trống</h2>
                <p style={{color: '#666', marginBottom: '30px'}}>
                    Hãy thêm vài món đồ xanh vào không gian của bạn nhé!
                </p>
                <Link to="/shop" className="checkout-btn" style={{display: 'inline-block', width: 'auto', textDecoration: 'none', padding: '12px 30px'}}>
                    Quay lại mua sắm
                </Link>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h2 className="cart-title">Giỏ Hàng Của Bạn</h2>

            <div className="cart-layout">
                {/* --- Danh sách sản phẩm (Bên trái) --- */}
                <div className="cart-items-section">
                    
                    {/* --- MỚI: Nút Xóa Tất Cả --- */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                        <button 
                            onClick={clearCart} // Gọi hàm trực tiếp, không thông báo
                            style={{
                                background: 'transparent',
                                border: '1px solid #d9534f',
                                color: '#d9534f',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '14px',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#d9534f'; e.currentTarget.style.color = '#fff'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d9534f'; }}
                        >
                            <FaTimes /> Xóa tất cả
                        </button>
                    </div>

                    <table className="cart-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Đơn giá</th>
                                <th>Số lượng</th>
                                <th>Thành tiền</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item) => (
                                <tr key={item.variantId}>
                                    {/* 1. Hình ảnh & Tên */}
                                    <td data-label="Sản phẩm">
                                        <div className="product-info-cell">
                                            <img 
                                                src={item.image ? (item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`) : 'https://via.placeholder.com/80'} 
                                                alt={item.productName} 
                                                className="cart-img"
                                            />
                                            <div>
                                                <div className="product-name">{item.productName}</div>
                                                {item.variantName && item.variantName !== 'Tiêu chuẩn' && (
                                                    <div className="product-variant">
                                                        Phân loại: {item.variantName}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. Đơn giá */}
                                    <td data-label="Đơn giá" style={{whiteSpace: 'nowrap'}}>
                                        {item.price ? item.price.toLocaleString() : 0} đ
                                    </td>

                                    {/* 3. Số lượng */}
                                    <td data-label="Số lượng">
                                        <div className="quantity-control">
                                            <button 
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                            >
                                                <FaMinus size={10} />
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button 
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                            >
                                                <FaPlus size={10} />
                                            </button>
                                        </div>
                                    </td>

                                    {/* 4. Thành tiền */}
                                    <td data-label="Thành tiền">
                                        <span className="total-price-cell">
                                            {(item.price * item.quantity).toLocaleString()} đ
                                        </span>
                                    </td>

                                    {/* 5. Nút xóa lẻ */}
                                    <td>
                                        <button 
                                            className="remove-btn"
                                            onClick={() => removeFromCart(item.variantId)}
                                            title="Xóa sản phẩm"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="continue-shopping">
                        <Link to="/shop" className="back-link">
                            <FaArrowLeft /> Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>

                {/* --- Tổng tiền & Thanh toán (Bên phải) --- */}
                <div className="cart-summary-section">
                    <h3 className="summary-title">Tóm tắt đơn hàng</h3>
                    <div className="summary-row">
                        <span>Tổng tiền:</span>
                        <span className="summary-total">{(totalAmount || 0).toLocaleString()} đ</span>
                    </div>
                    
                    <button 
                        className="checkout-btn"
                        onClick={() => navigate('/checkout')} 
                    >
                        TIẾN HÀNH THANH TOÁN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;