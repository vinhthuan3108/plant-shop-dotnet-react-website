import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCancel = () => {
    return (
        <div style={{ textAlign: 'center', marginTop: '100px', color: 'red' }}>
            <h2>Giao dịch đã bị hủy</h2>
            <p>Bạn đã hủy quá trình thanh toán.</p>
            <Link to="/checkout" style={{ color: 'blue', textDecoration: 'underline' }}>Quay lại trang thanh toán</Link>
        </div>
    );
};

export default PaymentCancel;