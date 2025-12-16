import { useState, useEffect } from 'react';
import UserModal from './UserModal';

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
        if(window.confirm("Xóa nhân viên này?")) {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchUsers();
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Tài Khoản</h2>
            <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                style={{ marginBottom: 15, padding: '10px 20px', background: 'green', color: 'white', border: 'none' }}>
                + Thêm Nhân Viên
            </button>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: 10 }}>Họ Tên</th>
                        <th style={{ padding: 10 }}>Email</th>
                        <th style={{ padding: 10 }}>Vai trò</th>
                        <th style={{ padding: 10 }}>Trạng thái</th>
                        <th style={{ padding: 10 }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.userId}>
                            <td style={{ padding: 10 }}>{u.fullName}</td>
                            <td style={{ padding: 10 }}>{u.email}</td>
                            <td style={{ padding: 10, textAlign: 'center' }}>
                                <span style={{ padding: '4px 8px', background: '#e2e6ea', borderRadius: 4 }}>
                                    {u.roleName || 'N/A'}
                                </span>
                            </td>
                            <td style={{ padding: 10, textAlign: 'center', color: u.isActive ? 'green' : 'red' }}>
                                {u.isActive ? 'Active' : 'Locked'}
                            </td>
                            <td style={{ padding: 10, textAlign: 'center' }}>
                                <button onClick={() => { setEditingItem(u); setIsModalOpen(true); }} style={{ marginRight: 5 }}>Sửa</button>
                                <button onClick={() => handleDelete(u.userId)} style={{ color: 'red' }}>Xóa</button>
                            </td>
                        </tr>
                    ))}
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