import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaPrint, FaCalendarAlt, FaSearch, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const ImportReceiptList = () => {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ fromDate: '', toDate: '', supplierId: '' });

    // --- STATE PHÂN TRANG (MỚI) ---
    const [page, setPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị trên mỗi trang

    // --- STATE CHO MODAL & EDIT ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    
    // State riêng cho chức năng sửa giá
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState([]); 

    const BASE_URL = 'https://localhost:7298';

    // 1. FETCH DANH SÁCH PHIẾU
    const fetchReceipts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.fromDate) params.append('fromDate', filters.fromDate);
            if (filters.toDate) params.append('toDate', filters.toDate);
            if (filters.supplierId) params.append('supplierId', filters.supplierId);

            const res = await axios.get(`${BASE_URL}/api/ImportReceipts?${params.toString()}`);
            const data = res.data?.$values || res.data;
            setReceipts(Array.isArray(data) ? data : []);
            
            // Reset về trang 1 khi lọc lại dữ liệu
            setPage(1); 
        } catch (err) {
            console.error("Lỗi tải phiếu nhập:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReceipts(); }, []);

    // --- LOGIC TÍNH TOÁN PHÂN TRANG (CLIENT-SIDE) ---
    const indexOfLastItem = page * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = receipts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(receipts.length / itemsPerPage);

    const paginate = (pageNumber) => setPage(pageNumber);

    // 2. XEM CHI TIẾT
    const viewDetail = async (id) => {
        setIsEditing(false);
        try {
            const res = await axios.get(`${BASE_URL}/api/ImportReceipts/${id}`);
            const data = res.data?.$values || res.data;
            setSelectedDetail({
                id: id,
                items: Array.isArray(data) ? data : []
            });
            setIsModalOpen(true);
        } catch (err) {
            console.error("Lỗi tải chi tiết:", err);
            alert("Không thể tải chi tiết phiếu nhập.");
        }
    };

    // 3. XỬ LÝ XÓA PHIẾU
    const handleDelete = async (id) => {
        if (!window.confirm(`CẢNH BÁO: Bạn có chắc muốn xóa phiếu PN-${id}?\n\nHành động này sẽ trừ lại tồn kho. Nếu hàng đã bán, hệ thống sẽ chặn xóa.`)) {
            return;
        }
        try {
            await axios.delete(`${BASE_URL}/api/ImportReceipts/${id}`);
            alert("Xóa phiếu và hoàn tác kho thành công!");
            fetchReceipts(); 
        } catch (err) {
            console.error("Lỗi xóa phiếu:", err);
            if (err.response && err.response.data && err.response.data.message) {
                alert(`KHÔNG THỂ XÓA:\n${err.response.data.message}`);
            } else {
                alert("Có lỗi xảy ra khi xóa phiếu.");
            }
        }
    };

    // 4. BẮT ĐẦU SỬA GIÁ
    const handleStartEdit = () => {
        const currentData = selectedDetail.items.map(item => ({
            detailId: item.detailId,       
            productName: item.productName, 
            variantName: item.variantName,
            quantity: item.quantity,       
            importPrice: item.importPrice  
        }));
        setEditData(currentData);
        setIsEditing(true);
    };

    // 5. XỬ LÝ KHI GÕ INPUT GIÁ
    const handlePriceChange = (index, newPrice) => {
        const newData = [...editData];
        newData[index].importPrice = Number(newPrice);
        setEditData(newData);
    };

    // 6. LƯU CẬP NHẬT GIÁ
    const handleSavePrice = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn cập nhật giá vốn mới?")) return;
        try {
            const payload = editData.map(item => ({
                DetailId: item.detailId,
                NewImportPrice: item.importPrice
            }));
            await axios.put(`${BASE_URL}/api/ImportReceipts/${selectedDetail.id}/update-price`, payload);
            
            alert("Cập nhật giá vốn thành công!");
            setIsEditing(false);
            setIsModalOpen(false);
            fetchReceipts();
        } catch (err) {
            console.error(err);
            alert("Lỗi cập nhật giá: " + (err.response?.data?.message || err.message));
        }
    };

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', borderLeft: '5px solid #3498db', paddingLeft: '10px' }}>
                Lịch Sử Nhập Kho
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
                    onClick={fetchReceipts} 
                    style={{ padding: '8px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}
                >
                    <FaSearch /> Lọc dữ liệu
                </button>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#ecf0f1' }}>
                        <tr>
                            {/* --- CỘT STT MỚI --- */}
                            <th style={{ padding: '15px', textAlign: 'center', color: '#2c3e50', width: '50px' }}>STT</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50' }}>Mã Phiếu</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50' }}>Nhà Cung Cấp</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50' }}>Ngày Nhập</th>
                            <th style={{ padding: '15px', textAlign: 'left', color: '#2c3e50' }}>Người Tạo</th>
                            <th style={{ padding: '15px', textAlign: 'right', color: '#2c3e50' }}>Tổng Tiền</th>
                            <th style={{ padding: '15px', textAlign: 'center', color: '#2c3e50' }}>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((r, index) => {
                                // Tính STT
                                const stt = (page - 1) * itemsPerPage + index + 1;

                                return (
                                    <tr 
                                        key={r.receiptId} 
                                        style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        {/* HIỂN THỊ STT */}
                                        <td style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>
                                        
                                        <td style={{ padding: '15px', fontWeight: 'bold', color: '#3498db' }}>PN-{r.receiptId}</td>
                                        <td style={{ padding: '15px' }}>{r.supplierName}</td>
                                        <td style={{ padding: '15px' }}>{new Date(r.importDate).toLocaleDateString('vi-VN')}</td>
                                        <td style={{ padding: '15px' }}>{r.creatorName}</td>
                                        <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>
                                            {formatMoney(r.totalAmount)}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                {/* NÚT CHI TIẾT (STYLE GIỐNG ADMIN ORDER) */}
                                                <button 
                                                    onClick={() => viewDetail(r.receiptId)} 
                                                    style={{ 
                                                        width: '36px', height: '36px', 
                                                        border: '1px solid #4e73df', borderRadius: '6px', 
                                                        backgroundColor: 'white', color: '#4e73df', 
                                                        cursor: 'pointer', display: 'inline-flex', 
                                                        alignItems: 'center', justifyContent: 'center', 
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
                                                    }}
                                                    title="Xem chi tiết & Sửa giá"
                                                >
                                                    <FaEye />
                                                </button>
                                                
                                                {/* NÚT XÓA (STYLE GIỐNG ADMIN ORDER) */}
                                                <button 
                                                    onClick={() => handleDelete(r.receiptId)} 
                                                    style={{ 
                                                        width: '36px', height: '36px', 
                                                        border: '1px solid #f5c2c7', borderRadius: '6px',
                                                        backgroundColor: 'white', color: '#dc3545', 
                                                        cursor: 'pointer', display: 'inline-flex', 
                                                        alignItems: 'center', justifyContent: 'center', 
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                                    }}
                                                    title="Xóa phiếu (Hoàn kho)"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Không có dữ liệu phiếu nhập nào.</td></tr>
                        )}
                    </tbody>
                </table>

                {/* --- UI PHÂN TRANG (GIỐNG ADMIN ORDER) --- */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '5px', borderTop: '1px solid #eee' }}>
                        {/* NHÓM NÚT TRÁI */}
                        {page > 1 && (
                            <>
                                <button 
                                    onClick={() => paginate(1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Về trang đầu"
                                >
                                    &#171; Đầu
                                </button>
                                <button 
                                    onClick={() => paginate(page - 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    &lsaquo; Trước
                                </button>
                            </>
                        )}

                        {/* DANH SÁCH SỐ TRANG (SLIDING WINDOW) */}
                        {(() => {
                            let startPage, endPage;
                            if (totalPages <= 10) {
                                startPage = 1;
                                endPage = totalPages;
                            } else {
                                if (page <= 6) {
                                    startPage = 1;
                                    endPage = 10;
                                } else if (page + 4 >= totalPages) {
                                    startPage = totalPages - 9;
                                    endPage = totalPages;
                                } else {
                                    startPage = page - 5;
                                    endPage = page + 4;
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
                                        background: page === number ? '#4e73df' : 'white', 
                                        color: page === number ? 'white' : '#333',
                                        cursor: 'pointer', 
                                        borderRadius: '4px',
                                        fontWeight: page === number ? 'bold' : 'normal',
                                        fontSize: '13px',
                                        minWidth: '32px'
                                    }}
                                >
                                    {number}
                                </button>
                            ));
                        })()}

                        {/* NHÓM NÚT PHẢI */}
                        {page < totalPages && (
                            <>
                                <button 
                                    onClick={() => paginate(page + 1)} 
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

            {/* MODAL CHI TIẾT & SỬA (GIỮ NGUYÊN) */}
            {isModalOpen && selectedDetail && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: 'white', width: '800px', maxWidth: '95%', borderRadius: '8px', padding: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'fadeIn 0.3s' }}>
                        
                        {/* Header Modal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: '#2c3e50' }}>
                                {isEditing ? `Sửa giá phiếu nhập #PN-${selectedDetail.id}` : `Chi tiết phiếu nhập #PN-${selectedDetail.id}`}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}>&times;</button>
                        </div>

                        {/* Body Modal - Table */}
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontSize: '13px' }}>Sản phẩm</th>
                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd', fontSize: '13px' }}>SL</th>
                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd', fontSize: '13px', width: '180px' }}>
                                            {isEditing ? 'Giá nhập mới (VNĐ)' : 'Giá nhập'}
                                        </th>
                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd', fontSize: '13px' }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(isEditing ? editData : selectedDetail.items).map((d, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>
                                                <div style={{fontWeight: '500'}}>{d.productName}</div>
                                                <div style={{color: '#666', fontSize: '12px'}}>{d.variantName !== 'Tiêu chuẩn' ? d.variantName : ''}</div>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{d.quantity}</td>
                                            <td style={{ padding: '10px', textAlign: 'right' }}>
                                                {isEditing ? (
                                                    <input 
                                                        type="number" 
                                                        value={d.importPrice} 
                                                        onChange={(e) => handlePriceChange(i, e.target.value)}
                                                        style={{ width: '100%', padding: '6px', textAlign: 'right', border: '1px solid #3498db', borderRadius: '4px', outline: 'none' }}
                                                    />
                                                ) : (
                                                    formatMoney(d.importPrice)
                                                )}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                                                {formatMoney(d.quantity * d.importPrice)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Buttons */}
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            {!isEditing ? (
                                <>
                                    <button 
                                        onClick={handleStartEdit} 
                                        style={{ padding: '8px 15px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        title="Chỉ sửa giá nhập, không sửa số lượng"
                                    >
                                        <FaEdit /> Sửa giá vốn
                                    </button>
                                    <button 
                                        onClick={() => window.print()} 
                                        style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <FaPrint /> In phiếu
                                    </button>
                                    <button 
                                        onClick={() => setIsModalOpen(false)} 
                                        style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Đóng
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span style={{ display: 'flex', alignItems: 'center', marginRight: 'auto', color: '#e67e22', fontStyle: 'italic', fontSize: '13px' }}>
                                        * Lưu ý: Giá vốn sản phẩm sẽ được cập nhật theo giá mới.
                                    </span>
                                    <button 
                                        onClick={() => setIsEditing(false)} 
                                        style={{ padding: '8px 15px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <FaTimes /> Hủy bỏ
                                    </button>
                                    <button 
                                        onClick={handleSavePrice} 
                                        style={{ padding: '8px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <FaSave /> Lưu thay đổi
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
};

export default ImportReceiptList;