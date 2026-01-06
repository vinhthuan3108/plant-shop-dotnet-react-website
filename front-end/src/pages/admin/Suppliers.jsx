import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import Swal from 'sweetalert2'; // 1. Import SweetAlert
import SupplierModal from '../../components/admin/SupplierModal';
import { API_BASE } from '../../utils/apiConfig.jsx'; // 2. Import API_BASE

const Suppliers = () => {
    // --- STATE DỮ LIỆU ---
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    
    // --- STATE PHÂN TRANG ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    // 3. Sử dụng API_BASE thay vì hardcode localhost
    const API_URL = `${API_BASE}/api/suppliers`;

    const fetchSuppliers = async () => {
        try {
            const res = await axios.get(API_URL);
            // Xử lý dữ liệu trả về (đề phòng trường hợp $values của .NET)
            const data = res.data?.$values || res.data;
            setSuppliers(Array.isArray(data) ? data : []);
            setCurrentPage(1);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
            // Swal.fire('Lỗi', 'Không thể tải danh sách nhà cung cấp', 'error');
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    // --- LOGIC PHÂN TRANG ---
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

    // 4. XỬ LÝ LƯU (SweetAlert)
    const handleSave = async (data) => {
        try {
            if (selectedSupplier) {
                await axios.put(`${API_URL}/${selectedSupplier.supplierId}`, data);
            } else {
                await axios.post(API_URL, data);
            }
            
            setIsModalOpen(false);
            
            // Thông báo thành công
            Swal.fire({
                title: 'Thành công!',
                text: 'Đã lưu thông tin nhà cung cấp.',
                icon: 'success',
                timer: 700,
                showConfirmButton: false
            });

            fetchSuppliers();
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Lỗi!',
                text: 'Không thể lưu dữ liệu: ' + (error.response?.data?.message || error.message),
                icon: 'error'
            });
        }
    };

    // 5. XỬ LÝ XÓA (SweetAlert Confirm)
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?',
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                
                Swal.fire({
                    title: 'Đã xóa!',
                    text: 'Nhà cung cấp đã được xóa.',
                    icon: 'success',
                    timer: 700,
                    showConfirmButton: false
                });

                fetchSuppliers();
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: 'Không thể xóa!',
                    text: error.response?.data?.message || error.message,
                    icon: 'error'
                });
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
                            <th style={{ padding: '12px', textAlign: 'left', width: '15%' }}>Email</th> 
                            <th style={{ padding: '12px', textAlign: 'center', width: '13%' }}>SĐT</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '24%' }}>Địa chỉ</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '18%' }}>Ghi chú</th> 
                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map((s, index) => {
                            const stt = (currentPage - 1) * itemsPerPage + index + 1;
                            return (
                                <tr key={s.supplierId} style={{ borderBottom: '1px solid #eee' }}>
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
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => handleOpenEdit(s)}
                                            style={{ marginRight: '8px', cursor: 'pointer', background: 'transparent', color: '#4e73df', border: '1px solid #4e73df', padding: '5px 10px', borderRadius: '4px', fontSize: '12px' }}
                                        >
                                            Sửa
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(s.supplierId)}
                                            style={{ cursor: 'pointer', background: 'transparent', color: '#e74a3b', border: '1px solid #e74a3b', padding: '5px 10px', borderRadius: '4px', fontSize: '12px' }}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    Chưa có dữ liệu nhà cung cấp
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* --- THANH PHÂN TRANG --- */}
                {suppliers.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '5px', borderTop: '1px solid #eee' }}>
                        {currentPage > 1 && (
                            <>
                                <button onClick={() => paginate(1)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}>&#171; Đầu</button>
                                <button onClick={() => paginate(currentPage - 1)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>&lsaquo; Trước</button>
                            </>
                        )}
                        {(() => {
                            let startPage, endPage;
                            if (totalPages <= 10) { startPage = 1; endPage = totalPages; } 
                            else {
                                if (currentPage <= 6) { startPage = 1; endPage = 10; } 
                                else if (currentPage + 4 >= totalPages) { startPage = totalPages - 9; endPage = totalPages; } 
                                else { startPage = currentPage - 5; endPage = currentPage + 4; }
                            }
                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) { pages.push(i); }
                            return pages.map(number => (
                                <button key={number} onClick={() => paginate(number)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: currentPage === number ? '#4e73df' : 'white', color: currentPage === number ? 'white' : '#333', cursor: 'pointer', borderRadius: '4px', fontWeight: currentPage === number ? 'bold' : 'normal', fontSize: '13px', minWidth: '32px' }}>
                                    {number}
                                </button>
                            ));
                        })()}
                        {currentPage < totalPages && (
                            <>
                                <button onClick={() => paginate(currentPage + 1)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>Sau &rsaquo;</button>
                                <button onClick={() => paginate(totalPages)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}>Cuối &#187;</button>
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

            {/* 6. STYLE FIX Z-INDEX (Để Swal luôn đè lên Modal) */}
            <style>{`
                .swal2-container {
                    z-index: 20000 !important;
                }
            `}</style>
        </div>
    );
};

export default Suppliers;