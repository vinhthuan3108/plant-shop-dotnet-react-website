import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ImportReceiptList = () => {
    const [receipts, setReceipts] = useState([]);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [filters, setFilters] = useState({ fromDate: '', toDate: '', supplierId: '' });

    const fetchReceipts = async () => {
        const params = new URLSearchParams(filters).toString();
        const res = await axios.get(`https://localhost:7298/api/ImportReceipts?${params}`);
        setReceipts(res.data?.$values ?? res.data);
    };

    useEffect(() => { fetchReceipts(); }, [filters]);

    const viewDetail = async (id) => {
        const res = await axios.get(`https://localhost:7298/api/ImportReceipts/${id}`);
        setSelectedDetail(res.data?.$values ?? res.data);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h3>Lịch sử nhập kho</h3>
            {/* Bộ lọc */}
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                <input type="date" onChange={e => setFilters({...filters, fromDate: e.target.value})} />
                <input type="date" onChange={e => setFilters({...filters, toDate: e.target.value})} />
                <button onClick={fetchReceipts}>Lọc dữ liệu</button>
            </div>

            <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f4f4f4' }}>
                    <tr>
                        <th>Mã phiếu</th>
                        <th>Nhà cung cấp</th>
                        <th>Ngày nhập</th>
                        <th>Tổng tiền</th>
                        <th>Người tạo</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {receipts.map(r => (
                        <tr key={r.receiptId}>
                            <td>PN-{r.receiptId}</td>
                            <td>{r.supplierName}</td>
                            <td>{new Date(r.importDate).toLocaleDateString()}</td>
                            <td>{r.totalAmount.toLocaleString()} đ</td>
                            <td>{r.creatorName}</td>
                            <td><button onClick={() => viewDetail(r.receiptId)}>Xem chi tiết</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal chi tiết phiếu nhập */}
            {selectedDetail && (
                <div className="modal" style={{ border: '1px solid black', padding: '20px', marginTop: '20px' }}>
                    <h4>Chi tiết mặt hàng</h4>
                    <ul>
                        {selectedDetail.map((d, i) => (
                            <li key={i}>{d.productName} - SL: {d.quantity} - Giá: {d.importPrice.toLocaleString()} đ</li>
                        ))}
                    </ul>
                    <button onClick={() => setSelectedDetail(null)}>Đóng</button>
                    <button onClick={() => window.print()}>In phiếu nhập</button>
                </div>
            )}
        </div>
    );
};
export default ImportReceiptList;