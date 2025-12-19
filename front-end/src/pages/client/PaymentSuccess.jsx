import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    
    // Đơn giản là chuyển hướng về trang OrderSuccess
    useEffect(() => {
        // Có thể gọi thêm API check lại status nếu cần chắc chắn
        setTimeout(() => {
            navigate('/order-success');
        }, 1000); // Đợi 1s cho mượt
    }, [navigate]);

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h2>Thanh toán thành công! Đang chuyển hướng...</h2>
        </div>
    );
};

export default PaymentSuccess;