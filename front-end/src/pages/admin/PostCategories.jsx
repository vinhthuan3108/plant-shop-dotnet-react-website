import { useState, useEffect } from 'react';
import PostCategoryModal from '../../components/admin/PostCategoryModal';
import { API_BASE } from '../../utils/apiConfig.jsx';
function PostCategories() {
    // --- STATE DỮ LIỆU ---
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // --- STATE PHÂN TRANG (MỚI) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị mỗi trang

    const API_URL = `${API_BASE}/api/TblPostCategories`;

    const fetchCategories = () => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                // Reset về trang 1 khi load lại dữ liệu
                setCurrentPage(1);
            })
            .catch(err => console.error("Lỗi fetch:", err));
    };

    useEffect(() => { fetchCategories(); }, []);

    // --- LOGIC PHÂN TRANG (Client-side) ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = categories.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(categories.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleSaveFromModal = async (formData) => {
        const isEdit = !!editingItem;
        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `${API_URL}/${editingItem.postCategoryId}` : API_URL;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchCategories();
            } else {
                alert('Có lỗi xảy ra khi lưu dữ liệu');
            }
        } catch (error) {
            console.error("Lỗi save:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
            try {
                const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (res.ok) fetchCategories();
            } catch (error) {
                console.error("Lỗi delete:", error);
            }
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản Lý Danh Mục Bài Đăng</h2>
            
            <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Thêm mới danh mục
            </button>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            {/* CỘT STT MỚI */}
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                            <th style={{ padding: '12px', width: '25%' }}>Tên Danh Mục</th>
                            <th style={{ padding: '12px' }}>Mô tả</th>
                            <th style={{ padding: '12px', width: '150px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map((item, index) => {
                            // TÍNH STT
                            const stt = (currentPage - 1) * itemsPerPage + index + 1;

                            return (
                                <tr key={item.postCategoryId} style={{ borderBottom: '1px solid #eee' }}>
                                    {/* Hiển thị STT */}
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>

                                    <td style={{ padding: '12px', verticalAlign: 'top', wordBreak: 'break-word' }}>
                                        <strong style={{color: '#333'}}>{item.categoryName}</strong>
                                    </td>
                                    <td style={{ padding: '12px', verticalAlign: 'top', wordBreak: 'break-word', color: '#555' }}>
                                        {item.description}
                                    </td>
                                    
                                    {/* CỘT THAO TÁC (Giao diện mới) */}
                                    <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'middle' }}>
                                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                            style={{ 
                                                marginRight: '8px', 
                                                cursor: 'pointer', 
                                                background: 'transparent', 
                                                color: '#4e73df', 
                                                border: '1px solid #4e73df', 
                                                padding: '5px 10px', 
                                                borderRadius: '4px', 
                                                fontSize: '12px' 
                                            }}>
                                            Sửa
                                        </button>
                                        <button onClick={() => handleDelete(item.postCategoryId)}
                                            style={{ 
                                                cursor: 'pointer', 
                                                background: 'transparent', 
                                                color: '#e74a3b', 
                                                border: '1px solid #e74a3b', 
                                                padding: '5px 10px', 
                                                borderRadius: '4px', 
                                                fontSize: '12px' 
                                            }}>
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    Chưa có danh mục nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* --- THANH PHÂN TRANG UI --- */}
                {categories.length > itemsPerPage && (
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

            <PostCategoryModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveFromModal}
                initialData={editingItem}
            />
        </div>
    );
}

export default PostCategories;