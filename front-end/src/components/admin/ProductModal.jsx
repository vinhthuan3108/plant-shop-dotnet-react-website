import { useState, useEffect, useMemo, useRef } from 'react'; // Thêm useMemo, useRef
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';

function ProductModal({ isOpen, onClose, onSubmit, initialData, categories }) {
    // --- Các State dữ liệu ---
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [catId, setCatId] = useState(''); 
    
    const [originalPrice, setOriginalPrice] = useState(0);
    const [salePrice, setSalePrice] = useState(0);
    const [stock, setStock] = useState(0);
    const [minStock, setMinStock] = useState(5);

    const [saleStart, setSaleStart] = useState('');
    const [saleEnd, setSaleEnd] = useState('');
    
    // State cho 2 ô soạn thảo
    const [shortDesc, setShortDesc] = useState('');
    const [detailDesc, setDetailDesc] = useState(''); 
    
    const [size, setSize] = useState('');
    const [characteristics, setCharacteristics] = useState('');
    const [fengShui, setFengShui] = useState('');

    const [active, setActive] = useState(true);
    const [images, setImages] = useState([]); 
    const [uploading, setUploading] = useState(false);

    // --- CẤU HÌNH REACT QUILL (Nâng cấp hỗ trợ 2 Editor) ---
    const shortQuillRef = useRef(null);  // Ref cho Mô tả ngắn
    const detailQuillRef = useRef(null); // Ref cho Mô tả chi tiết (đổi tên từ quillRef cũ)
    
    const API_BASE = 'https://localhost:7298';

    // Hàm upload file lên server (dùng chung)
    const uploadFileForEditor = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/api/Upload`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                return data.url; 
            }
        } catch (err) {
            console.error("Upload ảnh editor lỗi:", err);
        }
        return null;
    };

    // Hàm tạo Image Handler riêng cho từng Editor
    // editorRef: Tham chiếu đến Editor nào đang được thao tác
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
                        // Lấy đúng instance của editor dựa trên Ref truyền vào
                        const quill = editorRef.current.getEditor();
                        const range = quill.getSelection();
                        quill.insertEmbed(range ? range.index : 0, 'image', `${API_BASE}${url}`);
                    }
                }
            };
        };
    };

    // Cấu hình Toolbar (Dùng chung layout, chỉ khác handler)
    const toolbarContainer = [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['image', 'link'], 
        ['clean']
    ];

    const formats = [
        'header', 'bold', 'italic', 'underline', 'strike',
        'list', 'align', 'image', 'link'
    ];

    // Tạo module riêng cho từng ô để gắn đúng handler
    const modulesShort = useMemo(() => ({
        toolbar: {
            container: toolbarContainer,
            handlers: { image: createImageHandler(shortQuillRef) } // Gắn với Ref ngắn
        }
    }), []);

    const modulesDetail = useMemo(() => ({
        toolbar: {
            container: toolbarContainer,
            handlers: { image: createImageHandler(detailQuillRef) } // Gắn với Ref chi tiết
        }
    }), []);
    // -----------------------------------------------------------

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); 
    };

    useEffect(() => {
        if (initialData) {
            setCode(initialData.productCode);
            setName(initialData.productName);
            setCatId(initialData.categoryId || '');
            setOriginalPrice(initialData.originalPrice);
            setSalePrice(initialData.salePrice || 0);
            setStock(initialData.stockQuantity || 0);
            setMinStock(initialData.minStockAlert || 5);
            setSaleStart(formatDateForInput(initialData.saleStartDate));
            setSaleEnd(formatDateForInput(initialData.saleEndDate));
            
            // Load nội dung HTML vào cả 2 state
            setShortDesc(initialData.shortDescription || '');
            setDetailDesc(initialData.detailDescription || '');

            setSize(initialData.size || '');
            setCharacteristics(initialData.characteristics || '');
            setFengShui(initialData.fengShuiTags || '');
            setActive(initialData.isActive ?? true);
            if (initialData.tblProductImages) {
                setImages(initialData.tblProductImages);
            }
        } else {
            // Reset form
            setCode(''); setName(''); setCatId(categories.length > 0 ? categories[0].categoryId : '');
            setOriginalPrice(0); setSalePrice(0); setStock(0); setMinStock(5);
            setSaleStart(''); setSaleEnd('');
            setShortDesc(''); setDetailDesc('');
            setSize(''); setCharacteristics(''); setFengShui('');
            setActive(true); setImages([]);
        }
    }, [initialData, isOpen, categories]);

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
            } catch (err) { console.error("Upload lỗi:", err); }
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

    const handleSubmit = () => {
        if (!code.trim()) return alert("Mã sản phẩm không được trống");
        if (!name.trim()) return alert("Tên sản phẩm không được trống");
        if (!catId) return alert("Vui lòng chọn danh mục");
        if (originalPrice < 0) return alert("Giá gốc không hợp lệ");
        
        const formData = {
            productCode: code,
            productName: name,
            categoryId: parseInt(catId), 
            originalPrice: parseFloat(originalPrice),
            salePrice: parseFloat(salePrice) || null,
            saleStartDate: saleStart ? new Date(saleStart) : null,
            saleEndDate: saleEnd ? new Date(saleEnd) : null,
            stockQuantity: parseInt(stock),
            minStockAlert: parseInt(minStock),
            
            shortDescription: shortDesc,   // HTML từ Quill ngắn
            detailDescription: detailDesc, // HTML từ Quill chi tiết

            size: size,
            characteristics: characteristics,
            fengShuiTags: fengShui,
            isActive: active,
            tblProductImages: images
        };
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ 
                backgroundColor: 'white', padding: '20px', 
                borderRadius: '8px', 
                width: '900px', 
                maxHeight: '90vh', overflowY: 'auto' 
            }}>
                <h3>{initialData ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {/* Cột Trái */}
                    <div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Mã sản phẩm (*):</label>
                            <input type="text" value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Tên sản phẩm (*):</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Danh mục (*):</label>
                            <select value={catId} onChange={e => setCatId(e.target.value)} style={{ width: '100%', padding: '8.5px' }}>
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(c => (<option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>))}
                            </select>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Kích thước (Size):</label>
                            <input type="text" value={size} onChange={e => setSize(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                        </div>
                        
                    </div>

                    {/* Cột Phải */}
                    {/* Cột Phải */}
                    <div>
                        {/* Hàng 1: Giá (Giữ nguyên) */}
                        <div style={{ display:'flex', gap:'10px' }}>
                            <div style={{ marginBottom: '10px', flex:1 }}>
                                <label>Giá gốc (*):</label>
                                <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                            </div>
                            <div style={{ marginBottom: '10px', flex:1 }}>
                                <label>Giá KM:</label>
                                <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                            </div>
                        </div>

                        {/* Hàng 2: Ngày Khuyến Mãi (Được đảo lên đây) */}
                        <div style={{ display:'flex', gap:'10px' }}>
                            <div style={{ marginBottom: '10px', flex:1 }}>
                                <label>Ngày bắt đầu KM:</label>
                                <input type="datetime-local" value={saleStart} onChange={e => setSaleStart(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                            </div>
                            <div style={{ marginBottom: '10px', flex:1 }}>
                                <label>Ngày kết thúc KM:</label>
                                <input type="datetime-local" value={saleEnd} onChange={e => setSaleEnd(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                            </div>
                        </div>

                        {/* Hàng 3: Tồn kho & Cảnh báo Min (Được đảo xuống đây) */}
                        <div style={{ display:'flex', gap:'10px' }}>
                            <div style={{ marginBottom: '10px', flex:1 }}>
                                <label>Tồn kho (Hiện có):</label>
                                <input 
                                    type="number" 
                                    value={stock} 
                                    readOnly // Chỉ cho xem
                                    // Bỏ onChange để không cho sửa
                                    style={{ 
                                        width: '100%', 
                                        padding: '6px', 
                                        backgroundColor: '#e9ecef', // Màu xám báo hiệu readonly
                                        cursor: 'not-allowed',
                                        color: '#495057'
                                    }} 
                                />
                            </div>
                            <div style={{ marginBottom: '10px', flex:1 }}>
                                <label>Cảnh báo min:</label>
                                <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Tags Phong thủy:</label>
                            <input type="text" value={fengShui} onChange={e => setFengShui(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                        </div>
                    </div>
                </div>

                {/* Hình ảnh */}
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <h4>Hình ảnh sản phẩm</h4>
                    <div style={{ marginBottom: '10px' }}>
                        <input type="file" multiple onChange={handleFileChange} disabled={uploading} />
                        {uploading && <span> Đang tải lên...</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {images.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative', border: img.isThumbnail ? '2px solid green' : '1px solid #ddd', padding: '2px' }}>
                                <img src={`${API_BASE}${img.imageUrl}`} alt="product" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                <button onClick={() => handleRemoveImage(idx)} style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', cursor: 'pointer', fontSize:'10px' }}>X</button>
                                <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '2px' }}>
                                    <input type="radio" name="thumb" checked={img.isThumbnail} onChange={() => handleSetThumbnail(idx)} /> Đại diện
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* --- 1. MÔ TẢ NGẮN (Đã chuyển sang Quill) --- */}
                <div style={{ marginBottom: '60px', marginTop: '10px' }}>
                    <label style={{display: 'block', marginBottom: '5px'}}>Mô tả ngắn:</label>
                    <ReactQuill 
                        ref={shortQuillRef} // Gắn Ref ngắn
                        theme="snow" 
                        value={shortDesc} 
                        onChange={setShortDesc} 
                        modules={modulesShort} // Dùng Modules ngắn
                        formats={formats}
                        style={{ height: '150px' }} // Chiều cao nhỏ hơn xíu
                    />
                </div>
                
                {/* --- 2. MÔ TẢ CHI TIẾT --- */}
                <div style={{ marginBottom: '60px' }}> 
                    <label style={{display: 'block', marginBottom: '5px'}}>Mô tả chi tiết:</label>
                    <ReactQuill 
                        ref={detailQuillRef} // Gắn Ref chi tiết
                        theme="snow" 
                        value={detailDesc} 
                        onChange={setDetailDesc} 
                        modules={modulesDetail} // Dùng Modules chi tiết
                        formats={formats}
                        style={{ height: '200px' }} 
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Đặc điểm (JSON/Text):</label>
                    <textarea value={characteristics} onChange={e => setCharacteristics(e.target.value)} style={{ width: '100%', height: '50px', padding:'5px' }} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Đang hoạt động (IsActive)
                    </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 20px', backgroundColor: '#6c757d', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer' }}>Hủy</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border:'none', borderRadius:'4px', cursor:'pointer' }}>Lưu Sản Phẩm</button>
                </div>
            </div>
        </div>
    );
}

export default ProductModal;