import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import SupplierModal from '../../components/admin/SupplierModal';

const Suppliers = () => {
    // --- STATE DỮ LIỆU ---
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    // --- STATE PHÂN TRANG (MỚI) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị mỗi trang

    const API_URL = 'https://localhost:7298/api/suppliers';

    const fetchSuppliers = async () => {
        try {
            const res = await axios.get(API_URL);
            setSuppliers(res.data);
            // Reset về trang 1 khi load lại dữ liệu
            setCurrentPage(1);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    // --- LOGIC PHÂN TRANG (Client-side) ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = suppliers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(suppliers.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleOpenAdd = () => {
        setSelectedSupplier(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setSelectedSupplier(item);
        setIsModalOpen(true);
    };

    const handleSave = async (data) => {
        try {
            if (selectedSupplier) {
                await axios.put(`${API_URL}/${selectedSupplier.supplierId}`, data);
            } else {
                await axios.post(API_URL, data);
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            alert('Có lỗi xảy ra: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                fetchSuppliers();
            } catch (error) {
                alert('Không thể xóa: ' + error.message);
            }
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản Lý Nhà Cung Cấp</h2>
            
            <button 
                onClick={handleOpenAdd} 
                style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                + Thêm mới
            </button>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '15%' }}>Tên Nhà Cung Cấp</th>
                            {/* 1. THÊM HEADER EMAIL */}
                            <th style={{ padding: '12px', textAlign: 'left', width: '15%' }}>Email</th> 
                            <th style={{ padding: '12px', textAlign: 'center', width: '13%' }}>SĐT</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '24%' }}>Địa chỉ</th>
                            {/* Giảm width cột Ghi chú lại một chút để nhường chỗ */}
                            <th style={{ padding: '12px', textAlign: 'left', width: '18%' }}>Ghi chú</th> 
                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map((s, index) => {
                            // TÍNH STT
                            const stt = (currentPage - 1) * itemsPerPage + index + 1;

                            return (
                                <tr key={s.supplierId} style={{ borderBottom: '1px solid #eee' }}>
                                    {/* Hiển thị STT */}
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>

                                    <td style={{ padding: '12px', wordWrap: 'break-word' }}>
                                        <strong style={{color: '#333'}}>{s.supplierName}</strong>
                                    </td>
                                    <td style={{ padding: '12px', wordWrap: 'break-word', color: '#555' }}>
                                        {s.email}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center', wordWrap: 'break-word', color: '#555' }}>
                                        {s.phoneNumber}
                                    </td>
                                    <td style={{ padding: '12px', wordWrap: 'break-word', color: '#555' }}>
                                        {s.address}
                                    </td>
                                    <td style={{ padding: '12px', color: '#666', fontStyle: 'italic', wordWrap: 'break-word' }}>
                                        {s.note}
                                    </td>
                                    
                                    {/* CỘT THAO TÁC (Giao diện mới) */}
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleOpenEdit(s)}
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
                                            onClick={() => handleDelete(s.supplierId)}
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
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    Chưa có dữ liệu nhà cung cấp
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* --- THANH PHÂN TRANG (UI giống AdminProduct) --- */}
                {suppliers.length > itemsPerPage && (
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

            <SupplierModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave}
                selectedSupplier={selectedSupplier}
            />
        </div>
    );
};

export default Suppliers;