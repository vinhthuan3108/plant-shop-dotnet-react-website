import { useState, useEffect } from 'react';

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
        if (!name.trim()) return alert("Tên không được trống");

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
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>

            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px' }}>
                <h3>{initialData ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục Mới'}</h3>
                
                <div style={{ marginBottom: '10px' }}>
                    <label>Tên danh mục:</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                    <label>Mô tả:</label>
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} style={{ width: '100%', height: '60px' }} />
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label>Thứ tự:</label>
                        <input type="number" value={order} onChange={e => setOrder(e.target.value)} style={{ width: '60px' }} />
                    </div>
                    <div>
                        <label>
                            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Hoạt động
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 15px', backgroundColor: '#ccc' }}>Hủy</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white' }}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default CategoryModal;