import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const VariantSelectionModal = ({ isOpen, onClose, product, onConfirm }) => {
    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [quantity, setQuantity] = useState(1);

    // Reset state khi mở modal với sản phẩm mới
    useEffect(() => {
        if (isOpen && product && product.tblProductVariants?.length > 0) {
            // Mặc định chọn variant đầu tiên để khách đỡ phải bấm
            setSelectedVariantId(product.tblProductVariants[0].variantId);
            setQuantity(1);
        }
    }, [isOpen, product]);

    if (!isOpen || !product) return null;

    const variants = product.tblProductVariants || [];
    // Tìm variant đang chọn để hiển thị giá và tồn kho tương ứng
    const currentVariant = variants.find(v => v.variantId === selectedVariantId) || {};

    const handleConfirm = () => {
        if (!selectedVariantId) return alert("Vui lòng chọn phân loại!");
        
        // Gửi dữ liệu variant đã chọn ra ngoài
        onConfirm(selectedVariantId, quantity, currentVariant);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white', width: '400px', padding: '20px',
                borderRadius: '8px', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}>
                {/* Nút đóng */}
                <button onClick={onClose} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666' }}>
                    <FaTimes />
                </button>
                
                <h3 style={{ marginTop: 0, color: '#2e7d32', fontSize: '18px', paddingRight: '20px' }}>{product.productName}</h3>
                
                {/* Danh sách Variants */}
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Chọn phân loại:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {variants.map(v => (
                            <button
                                key={v.variantId}
                                onClick={() => setSelectedVariantId(v.variantId)}
                                style={{
                                    padding: '6px 12px',
                                    border: selectedVariantId === v.variantId ? '2px solid #2e7d32' : '1px solid #ddd',
                                    backgroundColor: selectedVariantId === v.variantId ? '#e8f5e9' : 'white',
                                    borderRadius: '4px', cursor: 'pointer', fontSize: '13px',
                                    color: selectedVariantId === v.variantId ? '#2e7d32' : '#333',
                                    fontWeight: selectedVariantId === v.variantId ? 'bold' : 'normal'
                                }}
                            >
                                {v.variantName}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Thông tin chi tiết của Variant đang chọn */}
                <div style={{ marginBottom: '20px', padding: '12px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #eee' }}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom: '5px'}}>
                        <span style={{fontSize: '14px'}}>Giá bán:</span>
                        <span style={{fontWeight:'bold', color:'#d32f2f', fontSize: '16px'}}>
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentVariant.salePrice || currentVariant.originalPrice || 0)}
                        </span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#666'}}>
                        <span>Kho:</span>
                        <span>{currentVariant.stockQuantity > 0 ? `${currentVariant.stockQuantity} sản phẩm` : 'Hết hàng'}</span>
                    </div>
                </div>

                {/* Chọn số lượng */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', justifyContent: 'center' }}>
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '32px', height: '32px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>-</button>
                    <input type="text" value={quantity} readOnly style={{ width: '50px', textAlign: 'center', height: '32px', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', borderLeft: 'none', borderRight: 'none', outline: 'none' }} />
                    <button onClick={() => setQuantity(q => q + 1)} style={{ width: '32px', height: '32px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>+</button>
                </div>

                {/* Nút xác nhận */}
                <button 
                    onClick={handleConfirm}
                    disabled={!currentVariant.stockQuantity || currentVariant.stockQuantity <= 0}
                    style={{ 
                        width: '100%', padding: '12px', 
                        backgroundColor: currentVariant.stockQuantity > 0 ? '#2e7d32' : '#ccc', 
                        color: 'white', border: 'none', borderRadius: '4px', 
                        fontWeight: 'bold', cursor: currentVariant.stockQuantity > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '14px'
                    }}
                >
                    {currentVariant.stockQuantity > 0 ? "THÊM VÀO GIỎ HÀNG" : "HẾT HÀNG"}
                </button>
            </div>
        </div>
    );
};

export default VariantSelectionModal;