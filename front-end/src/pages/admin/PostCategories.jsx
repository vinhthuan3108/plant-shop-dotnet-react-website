import { useState, useEffect } from 'react';
import PostCategoryModal from '../../components/admin/PostCategoryModal';

function PostCategories() {
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const API_URL = 'https://localhost:7298/api/TblPostCategories';

    const fetchCategories = () => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Lỗi fetch:", err));
    };

    useEffect(() => { fetchCategories(); }, []);

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
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Danh Mục Bài Đăng</h2>
            
            <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                + Thêm mới danh mục bài đăng
            </button>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd', tableLayout: 'fixed' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        {/* Chiếm 30% chiều rộng */}
                        <th style={{ padding: '12px', width: '20%' }}>Tên Danh Mục</th>
                        
                        {/* Chiếm phần còn lại (khoảng 70%) */}
                        <th style={{ padding: '12px' }}>Mô tả</th>
                        
                        {/* Cố định chiều rộng vừa đủ cho 2 nút */}
                        <th style={{ padding: '12px', width: '110px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(item => (
                        <tr key={item.postCategoryId}>
                            {/* wordBreak: 'break-word' giúp xuống dòng nếu tên quá dài */}
                            <td style={{ padding: '10px', verticalAlign: 'top', wordBreak: 'break-word' }}>
                                <strong>{item.categoryName}</strong>
                            </td>
                            <td style={{ padding: '10px', verticalAlign: 'top', wordBreak: 'break-word' }}>
                                {item.description}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                    style={{ marginRight: '8px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                                    Sửa
                                </button>
                                <button onClick={() => handleDelete(item.postCategoryId)}
                                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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