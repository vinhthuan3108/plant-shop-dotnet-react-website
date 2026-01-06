import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const OrderSuccess = () => {
    const location = useLocation();

    return (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <FaCheckCircle size={80} color="#2e7d32" style={{ marginBottom: '20px' }} />
            <h1 style={{ color: '#2e7d32' }}>ĐẶT HÀNG THÀNH CÔNG!</h1>
            <p style={{ fontSize: '18px', margin: '20px 0' }}>Cảm ơn bạn đã mua sắm tại Cây Cảnh Nha Trang.</p>
            
            
            <div style={{ marginTop: '40px' }}>
                <Link to="/" style={{ padding: '10px 25px', backgroundColor: '#333', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                    Về trang chủ
                </Link>
                <Link to="/products" style={{ padding: '10px 25px', backgroundColor: '#2e7d32', color: 'white', textDecoration: 'none', borderRadius: '4px', marginLeft: '10px' }}>
                    Tiếp tục mua sắm
                </Link>
            </div>
        </div>
    );
};

export default OrderSuccess;