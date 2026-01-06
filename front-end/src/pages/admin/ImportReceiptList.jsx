import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaEye, FaPrint, FaCalendarAlt, FaSearch, FaTrash, FaEdit, FaSave, FaTimes, FaUndo } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { API_BASE } from '../../utils/apiConfig.jsx';

const ImportReceiptList = () => {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // 1. SỬA: State quản lý giới hạn giá (Dynamic) thay vì cố định
    const [priceBounds, setPriceBounds] = useState({ min: 0, max: 10000000 }); 
    const isFirstLoad = useRef(true); // Ref để chỉ tính max price lần đầu

    // State bộ lọc mở rộng
    const [filters, setFilters] = useState({ 
        fromDate: '', 
        toDate: '', 
        supplierId: '',
        keyword: '',           
        minPrice: 0,           
        maxPrice: 10000000    
    });

    // --- STATE PHÂN TRANG ---
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    // --- STATE CHO MODAL & EDIT ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState([]); 

    // FETCH DANH SÁCH PHIẾU
    const fetchReceipts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.fromDate) params.append('fromDate', filters.fromDate);
            if (filters.toDate) params.append('toDate', filters.toDate);
            if (filters.supplierId) params.append('supplierId', filters.supplierId);
            if (filters.keyword) params.append('keyword', filters.keyword);
            
            // Chỉ gửi min/max nếu người dùng đã filter, hoặc gửi mặc định
            params.append('minPrice', filters.minPrice);
            params.append('maxPrice', filters.maxPrice);

            const res = await axios.get(`${API_BASE}/api/ImportReceipts?${params.toString()}`);
            const data = res.data?.$values || res.data;
            const validData = Array.isArray(data) ? data : [];
            
            setReceipts(validData);
            
            // --- 2. LOGIC TỰ ĐỘNG LẤY MAX PRICE (Giống AdminProduct) ---
            if (isFirstLoad.current && validData.length > 0) {
                // Lấy danh sách tổng tiền
                const prices = validData.map(r => r.totalAmount);
                const maxVal = Math.max(...prices);
                
                // Nếu maxVal quá nhỏ (ví dụ 0) thì gán mặc định để slider đẹp
                const finalMax = maxVal > 0 ? maxVal : 10000000;

                setPriceBounds({ min: 0, max: finalMax });
                
                // Cập nhật lại filters để thanh trượt hiển thị đúng range max
                setFilters(prev => ({ ...prev, maxPrice: finalMax }));
                
                isFirstLoad.current = false;
            }

            // Reset về trang 1 khi lọc
            setPage(1);
        } catch (err) {
            console.error("Lỗi tải phiếu nhập:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReceipts(); }, []);

    // --- LOGIC PHÂN TRANG ---
    const indexOfLastItem = page * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = receipts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(receipts.length / itemsPerPage);
    const paginate = (pageNumber) => setPage(pageNumber);

    // --- HANDLERS BỘ LỌC ---
    const handleSliderChange = (value) => {
        setFilters(prev => ({ ...prev, minPrice: value[0], maxPrice: value[1] }));
    };

    const handleResetFilter = () => {
        const defaultFilters = {
            fromDate: '', 
            toDate: '', 
            supplierId: '',
            keyword: '',
            minPrice: 0, // Reset về 0
            maxPrice: priceBounds.max // Reset về Max động
        };
        setFilters(defaultFilters);
        
        // Gọi lại API (cần tạo params thủ công vì state chưa kịp update)
        // Hoặc đơn giản là người dùng bấm nút Tìm kiếm sau khi reset. 
        // Ở đây ta set lại state, user bấm Tìm kiếm để refresh.
    };

    // XEM CHI TIẾT
    const viewDetail = async (id) => {
        setIsEditing(false);
        try {
            const res = await axios.get(`${API_BASE}/api/ImportReceipts/${id}`);
            const data = res.data?.$values || res.data;
            setSelectedDetail({
                id: id,
                items: Array.isArray(data) ? data : []
            });
            setIsModalOpen(true);
        } catch (err) {
            console.error("Lỗi tải chi tiết:", err);
            Swal.fire('Lỗi', 'Không thể tải chi tiết phiếu nhập.', 'error');
        }
    };

    // XỬ LÝ XÓA PHIẾU
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: `Xóa phiếu PN-${id}?`,
            html: `Hành động này sẽ <b>trừ lại tồn kho</b>.<br/>Nếu hàng đã bán, hệ thống sẽ chặn xóa.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Đồng ý xóa',
            cancelButtonText: 'Hủy bỏ'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.delete(`${API_BASE}/api/ImportReceipts/${id}`);
            
            Swal.fire({
                title: 'Đã xóa!',
                text: 'Xóa phiếu và hoàn tác kho thành công.',
                icon: 'success',
                timer: 700,
                showConfirmButton: false
            });
            fetchReceipts(); 
        } catch (err) {
            console.error("Lỗi xóa phiếu:", err);
            const msg = err.response?.data?.message || "Có lỗi xảy ra khi xóa phiếu.";
            Swal.fire('Không thể xóa!', msg, 'error');
        }
    };

    // BẮT ĐẦU SỬA GIÁ
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

    const handlePriceChange = (index, newPrice) => {
        const newData = [...editData];
        newData[index].importPrice = Number(newPrice);
        setEditData(newData);
    };

    // LƯU CẬP NHẬT GIÁ
    const handleSavePrice = async () => {
        const result = await Swal.fire({
            title: 'Cập nhật giá vốn?',
            text: "Giá vốn mới sẽ được áp dụng ngay lập tức.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Lưu thay đổi',
            cancelButtonText: 'Hủy'
        });

        if (!result.isConfirmed) return;

        try {
            const payload = editData.map(item => ({
                DetailId: item.detailId,
                NewImportPrice: item.importPrice
            }));
            await axios.put(`${API_BASE}/api/ImportReceipts/${selectedDetail.id}/update-price`, payload);
            
            Swal.fire('Thành công', 'Cập nhật giá vốn thành công!', 'success');
            
            setIsEditing(false);
            setIsModalOpen(false);
            fetchReceipts();
        } catch (err) {
            console.error(err);
            Swal.fire('Lỗi', "Lỗi cập nhật giá: " + (err.response?.data?.message || err.message), 'error');
        }
    };

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Lịch sử nhập kho</h2>

            {/* --- KHỐI BỘ LỌC --- */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                
                {/* Dòng 1: Ngày tháng & Từ khóa */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Từ ngày</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px' }}>
                            <FaCalendarAlt color="#888" style={{ marginRight: '8px' }} />
                            <input type="date" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} style={{ border: 'none', outline: 'none', color: '#555', width: '100%' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Đến ngày</label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '8px 10px' }}>
                            <FaCalendarAlt color="#888" style={{ marginRight: '8px' }} />
                            <input type="date" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} style={{ border: 'none', outline: 'none', color: '#555', width: '100%' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize:'13px', color:'#555'}}>Từ khóa</label>
                        <input 
                            type="text" 
                            placeholder="Mã phiếu, NCC, Người tạo..." 
                            value={filters.keyword} 
                            onChange={e => setFilters({ ...filters, keyword: e.target.value })} 
                            style={{ width: '100%', padding: '9px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }} 
                        />
                    </div>
                </div>

                {/* Dòng 2: Slider Giá & Nút bấm */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'end' }}>
                    
                    {/* Slider Giá */}
                    <div>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize:'13px', color:'#555'}}>
                            Khoảng tổng tiền: <span style={{color:'#4e73df'}}>{formatMoney(filters.minPrice)} — {formatMoney(filters.maxPrice)}</span>
                        </label>
                        <div style={{ padding: '0 10px' }}>
                            {/* 3. Slider sử dụng priceBounds.max động */}
                            <Slider 
                                range 
                                min={priceBounds.min} 
                                max={priceBounds.max} 
                                step={10000} 
                                value={[filters.minPrice, filters.maxPrice]} 
                                onChange={handleSliderChange} 
                                trackStyle={[{ backgroundColor: '#4e73df', height: 6 }]} 
                                handleStyle={[
                                    { borderColor: '#4e73df', backgroundColor: '#fff', opacity: 1, marginTop: -4 }, 
                                    { borderColor: '#4e73df', backgroundColor: '#fff', opacity: 1, marginTop: -4 }
                                ]} 
                                railStyle={{ backgroundColor: '#e9ecef', height: 6 }} 
                            />
                        </div>
                    </div>

                    {/* Nút Tìm kiếm & Reset */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={fetchReceipts} 
                            style={{ flex: 1, padding: '10px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        >
                            <FaSearch /> Tìm kiếm
                        </button>
                        <button 
                            onClick={handleResetFilter} 
                            style={{ flex: 0.6, padding: '10px', backgroundColor: '#f8f9fa', color: '#666', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                        >
                            <FaUndo /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#ecf0f1' }}>
                        <tr>
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
                                const stt = (page - 1) * itemsPerPage + index + 1;
                                return (
                                    <tr 
                                        key={r.receiptId} 
                                        style={{ borderBottom: '1px solid #eee', transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
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
                                                <button 
                                                    onClick={() => viewDetail(r.receiptId)} 
                                                    style={{ width: '36px', height: '36px', border: '1px solid #4e73df', borderRadius: '6px', backgroundColor: 'white', color: '#4e73df', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                                    title="Xem chi tiết & Sửa giá"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(r.receiptId)} 
                                                    style={{ width: '36px', height: '36px', border: '1px solid #f5c2c7', borderRadius: '6px', backgroundColor: 'white', color: '#dc3545', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
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

                {/* --- UI PHÂN TRANG --- */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '5px', borderTop: '1px solid #eee' }}>
                        {page > 1 && (
                            <>
                                <button onClick={() => paginate(1)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}>&#171; Đầu</button>
                                <button onClick={() => paginate(page - 1)} style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}>&lsaquo; Trước</button>
                            </>
                        )}

                        {(() => {
                            let startPage, endPage;
                            if (totalPages <= 10) { startPage = 1; endPage = totalPages; } 
                            else {
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
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: page === number ? '#4e73df' : 'white', color: page === number ? 'white' : '#333', cursor: 'pointer', borderRadius: '4px', fontWeight: page === number ? 'bold' : 'normal', fontSize: '13px', minWidth: '32px' }}
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

            {/* MODAL CHI TIẾT & SỬA */}
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
            
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                /* 4. FIX Z-INDEX CHO SWEETALERT */
                .swal2-container {
                    z-index: 20000 !important;
                }
            `}</style>
        </div>
    );
};

export default ImportReceiptList;