import { useState, useEffect } from 'react';

function BannerModal({ isOpen, onClose, onSubmit, initialData }) {
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [order, setOrder] = useState(0);
    const [active, setActive] = useState(true);
    
    // State xử lý ảnh
    const [selectedFile, setSelectedFile] = useState(null); // File user chọn
    const [currentImageUrl, setCurrentImageUrl] = useState(''); // Link ảnh (cũ hoặc mới)
    const [previewUrl, setPreviewUrl] = useState(''); // Để hiển thị xem trước

    const API_DOMAIN = 'https://localhost:7298'; 

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setLink(initialData.linkUrl || '');
            setOrder(initialData.displayOrder || 0);
            setActive(initialData.isActive ?? true);
            setCurrentImageUrl(initialData.imageUrl || ''); // Lưu link ảnh cũ
            setPreviewUrl(initialData.imageUrl ? `${API_DOMAIN}${initialData.imageUrl}` : '');
        } else {
            resetForm();
        }
    }, [initialData, isOpen]);

    const resetForm = () => {
        setTitle('');
        setLink('');
        setOrder(0);
        setActive(true);
        setSelectedFile(null);
        setCurrentImageUrl('');
        setPreviewUrl('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Xem trước ảnh vừa chọn
        }
    };

    // Hàm upload ảnh riêng
    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        // Gọi vào API UploadController bạn vừa gửi, type="banners"
        const res = await fetch(`${API_DOMAIN}/api/Upload/banners`, {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) throw new Error('Lỗi upload ảnh');
        const data = await res.json();
        return data.url; // Trả về: /banners/abc.jpg
    };

    const handleSave = async () => {
        // Validate
        if (!title.trim()) return alert("Nhập tiêu đề banner");
        if (!initialData && !selectedFile) return alert("Vui lòng chọn ảnh!");

        try {
            let finalImageUrl = currentImageUrl; // Mặc định dùng link cũ

            // Nếu người dùng có chọn file mới -> Upload lấy link mới
            if (selectedFile) {
                finalImageUrl = await uploadImage(selectedFile);
            }

            // Tạo object JSON chuẩn
            const bannerData = {
                title: title,
                linkUrl: link,
                displayOrder: parseInt(order),
                isActive: active,
                imageUrl: finalImageUrl // Gán link ảnh vào đây
            };

            onSubmit(bannerData); // Gửi JSON về component cha
            
        } catch (error) {
            alert("Có lỗi khi xử lý ảnh: " + error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px' }}>
                <h3>{initialData ? 'Cập Nhật Banner' : 'Thêm Banner Mới'}</h3>
                
                {/* Chọn ảnh */}
                <div style={{ marginBottom: '15px' }}>
                    <label>Hình ảnh:</label> <br/>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    {previewUrl && (
                        <div style={{ marginTop: '10px' }}>
                            <img src={previewUrl} alt="Preview" style={{ height: '100px', border: '1px solid #ddd' }} />
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Tiêu đề:</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                    <label>Link liên kết:</label>
                    <input type="text" value={link} onChange={e => setLink(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label>Thứ tự: </label>
                        <input type="number" value={order} onChange={e => setOrder(e.target.value)} style={{ width: '60px' }} />
                    </div>
                    <div>
                         <label>
                            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Hiển thị
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose}>Hủy</button>
                    <button onClick={handleSave} style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 15px', border: 'none' }}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default BannerModal;