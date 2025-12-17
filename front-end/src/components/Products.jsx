import { useState, useEffect } from 'react';
import ProductModal from './ProductModal';

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);


    const API_URL = 'https://localhost:7298/api/TblProducts';
    const CAT_API_URL = 'https://localhost:7298/api/TblCategories';


    const fetchProducts = () => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {              
                const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setProducts(sortedData);
            })
            .catch(err => console.error(err));
    };

    const fetchCategories = () => {
        fetch(CAT_API_URL)
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    const getCategoryName = (catId) => {
        const cat = categories.find(c => c.categoryId === catId);
        return cat ? cat.categoryName : '---';
    };

    const handleOpenAdd = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) {
            try {
                const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchProducts();
                } else {
                    alert('Lỗi khi xóa!');
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleSaveFromModal = async (formData) => {
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `${API_URL}/${editingItem.productId}` : API_URL;
        
        if (editingItem) {
            formData.productId = editingItem.productId;
        }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchProducts();
            } else {
                const err = await res.json();

                console.error("Server Error:", err); 
                alert('Lỗi: ' + (err.title || 'Kiểm tra lại dữ liệu nhập (FK, Unique Code...)'));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Sản Phẩm</h2>
            
            <button onClick={handleOpenAdd} style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                + Thêm Sản Phẩm
            </button>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th style={{ padding: '10px' }}>Mã SP</th>
                        <th style={{ padding: '10px' }}>Tên Sản Phẩm</th>
                        <th style={{ padding: '10px' }}>Danh mục</th>
                        <th style={{ padding: '10px' }}>Giá gốc</th>
                        <th style={{ padding: '10px' }}>Tồn kho</th>
                        <th style={{ padding: '10px' }}>Trạng thái</th>
                        <th style={{ padding: '10px' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(item => (
                        <tr key={item.productId}>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{item.productCode}</td>
                            <td style={{ padding: '8px' }}>
                                <strong>{item.productName}</strong><br/>
                                <small style={{color:'#666'}}>{item.shortDescription}</small>
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{getCategoryName(item.categoryId)}</td>
                            <td style={{ padding: '8px', textAlign: 'right' }}>
                                {item.originalPrice?.toLocaleString('vi-VN')} đ
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>{item.stockQuantity}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                {item.isActive ? 
                                    <span style={{color: 'green', fontWeight:'bold'}}>Đang bán</span> : 
                                    <span style={{color: 'red'}}>Ngừng bán</span>
                                }
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                <button onClick={() => handleOpenEdit(item)} style={{ marginRight: '5px', cursor: 'pointer', background:'#007bff', color:'white', border:'none', padding:'5px 10px', borderRadius:'3px' }}>Sửa</button>
                                <button onClick={() => handleDelete(item.productId)} style={{ cursor: 'pointer', background:'#dc3545', color:'white', border:'none', padding:'5px 10px', borderRadius:'3px' }}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
                        
            <ProductModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveFromModal}
                initialData={editingItem}
                categories={categories} // Truyền danh sách Category vào modal
            />
        </div>
    );
}

export default Products;