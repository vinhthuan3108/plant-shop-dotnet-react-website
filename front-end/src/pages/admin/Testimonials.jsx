import { useState, useEffect } from 'react';
import TestimonialModal from "../../components/admin/TestimonialModal"; // Nhớ import đúng đường dẫn

function Testimonials() {
    const [testimonials, setTestimonials] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const API_HOST = 'https://localhost:7298';
    // Đường dẫn API
    const API_URL = 'https://localhost:7298/api/TblTestimonials';
    const getImageUrl = (url) => {
    if (!url) return null;
    // Nếu link đã là http... (link ngoài) thì giữ nguyên
    if (url.startsWith('http')) return url;
    // Nếu là link nội bộ (/testimonials/...) thì nối thêm domain API
    return `${API_HOST}${url}`;
}
    const fetchTestimonials = () => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                // Sắp xếp: Mới nhất lên đầu (theo ID giảm dần) hoặc theo logic bạn muốn
                const sortedData = data.sort((a, b) => b.testimonialId - a.testimonialId);
                setTestimonials(sortedData);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchTestimonials(); }, []);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSaveFromModal = async (formData) => {
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `${API_URL}/${editingItem.testimonialId}` : API_URL;
        
        // Nếu là sửa thì phải gán ID vào object gửi đi
        if (editingItem) formData.testimonialId = editingItem.testimonialId;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchTestimonials(); // Load lại danh sách
            } else {
                const err = await res.json(); // Có thể lỗi parse nếu API không trả về JSON chuẩn
                alert('Lỗi: ' + (err.title || 'Có lỗi xảy ra'));
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối API");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn chắc chắn muốn xóa đánh giá này?')) {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchTestimonials();
        }
    };

    // Hàm render số sao ra icon cho đẹp
    const renderStars = (count) => {
        return "⭐".repeat(count);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Đánh Giá Giả</h2>

            <button onClick={handleOpenAdd} style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                + Thêm đánh giá
            </button>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th style={{ padding: '10px', width: '80px' }}>Avatar</th>
                        <th style={{ padding: '10px' }}>Thông tin khách</th>
                        <th style={{ padding: '10px' }}>Nội dung</th>
                        <th style={{ padding: '10px', width: '100px', textAlign: 'center' }}>Đánh giá</th>
                        <th style={{ padding: '10px', width: '120px', textAlign: 'center' }}>Trạng thái</th>
                        <th style={{ padding: '10px', width: '150px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {testimonials.map(item => (
                        <tr key={item.testimonialId}>
                            {/* Cột Avatar */}
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                {item.avatarUrl ? (
                                    <img 
                                        src={getImageUrl(item.avatarUrl)} // <-- GỌI HÀM Ở ĐÂY
                                        alt="avt" 
                                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} 
                                    />
                                ) : (
                                    <span style={{ fontSize: '12px', color: '#999' }}>No img</span>
                                )}
                            </td>

                            {/* Cột Tên & Chức vụ */}
                            <td style={{ padding: '10px' }}>
                                <strong>{item.name}</strong> <br />
                                <span style={{ fontSize: '13px', color: '#666' }}>{item.role}</span>
                            </td>

                            {/* Cột Nội dung */}
                            <td style={{ padding: '10px' }}>
                                {item.content}
                            </td>

                            {/* Cột Sao */}
                            <td style={{ padding: '10px', textAlign: 'center', color: '#FFD700' }}>
                                {renderStars(item.rating || 0)}
                            </td>

                            {/* Cột Trạng thái */}
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                {item.isActive ? (
                                    <span style={{ backgroundColor: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                        Hiển thị
                                    </span>
                                ) : (
                                    <span style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                        Ẩn
                                    </span>
                                )}
                            </td>

                            {/* Cột Nút bấm */}
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button
                                    onClick={() => handleOpenEdit(item)}
                                    style={{ marginRight: '8px', padding: '5px 10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    Sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(item.testimonialId)}
                                    style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <TestimonialModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveFromModal}
                initialData={editingItem}
            />
        </div>
    );
}

export default Testimonials;