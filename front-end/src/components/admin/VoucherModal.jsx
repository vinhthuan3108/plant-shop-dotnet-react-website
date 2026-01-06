import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
// 1. Import SweetAlert2

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
        usageLimit: 100,
        isActive: true // 2. Thêm trạng thái mặc định
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
                    usageLimit: editingVoucher.usageLimit || 0,
                    isActive: editingVoucher.isActive // 3. Lấy trạng thái từ voucher đang sửa
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
                    usageLimit: 100,
                    isActive: true // Mặc định thêm mới là active
                });
            }
        }
    }, [isOpen, editingVoucher]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Xử lý riêng cho select boolean nếu cần, nhưng với select value string "true"/"false" thì cần parse
        const val = name === 'isActive' ? (value === 'true') : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = () => {
        // 1. Kiểm tra Mã code
        if (!formData.code.trim()) {
            return Swal.fire({
                title: 'Thiếu thông tin',
                text: 'Mã code không được trống',
                icon: 'warning'
            });
        }
        
        // 2. Kiểm tra ngày
        if (!formData.startDate) {
            return Swal.fire({
                title: 'Thiếu thông tin',
                text: 'Vui lòng chọn ngày bắt đầu!',
                icon: 'warning'
            });
        }
        if (!formData.endDate) {
            return Swal.fire({
                title: 'Thiếu thông tin',
                text: 'Vui lòng chọn ngày kết thúc!',
                icon: 'warning'
            });
        }

        // 3. Kiểm tra logic ngày
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end < start) {
            return Swal.fire({
                title: 'Lỗi thời gian',
                text: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!',
                icon: 'error'
            });
        }

        // 4. Validate giá trị âm
        if (formData.discountValue < 0 || formData.minOrderValue < 0) {
             return Swal.fire({
                title: 'Lỗi giá trị',
                text: 'Giá trị giảm hoặc đơn tối thiểu không được âm.',
                icon: 'warning'
            });
        }

        // Chuẩn bị dữ liệu gửi đi
        const payload = {
            ...formData,
            discountValue: Number(formData.discountValue),
            maxDiscountAmount: Number(formData.maxDiscountAmount),
            minOrderValue: Number(formData.minOrderValue),
            usageLimit: Number(formData.usageLimit),
            isActive: formData.isActive // Gửi trạng thái lên server
        };
        onSubmit(payload);
    };

    // Style chung cho input
    const inputStyle = { width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '500' };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', 
            zIndex: 1000 // Modal z-index
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                
                <h3>{editingVoucher ? 'Cập Nhật Voucher' : 'Tạo Mã Giảm Giá Mới'}</h3>
                
                {/* 4. Thêm phần chỉnh trạng thái (Chỉ hiện khi đang Edit) */}
                {editingVoucher && (
                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #e9ecef' }}>
                        <label style={{...labelStyle, color: '#4e73df'}}>Trạng thái hoạt động:</label>
                        <select 
                            name="isActive" 
                            value={formData.isActive} 
                            onChange={handleChange} 
                            style={{...inputStyle, marginBottom: 0, borderColor: formData.isActive ? '#28a745' : '#6c757d'}}
                        >
                            <option value="true">Đang kích hoạt (Mở)</option>
                            <option value="false">Ngừng kích hoạt (Khóa)</option>
                        </select>
                        <small style={{color: '#666', fontStyle: 'italic'}}>
                            * Lưu ý: Nếu chọn "Mở" nhưng ngày kết thúc đã qua, hệ thống vẫn tính là "Hết hạn".
                        </small>
                    </div>
                )}

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