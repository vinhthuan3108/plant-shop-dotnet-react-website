import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEye, FaPrint, FaCalendarAlt, FaSearch } from 'react-icons/fa'; // Cần npm install react-icons

const ImportReceiptList = () => {
    const [receipts, setReceipts] = useState([]);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ fromDate: '', toDate: '', supplierId: '' });

    // State cho Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

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
        } catch (err) {
            console.error("Lỗi tải phiếu nhập:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReceipts(); }, []);

    // 2. XEM CHI TIẾT
    const viewDetail = async (id) => {
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

    // Style định dạng tiền tệ
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
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</td></tr>
                        ) : receipts.length > 0 ? (
                            receipts.map((r, index) => (
                                <tr key={r.receiptId} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                    <td style={{ padding: '15px', fontWeight: 'bold', color: '#3498db' }}>PN-{r.receiptId}</td>
                                    <td style={{ padding: '15px' }}>{r.supplierName}</td>
                                    <td style={{ padding: '15px' }}>{new Date(r.importDate).toLocaleDateString('vi-VN')}</td>
                                    <td style={{ padding: '15px' }}>{r.creatorName}</td>
                                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>
                                        {formatMoney(r.totalAmount)}
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button 
                                            onClick={() => viewDetail(r.receiptId)} 
                                            style={{ backgroundColor: 'white', border: '1px solid #ddd', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', color: '#555', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                            title="Xem chi tiết"
                                        >
                                            <FaEye /> Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Không có dữ liệu phiếu nhập nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT */}
            {isModalOpen && selectedDetail && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{ backgroundColor: 'white', width: '700px', maxWidth: '90%', borderRadius: '8px', padding: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', position: 'relative', animation: 'fadeIn 0.3s' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>&times;</button>
                        
                        <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            Chi tiết phiếu nhập #PN-{selectedDetail.id}
                        </h3>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontSize: '13px' }}>Sản phẩm</th>
                                        <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd', fontSize: '13px' }}>Phân loại</th>
                                        <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd', fontSize: '13px' }}>SL</th>
                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd', fontSize: '13px' }}>Giá nhập</th>
                                        <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd', fontSize: '13px' }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDetail.items.map((d, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '10px' }}>{d.productName}</td>
                                            {/* HIỂN THỊ TÊN VARIANT */}
                                            <td style={{ padding: '10px', color: '#666', fontSize: '13px' }}>
                                                {d.variantName !== 'Tiêu chuẩn' ? d.variantName : '-'}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{d.quantity}</td>
                                            <td style={{ padding: '10px', textAlign: 'right' }}>{formatMoney(d.importPrice)}</td>
                                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(d.subTotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                        </div>
                    </div>
                </div>
            )}
            
            {/* CSS Animation cho Modal */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ImportReceiptList;