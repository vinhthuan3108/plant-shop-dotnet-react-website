import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InventoryAdjustment = () => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        productId: '',
        type: 'decrease', // Mặc định là giảm (cây héo/chết)
        quantity: 1,
        reason: '' // Chỉ sử dụng một ô nhập lý do
    });

    useEffect(() => {
        // Lấy danh sách sản phẩm để chọn
        axios.get('https://localhost:7298/api/TblProducts')
            .then(res => setProducts(res.data?.$values ?? res.data));
    }, []);

    const handleSubmit = async () => {
        if (!formData.productId) return alert("Vui lòng chọn sản phẩm!");
        if (!formData.reason.trim()) return alert("Vui lòng nhập lý do điều chỉnh!");

        // Tính toán số lượng thực tế gửi lên server (âm nếu Giảm, dương nếu Tăng)
        const adjustedValue = formData.type === 'decrease' 
            ? -Math.abs(formData.quantity) 
            : Math.abs(formData.quantity);

        const payload = {
            productId: parseInt(formData.productId),
            userId: 6, // Tạm thời ID Admin
            quantityAdjusted: adjustedValue,
            reason: formData.reason
        };

        try {
            await axios.post('https://localhost:7298/api/InventoryAdjustments', payload);
            alert("Đã cập nhật tồn kho và lưu lịch sử log!");
            // Reset form
            setFormData({ ...formData, productId: '', quantity: 1, reason: '' });
        } catch (err) {
            alert("Có lỗi xảy ra khi thực hiện điều chỉnh.");
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Phiếu Điều Chỉnh Tồn Kho</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div>
                    <label>Sản phẩm:</label>
                    <select style={{ width: '100%' }} value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})}>
                        <option value="">-- Chọn loại cây --</option>
                        {products.map(p => (
                            <option key={p.productId} value={p.productId}>
                                {p.productName} (Đang tồn: {p.stockQuantity})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Hình thức điều chỉnh:</label>
                    <select style={{ width: '100%' }} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="decrease">Giảm số lượng (Cây hỏng/Chết/Mất mát)</option>
                        <option value="increase">Tăng số lượng (Kiểm kê dư/Sai sót)</option>
                    </select>
                </div>

                <div>
                    <label>Số lượng lệch:</label>
                    <input type="number" min="1" style={{ width: '100%' }} value={formData.quantity} 
                        onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                </div>

                <div>
                    <label>Lý do điều chỉnh (Bắt buộc):</label>
                    <textarea 
                        rows="4" 
                        style={{ width: '100%' }} 
                        placeholder="Ví dụ: Cây bị héo lá do sâu bệnh, vỡ chậu khi di chuyển..."
                        value={formData.reason} 
                        onChange={e => setFormData({...formData, reason: e.target.value})} 
                    />
                </div>

                <button 
                    onClick={handleSubmit} 
                    style={{ background: '#ff9800', color: 'white', border: 'none', padding: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    XÁC NHẬN CẬP NHẬT KHO
                </button>
            </div>
        </div>
    );
};

export default InventoryAdjustment;