import { useState, useEffect } from 'react';
import UserModal from "../../components/admin/UserModal";
import { API_BASE } from '../../utils/apiConfig.jsx';
// Hàm format ngày (giữ nguyên)
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

function Users() {
    // --- STATE DỮ LIỆU ---
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // --- STATE TÌM KIẾM & LỌC ---
    const [searchText, setSearchText] = useState('');
    const [filterRoleId, setFilterRoleId] = useState('');

    // --- STATE PHÂN TRANG (MỚI) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị mỗi trang [cite: 54]

    const API_URL = `${API_BASE}/api/TblUsers`;

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

    // Reset về trang 1 khi thay đổi bộ lọc tìm kiếm
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, filterRoleId]);

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

    // --- LOGIC LỌC DỮ LIỆU ---
    const filteredUsers = users.filter(u => {
        // a. Lọc theo Role
        if (filterRoleId && u.roleId !== parseInt(filterRoleId)) {
            return false;
        }
        // b. Tìm kiếm
        const searchLower = searchText.toLowerCase();
        const nameMatch = (u.fullName || '').toLowerCase().includes(searchLower);
        const emailMatch = (u.email || '').toLowerCase().includes(searchLower);
        const phoneMatch = (u.phoneNumber || '').toLowerCase().includes(searchLower);

        return nameMatch || emailMatch || phoneMatch;
    });

    // --- LOGIC PHÂN TRANG (Áp dụng lên danh sách đã lọc) ---
    const indexOfLastItem = currentPage * itemsPerPage; 
    const indexOfFirstItem = indexOfLastItem - itemsPerPage; 
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage); 
    const paginate = (pageNumber) => setCurrentPage(pageNumber); 

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản Lý Tài Khoản</h2>

            {/* --- THANH CÔNG CỤ --- */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {/* Ô tìm kiếm */}
                <input 
                    type="text"
                    placeholder="Tìm tên, email, SĐT..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        width: '300px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        outline: 'none'
                    }}
                />

                {/* Dropdown lọc Role */}
                <select 
                    value={filterRoleId}
                    onChange={(e) => setFilterRoleId(e.target.value)}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        minWidth: '150px',
                        outline: 'none'
                    }}
                >
                    <option value="">-- Tất cả vai trò --</option>
                    {roles.map(r => (
                        <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                    ))}
                </select>

                {/* Nút thêm mới */}
                <button 
                    onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
                    style={{ 
                        marginLeft: 'auto',
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

            {/* KHỐI BẢNG DỮ LIỆU */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            {/* CỘT STT [cite: 122] */}
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Họ Tên</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>SĐT</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Ngày tạo</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Vai trò</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map((u, index) => {
                            // TÍNH STT [cite: 129]
                            const stt = (currentPage - 1) * itemsPerPage + index + 1;

                            return (
                                <tr key={u.userId} style={{ borderBottom: '1px solid #eee' }}>
                                    {/* Hiển thị STT  */}
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>
                                    
                                    <td style={{ padding: '12px' }}><strong>{u.fullName}</strong></td>
                                    <td style={{ padding: '12px', color: '#555' }}>{u.email}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>{u.phoneNumber}</td>
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{formatDate(u.createdAt)}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ padding: '4px 8px', background: '#e2e6ea', borderRadius: '4px', fontSize: '12px', color: '#333' }}>
                                            {u.roleName || 'N/A'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {u.isActive ?
                                            <span style={{ color: '#1cc88a', fontSize: '12px', fontWeight: 'bold' }}>Active</span> : 
                                            <span style={{ color: '#e74a3b', fontSize: '12px', fontWeight: 'bold' }}>Locked</span>
                                        }
                                    </td>
                                    
                                    {/* CỘT THAO TÁC (Style mới)  */}
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => { setEditingItem(u); setIsModalOpen(true); }} 
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
                                            onClick={() => handleDelete(u.userId)} 
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
                            );
                        }) : (
                            <tr><td colSpan="8" style={{textAlign: 'center', padding: '30px', color: '#888'}}>Không tìm thấy dữ liệu phù hợp</td></tr>
                        )}
                    </tbody>
                </table>

                {/* --- THANH PHÂN TRANG (COPY TỪ ADMINPRODUCT)  --- */}
                {filteredUsers.length > itemsPerPage && (
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