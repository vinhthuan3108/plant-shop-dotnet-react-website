import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaExclamationTriangle, FaCheckCircle, FaHistory } from 'react-icons/fa'; // Cần npm install react-icons

const InventoryAdjustment = () => {
    // --- MASTER DATA ---
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- FORM SELECTION STATE ---
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    
    // --- FORM DATA TO SUBMIT ---
    const [formData, setFormData] = useState({
        variantId: '',
        type: 'decrease', // decrease | increase
        quantity: 1,
        reason: ''
    });

    const [currentStock, setCurrentStock] = useState(null); // Lưu tồn kho hiện tại để hiển thị

    const BASE_URL = 'https://localhost:7298';

    // 1. LOAD DATA
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [resCat, resProd] = await Promise.all([
                    axios.get(`${BASE_URL}/api/TblCategories`),
                    axios.get(`${BASE_URL}/api/TblProducts/filter`) // API này đã trả về variants
                ]);

                setCategories(resCat.data?.$values || resCat.data || []);
                setAllProducts(resProd.data?.$values || resProd.data || []);
            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
                alert("Không thể tải danh sách sản phẩm.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // 2. HANDLERS
    const handleCategoryChange = (e) => {
        setSelectedCategoryId(e.target.value);
        setSelectedProductId('');
        setFormData({ ...formData, variantId: '' });
        setCurrentStock(null);
    };

    const handleProductChange = (e) => {
        setSelectedProductId(e.target.value);
        setFormData({ ...formData, variantId: '' });
        setCurrentStock(null);
    };

    const handleVariantChange = (e) => {
        const varId = e.target.value;
        setFormData({ ...formData, variantId: varId });
        
        // Tìm tồn kho hiện tại để hiển thị
        const prod = allProducts.find(p => p.productId == selectedProductId);
        if (prod) {
            const variants = prod.tblProductVariants || [];
            const variant = variants.find(v => v.variantId == varId);
            if (variant) setCurrentStock(variant.stockQuantity);
        }
    };

    // Filter Helpers
    const filteredProducts = selectedCategoryId 
        ? allProducts.filter(p => p.categoryId == selectedCategoryId) 
        : [];

    const filteredVariants = selectedProductId 
        ? (allProducts.find(p => p.productId == selectedProductId)?.tblProductVariants || []) 
        : [];

    // 3. SUBMIT
    const handleSubmit = async () => {
        if (!formData.variantId) return alert("Vui lòng chọn phân loại sản phẩm!");
        if (!formData.reason.trim()) return alert("Vui lòng nhập lý do điều chỉnh!");
        if (formData.quantity <= 0) return alert("Số lượng phải lớn hơn 0!");

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;

        if (!token || !user) return alert("Vui lòng đăng nhập lại!");

        // Tính số lượng điều chỉnh (âm/dương)
        const adjustedValue = formData.type === 'decrease' 
            ? -Math.abs(formData.quantity) 
            : Math.abs(formData.quantity);

        const payload = {
            variantId: parseInt(formData.variantId), // Backend cần VariantId
            userId: user.userId,
            quantityAdjusted: adjustedValue,
            reason: formData.reason
        };

        try {
            await axios.post(`${BASE_URL}/api/InventoryAdjustments`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert("Đã cập nhật tồn kho thành công!");
            
            // Cập nhật lại tồn kho ở client để không cần reload trang
            const newStock = (currentStock || 0) + adjustedValue;
            setCurrentStock(newStock);
            
            // Update vào master data (để nếu chọn lại vẫn đúng)
            const updatedProducts = [...allProducts];
            const pIndex = updatedProducts.findIndex(p => p.productId == selectedProductId);
            if (pIndex !== -1) {
                const vIndex = updatedProducts[pIndex].tblProductVariants.findIndex(v => v.variantId == formData.variantId);
                if (vIndex !== -1) {
                    updatedProducts[pIndex].tblProductVariants[vIndex].stockQuantity = newStock;
                    setAllProducts(updatedProducts);
                }
            }

            // Reset lý do & số lượng
            setFormData({ ...formData, quantity: 1, reason: '' });

        } catch (err) {
            console.error(err);
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div style={{padding:'20px', textAlign:'center'}}>Đang tải dữ liệu...</div>;

    return (
        <div style={{ padding: '20px', backgroundColor: '#f4f6f9', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '600px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                
                {/* HEADER */}
                <div style={{ backgroundColor: '#ff9800', padding: '15px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaExclamationTriangle size={24} />
                    <h2 style={{ margin: 0, fontSize: '18px' }}>Điều Chỉnh / Cân Bằng Kho</h2>
                </div>

                <div style={{ padding: '25px' }}>
                    
                    {/* BƯỚC 1: CHỌN SẢN PHẨM (3 CẤP) */}
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#555', fontSize: '14px', textTransform: 'uppercase' }}>1. Chọn Sản Phẩm</h4>
                        
                        <div style={{ display: 'grid', gap: '15px' }}>
                            <div>
                                <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'bold'}}>Danh mục:</label>
                                <select value={selectedCategoryId} onChange={handleCategoryChange} style={inputStyle}>
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'bold'}}>Sản phẩm:</label>
                                <select value={selectedProductId} onChange={handleProductChange} style={inputStyle} disabled={!selectedCategoryId}>
                                    <option value="">-- Chọn sản phẩm --</option>
                                    {filteredProducts.map(p => <option key={p.productId} value={p.productId}>{p.productName} - [{p.productCode}]</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{display:'block', marginBottom:'5px', fontSize:'13px', fontWeight:'bold'}}>Phân loại (Variant): <span style={{color:'red'}}>*</span></label>
                                <select value={formData.variantId} onChange={handleVariantChange} style={inputStyle} disabled={!selectedProductId}>
                                    <option value="">-- Chọn Size/Màu --</option>
                                    {filteredVariants.map(v => (
                                        <option key={v.variantId} value={v.variantId}>{v.variantName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* HIỂN THỊ TỒN KHO HIỆN TẠI */}
                        {currentStock !== null && (
                            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                                Tồn kho hiện tại: {currentStock} sản phẩm
                            </div>
                        )}
                    </div>

                    {/* BƯỚC 2: NHẬP SỐ LIỆU ĐIỀU CHỈNH */}
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 15px 0', color: '#555', fontSize: '14px', textTransform: 'uppercase' }}>2. Thông tin điều chỉnh</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label style={{display:'block', marginBottom:'5px', fontSize:'13px'}}>Loại điều chỉnh:</label>
                                <select 
                                    style={inputStyle} 
                                    value={formData.type} 
                                    onChange={e => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="decrease">📉 Giảm (Hư hỏng/Mất)</option>
                                    <option value="increase">📈 Tăng (Kiểm kê dư)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{display:'block', marginBottom:'5px', fontSize:'13px'}}>Số lượng lệch:</label>
                                <input 
                                    type="number" min="1" 
                                    style={inputStyle} 
                                    value={formData.quantity} 
                                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} 
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{display:'block', marginBottom:'5px', fontSize:'13px'}}>Lý do (Bắt buộc):</label>
                            <textarea 
                                rows="3" 
                                style={{...inputStyle, resize: 'none'}} 
                                placeholder="VD: Cây bị héo do vận chuyển, vỡ chậu..."
                                value={formData.reason} 
                                onChange={e => setFormData({...formData, reason: e.target.value})} 
                            />
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <button 
                        onClick={handleSubmit} 
                        style={{ 
                            width: '100%', padding: '12px', 
                            backgroundColor: '#ff9800', color: 'white', 
                            border: 'none', borderRadius: '4px', 
                            fontWeight: 'bold', fontSize: '16px', 
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        <FaCheckCircle /> XÁC NHẬN CẬP NHẬT
                    </button>

                </div>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px'
};

export default InventoryAdjustment;