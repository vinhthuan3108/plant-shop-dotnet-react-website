import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2'; 
import VoucherModal from '../../components/admin/VoucherModal';
import { API_BASE } from '../../utils/apiConfig.jsx';

function Vouchers() {
    // --- 1. STATE QUẢN LÝ DỮ LIỆU ---
    const [vouchers, setVouchers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);

    // --- 2. STATE PHÂN TRANG ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    // --- 3. STATE BỘ LỌC (CẬP NHẬT) ---
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'expired'
    const [fromDate, setFromDate] = useState(''); // Lọc từ ngày
    const [toDate, setToDate] = useState('');     // Lọc đến ngày

    const API_URL = `${API_BASE}/api/vouchers`;

    // --- 4. LOGIC GỌI API (CẬP NHẬT) ---
    const fetchVouchers = async () => {
        try {
            // Sử dụng URLSearchParams để xây dựng query string an toàn
            const params = new URLSearchParams();

            if (search) params.append('search', search);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (fromDate) params.append('from', fromDate);
            if (toDate) params.append('to', toDate);
            
            // Kết quả url sẽ dạng: .../api/vouchers?search=ABC&status=active&from=2023-01-01...
            const url = `${API_URL}?${params.toString()}`;
            
            const res = await axios.get(url);
            setVouchers(res.data);
            setCurrentPage(1); // Reset về trang 1 khi lọc
        } catch (error) {
            console.error("Lỗi tải danh sách voucher", error);
        }
    };

    // Tự động gọi lại API khi thay đổi Dropdown trạng thái
    useEffect(() => {
        fetchVouchers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus]);

    // --- 5. LOGIC PHÂN TRANG ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = vouchers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(vouchers.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // --- 6. HANDLERS (Modal & CRUD) ---
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
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Cập nhật voucher thành công.',
                    icon: 'success',
                    timer: 700,
                    showConfirmButton: false
                });
            } else {
                await axios.post(API_URL, formData);
                Swal.fire({
                    title: 'Thành công!',
                    text: 'Tạo mã giảm giá thành công!',
                    icon: 'success',
                    timer: 700,
                    showConfirmButton: false
                });
            }
            setIsModalOpen(false);
            fetchVouchers();
        } catch (error) {
            console.error(error);
            Swal.fire({
                title: 'Lỗi!',
                text: error.response?.data || "Có lỗi xảy ra.",
                icon: 'error'
            });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn chắc chắn?',
            text: "Bạn muốn xóa hoặc ngừng kích hoạt voucher này?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const res = await axios.delete(`${API_URL}/${id}`);
                Swal.fire({
                    title: 'Đã xóa!',
                    text: res.data.message || 'Voucher đã được xóa/ngưng.',
                    icon: 'success',
                    timer: 700,
                    showConfirmButton: false
                });
                fetchVouchers();
            } catch (error) {
                Swal.fire({
                    title: 'Lỗi!',
                    text: 'Không thể xóa voucher này.',
                    icon: 'error'
                });
            }
        }
    };

    // Hàm reset bộ lọc về mặc định
    const handleResetFilter = () => {
        setSearch('');
        setFromDate('');
        setToDate('');
        setFilterStatus('all');
        // Lưu ý: setFilterStatus sẽ trigger useEffect để fetch lại data
    };

    // --- 7. LOGIC HIỂN THỊ BADGE ---
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

            {/* --- KHỐI CÔNG CỤ TÌM KIẾM & BỘ LỌC --- */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    
                    {/* 1. Tìm kiếm */}
                    <div style={{flex: 1, minWidth: '200px'}}>
                        <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'bold', color:'#555'}}>Tìm kiếm:</label>
                        <input 
                            type="text" 
                            placeholder="Nhập mã code..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '9px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                        />
                    </div>

                    {/* 2. Từ ngày */}
                    <div>
                        <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'bold', color:'#555'}}>Từ ngày:</label>
                        <input 
                            type="date" 
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                        />
                    </div>

                    {/* 3. Đến ngày */}
                    <div>
                        <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'bold', color:'#555'}}>Đến ngày:</label>
                        <input 
                            type="date" 
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}
                        />
                    </div>

                    {/* 4. Trạng thái */}
                    <div>
                        <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'bold', color:'#555'}}>Trạng thái:</label>
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ padding: '9px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none', minWidth:'160px' }}
                        >
                            <option value="all">-- Tất cả --</option>
                            <option value="active">Đang kích hoạt</option>
                            <option value="expired">Đã hết hạn</option>
                            {/* THÊM DÒNG NÀY: */}
                            <option value="inactive">Đã khóa (Ngừng kích hoạt)</option>
                        </select>
                    </div>

                    {/* 5. Nút Action */}
                    <div style={{display:'flex', gap:'5px'}}>
                        <button onClick={fetchVouchers} style={{ padding: '9px 20px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                            🔍 Tìm
                        </button>
                        <button onClick={handleResetFilter} style={{ padding: '9px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Đặt lại bộ lọc">
                            ↺
                        </button>
                    </div>
                </div>
            </div>

            {/* --- NÚT THÊM MỚI --- */}
            <div style={{ marginBottom: '15px' }}>
                <button 
                    onClick={handleOpenAdd} 
                    style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Tạo Voucher
                </button>
            </div>

            {/* --- BẢNG DỮ LIỆU --- */}
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
                                            <button 
                                                onClick={() => handleOpenEdit(v)} 
                                                style={{ marginRight: '8px', cursor: 'pointer', background:'transparent', color:'#4e73df', border:'1px solid #4e73df', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}>
                                                Sửa
                                            </button>
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

                {/* --- THANH PHÂN TRANG --- */}
                {vouchers.length > itemsPerPage && (
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

            <VoucherModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={handleSaveFromModal} 
                editingVoucher={editingVoucher}
            />

            {/* Fix Z-Index cho SweetAlert */}
            <style>{`
                .swal2-container {
                    z-index: 20000 !important;
                }
            `}</style>
        </div>
    );
}

export default Vouchers;