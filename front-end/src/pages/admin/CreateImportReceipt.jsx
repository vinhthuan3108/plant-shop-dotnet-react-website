import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTrash, FaPlus } from 'react-icons/fa'; // Cần cài: npm install react-icons

const CreateImportReceipt = () => {
    // --- STATE DỮ LIỆU GỐC (MASTER DATA) ---
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // Chứa toàn bộ sản phẩm và variants
    const [loading, setLoading] = useState(true);

    // --- FORM STATE ---
    const [supplierId, setSupplierId] = useState('');
    const [note, setNote] = useState('');
    const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);

    // --- CHI TIẾT NHẬP HÀNG (Rows) ---
    // Mỗi dòng sẽ cần lưu thêm trạng thái categoryId và productId tạm thời để filter
    const [details, setDetails] = useState([
        { tempCategoryId: '', tempProductId: '', variantId: '', quantity: 1, importPrice: 0 }
    ]);

    const BASE_URL = 'https://localhost:7298';

    // 1. LOAD DỮ LIỆU
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [resSup, resCat, resProd] = await Promise.all([
                    axios.get(`${BASE_URL}/api/suppliers`),
                    axios.get(`${BASE_URL}/api/TblCategories`),
                    // Gọi API lấy full sản phẩm kèm biến thể (Dùng API filter hoặc API get all)
                    axios.get(`${BASE_URL}/api/TblProducts/filter`) 
                ]);

                // Xử lý dữ liệu (đề phòng trường hợp trả về $values của .NET)
                const sData = resSup.data?.$values || resSup.data || [];
                const cData = resCat.data?.$values || resCat.data || [];
                const pData = resProd.data?.$values || resProd.data || [];

                setSuppliers(Array.isArray(sData) ? sData : []);
                setCategories(Array.isArray(cData) ? cData : []);
                setAllProducts(Array.isArray(pData) ? pData : []);

            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
                alert("Không thể tải danh sách sản phẩm/NCC.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. XỬ LÝ THÊM/XÓA DÒNG
    const addRow = () => {
        setDetails([...details, { tempCategoryId: '', tempProductId: '', variantId: '', quantity: 1, importPrice: 0 }]);
    };

    const removeRow = (index) => {
        if (details.length === 1) return;
        setDetails(details.filter((_, i) => i !== index));
    };

    // 3. XỬ LÝ THAY ĐỔI GIÁ TRỊ TRÊN DÒNG (LOGIC QUAN TRỌNG)
    const handleRowChange = (index, field, value) => {
        const newRows = [...details];
        const row = newRows[index];

        if (field === 'tempCategoryId') {
            // Khi đổi Danh mục -> Reset Sản phẩm và Variant
            row.tempCategoryId = value;
            row.tempProductId = '';
            row.variantId = '';
        } 
        else if (field === 'tempProductId') {
            // Khi đổi Sản phẩm -> Reset Variant
            row.tempProductId = value;
            row.variantId = '';
            
            // Tự động set Variant nếu sản phẩm chỉ có 1 variant
            const selectedProd = allProducts.find(p => p.productId == value);
            // Lưu ý: Cần kiểm tra cấu trúc dữ liệu trả về từ API xem biến thể nằm ở đâu
            // API /filter trả về mảng phẳng, ta cần tìm trong danh sách full
            // Ở đây giả định bạn dùng API get all có structure nested hoặc ta filter từ allProducts
        } 
        else {
            row[field] = value;
        }

        setDetails(newRows);
    };

    // Helper: Lọc sản phẩm theo danh mục đang chọn của dòng đó
    const getProductsByCategory = (catId) => {
        if (!catId) return [];
        return allProducts.filter(p => p.categoryId == catId);
    };

    // Helper: Lấy danh sách Variants của sản phẩm (Cần gọi API chi tiết hoặc lấy từ list nếu có sẵn)
    // Vì danh sách /filter trả về variants dạng rút gọn hoặc không có, 
    // tốt nhất khi chọn Product, ta nên tìm trong mảng allProducts (nếu API filter đã include variants)
    // Hoặc gọi API chi tiết. Để tối ưu, giả sử API /filter đã trả về variants hoặc ta dùng API get all.
    // **FIX**: Để đơn giản và nhanh, ta sẽ dùng API lấy chi tiết sản phẩm mỗi khi chọn SP, 
    // HOẶC tốt hơn là API /filter trả về list variants.
    // Dựa vào code Controller trước đó, API /filter CÓ trả về TblProductVariants.
    const getVariantsByProduct = (prodId) => {
        if (!prodId) return [];
        const prod = allProducts.find(p => p.productId == prodId);
        // Kiểm tra cấu trúc trả về của API
        return prod?.tblProductVariants || prod?.TblProductVariants || []; 
    };

    // Tính tổng tiền
    const totalAmount = details.reduce((sum, item) => sum + (item.quantity * item.importPrice), 0);

    // 4. SUBMIT
    const handleSubmit = async () => {
        if (!supplierId) return alert("Chưa chọn Nhà cung cấp!");
        if (details.some(d => !d.variantId)) return alert("Vui lòng chọn đầy đủ phân loại hàng cho các dòng!");

        const token = localStorage.getItem('token'); // Hoặc lấy từ Context
        if (!token) return alert("Vui lòng đăng nhập lại.");

        // Chuẩn bị payload đúng chuẩn DTO Backend yêu cầu
        const payload = {
            supplierId: parseInt(supplierId),
            importDate: importDate,
            note: note,
            details: details.map(d => ({
                variantId: parseInt(d.variantId), // Backend cần VariantId
                quantity: parseInt(d.quantity),
                importPrice: parseFloat(d.importPrice)
            }))
        };

        try {
            const res = await axios.post(`${BASE_URL}/api/ImportReceipts`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 200 || res.status === 201) {
                alert("Nhập kho thành công!");
                // Reset form
                setDetails([{ tempCategoryId: '', tempProductId: '', variantId: '', quantity: 1, importPrice: 0 }]);
                setNote('');
            }
        } catch (err) {
            console.error(err);
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div style={{padding:'20px'}}>Đang tải dữ liệu...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>Tạo Phiếu Nhập Kho</h2>

            {/* HEADER PHIẾU */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '20px', background: '#ecf0f1', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                <div>
                    <label style={{fontWeight:'bold', display:'block', marginBottom:'5px'}}>Nhà cung cấp (*)</label>
                    <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={inputStyle}>
                        <option value="">-- Chọn NCC --</option>
                        {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{fontWeight:'bold', display:'block', marginBottom:'5px'}}>Ngày nhập</label>
                    <input type="date" value={importDate} onChange={e => setImportDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                    <label style={{fontWeight:'bold', display:'block', marginBottom:'5px'}}>Ghi chú</label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập ghi chú..." style={inputStyle} />
                </div>
            </div>

            {/* BẢNG CHI TIẾT */}
            <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#34495e', color: 'white', textAlign: 'left' }}>
                            <th style={{ padding: '12px', width: '20%' }}>1. Danh mục</th>
                            <th style={{ padding: '12px', width: '25%' }}>2. Sản phẩm</th>
                            <th style={{ padding: '12px', width: '20%' }}>3. Phân loại (Variant)</th>
                            <th style={{ padding: '12px', width: '10%', textAlign: 'center' }}>Số lượng</th>
                            <th style={{ padding: '12px', width: '15%', textAlign: 'right' }}>Giá nhập</th>
                            <th style={{ padding: '12px', width: '5%', textAlign: 'center' }}>Xóa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.map((row, index) => {
                            // Logic filter cho từng dòng
                            const filteredProducts = getProductsByCategory(row.tempCategoryId);
                            const filteredVariants = getVariantsByProduct(row.tempProductId);

                            return (
                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    {/* Cột 1: Danh mục */}
                                    <td style={{ padding: '10px' }}>
                                        <select 
                                            value={row.tempCategoryId} 
                                            onChange={e => handleRowChange(index, 'tempCategoryId', e.target.value)}
                                            style={tableInputStyle}
                                        >
                                            <option value="">-- Chọn danh mục --</option>
                                            {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                                        </select>
                                    </td>

                                    {/* Cột 2: Sản phẩm (Filter theo Danh mục) */}
                                    <td style={{ padding: '10px' }}>
                                        <select 
                                            value={row.tempProductId} 
                                            onChange={e => handleRowChange(index, 'tempProductId', e.target.value)}
                                            style={tableInputStyle}
                                            disabled={!row.tempCategoryId}
                                        >
                                            <option value="">-- Chọn sản phẩm --</option>
                                            {filteredProducts.map(p => (
                                                <option key={p.productId} value={p.productId}>{p.productName} - [{p.productCode}]</option>
                                            ))}
                                        </select>
                                    </td>

                                    {/* Cột 3: Variant (Filter theo Sản phẩm) - QUAN TRỌNG */}
                                    <td style={{ padding: '10px' }}>
                                        <select 
                                            value={row.variantId} 
                                            onChange={e => handleRowChange(index, 'variantId', e.target.value)}
                                            style={{...tableInputStyle, border: !row.variantId ? '1px solid orange' : '1px solid #ddd'}}
                                            disabled={!row.tempProductId}
                                        >
                                            <option value="">-- Chọn Size/Màu --</option>
                                            {filteredVariants.length > 0 ? (
                                                filteredVariants.map(v => (
                                                    <option key={v.variantId} value={v.variantId}>
                                                        {v.variantName} (Tồn: {v.stockQuantity})
                                                    </option>
                                                ))
                                            ) : (
                                                row.tempProductId && <option disabled>Lỗi: Không có biến thể</option>
                                            )}
                                        </select>
                                    </td>

                                    {/* Cột 4: Số lượng */}
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <input 
                                            type="number" min="1" 
                                            value={row.quantity} 
                                            onChange={e => handleRowChange(index, 'quantity', e.target.value)}
                                            style={{...tableInputStyle, textAlign: 'center'}}
                                        />
                                    </td>

                                    {/* Cột 5: Giá nhập */}
                                    <td style={{ padding: '10px', textAlign: 'right' }}>
                                        <input 
                                            type="number" min="0" 
                                            value={row.importPrice} 
                                            onChange={e => handleRowChange(index, 'importPrice', e.target.value)}
                                            style={{...tableInputStyle, textAlign: 'right'}}
                                        />
                                        <div style={{fontSize: '11px', color: '#888', marginTop: '2px'}}>
                                            {(row.quantity * row.importPrice).toLocaleString()} đ
                                        </div>
                                    </td>

                                    {/* Cột 6: Xóa */}
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <button onClick={() => removeRow(index)} style={{ color: '#e74a3b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div style={{ padding: '10px', background: '#f9f9f9', borderTop: '1px solid #ddd' }}>
                    <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px dashed #3498db', color: '#3498db', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        <FaPlus /> Thêm dòng
                    </button>
                </div>
            </div>

            {/* FOOTER TỔNG KẾT */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    Tổng tiền: <span style={{ color: '#e74a3b', fontSize: '24px' }}>{totalAmount.toLocaleString()} VNĐ</span>
                </div>
                <button 
                    onClick={handleSubmit}
                    style={{ background: '#27ae60', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                    LƯU PHIẾU NHẬP
                </button>
            </div>
        </div>
    );
};

// CSS Styles inline
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' };
const tableInputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' };

export default CreateImportReceipt;