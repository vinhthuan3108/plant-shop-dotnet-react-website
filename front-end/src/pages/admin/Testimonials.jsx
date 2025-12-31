import { useState, useEffect } from 'react';
import TestimonialModal from "../../components/admin/TestimonialModal";
// Nhớ import đúng đường dẫn

function Testimonials() {
    // --- STATE DỮ LIỆU ---
    const [testimonials, setTestimonials] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    // --- STATE PHÂN TRANG (MỚI) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị mỗi trang

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
                // Sắp xếp: Mới nhất lên đầu (theo ID giảm dần)
                const sortedData = data.sort((a, b) => b.testimonialId - a.testimonialId);
                setTestimonials(sortedData);
                // Reset về trang 1 khi load lại dữ liệu
                setCurrentPage(1);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchTestimonials(); }, []);

    // --- LOGIC PHÂN TRANG (MỚI) ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = testimonials.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(testimonials.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
                fetchTestimonials();
                // Load lại danh sách
            } else {
                const err = await res.json();
                // Có thể lỗi parse nếu API không trả về JSON chuẩn
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
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản Lý Đánh Giá Giả</h2>

            <button onClick={handleOpenAdd} style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Thêm đánh giá
            </button>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            {/* CỘT STT MỚI */}
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                            <th style={{ padding: '12px', width: '80px' }}>Avatar</th>
                            <th style={{ padding: '12px' }}>Thông tin khách</th>
                            <th style={{ padding: '12px' }}>Nội dung</th>
                            <th style={{ padding: '12px', width: '100px', textAlign: 'center' }}>Đánh giá</th>
                            <th style={{ padding: '12px', width: '120px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '12px', width: '150px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map((item, index) => {
                            // TÍNH STT
                            const stt = (currentPage - 1) * itemsPerPage + index + 1;
                            
                            return (
                                <tr key={item.testimonialId} style={{ borderBottom: '1px solid #eee' }}>
                                    {/* Cột STT */}
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>

                                    {/* Cột Avatar */}
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {item.avatarUrl ? (
                                            <img 
                                                src={getImageUrl(item.avatarUrl)} 
                                                alt="avt" 
                                                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} 
                                            />
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#999' }}>No img</span>
                                        )}
                                    </td>

                                    {/* Cột Tên & Chức vụ */}
                                    <td style={{ padding: '12px' }}>
                                        <strong style={{color: '#333'}}>{item.name}</strong> <br />
                                        <span style={{ fontSize: '13px', color: '#666' }}>{item.role}</span>
                                    </td>

                                    {/* Cột Nội dung */}
                                    <td style={{ padding: '12px', color: '#555' }}>
                                        {item.content}
                                    </td>

                                    {/* Cột Sao */}
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#FFD700' }}>
                                        {renderStars(item.rating || 0)}
                                    </td>

                                    {/* Cột Trạng thái */}
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
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

                                    {/* Cột Nút bấm (GIAO DIỆN MỚI) */}
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleOpenEdit(item)}
                                            style={{ 
                                                marginRight: '8px', 
                                                cursor: 'pointer', 
                                                background: 'transparent', 
                                                color: '#4e73df', 
                                                border: '1px solid #4e73df', 
                                                padding: '5px 10px', 
                                                borderRadius: '4px', 
                                                fontSize: '12px' 
                                            }}
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.testimonialId)}
                                            style={{ 
                                                cursor: 'pointer', 
                                                background: 'transparent', 
                                                color: '#dc3545', 
                                                border: '1px solid #dc3545', 
                                                padding: '5px 10px', 
                                                borderRadius: '4px', 
                                                fontSize: '12px' 
                                            }}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan="7" style={{textAlign:'center', padding:'30px', color:'#888'}}>Chưa có đánh giá nào.</td></tr>
                        )}
                    </tbody>
                </table>

                {/* --- THANH PHÂN TRANG UI (COPY TỪ ADMINPRODUCT) --- */}
                {testimonials.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '5px', borderTop: '1px solid #eee' }}>
                        
                        {/* NHÓM NÚT TRÁI */}
                        {currentPage > 1 && (
                            <>
                                <button 
                                    onClick={() => paginate(1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Về trang đầu"
                                >
                                    &#171; Đầu
                                </button>
                                <button 
                                    onClick={() => paginate(currentPage - 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    &lsaquo; Trước
                                </button>
                            </>
                        )}

                        {/* DANH SÁCH SỐ TRANG */}
                        {(() => {
                            let startPage, endPage;
                            if (totalPages <= 10) {
                                startPage = 1;
                                endPage = totalPages;
                            } else {
                                if (currentPage <= 6) {
                                    startPage = 1;
                                    endPage = 10;
                                } else if (currentPage + 4 >= totalPages) {
                                    startPage = totalPages - 9;
                                    endPage = totalPages;
                                } else {
                                    startPage = currentPage - 5;
                                    endPage = currentPage + 4;
                                }
                            }

                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(i);
                            }

                            return pages.map(number => (
                                <button 
                                    key={number} 
                                    onClick={() => paginate(number)}
                                    style={{ 
                                        padding: '6px 12px', 
                                        border: '1px solid #ddd', 
                                        background: currentPage === number ? '#4e73df' : 'white', 
                                        color: currentPage === number ? 'white' : '#333',
                                        cursor: 'pointer', 
                                        borderRadius: '4px',
                                        fontWeight: currentPage === number ? 'bold' : 'normal',
                                        fontSize: '13px',
                                        minWidth: '32px'
                                    }}
                                >
                                    {number}
                                </button>
                            ));
                        })()}

                        {/* NHÓM NÚT PHẢI */}
                        {currentPage < totalPages && (
                            <>
                                <button 
                                    onClick={() => paginate(currentPage + 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    Sau &rsaquo;
                                </button>
                                <button 
                                    onClick={() => paginate(totalPages)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Đến trang cuối"
                                >
                                    Cuối &#187;
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

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