import { useState, useEffect } from 'react';
import CategoryModal from "../../components/admin/CategoryModal"
import { API_BASE } from '../../utils/apiConfig.jsx';
import Swal from 'sweetalert2';
function Categories() {
    // --- STATE DỮ LIỆU ---
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // --- STATE PHÂN TRANG (MỚI) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị mỗi trang

    const API_URL = `${API_BASE}/api/TblCategories`; 

    const fetchCategories = () => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                // Sắp xếp theo thứ tự hiển thị (nhỏ lên trước)
                const sortedData = data
                    .filter(x => !x.isDeleted)
                    .sort((a, b) => a.displayOrder - b.displayOrder);
                setCategories(sortedData);
                // Reset về trang 1 khi load lại dữ liệu
                setCurrentPage(1);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchCategories(); }, []);

    // --- LOGIC PHÂN TRANG (Client-side) ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = categories.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(categories.length / itemsPerPage);
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
        const url = editingItem ? `${API_URL}/${editingItem.categoryId}` : API_URL;
        if (editingItem) formData.categoryId = editingItem.categoryId;
        
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
                const err = await res.json();
                alert('Lỗi: ' + (err.message || 'Có lỗi xảy ra'));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        // Thay window.confirm bằng Swal
        const result = await Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?',
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // Màu đỏ cho nút xóa
            cancelButtonColor: '#3085d6', // Màu xanh cho nút hủy
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy bỏ'
        });

        // Nếu người dùng nhấn nút "Vâng, xóa nó!"
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

                if (res.ok) {
                    // Xóa thành công -> Hiện thông báo đẹp
                    Swal.fire({
                        title: 'Đã xóa!',
                        text: 'Danh mục đã được xóa thành công.',
                        icon: 'success',
                        timer: 700, 
                        showConfirmButton: false
                    });
                    fetchCategories();
                } else {
                    // Xóa thất bại -> Lấy lỗi từ backend
                    const data = await res.json();
                    
                    // Hiện lỗi bằng Swal thay vì alert
                    Swal.fire({
                        title: 'Không thể xóa!',
                        text: data.message || 'Có lỗi xảy ra khi xóa.',
                        icon: 'error',
                        confirmButtonText: 'Đã hiểu'
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: 'Lỗi!',
                    text: 'Không thể kết nối đến server.',
                    icon: 'error'
                });
            }
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản Lý Danh Mục</h2>
            
            <button onClick={handleOpenAdd} 
                style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Thêm mới
            </button>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            <th style={{ padding: '12px', width: '20%' }}>Tên Danh Mục</th>
                            <th style={{ padding: '12px' }}>Mô tả</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>Số lượng SP</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>Thứ tự hiển thị</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Trạng thái</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map(item => (
                            <tr key={item.categoryId} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px', verticalAlign: 'center', wordBreak: 'break-word' }}>
                                    <strong style={{color: '#333'}}>{item.categoryName}</strong>
                                </td>
                                <td style={{ padding: '12px', verticalAlign: 'top', wordBreak: 'break-word', color: '#555' }}>
                                    {item.description}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#555' }}>
                                    {item.productCount}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#4e73df' }}>
                                    {item.displayOrder}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    {item.isActive ? (
                                        <span style={{ backgroundColor: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                            Đang hoạt động
                                        </span>
                                    ) : (
                                        <span style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                                            Ngừng hoạt động
                                        </span>
                                    )}
                                </td>

                                {/* CỘT THAO TÁC (Giao diện mới) */}
                                <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'middle' }}>
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
                                        onClick={() => handleDelete(item.categoryId)} 
                                        style={{ 
                                            cursor: 'pointer', 
                                            background: 'transparent', 
                                            color: '#e74a3b', 
                                            border: '1px solid #e74a3b', 
                                            padding: '5px 10px', 
                                            borderRadius: '4px', 
                                            fontSize: '12px' 
                                        }}
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
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

            <CategoryModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveFromModal}
                initialData={editingItem}
            />
        </div>
    );
}

export default Categories;