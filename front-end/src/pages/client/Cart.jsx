import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft } from 'react-icons/fa';

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useContext(CartContext);
    const navigate = useNavigate();
    const BASE_URL = 'https://localhost:7298';

    if (cartItems.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Giỏ hàng của bạn đang trống</h2>
                <Link to="/products" style={{ color: '#2e7d32', fontWeight: 'bold' }}>Quay lại mua sắm</Link>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px', color: '#2e7d32' }}>Giỏ Hàng Của Bạn</h2>

            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                {/* Danh sách sản phẩm */}
                <div style={{ flex: 3, minWidth: '600px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>Sản phẩm</th>
                                <th style={{ padding: '10px' }}>Đơn giá</th>
                                <th style={{ padding: '10px' }}>Số lượng</th>
                                <th style={{ padding: '10px' }}>Thành tiền</th>
                                <th style={{ padding: '10px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item) => (
                                <tr key={item.productId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px 10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <img 
                                            src={item.imageUrl ? `${BASE_URL}${item.imageUrl}` : 'https://via.placeholder.com/80'} 
                                            alt={item.productName} 
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                        <div>
                                            <strong>{item.productName}</strong>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px' }}>{item.price.toLocaleString()} đ</td>
                                    <td style={{ padding: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', width: 'fit-content', borderRadius: '4px' }}>
                                            <button 
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                style={{ padding: '5px 10px', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                <FaMinus size={10} />
                                            </button>
                                            <span style={{ padding: '0 10px' }}>{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                style={{ padding: '5px 10px', background: 'none', border: 'none', cursor: 'pointer' }}
                                            >
                                                <FaPlus size={10} />
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '10px', color: '#d32f2f', fontWeight: 'bold' }}>
                                        {(item.price * item.quantity).toLocaleString()} đ
                                    </td>
                                    <td style={{ padding: '10px' }}>
                                        <button 
                                            onClick={() => removeFromCart(item.productId)}
                                            style={{ color: '#999', background: 'none', border: 'none', cursor: 'pointer' }}
                                            title="Xóa"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div style={{ marginTop: '20px' }}>
                        <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#333' }}>
                            <FaArrowLeft /> Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>

                {/* Tổng tiền & Thanh toán */}
                <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
                    <h3>Cộng giỏ hàng</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', fontSize: '18px', fontWeight: 'bold' }}>
                        <span>Tổng tiền:</span>
                        <span style={{ color: '#d32f2f' }}>{cartTotal.toLocaleString()} đ</span>
                    </div>
                    <button 
                        onClick={() => alert("Chức năng thanh toán đang phát triển!")}
                        style={{ width: '100%', padding: '15px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
                    >
                        TIẾN HÀNH THANH TOÁN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;