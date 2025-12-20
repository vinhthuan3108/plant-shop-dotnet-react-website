import { useState, useEffect } from 'react';
import BannerModal from "../../components/admin/BannerModal";

function AdminBanners() {
    const [banners, setBanners] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const API_DOMAIN = 'https://localhost:7298'; 
    const API_URL = `${API_DOMAIN}/api/TblBanners`; 

    const fetchBanners = () => {
        fetch(`${API_URL}/admin`)
            .then(res => res.json())
            .then(data => setBanners(data))
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
        
        // Nếu là sửa, cần gán thêm ID vào object json
        if (editingItem) jsonData.bannerId = editingItem.bannerId;

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json' // Bắt buộc phải có dòng này
                },
                body: JSON.stringify(jsonData) // Chuyển object thành chuỗi JSON
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchBanners();
                alert("Thành công!");
            } else {
                alert("Lỗi khi lưu dữ liệu");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Xóa banner này?')) {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchBanners();
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Banner</h2>
            <button onClick={handleOpenAdd} style={{ marginBottom: '15px', padding: '10px', background: 'green', color: 'white' }}>+ Thêm mới</button>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Ảnh</th>
                        <th>Tiêu đề</th>
                        <th>Thứ tự</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {banners.map(item => (
                        <tr key={item.bannerId}>
                            <td style={{ textAlign: 'center', padding: '5px' }}>
                                <img src={`${API_DOMAIN}${item.imageUrl}`} alt="" style={{ height: '50px' }} />
                            </td>
                            <td>{item.title}</td>
                            <td>{item.displayOrder}</td>
                            <td>{item.isActive ? 'Hiện' : 'Ẩn'}</td>
                            <td>
                                <button onClick={() => handleOpenEdit(item)}>Sửa</button>
                                <button onClick={() => handleDelete(item.bannerId)} style={{ marginLeft: '5px', color: 'red' }}>Xóa</button>
                            </td>
                        </tr>
                    ))}
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