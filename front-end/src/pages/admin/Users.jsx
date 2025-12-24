import { useState, useEffect } from 'react';
import UserModal from "../../components/admin/UserModal";

// Hàm format ngày (giữ nguyên như cũ)
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

function Users() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // --- 1. THÊM STATE CHO TÌM KIẾM VÀ LỌC ---
    const [searchText, setSearchText] = useState('');
    const [filterRoleId, setFilterRoleId] = useState(''); // Rỗng là chọn "Tất cả"

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

    // ... (Giữ nguyên handleSave và handleDelete) ...
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
            } else { alert("Lỗi lưu dữ liệu"); }
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Bạn chắc chắn muốn xóa nhân viên này?")) {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchUsers();
        }
    };

    // --- 2. LOGIC LỌC DỮ LIỆU ---
    // Tạo biến filteredUsers được tính toán từ danh sách gốc 'users'
    const filteredUsers = users.filter(u => {
        // a. Lọc theo Role (nếu có chọn)
        if (filterRoleId && u.roleId !== parseInt(filterRoleId)) {
            return false;
        }

        // b. Tìm kiếm theo Tên, Email, SĐT
        // Chuyển tất cả về chữ thường để tìm không phân biệt hoa thường
        const searchLower = searchText.toLowerCase();
        const nameMatch = (u.fullName || '').toLowerCase().includes(searchLower);
        const emailMatch = (u.email || '').toLowerCase().includes(searchLower);
        const phoneMatch = (u.phoneNumber || '').toLowerCase().includes(searchLower);

        return nameMatch || emailMatch || phoneMatch;
    });

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Tài Khoản</h2>

            {/* --- 3. THANH CÔNG CỤ (TÌM KIẾM & LỌC & NÚT THÊM) --- */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                
                {/* Ô tìm kiếm */}
                <input 
                    type="text"
                    placeholder="Tìm tên, email, SĐT..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                        padding: '8px',
                        width: '300px',
                        borderRadius: '4px',
                        border: '1px solid #ccc'
                    }}
                />

                {/* Dropdown lọc Role */}
                <select 
                    value={filterRoleId}
                    onChange={(e) => setFilterRoleId(e.target.value)}
                    style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        minWidth: '150px'
                    }}
                >
                    <option value="">-- Tất cả vai trò --</option>
                    {roles.map(r => (
                        <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                    ))}
                </select>

                {/* Nút thêm mới (đẩy sang phải) */}
                <button 
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                    style={{ 
                        marginLeft: 'auto', // Đẩy nút này sang phải cùng
                        padding: '10px 20px', 
                        background: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    + Thêm Nhân Viên
                </button>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th style={{ padding: '12px' }}>Họ Tên</th>
                        <th style={{ padding: '12px' }}>Email</th>
                        <th style={{ padding: '12px' }}>SĐT</th>
                        <th style={{ padding: '12px' }}>Ngày tạo</th>
                        <th style={{ padding: '12px' }}>Vai trò</th>
                        <th style={{ padding: '12px' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {/* QUAN TRỌNG: Duyệt qua filteredUsers thay vì users */}
                    {filteredUsers.map(u => (
                        <tr key={u.userId}>
                            <td style={{ padding: '10px' }}><strong>{u.fullName}</strong></td>
                            <td style={{ padding: '10px' }}>{u.email}</td>
                            <td style={{ padding: '10px' }}>{u.phoneNumber}</td>
                            <td style={{ padding: '10px' }}>{formatDate(u.createdAt)}</td>
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
                                    style={{ marginRight: '8px', padding: '5px 10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    Sửa
                                </button>
                                <button 
                                    onClick={() => handleDelete(u.userId)} 
                                    style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                    
                    {/* Hiển thị thông báo nếu không tìm thấy kết quả */}
                    {filteredUsers.length === 0 && (
                        <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Không tìm thấy dữ liệu phù hợp</td></tr>
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