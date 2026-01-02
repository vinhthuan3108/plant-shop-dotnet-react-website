import { useState, useEffect } from 'react';
import BannerModal from "../../components/admin/BannerModal";
import { API_BASE } from '../../utils/apiConfig.jsx';
function AdminBanners() {
    const [banners, setBanners] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    //const API_DOMAIN = 'https://localhost:7298'; 
    const API_URL = `${API_BASE}/api/TblBanners`; 

    const fetchBanners = () => {
        fetch(`${API_URL}/admin`)
            .then(res => res.json())
            .then(data => {
                // Sắp xếp theo thứ tự hiển thị (nhỏ đến lớn)
                const sortedData = data.sort((a, b) => a.displayOrder - b.displayOrder);
                setBanners(sortedData);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchBanners(); }, []);

    const handleOpenAdd = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    // Hàm lưu (nhận JSON Data từ modal)
    const handleSaveFromModal = async (jsonData) => {
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `${API_URL}/${editingItem.bannerId}` : API_URL;
        
        if (editingItem) jsonData.bannerId = editingItem.bannerId;

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(jsonData) 
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchBanners();
            } else {
                alert("Lỗi khi lưu dữ liệu");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa banner này?')) {
            try {
                const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchBanners();
                } else {
                    alert('Lỗi khi xóa!');
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Banner</h2>
            
            {/* Thanh công cụ (Nút thêm) - Style giống Products */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                    onClick={handleOpenAdd} 
                    style={{ 
                        padding: '10px 20px', 
                        background: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        fontWeight: 'bold' 
                    }}
                >
                    + Thêm Banner Mới
                </button>
            </div>

            {/* Bảng dữ liệu - Style giống Products */}
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd', fontSize: '14px' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th style={{ padding: '10px', width: '120px', textAlign: 'center' }}>Hình ảnh</th>
                        <th style={{ padding: '10px' }}>Tiêu đề</th>
                        <th style={{ padding: '10px', width: '100px', textAlign: 'center' }}>Thứ tự</th>
                        <th style={{ padding: '10px', width: '120px', textAlign: 'center' }}>Trạng thái</th>
                        <th style={{ padding: '10px', width: '150px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {banners.map(item => (
                        <tr key={item.bannerId}>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                {item.imageUrl ? (
                                    <img 
                                        src={`${API_BASE}${item.imageUrl}`} 
                                        alt="banner" 
                                        style={{ 
                                            width: '100px', // Banner thường ngang nên để rộng hơn thumb sản phẩm
                                            height: '50px', 
                                            objectFit: 'cover', 
                                            borderRadius: '4px', 
                                            border: '1px solid #ddd' 
                                        }} 
                                    />
                                ) : (
                                    <span style={{ fontSize: '10px', color: '#999' }}>No Image</span>
                                )}
                            </td>
                            
                            <td style={{ padding: '8px' }}>
                                <strong>{item.title}</strong>
                            </td>
                            
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                {item.displayOrder}
                            </td>
                            
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                {item.isActive ? 
                                    <span style={{color: 'green', fontWeight:'bold'}}>Đang hiện</span> : 
                                    <span style={{color: 'red'}}>Đang ẩn</span>
                                }
                            </td>
                            
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                <button 
                                    onClick={() => handleOpenEdit(item)} 
                                    style={{ 
                                        marginRight: '5px', 
                                        cursor: 'pointer', 
                                        background: '#007bff', 
                                        color: 'white', 
                                        border: 'none', 
                                        padding: '5px 10px', 
                                        borderRadius: '3px' 
                                    }}
                                >
                                    Sửa
                                </button>
                                <button 
                                    onClick={() => handleDelete(item.bannerId)} 
                                    style={{ 
                                        cursor: 'pointer', 
                                        background: '#dc3545', 
                                        color: 'white', 
                                        border: 'none', 
                                        padding: '5px 10px', 
                                        borderRadius: '3px' 
                                    }}
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                    {banners.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                Chưa có banner nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <BannerModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveFromModal}
                initialData={editingItem}
            />
        </div>
    );
}

export default AdminBanners;