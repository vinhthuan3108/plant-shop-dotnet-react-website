import React, { useState, useEffect } from 'react';

const VoucherModal = ({ isOpen, onClose, onSubmit, editingVoucher }) => {
    // State quản lý form
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'FIXED',
        discountValue: 0,
        maxDiscountAmount: 0,
        minOrderValue: 0,
        startDate: '',
        endDate: '',
        usageLimit: 100
    });

    useEffect(() => {
        if (isOpen) {
            if (editingVoucher) {
                // Format ngày giờ để hiển thị input datetime-local
                const formatDateTime = (dateString) => {
                    if (!dateString) return '';
                    return new Date(dateString).toISOString().slice(0, 16);
                };

                setFormData({
                    code: editingVoucher.code,
                    discountType: editingVoucher.discountType,
                    discountValue: editingVoucher.discountValue,
                    maxDiscountAmount: editingVoucher.maxDiscountAmount || 0,
                    minOrderValue: editingVoucher.minOrderValue || 0,
                    startDate: formatDateTime(editingVoucher.startDate),
                    endDate: formatDateTime(editingVoucher.endDate),
                    usageLimit: editingVoucher.usageLimit || 0
                });
            } else {
                // Reset form khi thêm mới
                setFormData({
                    code: '',
                    discountType: 'FIXED',
                    discountValue: 0,
                    maxDiscountAmount: 0,
                    minOrderValue: 0,
                    startDate: new Date().toISOString().slice(0, 16),
                    endDate: '',
                    usageLimit: 100
                });
            }
        }
    }, [isOpen, editingVoucher]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        // 1. Kiểm tra Mã code
        if (!formData.code.trim()) return alert("Mã code không được trống");

        // 2. Kiểm tra xem đã chọn ngày chưa (Thêm đoạn này)
        if (!formData.startDate) return alert("Vui lòng chọn ngày bắt đầu!");
        if (!formData.endDate) return alert("Vui lòng chọn ngày kết thúc!");

        // 3. Kiểm tra logic ngày (Kết thúc phải sau Bắt đầu)
        // Lưu ý: new Date() cần chuỗi đúng định dạng, nếu rỗng sẽ ra Invalid Date
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end < start) {
            return alert("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
        }

        // Chuẩn bị dữ liệu gửi đi
        const payload = {
            ...formData,
            discountValue: Number(formData.discountValue),
            maxDiscountAmount: Number(formData.maxDiscountAmount),
            minOrderValue: Number(formData.minOrderValue),
            usageLimit: Number(formData.usageLimit)
        };
        
        onSubmit(payload);
    };
    // Style chung cho input
    const inputStyle = { width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '500' };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3>{editingVoucher ? 'Cập Nhật Voucher' : 'Tạo Mã Giảm Giá Mới'}</h3>
                
                {/* Hàng 1: Code + Số lượng */}
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Mã Code:</label>
                        <input 
                            type="text" 
                            name="code"
                            value={formData.code} 
                            onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                            style={inputStyle}
                            disabled={!!editingVoucher} 
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Số lượng giới hạn:</label>
                        <input type="number" name="usageLimit" value={formData.usageLimit} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>

                {/* Hàng 2: Loại + Giá trị */}
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Loại giảm giá:</label>
                        <select name="discountType" value={formData.discountType} onChange={handleChange} style={inputStyle} disabled={!!editingVoucher}>
                            <option value="FIXED">Số tiền (VNĐ)</option>
                            <option value="PERCENT">Phần trăm (%)</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Giá trị giảm:</label>
                        <input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} style={inputStyle} disabled={!!editingVoucher} />
                    </div>
                </div>

                {/* Hàng 3: Max giảm (nếu là %) + Đơn tối thiểu */}
                <div style={{ display: 'flex', gap: '20px' }}>
                    {formData.discountType === 'PERCENT' && (
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Giảm tối đa (VNĐ):</label>
                            <input type="number" name="maxDiscountAmount" value={formData.maxDiscountAmount} onChange={handleChange} style={inputStyle} />
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Đơn tối thiểu:</label>
                        <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>

                {/* Hàng 4: Ngày tháng */}
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Ngày bắt đầu:</label>
                        <input type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Ngày kết thúc:</label>
                        <input type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} style={inputStyle} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default VoucherModal;