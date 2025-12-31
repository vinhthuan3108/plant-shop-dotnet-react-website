import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VoucherModal from '../../components/admin/VoucherModal';

function Vouchers() {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [vouchers, setVouchers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);

    // --- STATE PHÂN TRANG (MỚI - GIỐNG ADMINPRODUCT) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị mỗi trang

    // --- STATE BỘ LỌC ---
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const API_URL = 'https://localhost:7298/api/vouchers';

    // --- LOGIC GỌI API ---
    const fetchVouchers = async () => {
        try {
            let url = `${API_URL}?search=${search}`;
            if (filterStatus === 'active') url += '&isActive=true';
            if (filterStatus === 'inactive') url += '&isActive=false';
            
            const res = await axios.get(url);
            setVouchers(res.data);
            setCurrentPage(1); // Reset về trang 1 khi tìm kiếm lại
        } catch (error) {
            console.error("Lỗi tải danh sách voucher", error);
        }
    };

    useEffect(() => {
        fetchVouchers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    // --- LOGIC PHÂN TRANG (MỚI) ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = vouchers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(vouchers.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // --- HANDLERS ---
    const handleOpenAdd = () => {
        setEditingVoucher(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (voucher) => {
        setEditingVoucher(voucher);
        setIsModalOpen(true);
    };

    const handleSaveFromModal = async (formData) => {
        try {
            if (editingVoucher) {
                await axios.put(`${API_URL}/${editingVoucher.voucherId}`, formData);
                alert("Cập nhật thành công!");
            } else {
                await axios.post(API_URL, formData);
                alert("Tạo mã giảm giá thành công!");
            }
            setIsModalOpen(false);
            fetchVouchers();
        } catch (error) {
            console.error(error);
            alert(error.response?.data || "Có lỗi xảy ra.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa hoặc ngừng voucher này?")) {
            try {
                const res = await axios.delete(`${API_URL}/${id}`);
                alert(res.data.message);
                fetchVouchers();
            } catch (error) {
                alert("Lỗi khi xóa voucher");
            }
        }
    };

    // Hàm render badge trạng thái
    const renderStatusBadge = (voucher) => {
        const now = new Date();
        const endDate = new Date(voucher.endDate);
        
        let style = { padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
        let text = "";

        if (!voucher.isActive) {
            style = { ...style, backgroundColor: '#6c757d', color: 'white' }; // Xám
            text = "Đã khóa";
        } else if (now > endDate) {
            style = { ...style, backgroundColor: '#f8d7da', color: 'red' }; // Đỏ nhạt
            text = "Hết hạn";
        } else if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
            style = { ...style, backgroundColor: '#fff3cd', color: '#856404' }; // Vàng
            text = "Hết lượt";
        } else {
            style = { ...style, backgroundColor: '#d4edda', color: '#155724' }; // Xanh lá
            text = "Đang kích hoạt";
        }

        return <span style={style}>{text}</span>;
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản lý Mã Giảm Giá</h2>

            {/* KHỐI CÔNG CỤ TÌM KIẾM */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã code..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1, padding: '9px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                    />
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ padding: '9px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                    >
                        <option value="all">-- Tất cả trạng thái --</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Đã ngừng</option>
                    </select>
                    <button onClick={fetchVouchers} style={{ padding: '9px 20px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                        🔍 Tìm kiếm
                    </button>
                </div>
            </div>

            {/* NÚT THÊM MỚI */}
            <div style={{ marginBottom: '15px' }}>
                <button 
                    onClick={handleOpenAdd} 
                    style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Tạo Voucher
                </button>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Mã Code</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Mức giảm</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Đơn tối thiểu</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Thời gian</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Đã dùng</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Không tìm thấy voucher nào phù hợp.</td></tr>
                        ) : (
                            currentItems.map((v, index) => {
                                // TÍNH TOÁN STT
                                const stt = (currentPage - 1) * itemsPerPage + index + 1;
                                const rowStyle = { borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' };

                                return (
                                    <tr key={v.voucherId} style={rowStyle}>
                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#4e73df' }}>{v.code}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {v.discountType === 'PERCENT' 
                                                ? <span style={{color: '#e74a3b', fontWeight: '500'}}>{v.discountValue}% (Max {v.maxDiscountAmount?.toLocaleString()}đ)</span>
                                                : <span style={{color: '#e74a3b', fontWeight: '500'}}>{v.discountValue?.toLocaleString()}đ</span>
                                            }
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>{v.minOrderValue?.toLocaleString()}đ</td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: '#555' }}>
                                            <div>{new Date(v.startDate).toLocaleDateString('vi-VN')}</div>
                                            <div style={{fontSize: '11px', color: '#888'}}>đến {new Date(v.endDate).toLocaleDateString('vi-VN')}</div>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{fontWeight: 'bold'}}>{v.usageCount}</span> <span style={{color: '#999'}}>/ {v.usageLimit || '∞'}</span>
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {renderStatusBadge(v)}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            {/* NÚT SỬA */}
                                            <button 
                                                onClick={() => handleOpenEdit(v)} 
                                                style={{ marginRight: '8px', cursor: 'pointer', background:'transparent', color:'#4e73df', border:'1px solid #4e73df', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}>
                                                Sửa
                                            </button>
                                            {/* NÚT XÓA */}
                                            <button 
                                                onClick={() => handleDelete(v.voucherId)} 
                                                style={{ cursor: 'pointer', background:'transparent', color:'#e74a3b', border:'1px solid #e74a3b', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}>
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* --- THANH PHÂN TRANG (COPY TỪ ADMIN PRODUCT) --- */}
                {vouchers.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '5px', borderTop: '1px solid #eee' }}>
                        
                        {/* NHÓM NÚT TRÁI: Chỉ hiện khi không phải trang 1 */}
                        {currentPage > 1 && (
                            <>
                                {/* Nút về Trang đầu */}
                                <button 
                                    onClick={() => paginate(1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Về trang đầu"
                                >
                                    &#171; Đầu
                                </button>

                                {/* Nút Trước */}
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
                            // Nếu tổng số trang <= 10 thì hiện hết
                            if (totalPages <= 10) {
                                startPage = 1;
                                endPage = totalPages;
                            } else {
                                // Nếu tổng > 10, tính toán cửa sổ trượt
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

                        {/* NHÓM NÚT PHẢI: Chỉ hiện khi không phải trang cuối */}
                        {currentPage < totalPages && (
                            <>
                                {/* Nút Sau */}
                                <button 
                                    onClick={() => paginate(currentPage + 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    Sau &rsaquo;
                                </button>

                                {/* Nút đến Trang cuối */}
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

            {/* Gọi Modal */}
            <VoucherModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={handleSaveFromModal} 
                editingVoucher={editingVoucher}
            />
        </div>
    );
}

export default Vouchers;