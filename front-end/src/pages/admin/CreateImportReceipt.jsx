import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CreateImportReceipt = () => {
    // 1. Khởi tạo State luôn là mảng rỗng
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [supplierId, setSupplierId] = useState('');
    const [note, setNote] = useState('');
    const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
    const [details, setDetails] = useState([{ productId: '', quantity: 1, importPrice: 0 }]);

    useEffect(() => {
    const fetchData = async () => {
    try {
        setLoading(true);
        const [resSup, resProd] = await Promise.all([
            axios.get('https://localhost:7298/api/suppliers'),
            // SỬA TẠI ĐÂY: Thêm Tbl vào trước Products
            axios.get('https://localhost:7298/api/TblProducts') 
        ]);

        console.log(">>> NCC thành công:", resSup.data);
        console.log(">>> Sản phẩm thành công:", resProd.data);

        const sData = resSup.data?.$values ?? resSup.data;
        const pData = resProd.data?.$values ?? resProd.data;

        setSuppliers(Array.isArray(sData) ? sData : []);
        setProducts(Array.isArray(pData) ? pData : []);
    } catch (err) {
        console.error(">>> LỖI CỤ THỂ:", err);
        // Kiểm tra xem lỗi 404 rơi vào link nào
        if (err.response?.status === 404) {
            alert("Lỗi 404: Không tìm thấy API Sản phẩm. Hãy kiểm tra lại TblProductsController!");
        }
    } finally {
        setLoading(false);
    }
};
    fetchData();
}, []);

    const addRow = () => setDetails([...details, { productId: '', quantity: 1, importPrice: 0 }]);
    const removeRow = (index) => setDetails(details.filter((_, i) => i !== index));

    const handleUpdate = (index, field, value) => {
        const newDetails = [...details];
        newDetails[index][field] = value;
        setDetails(newDetails);
    };

    const totalAmount = details.reduce((sum, item) => sum + (item.quantity * item.importPrice), 0);

    const handleSubmit = async () => {
    if (!supplierId) return alert("Vui lòng chọn nhà cung cấp!");
    if (details.some(d => !d.productId)) return alert("Vui lòng chọn đầy đủ sản phẩm!");

    // 1. Lấy Token
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Bạn chưa đăng nhập!");
        return;
    }

    // 2. Cấu hình Header
    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const payload = {
        supplierId: parseInt(supplierId),
        importDate: importDate,
        note: note,
        // creatorId: 6,  <-- XÓA DÒNG NÀY (Backend tự lấy ID rồi)
        details: details.map(d => ({
            productId: parseInt(d.productId),
            quantity: parseInt(d.quantity),
            importPrice: parseFloat(d.importPrice)
        }))
    };

    try {
        // 3. Truyền config vào tham số thứ 3 của axios.post
        const response = await axios.post('https://localhost:7298/api/ImportReceipts', payload, config);
        
        if (response.status === 200 || response.status === 201) {
            alert("Đã lưu phiếu nhập và cập nhật tồn kho thành công!");
            // Reset form
            setDetails([{ productId: '', quantity: 1, importPrice: 0 }]);
            setNote('');
            setSupplierId('');
        }
    } catch (err) {
        console.error("Lỗi khi POST dữ liệu:", err);
        // Hiển thị lỗi chi tiết hơn nếu có
        const errorMessage = err.response?.data?.message || err.response?.data || "Lỗi hệ thống";
        alert(`Lỗi: ${errorMessage}`);
    }
};

    if (loading) return <div>Đang tải dữ liệu kho...</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>Tạo Phiếu Nhập Kho</h2>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', backgroundColor: '#f9f9f9', padding: '15px' }}>
                <div>
                    <label><b>Nhà cung cấp:</b> </label>
                    <select value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                        <option value="">-- Chọn NCC --</option>
                        {/* 4. Dùng optional chaining ?.map để an toàn tuyệt đối */}
                        {suppliers?.map(s => (
                            <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label><b>Ngày nhập:</b> </label>
                    <input type="date" value={importDate} onChange={e => setImportDate(e.target.value)} />
                </div>
            </div>

            <table border="1" width="100%" style={{ borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#eee' }}>
                        <th style={{ padding: '10px' }}>Sản phẩm (Cây)</th>
                        <th>Số lượng</th>
                        <th>Giá nhập</th>
                        <th>Thành tiền</th>
                        <th>Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    {details.map((item, index) => (
                        <tr key={index}>
                            <td style={{ padding: '5px' }}>
                                <select 
                                    style={{ width: '100%', padding: '5px' }}
                                    value={item.productId} 
                                    onChange={e => handleUpdate(index, 'productId', e.target.value)}
                                >
                                    <option value="">-- Chọn loại cây --</option>
                                    {products?.map(p => (
                                        <option key={p.productId} value={p.productId}>
                                            [{p.productCode}] {p.productName} (Tồn: {p.stockQuantity})
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td align="center">
                                <input type="number" min="1" value={item.quantity} 
                                    style={{ width: '60px' }}
                                    onChange={e => handleUpdate(index, 'quantity', e.target.value)} />
                            </td>
                            <td align="center">
                                <input type="number" value={item.importPrice} 
                                    style={{ width: '100px' }}
                                    onChange={e => handleUpdate(index, 'importPrice', e.target.value)} />
                            </td>
                            <td align="right" style={{ paddingRight: '10px' }}>
                                {(item.quantity * item.importPrice).toLocaleString()} đ
                            </td>
                            <td align="center">
                                <button onClick={() => removeRow(index)} style={{ color: 'red' }}>✖</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: '15px' }}>
                <button onClick={addRow} style={{ padding: '5px 15px' }}>+ Thêm sản phẩm</button>
                <div style={{ marginTop: '15px' }}>
                    <label>Ghi chú phiếu nhập:</label><br/>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows="2" style={{ width: '100%', marginTop: '5px' }} />
                </div>
                
                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>Tổng tiền: <span style={{ color: 'red' }}>{totalAmount.toLocaleString()} VNĐ</span></h3>
                    <button 
                        onClick={handleSubmit}
                        style={{ 
                            background: '#28a745', color: 'white', 
                            padding: '12px 30px', border: 'none', 
                            borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
                        }}
                    >
                        HOÀN TẤT NHẬP KHO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateImportReceipt;