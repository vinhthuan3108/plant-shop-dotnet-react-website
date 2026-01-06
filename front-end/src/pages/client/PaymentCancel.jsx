import React, { useEffect, useContext, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../../context/CartContext';
import { API_BASE } from '../../utils/apiConfig.jsx';
import Swal from 'sweetalert2';

const PaymentCancel = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Thêm hàm clearCart từ Context để dọn dẹp trước khi khôi phục
    const { addToCart, clearCart } = useContext(CartContext); 
    
    const [status, setStatus] = useState("Đang xử lý hoàn tác...");

    // QUAN TRỌNG: Dùng useRef để chặn useEffect chạy 2 lần
    const hasRun = useRef(false);

    useEffect(() => {
        const restoreCartAndCancelOrder = async () => {
            // 1. Nếu đã chạy rồi thì dừng ngay (Chặn lỗi nhân đôi/nhân ba sản phẩm)
            if (hasRun.current) return;
            hasRun.current = true;

            const orderCode = searchParams.get('orderCode');

            if (!orderCode) {
                navigate('/');
                return;
            }

            try {
                // 2. Gọi API lấy thông tin đơn hàng
                const resOrder = await axios.get(`${API_BASE}/api/Orders/${orderCode}`);
                
                // Kiểm tra cấu trúc dữ liệu trả về (chữ hoa/thường tùy backend của bạn)
                // Theo controller tôi viết ở trên thì nó nằm trong `resOrder.data.items`
                const items = resOrder.data.items || resOrder.data.Items; 

                if (items && items.length > 0) {
                    // 3. Xóa sạch giỏ hàng hiện tại trước khi khôi phục (để tránh cộng dồn với cái cũ)
                    clearCart(); 

                    // 4. Thêm lại từng món
                    items.forEach(item => {
                        addToCart({
                            variantId: item.variantId || item.VariantId,
                            quantity: item.quantity || item.Quantity,
                            productName: item.productName || item.ProductName,
                            price: item.price || item.Price,
                            // Thêm các trường khác nếu addToCart của bạn cần (ảnh, slug...)
                        });
                    });
                }

                // 5. Gọi API Hủy đơn hàng trong Database
                await axios.put(`${API_BASE}/api/Orders/cancel-order/${orderCode}`);

                // 6. Thông báo và chuyển hướng
                Swal.fire({
                    icon: 'info',
                    title: 'Đã hủy thanh toán',
                    text: 'Giỏ hàng của bạn đã được khôi phục.',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    navigate('/checkout');
                });

            } catch (error) {
                console.error("Lỗi hoàn tác:", error);
                setStatus("Có lỗi xảy ra, vui lòng kiểm tra lại đơn hàng.");
                // Vẫn cho về checkout sau 3s để khách không bị kẹt
                setTimeout(() => navigate('/checkout'), 3000);
            }
        };

        restoreCartAndCancelOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Dependency rỗng để chỉ chạy khi mount

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2 style={{color: '#d32f2f'}}>Giao dịch đã bị hủy</h2>
            <p>{status}</p>
            <div className="spinner-border text-danger" role="status" style={{margin: '20px auto', display: 'block'}}>
                <span className="sr-only">Loading...</span>
            </div>
            <p style={{fontStyle: 'italic', color: '#666'}}>Đang khôi phục giỏ hàng và chuyển hướng...</p>
        </div>
    );
};

export default PaymentCancel;