import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
function CategoryModal({ isOpen, onClose, onSubmit, initialData }) {

    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [order, setOrder] = useState(0);
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (initialData) {
            setName(initialData.categoryName);
            setDesc(initialData.description || '');
            setOrder(initialData.displayOrder);
            setActive(initialData.isActive);
        } else {
            setName('');
            setDesc('');
            setOrder(0);
            setActive(true);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;
    const handleSubmit = () => {
        // VALIDATION: Kiểm tra tên trống
        if (!name.trim()) {
            return Swal.fire({
                title: 'Thiếu thông tin!',
                text: 'Tên danh mục không được để trống.',
                icon: 'warning',
                confirmButtonText: 'Đã hiểu'
            });
        }

        const formData = {
            categoryName: name,
            description: desc,
            displayOrder: parseInt(order),
            isActive: active
        };
        
        onSubmit(formData);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0 }}>{initialData ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục Mới'}</h3>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên danh mục:</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mô tả:</label>
                    <textarea 
                        value={desc} 
                        onChange={e => setDesc(e.target.value)} 
                        style={{ width: '100%', height: '60px', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
                    />
                </div>

                {/* --- PHẦN ĐÃ CHỈNH SỬA --- */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '20px' }}>
                    
                    {/* Phần Thứ tự */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Thứ tự:</label>
                        <input 
                            type="number" 
                            value={order} 
                            onChange={e => setOrder(e.target.value)} 
                            style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} 
                        />
                    </div>

                    {/* Phần Checkbox Hoạt động */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                            <input 
                                type="checkbox" 
                                checked={active} 
                                onChange={e => setActive(e.target.checked)} 
                                style={{ width: '18px', height: '18px', marginRight: '8px', cursor: 'pointer' }}
                            /> 
                            Hoạt động
                        </label>
                    </div>

                </div>
                {/* ------------------------- */}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default CategoryModal;