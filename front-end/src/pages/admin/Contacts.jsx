import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Nhớ cài: npm install axios
import ContactModal from '../../components/admin/ContactModal';

function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State cho filter và search
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // State cho Modal
    const [selectedContact, setSelectedContact] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const API_URL = 'https://localhost:7298/api/Contacts'; 

    // Hàm load dữ liệu
    const fetchContacts = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}?search=${search}&status=${filterStatus}`;
            const res = await axios.get(url);
            setContacts(res.data);
        } catch (error) {
            console.error("Lỗi tải danh sách liên hệ:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [filterStatus]); // Load lại khi đổi bộ lọc status

    // Xử lý nút tìm kiếm
    const handleSearch = (e) => {
        e.preventDefault();
        fetchContacts();
    };

    // Mở xem chi tiết
    const handleViewDetail = (item) => {
        setSelectedContact(item);
        setIsModalOpen(true);
    };

    // Cập nhật trạng thái (Từ Modal hoặc từ nút nhanh bên ngoài nếu muốn)
    const handleUpdateStatus = async (id, newStatus) => {
        try {
            // API yêu cầu gửi chuỗi status trong body, axios post cần đúng định dạng 'Content-Type': 'application/json'
            await axios.put(`${API_URL}/${id}`, `"${newStatus}"`, {
                headers: { 'Content-Type': 'application/json' }
            });
            alert("Đã cập nhật trạng thái!");
            setIsModalOpen(false);
            fetchContacts(); // Reload lại bảng
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            alert("Có lỗi xảy ra khi cập nhật.");
        }
    };

    // Xóa tin nhắn
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tin nhắn liên hệ này?")) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                fetchContacts();
            } catch (error) {
                alert("Lỗi khi xóa.");
            }
        }
    };

    // Badge trạng thái
    const renderStatusBadge = (status) => {
        if (status === 'New') {
            return <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '12px' }}>Chưa xử lý</span>;
        } else if (status === 'Processed') {
            return <span style={{ backgroundColor: '#28a745', color: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '12px' }}>Đã xử lý</span>;
        }
        return <span style={{ backgroundColor: '#6c757d', color: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '12px' }}>Khác</span>;
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Quản Lý Liên Hệ Khách Hàng</h2>

            {/* Thanh công cụ: Tìm kiếm & Filter */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên hoặc email..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Tìm kiếm
                    </button>
                </form>
                
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '200px' }}
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="New">Chưa xử lý</option>
                    <option value="Processed">Đã xử lý</option>
                </select>
            </div>

            {/* Bảng dữ liệu */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        <tr>
                            <th style={{ padding: '15px' }}>ID</th>
                            <th style={{ padding: '15px' }}>Khách hàng</th>
                            <th style={{ padding: '15px' }}>Chủ đề</th>
                            <th style={{ padding: '15px' }}>Ngày gửi</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</td></tr>
                        ) : contacts.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Không có dữ liệu liên hệ nào.</td></tr>
                        ) : (
                            contacts.map((item) => (
                                <tr key={item.contactId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px' }}>{item.contactId}</td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{item.fullName}</div>
                                        <div style={{ fontSize: '13px', color: '#666' }}>{item.email}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>{item.subject || '(Không có chủ đề)'}</td>
                                    <td style={{ padding: '15px' }}>{new Date(item.sentAt).toLocaleString('vi-VN')}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {renderStatusBadge(item.status)}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleViewDetail(item)}
                                            style={{ marginRight: '10px', padding: '6px 12px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Xem
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.contactId)}
                                            style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <ContactModal 
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    contact={selectedContact}
    onUpdateStatus={handleUpdateStatus}
    refreshData={fetchContacts} // <--- THÊM DÒNG NÀY
/>
        </div>
    );
}

export default Contacts;