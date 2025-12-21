import { useState, useEffect } from 'react';
import UserModal from "../../components/admin/UserModal";

function Users() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const API_URL = 'https://localhost:7298/api/TblUsers';

    const MOCK_ROLES = [
        { roleId: 1, roleName: 'Admin' },
        { roleId: 2, roleName: 'Khách hàng' },
        { roleId: 3, roleName: 'Nhân viên Bán hàng' },
        { roleId: 4, roleName: 'Nhân viên Kho' },
    ];

    const fetchUsers = () => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchUsers();
        setRoles(MOCK_ROLES); 
    }, []);

    const handleSave = async (formData) => {
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `${API_URL}/${editingItem.userId}` : API_URL;
        
        if(editingItem) formData.userId = editingItem.userId;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchUsers();
            } else {
                alert("Lỗi lưu dữ liệu");
            }
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Bạn chắc chắn muốn xóa nhân viên này?")) {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchUsers();
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Tài Khoản</h2>
            
            <button 
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                style={{ 
                    marginBottom: '15px', 
                    padding: '10px 20px', 
                    background: '#28a745', // Xanh lá chuẩn
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', // Bo góc
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                + Thêm Nhân Viên
            </button>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th style={{ padding: '12px' }}>Họ Tên</th>
                        <th style={{ padding: '12px' }}>Email</th>
                        <th style={{ padding: '12px' }}>Vai trò</th>
                        <th style={{ padding: '12px' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.userId}>
                            <td style={{ padding: '10px' }}>
                                <strong>{u.fullName}</strong>
                            </td>
                            <td style={{ padding: '10px' }}>{u.email}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                <span style={{ padding: '4px 8px', background: '#e2e6ea', borderRadius: '4px', fontSize: '13px' }}>
                                    {u.roleName || 'N/A'}
                                </span>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                {u.isActive ? 
                                    <span style={{ color: 'green', fontWeight: 'bold' }}>Active</span> : 
                                    <span style={{ color: 'red', fontWeight: 'bold' }}>Locked</span>
                                }
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button 
                                    onClick={() => { setEditingItem(u); setIsModalOpen(true); }} 
                                    style={{ 
                                        marginRight: '8px', 
                                        padding: '5px 10px', 
                                        cursor: 'pointer', 
                                        backgroundColor: '#007bff', // Màu xanh dương (Sửa)
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '3px' 
                                    }}
                                >
                                    Sửa
                                </button>
                                <button 
                                    onClick={() => handleDelete(u.userId)} 
                                    style={{ 
                                        padding: '5px 10px', 
                                        cursor: 'pointer', 
                                        backgroundColor: '#dc3545', // Màu đỏ (Xóa)
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '3px' 
                                    }}
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>Chưa có dữ liệu</td></tr>
                    )}
                </tbody>
            </table>

            <UserModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={handleSave} 
                initialData={editingItem}
                roles={roles}
            />
        </div>
    );
}

export default Users;