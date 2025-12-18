import { useState, useEffect } from 'react';

function PostCategoryModal({ isOpen, onClose, onSubmit, initialData }) {
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.categoryName || '');
            setDesc(initialData.description || '');
        } else {
            setName(''); setDesc('');
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim()) return alert("Tên không được trống");
        const formData = {
            categoryName: name,
            description: desc
        };
        if (initialData) formData.postCategoryId = initialData.postCategoryId;
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
                <h3>{initialData ? 'Sửa Danh Mục' : 'Thêm Danh Mục'}</h3>
                <div style={{ marginBottom: '10px' }}>
                    <label>Tên danh mục:</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Mô tả:</label>
                    <textarea value={desc} onChange={e => setDesc(e.target.value)} style={{ width: '100%', height: '80px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 15px' }}>Hủy</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default PostCategoryModal;