import { useState, useEffect } from 'react';
import QandAModal from '../../components/admin/QandAModal';
import { API_BASE } from '../../utils/apiConfig.jsx';
import Swal from 'sweetalert2'; // Import SweetAlert2

function QandAManager() {
    const [qandas, setQandas] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    // API URL
    const API_URL = `${API_BASE}/api/QandA`;
    
    const fetchQandAs = () => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => setQandas(data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchQandAs(); }, []);

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
        const url = editingItem ? `${API_URL}/${editingItem.id}` : API_URL;
        
        // Mapping đúng field name với Backend Model
        if (editingItem) formData.id = editingItem.id;
        
        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (res.ok || res.status === 204) {
                setIsModalOpen(false);
                fetchQandAs();
                
                // Thay alert bằng Swal Success
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: 'Lưu dữ liệu Q&A thành công!',
                    timer: 700,
                    showConfirmButton: false
                });
            } else {
                // Thay alert bằng Swal Error
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Lỗi khi lưu dữ liệu'
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi kết nối',
                text: 'Không thể kết nối đến server API'
            });
        }
    };

    const handleDelete = async (id) => {
        // Thay window.confirm bằng Swal
        const result = await Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?',
            text: "Câu hỏi này sẽ bị xóa vĩnh viễn!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // Màu đỏ cho nút xóa
            cancelButtonColor: '#3085d6', // Màu xanh cho nút hủy
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy bỏ'
        });

        if (result.isConfirmed) {
            try {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                
                Swal.fire({
                    title: 'Đã xóa!',
                    text: 'Câu hỏi đã được xóa thành công.',
                    icon: 'success',
                    timer: 1000,
                    showConfirmButton: false
                });
                
                fetchQandAs();
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: 'Có lỗi xảy ra khi xóa.'
                });
            }
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản Lý Câu Hỏi Thường Gặp (Q&A)</h2>

            <button onClick={handleOpenAdd} style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Thêm câu hỏi
            </button>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                            {/* 1. Thêm cột tiêu đề hiển thị thứ tự ưu tiên */}
                            <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>Thứ tự</th>
                            <th style={{ padding: '12px', width: '30%' }}>Câu hỏi</th>
                            <th style={{ padding: '12px' }}>Câu trả lời</th>
                            <th style={{ padding: '12px', width: '120px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '12px', width: '150px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {qandas.length > 0 ?
                        qandas.map((item, index) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                {/* Cột số thứ tự đếm (index) */}
                                <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                
                                {/* 2. Hiển thị giá trị DisplayOrder từ DB */}
                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#4e73df' }}>
                                    {item.displayOrder}
                                </td>

                                <td style={{ padding: '12px', fontWeight: 'bold', color:'#333' }}>{item.question}</td>
                                <td style={{ padding: '12px', color:'#555' }}>{item.answer}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    {item.isActive ? 
                                        <span style={{color: 'green', fontWeight:'bold', background:'#d4edda', padding:'4px 8px', borderRadius:'12px', fontSize:'12px'}}>Hiển thị</span> : 
                                        <span style={{color: 'red', fontWeight:'bold', background:'#f8d7da', padding:'4px 8px', borderRadius:'12px', fontSize:'12px'}}>Ẩn</span>
                                    }
                                </td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <button onClick={() => handleOpenEdit(item)} style={{ marginRight: '5px', padding:'5px 10px', cursor:'pointer', border:'1px solid #4e73df', color:'#4e73df', background:'white', borderRadius:'4px' }}>Sửa</button>
                                    <button onClick={() => handleDelete(item.id)} style={{ padding:'5px 10px', cursor:'pointer', border:'1px solid #dc3545', color:'#dc3545', background:'white', borderRadius:'4px' }}>Xóa</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>Chưa có dữ liệu</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <QandAModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveFromModal}
                initialData={editingItem}
            />
        </div>
    );
}

export default QandAManager;