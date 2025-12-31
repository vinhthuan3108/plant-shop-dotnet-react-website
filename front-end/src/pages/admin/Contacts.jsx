import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ContactModal from '../../components/admin/ContactModal';

function Contacts() {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- STATE PHÂN TRANG (MỚI) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị mỗi trang

    // --- STATE FILTER & SEARCH ---
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // --- STATE MODAL ---
    const [selectedContact, setSelectedContact] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const API_URL = 'https://localhost:7298/api/Contacts'; 

    // --- LOGIC GỌI API ---
    const fetchContacts = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}?search=${search}&status=${filterStatus}`;
            const res = await axios.get(url);
            setContacts(res.data);
            setCurrentPage(1); // Reset về trang 1 khi lọc/tìm kiếm
        } catch (error) {
            console.error("Lỗi tải danh sách liên hệ:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    // --- LOGIC PHÂN TRANG (MỚI) ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = contacts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(contacts.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // --- HANDLERS ---
    const handleSearch = (e) => {
        e.preventDefault();
        fetchContacts();
    };

    const handleViewDetail = (item) => {
        setSelectedContact(item);
        setIsModalOpen(true);
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await axios.put(`${API_URL}/${id}`, `"${newStatus}"`, {
                headers: { 'Content-Type': 'application/json' }
            });
            alert("Đã cập nhật trạng thái!");
            setIsModalOpen(false);
            fetchContacts();
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            alert("Có lỗi xảy ra khi cập nhật.");
        }
    };

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
            return <span style={{ backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Chưa xem</span>;
        } else if (status === 'Processed') {
            return <span style={{ backgroundColor: '#28a745', color: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Đã xem</span>;
        }
        return <span style={{ backgroundColor: '#3787ceff', color: 'white', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>Đã phản hồi</span>;
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{ color: '#4e73df', marginBottom: '20px' }}>Quản Lý Liên Hệ Khách Hàng</h2>

            {/* Thanh công cụ: Tìm kiếm & Filter */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flex: 1 }}>
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên hoặc email..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, padding: '9px 12px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                    />
                    <button type="submit" style={{ padding: '9px 20px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        🔍 Tìm kiếm
                    </button>
                </form>
                
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '9px 12px', border: '1px solid #ddd', borderRadius: '4px', width: '200px', outline: 'none' }}
                >
                    <option value="all">-- Tất cả trạng thái --</option>
                    <option value="New">Chưa xem</option>
                    <option value="Processed">Đã xem</option>
                    <option value="Replied">Đã phản hồi</option>
                </select>
            </div>

            {/* Bảng dữ liệu */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Khách hàng</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Chủ đề</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Ngày gửi</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Đang tải...</td></tr>
                        ) : currentItems.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Không có dữ liệu liên hệ nào.</td></tr>
                        ) : (
                            currentItems.map((item, index) => {
                                // TÍNH TOÁN STT
                                const stt = (currentPage - 1) * itemsPerPage + index + 1;
                                const rowStyle = { borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' };

                                return (
                                    <tr key={item.contactId} style={rowStyle}>
                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>
                                        
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#4e73df' }}>{item.fullName}</div>
                                            <div style={{ fontSize: '13px', color: '#666' }}>{item.email}</div>
                                        </td>
                                        
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.subject || <span style={{color: '#999', fontStyle: 'italic'}}>(Không có chủ đề)</span>}</td>
                                        
                                        <td style={{ padding: '12px', textAlign: 'center', color: '#555' }}>{new Date(item.sentAt).toLocaleString('vi-VN')}</td>
                                        
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {renderStatusBadge(item.status)}
                                        </td>
                                        
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {/* NÚT XEM (Style outlined) */}
                                            <button 
                                                onClick={() => handleViewDetail(item)}
                                                style={{ marginRight: '8px', cursor: 'pointer', background:'transparent', color:'#17a2b8', border:'1px solid #17a2b8', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}
                                            >
                                                Xem
                                            </button>
                                            
                                            {/* NÚT XÓA (Style outlined) */}
                                            <button 
                                                onClick={() => handleDelete(item.contactId)}
                                                style={{ cursor: 'pointer', background:'transparent', color:'#e74a3b', border:'1px solid #e74a3b', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* --- THANH PHÂN TRANG (GIỐNG ADMIN PRODUCT) --- */}
                {contacts.length > itemsPerPage && (
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

                        {/* SỐ TRANG */}
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

            {/* Modal */}
            <ContactModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                contact={selectedContact}
                onUpdateStatus={handleUpdateStatus}
                refreshData={fetchContacts}
            />
        </div>
    );
}

export default Contacts;