import { useState, useEffect } from 'react';

function TestimonialModal({ isOpen, onClose, onSubmit, initialData }) {
    const API_HOST = 'https://localhost:7298';
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [content, setContent] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(''); // Lưu link ảnh (text)
    const [rating, setRating] = useState(5);
    const [active, setActive] = useState(true);
    const getImageUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_HOST}${url}`;
    }
    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setRole(initialData.role || '');
            setContent(initialData.content || '');
            setAvatarUrl(initialData.avatarUrl || '');
            setRating(initialData.rating || 5);
            setActive(initialData.isActive ?? true);
        } else {
            // Reset form khi thêm mới
            setName('');
            setRole('');
            setContent('');
            setAvatarUrl('');
            setRating(5);
            setActive(true);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim()) return alert("Tên khách hàng không được trống");
        if (!content.trim()) return alert("Nội dung đánh giá không được trống");

        const formData = {
            name: name,
            role: role,
            content: content,
            avatarUrl: avatarUrl,
            rating: parseInt(rating),
            isActive: active
        };
        onSubmit(formData);
    };
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Gọi đúng type 'testimonials' để backend lưu vào folder testimonials
            const res = await fetch('https://localhost:7298/api/Upload/testimonials', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setAvatarUrl(data.url); // Tự động điền link ảnh vào state
            } else {
                alert('Upload thất bại');
            }
        } catch (error) {
            console.error('Lỗi upload:', error);
            alert('Lỗi kết nối khi upload');
        }
    };
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3>{initialData ? 'Cập Nhật Đánh Giá' : 'Thêm Đánh Giá Mới'}</h3>

                {/* Hàng 1: Tên + Chức vụ */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label>Tên khách hàng:</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Chức vụ/Nghề nghiệp:</label>
                        <input type="text" value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="VD: Nhân viên văn phòng" />
                    </div>
                </div>

                {/* Hàng 2: Link Ảnh Avatar */}
                <div style={{ marginBottom: '10px' }}>
                    <label>Ảnh Avatar:</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="file" onChange={handleUpload} style={{ width: '200px' }} />
                        
                        <input 
                            type="text" 
                            value={avatarUrl} 
                            onChange={e => setAvatarUrl(e.target.value)} 
                            placeholder="Link ảnh..."
                            style={{ flex: 1, padding: '8px' }} 
                        />
                        
                        {/* Xem trước ảnh nhỏ - SỬA Ở ĐÂY */}
                        {avatarUrl && (
                            <img 
                                src={getImageUrl(avatarUrl)} // <-- Gọi hàm xử lý link
                                alt="Preview" 
                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }} 
                            />
                        )}
                    </div>
                </div>

                {/* Hàng 3: Nội dung */}
                <div style={{ marginBottom: '10px' }}>
                    <label>Nội dung đánh giá:</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} style={{ width: '100%', height: '80px', padding: '8px' }} />
                </div>

                {/* Hàng 4: Số sao + Checkbox */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center' }}>
                    <div>
                        <label>Số sao (1-5): </label>
                        <input type="number" min="1" max="5" value={rating} onChange={e => setRating(e.target.value)} style={{ width: '60px', padding: '5px' }} />
                    </div>
                    <div>
                        <label style={{ cursor: 'pointer' }}>
                            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Hiển thị lên web
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default TestimonialModal;