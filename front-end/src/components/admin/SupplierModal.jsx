import React, { useState, useEffect } from 'react';

const SupplierModal = ({ isOpen, onClose, onSave, selectedSupplier }) => {
    // Khởi tạo state với đầy đủ các trường bao gồm 'note'
    const [supplier, setSupplier] = useState({ 
        supplierName: '', 
        phoneNumber: '', 
        address: '', 
        note: '' 
    });

    useEffect(() => {
        if (selectedSupplier) {
            setSupplier(selectedSupplier);
        } else {
            setSupplier({ supplierName: '', phoneNumber: '', address: '', note: '' });
        }
    }, [selectedSupplier, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{selectedSupplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</h2>
                
                <div className="form-group">
                    <label>Tên nhà cung cấp:</label>
                    <input 
                        type="text" 
                        value={supplier.supplierName}
                        onChange={(e) => setSupplier({...supplier, supplierName: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Số điện thoại:</label>
                    <input 
                        type="text" 
                        value={supplier.phoneNumber || ''}
                        onChange={(e) => setSupplier({...supplier, phoneNumber: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Địa chỉ:</label>
                    <input 
                        type="text" 
                        value={supplier.address || ''}
                        onChange={(e) => setSupplier({...supplier, address: e.target.value})}
                    />
                </div>

                {/* --- Ô Ghi chú bổ sung ở đây --- */}
                <div className="form-group">
                    <label>Ghi chú:</label>
                    <textarea 
                        rows="3"
                        placeholder="Ví dụ: Chuyên các loại sen đá, hỗ trợ vận chuyển..."
                        value={supplier.note || ''}
                        onChange={(e) => setSupplier({...supplier, note: e.target.value})}
                    />
                </div>

                <div className="modal-actions">
                    <button className="btn-save" onClick={() => onSave(supplier)}>Lưu dữ liệu</button>
                    <button className="btn-cancel" onClick={onClose}>Hủy bỏ</button>
                </div>
            </div>
        </div>
    );
};

export default SupplierModal;