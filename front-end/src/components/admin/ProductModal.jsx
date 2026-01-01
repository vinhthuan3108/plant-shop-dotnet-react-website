import { useState, useEffect, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';
import { FaTrash, FaPlus } from 'react-icons/fa'; 

function ProductModal({ isOpen, onClose, onSubmit, initialData, categories }) {
    // --- STATE CHUNG ---
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [catId, setCatId] = useState(''); 
    const [active, setActive] = useState(true);

    // --- STATE NGÀY SALE & MÔ TẢ ---
    const [saleStart, setSaleStart] = useState('');
    const [saleEnd, setSaleEnd] = useState('');
    
    const [shortDesc, setShortDesc] = useState('');
    const [detailDesc, setDetailDesc] = useState('');
    const [fengShui, setFengShui] = useState('');
    const [images, setImages] = useState([]); 
    const [uploading, setUploading] = useState(false);

    // --- STATE BIẾN THỂ (VARIANTS) ---
    // CẬP NHẬT: Thêm trường weight (Kg) mặc định là 0
    const [variants, setVariants] = useState([
        { variantName: '', originalPrice: 0, salePrice: 0, weight: 0, stockQuantity: 0, minStockAlert: 5 }
    ]);

    // --- CẤU HÌNH EDITOR (Giữ nguyên) ---
    const shortQuillRef = useRef(null);
    const detailQuillRef = useRef(null);
    const API_BASE = 'https://localhost:7298';

    const uploadFileForEditor = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/api/Upload`, { method: 'POST', body: formData });
            if (res.ok) { const data = await res.json(); return data.url; }
        } catch (err) { console.error("Upload ảnh editor lỗi:", err); }
        return null;
    };

    const createImageHandler = (editorRef) => {
        return () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();
            input.onchange = async () => {
                const file = input.files[0];
                if (file) {
                    const url = await uploadFileForEditor(file);
                    if (url) {
                        const quill = editorRef.current.getEditor();
                        const range = quill.getSelection();
                        quill.insertEmbed(range ? range.index : 0, 'image', `${API_BASE}${url}`);
                    }
                }
            };
        };
    };

    const toolbarContainer = [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['image', 'link'], ['clean']
    ];
    const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'align', 'image', 'link'];
    const modulesShort = useMemo(() => ({ toolbar: { container: toolbarContainer, handlers: { image: createImageHandler(shortQuillRef) } } }), []);
    const modulesDetail = useMemo(() => ({ toolbar: { container: toolbarContainer, handlers: { image: createImageHandler(detailQuillRef) } } }), []);

    // Helper format ngày cho input datetime-local
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    };

    // --- LOAD DỮ LIỆU KHI EDIT ---
    useEffect(() => {
        if (initialData) {
            setCode(initialData.productCode || '');
            setName(initialData.productName || '');
            setCatId(initialData.categoryId || '');
            setShortDesc(initialData.shortDescription || '');
            setDetailDesc(initialData.detailDescription || '');
            setFengShui(initialData.fengShuiTags || '');
            setActive(initialData.isActive ?? true);
            
            // Load ngày sale
            setSaleStart(formatDateForInput(initialData.saleStartDate));
            setSaleEnd(formatDateForInput(initialData.saleEndDate));

            if (initialData.tblProductImages) setImages(initialData.tblProductImages);

            // Load Variants
            if (initialData.tblProductVariants && initialData.tblProductVariants.length > 0) {
                setVariants(initialData.tblProductVariants.map(v => ({
                    variantId: v.variantId,
                    variantName: v.variantName,
                    originalPrice: v.originalPrice,
                    salePrice: v.salePrice || 0,
                    weight: v.weight || 0, // <--- LOAD WEIGHT
                    stockQuantity: v.stockQuantity || 0,
                    minStockAlert: v.minStockAlert || 5
                })));
            } else {
                setVariants([{ variantName: 'Tiêu chuẩn', originalPrice: 0, salePrice: 0, weight: 0, stockQuantity: 0, minStockAlert: 5 }]);
            }

        } else {
            // Reset form (Thêm mới)
            setCode('');
            setName(''); 
            setCatId(categories.length > 0 ? categories[0].categoryId : '');
            setShortDesc(''); setDetailDesc(''); setFengShui('');
            setSaleStart(''); setSaleEnd('');
            setActive(true); setImages([]);
            setVariants([{ variantName: '', originalPrice: 0, salePrice: 0, weight: 0, stockQuantity: 0, minStockAlert: 5 }]);
        }
    }, [initialData, isOpen, categories]);

    // --- XỬ LÝ ẢNH ---
    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        const newImages = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);
            try {
                const res = await fetch(`${API_BASE}/api/Upload`, { method: 'POST', body: formData });
                if (res.ok) {
                    const data = await res.json();
                    const isFirst = (images.length + newImages.length) === 0;
                    newImages.push({ imageUrl: data.url, isThumbnail: isFirst, displayOrder: 0 });
                }
            } catch (err) { console.error(err); }
        }
        setImages(prev => [...prev, ...newImages]);
        setUploading(false);
        e.target.value = null; 
    };

    const handleRemoveImage = (index) => {
        const newArr = [...images];
        newArr.splice(index, 1);
        setImages(newArr);
    };

    const handleSetThumbnail = (index) => {
        const newArr = images.map((img, idx) => ({ ...img, isThumbnail: idx === index }));
        setImages(newArr);
    };

    // --- XỬ LÝ VARIANTS ---
    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const addVariant = () => {
        // CẬP NHẬT: Thêm weight: 0 khi tạo dòng mới
        setVariants([...variants, { variantName: '', originalPrice: 0, salePrice: 0, weight: 0, stockQuantity: 0, minStockAlert: 5 }]);
    };

    const removeVariant = (index) => {
        if (variants.length === 1) return alert("Phải có ít nhất 1 phân loại hàng!");
        const newVariants = [...variants];
        newVariants.splice(index, 1);
        setVariants(newVariants);
    };

    // --- SUBMIT ---
    const handleSubmit = () => {
        // 1. Validate cơ bản
        if (!code.trim()) return alert("Mã sản phẩm không được trống");
        if (!name.trim()) return alert("Tên sản phẩm không được trống");
        if (!catId) return alert("Vui lòng chọn danh mục");

        // 2. Validate Variants
        for(let v of variants) {
            if(!v.variantName.trim()) return alert("Tên phân loại không được để trống");
            if(isNaN(parseFloat(v.originalPrice)) || parseFloat(v.originalPrice) < 0) 
                return alert("Giá gốc không hợp lệ");
            // Validate Weight nếu cần (ví dụ không âm)
            if(isNaN(parseFloat(v.weight)) || parseFloat(v.weight) < 0)
                return alert("Cân nặng không hợp lệ");
        }

        // --- LOGIC VALIDATE KHUYẾN MÃI ---
        const hasSaleDates = saleStart && saleEnd;
        const hasAnySalePrice = variants.some(v => parseFloat(v.salePrice) > 0);

        if (hasAnySalePrice && !hasSaleDates) {
            return alert("Bạn đã nhập Giá KM nhưng chưa chọn thời gian áp dụng (Bắt đầu - Kết thúc)!");
        }

        if (hasSaleDates) {
            const hasInvalidSalePrice = variants.some(v => !v.salePrice || parseFloat(v.salePrice) <= 0);
            if (hasInvalidSalePrice) {
                return alert("Bạn đã thiết lập Ngày khuyến mãi, vui lòng nhập đầy đủ Giá KM (> 0) cho tất cả các phân loại!");
            }
            if (new Date(saleStart) >= new Date(saleEnd)) {
                return alert("Thời gian kết thúc khuyến mãi phải lớn hơn thời gian bắt đầu!");
            }
        }   

        // 3. Chuẩn hóa dữ liệu trước khi gửi
        const formData = {
            productId: initialData ? initialData.productId : 0,
            productCode: code.trim(),
            productName: name.trim(),
            categoryId: parseInt(catId) || 0,
            
            saleStartDate: saleStart ? new Date(saleStart).toISOString() : null,
            saleEndDate: saleEnd ? new Date(saleEnd).toISOString() : null,

            shortDescription: shortDesc,
            detailDescription: detailDesc,
            fengShuiTags: fengShui,
            isActive: active,
            
            tblProductImages: images.map(img => ({
                imageId: img.imageId || 0,
                imageUrl: img.imageUrl,
                isThumbnail: img.isThumbnail,
                displayOrder: img.displayOrder || 0
            })),
            
            // --- CẬP NHẬT: THÊM WEIGHT VÀO PAYLOAD ---
            tblProductVariants: variants.map(v => ({
                variantId: v.variantId || 0, 
                variantName: v.variantName.trim(),
                originalPrice: parseFloat(v.originalPrice) || 0,
                salePrice: parseFloat(v.salePrice) || 0,
                weight: parseFloat(v.weight) || 0, // <--- GỬI CÂN NẶNG
                stockQuantity: parseInt(v.stockQuantity) || 0,
                minStockAlert: parseInt(v.minStockAlert) || 5, 
            }))
        };

        console.log("Dữ liệu gửi đi:", formData);
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
            <div style={{ 
                backgroundColor: 'white', padding: '20px', borderRadius: '8px', 
                width: '950px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
            }}>
                <h3 style={{marginBottom:'15px', borderBottom:'1px solid #ddd', paddingBottom:'10px'}}>
                    {initialData ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                    {/* CỘT TRÁI */}
                    <div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Mã sản phẩm (*):</label>
                            <input type="text" value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', padding: '8px', marginTop:'5px' }} />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Tên sản phẩm (*):</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px', marginTop:'5px' }} />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Danh mục (*):</label>
                            <select value={catId} onChange={e => setCatId(e.target.value)} style={{ width: '100%', padding: '8px', marginTop:'5px' }}>
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(c => (<option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>))}
                            </select>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Tags Phong thủy:</label>
                            <input type="text" value={fengShui} onChange={e => setFengShui(e.target.value)} style={{ width: '100%', padding: '8px', marginTop:'5px' }} />
                        </div>
                       
                        {/* KHU VỰC NGÀY SALE */}
                        <div style={{display:'flex', gap:'10px', marginTop:'10px', background:'#f8f9fa', padding:'10px', borderRadius:'4px'}}>
                            <div style={{flex:1}}>
                                <label style={{fontSize:'12px', fontWeight:'bold'}}>Bắt đầu KM:</label>
                                <input type="datetime-local" value={saleStart} onChange={e => setSaleStart(e.target.value)} style={{width:'100%', padding:'5px', border:'1px solid #ccc', fontSize:'13px'}} />
                            </div>
                            <div style={{flex:1}}>
                                <label style={{fontSize:'12px', fontWeight:'bold'}}>Kết thúc KM:</label>
                                <input type="datetime-local" value={saleEnd} onChange={e => setSaleEnd(e.target.value)} style={{width:'100%', padding:'5px', border:'1px solid #ccc', fontSize:'13px'}} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '10px', marginTop:'10px' }}>
                            <label style={{ cursor: 'pointer', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px' }}>
                                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Đang bán (Active)
                            </label>
                        </div>
                    </div>

                    {/* CỘT PHẢI: HÌNH ẢNH */}
                    <div>
                        <label><strong>Hình ảnh sản phẩm:</strong></label>
                        <div style={{ marginBottom: '10px', marginTop:'5px' }}>
                            <input type="file" multiple onChange={handleFileChange} disabled={uploading} />
                            {uploading && <span> Đang tải lên...</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', minHeight:'100px', border:'1px dashed #ccc', padding:'10px', borderRadius:'4px' }}>
                            {images.length === 0 && <span style={{color:'#999', fontSize:'13px'}}>Chưa có hình ảnh nào</span>}
                            {images.map((img, idx) => (
                                <div key={idx} style={{ position: 'relative', border: img.isThumbnail ? '2px solid #28a745' : '1px solid #ddd', width:'80px', height:'80px' }}>
                                    <img src={`${API_BASE}${img.imageUrl}`} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button onClick={() => handleRemoveImage(idx)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius:'50%', width:'20px', height:'20px', cursor: 'pointer', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>X</button>
                                    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(255,255,255,0.8)', fontSize: '10px', textAlign:'center', padding:'2px' }}>
                                        <input type="radio" name="thumb" checked={img.isThumbnail} onChange={() => handleSetThumbnail(idx)} /> Đại diện
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KHU VỰC PHÂN LOẠI HÀNG (VARIANTS) */}
                <div style={{ marginTop: '20px', border: '1px solid #bce8f1', padding: '15px', borderRadius: '5px', backgroundColor: '#f0f9ff' }}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                        <div style={{display:'flex', alignItems:'baseline', gap:'10px'}}>
                            <h4 style={{margin:0, color:'#0056b3'}}>Phân loại hàng & Giá bán</h4>
                            <span style={{fontSize:'12px', color:'#e74a3b', fontStyle:'italic'}}>
                                (* Tồn kho chỉ được cập nhật tại mục Quản lý kho)
                            </span>
                        </div>
                        <button type="button" onClick={addVariant} style={{background:'#28a745', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}>
                            <FaPlus /> Thêm loại
                        </button>
                    </div>
                    
                    <table style={{width:'100%', borderCollapse:'collapse', background:'white'}}>
                        <thead>
                            <tr style={{background:'#eee', fontSize:'14px'}}>
                                <th style={{padding:'8px', border:'1px solid #ddd', textAlign:'left'}}>Tên loại <span style={{color:'red'}}>*</span></th>
                                <th style={{padding:'8px', border:'1px solid #ddd', width:'130px'}}>Giá gốc</th>
                                <th style={{padding:'8px', border:'1px solid #ddd', width:'130px'}}>Giá KM</th>
                                
                                {/* CỘT MỚI: CÂN NẶNG */}
                                <th style={{padding:'8px', border:'1px solid #ddd', width:'100px'}}>Cân nặng (Kg)</th>

                                <th style={{padding:'8px', border:'1px solid #ddd', width:'80px'}}>Tồn kho</th>
                                <th style={{padding:'8px', border:'1px solid #ddd', width:'80px'}}>Min Alert</th>
                                <th style={{padding:'8px', border:'1px solid #ddd', width:'50px'}}>Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {variants.map((v, idx) => (
                                <tr key={idx}>
                                    <td style={{padding:'5px', border:'1px solid #ddd'}}>
                                        <input type="text" value={v.variantName} onChange={e => handleVariantChange(idx, 'variantName', e.target.value)} style={{width:'100%', padding:'5px', border:'1px solid #ccc'}} />
                                    </td>
                                    <td style={{padding:'5px', border:'1px solid #ddd'}}>
                                        <input type="number" value={v.originalPrice} onChange={e => handleVariantChange(idx, 'originalPrice', e.target.value)} style={{width:'100%', padding:'5px', border:'1px solid #ccc', textAlign:'right'}} />
                                    </td>
                                    <td style={{padding:'5px', border:'1px solid #ddd'}}>
                                        <input type="number" value={v.salePrice} onChange={e => handleVariantChange(idx, 'salePrice', e.target.value)} style={{width:'100%', padding:'5px', border:'1px solid #ccc', textAlign:'right'}} />
                                    </td>
                                    
                                    {/* INPUT CÂN NẶNG */}
                                    <td style={{padding:'5px', border:'1px solid #ddd'}}>
                                        <input 
                                            type="number" 
                                            step="0.1" // Cho phép nhập số lẻ
                                            value={v.weight} 
                                            onChange={e => handleVariantChange(idx, 'weight', e.target.value)} 
                                            style={{width:'100%', padding:'5px', border:'1px solid #ccc', textAlign:'center'}} 
                                            placeholder="0"
                                        />
                                    </td>

                                    <td style={{padding:'5px', border:'1px solid #ddd'}}>
                                        <input 
                                            type="number" 
                                            value={v.stockQuantity} 
                                            disabled={true} 
                                            style={{
                                                width:'100%', 
                                                padding:'5px', 
                                                border:'1px solid #eee', 
                                                textAlign:'center', 
                                                backgroundColor: '#e9ecef', 
                                                color: '#6c757d',           
                                                cursor: 'not-allowed'
                                            }} 
                                        />
                                    </td>
                                    <td style={{padding:'5px', border:'1px solid #ddd'}}>
                                        <input type="number" 
                                            value={v.minStockAlert || ''} 
                                            onChange={e => handleVariantChange(idx, 'minStockAlert', e.target.value)} 
                                            style={{width:'100%', padding:'5px', border:'1px solid #ccc', textAlign:'center'}} 
                                        />
                                    </td>
                                    <td style={{padding:'5px', border:'1px solid #ddd', textAlign:'center'}}>
                                        <button type="button" onClick={() => removeVariant(idx)} style={{background:'none', border:'none', color:'red', cursor:'pointer'}}><FaTrash /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* EDITOR MÔ TẢ */}
                <div style={{ marginTop: '20px' }}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight:'bold'}}>Mô tả ngắn:</label>
                    <ReactQuill ref={shortQuillRef} theme="snow" value={shortDesc} onChange={setShortDesc} modules={modulesShort} formats={formats} style={{ height: '120px', marginBottom: '50px' }} />
                </div>
                
                <div style={{ marginTop: '10px' }}> 
                    <label style={{display: 'block', marginBottom: '5px', fontWeight:'bold'}}>Mô tả chi tiết:</label>
                    <ReactQuill ref={detailQuillRef} theme="snow" value={detailDesc} onChange={setDetailDesc} modules={modulesDetail} formats={formats} style={{ height: '200px', marginBottom: '50px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                    <button onClick={onClose} style={{ padding: '10px 25px', backgroundColor: '#6c757d', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer' }}>Hủy bỏ</button>
                    <button onClick={handleSubmit} style={{ padding: '10px 25px', backgroundColor: '#007bff', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold' }}>LƯU SẢN PHẨM</button>
                </div>
            </div>
        </div>
    );
}

export default ProductModal;