import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaSearch, FaHistory, FaBoxOpen } from 'react-icons/fa';
import { API_BASE } from '../../utils/apiConfig.jsx';
const InventoryAdjustHistory = () => {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ fromDate: '', toDate: '' });

    // --- STATE PHÂN TRANG ---
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    //const BASE_URL = 'https://localhost:7298'; // Cập nhật port nếu khác

    // 1. FETCH DỮ LIỆU
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.fromDate) params.append('fromDate', filters.fromDate);
            if (filters.toDate) params.append('toDate', filters.toDate);

            const res = await axios.get(`${API_BASE}/api/InventoryAdjustments?${params.toString()}`);
            
            // Xử lý dữ liệu trả về (hỗ trợ cả $values của .NET)
            const data = res.data?.$values || res.data;
            setHistoryList(Array.isArray(data) ? data : []);
            
            // Reset về trang 1 khi lọc lại
            setPage(1);
        } catch (err) {
            console.error("Lỗi tải lịch sử kho:", err);
            // alert("Không thể tải lịch sử kho."); // Có thể bật lại nếu muốn thông báo
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    // --- LOGIC PHÂN TRANG (Client-side) ---
    const indexOfLastItem = page * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = historyList.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(historyList.length / itemsPerPage);
    const paginate = (pageNumber) => setPage(pageNumber);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', borderLeft: '5px solid #e67e22', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaHistory /> Lịch Sử Điều Chỉnh Kho
            </h2>

            {/* BỘ LỌC */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Từ ngày</label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '5px 10px' }}>
                        <FaCalendarAlt color="#888" style={{ marginRight: '8px' }} />
                        <input type="date" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} style={{ border: 'none', outline: 'none', color: '#555' }} />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Đến ngày</label>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '5px 10px' }}>
                        <FaCalendarAlt color="#888" style={{ marginRight: '8px' }} />
                        <input type="date" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} style={{ border: 'none', outline: 'none', color: '#555' }} />
                    </div>
                </div>
                <button 
                    onClick={fetchHistory} 
                    style={{ padding: '8px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
                >
                    <FaSearch /> Xem dữ liệu
                </button>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#ecf0f1' }}>
                        <tr>
                            <th style={{ padding: '15px', textAlign: 'center', color: '#2c3e50', width: '50px' }}>STT</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50' }}>Thời gian</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50' }}>Sản phẩm</th>
                            <th style={{ padding: '15px', textAlign: 'center', color: '#2c3e50' }}>SL Thay đổi</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50' }}>Lý do</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50' }}>Người thực hiện</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item, index) => {
                                const stt = (page - 1) * itemsPerPage + index + 1;
                                const isPositive = item.quantityAdjusted > 0;

                                return (
                                    <tr 
                                        key={item.adjustmentId} 
                                        style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>
                                        
                                        {/* Thời gian */}
                                        <td style={{ padding: '15px', color: '#555' }}>
                                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                                        </td>

                                        {/* Sản phẩm & Hình ảnh */}
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', backgroundColor: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                                        <FaBoxOpen />
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{item.productName}</div>
                                                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Phân loại: {item.variantName}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Số lượng (Màu xanh/đỏ) */}
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <span style={{ 
                                                display: 'inline-block',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '13px',
                                                fontWeight: 'bold',
                                                backgroundColor: isPositive ? '#e8f8f5' : '#fdedec',
                                                color: isPositive ? '#27ae60' : '#c0392b'
                                            }}>
                                                {isPositive ? '+' : ''}{item.quantityAdjusted}
                                            </span>
                                        </td>

                                        {/* Lý do */}
                                        <td style={{ padding: '15px', fontStyle: 'italic', color: '#666' }}>
                                            {item.reason || "Không có lý do"}
                                        </td>

                                        {/* Người thực hiện */}
                                        <td style={{ padding: '15px', fontWeight: '500', color: '#2980b9' }}>
                                            {item.fullName}
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Không tìm thấy lịch sử điều chỉnh nào.</td></tr>
                        )}
                    </tbody>
                </table>

                {/* --- UI PHÂN TRANG --- */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '5px', borderTop: '1px solid #eee' }}>
                        {page > 1 && (
                            <>
                                <button onClick={() => paginate(1)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}>&#171; Đầu</button>
                                <button onClick={() => paginate(page - 1)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>&lsaquo; Trước</button>
                            </>
                        )}

                        {/* Số trang logic giống file mẫu */}
                        {(() => {
                            let startPage, endPage;
                            if (totalPages <= 10) {
                                startPage = 1; endPage = totalPages;
                            } else {
                                if (page <= 6) { startPage = 1; endPage = 10; } 
                                else if (page + 4 >= totalPages) { startPage = totalPages - 9; endPage = totalPages; } 
                                else { startPage = page - 5; endPage = page + 4; }
                            }
                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) { pages.push(i); }
                            
                            return pages.map(number => (
                                <button 
                                    key={number} 
                                    onClick={() => paginate(number)}
                                    style={{ 
                                        padding: '6px 12px', 
                                        border: '1px solid #ddd', 
                                        background: page === number ? '#4e73df' : 'white', 
                                        color: page === number ? 'white' : '#333',
                                        cursor: 'pointer', borderRadius: '4px',
                                        fontWeight: page === number ? 'bold' : 'normal',
                                        fontSize: '13px', minWidth: '32px'
                                    }}
                                >
                                    {number}
                                </button>
                            ));
                        })()}

                        {page < totalPages && (
                            <>
                                <button onClick={() => paginate(page + 1)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>Sau &rsaquo;</button>
                                <button onClick={() => paginate(totalPages)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}>Cuối &#187;</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryAdjustHistory;