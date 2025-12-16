import { useState, useEffect } from 'react';
import CategoryModal from './CategoryModal';

function Categories() {
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const API_URL = 'https://localhost:7298/api/TblCategories'; 

    const fetchCategories = () => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                // Sắp xếp theo thứ tự hiển thị (nhỏ lên trước)
                const sortedData = data
                    .filter(x => !x.isDeleted)
                    .sort((a, b) => a.displayOrder - b.displayOrder);
                setCategories(sortedData);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchCategories(); }, []);

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
        if (window.confirm('Bạn chắc chắn muốn xóa?')) {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchCategories();
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Danh Mục</h2>
            
            <button onClick={handleOpenAdd} style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                + Thêm mới
            </button>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Tên Danh Mục</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Mô tả</th>
                        

                        <th style={{ padding: '12px', textAlign: 'center', width: '80px' }}>Thứ tự hiển thị</th>
                        

                        <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Trạng thái</th>
                        
                        <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(item => (
                        <tr key={item.categoryId}>
                            <td style={{ padding: '10px' }}>
                                <strong>{item.categoryName}</strong>
                            </td>
                            <td style={{ padding: '10px' }}>{item.description}</td>
                            

                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                {item.displayOrder}
                            </td>


                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                {item.isActive ? (
                                    <span style={{ 
                                        backgroundColor: '#d4edda', 
                                        color: '#155724', 
                                        padding: '5px 10px', 
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        Đang hoạt động
                                    </span>
                                ) : (
                                    <span style={{ 
                                        backgroundColor: '#f8d7da', 
                                        color: '#721c24', 
                                        padding: '5px 10px', 
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        Ngừng hoạt động
                                    </span>
                                )}
                            </td>

                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button 
                                    onClick={() => handleOpenEdit(item)} 
                                    style={{ marginRight: '8px', padding: '5px 10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    Sửa
                                </button>
                                <button 
                                    onClick={() => handleDelete(item.categoryId)} 
                                    style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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