import { useState, useEffect } from 'react';
import Swal from 'sweetalert2'; // 1. Import SweetAlert

function SupplierModal({ isOpen, onClose, onSave, selectedSupplier }) {

    const [supplierName, setSupplierName] = useState('');
    const [email, setEmail] = useState(''); 
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        if (selectedSupplier) {
            setSupplierName(selectedSupplier.supplierName);
            setEmail(selectedSupplier.email || ''); 
            setPhoneNumber(selectedSupplier.phoneNumber || '');
            setAddress(selectedSupplier.address || '');
            setNote(selectedSupplier.note || '');
        } else {
            setSupplierName('');
            setEmail('');
            setPhoneNumber('');
            setAddress('');
            setNote('');
        }
    }, [selectedSupplier, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        // 2. Thay alert bằng SweetAlert
        if (!supplierName.trim()) {
            return Swal.fire({
                title: 'Thiếu thông tin!',
                text: 'Tên nhà cung cấp không được để trống.',
                icon: 'warning',
                confirmButtonText: 'Đã hiểu'
            });
        }

        const formData = {
            supplierName,
            email, 
            phoneNumber,
            address,
            note
        };
        
        if (selectedSupplier) formData.supplierId = selectedSupplier.supplierId;
        
        onSave(formData);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', 
            zIndex: 1000 // Z-index modal
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h3>{selectedSupplier ? 'Cập Nhật Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}</h3>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên nhà cung cấp:</label>
                    <input 
                        type="text" 
                        value={supplierName} 
                        onChange={e => setSupplierName(e.target.value)} 
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} 
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="example@gmail.com"
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} 
                    />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Số điện thoại:</label>
                    <input 
                        type="text" 
                        value={phoneNumber} 
                        onChange={e => setPhoneNumber(e.target.value)} 
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} 
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Địa chỉ:</label>
                    <input 
                        type="text" 
                        value={address} 
                        onChange={e => setAddress(e.target.value)} 
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} 
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ghi chú:</label>
                    <textarea 
                        value={note} 
                        onChange={e => setNote(e.target.value)} 
                        style={{ width: '100%', height: '60px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} 
                        placeholder="Ví dụ: Chuyên cung cấp sen đá..."
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default SupplierModal;