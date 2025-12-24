import { useState, useEffect, useMemo, useRef } from 'react'; // [cite: 1] Thêm useMemo, useRef
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';

function ProductModal({ isOpen, onClose, onSubmit, initialData, categories }) {
    // --- Các State cũ giữ nguyên ---
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [catId, setCatId] = useState(''); 
    
    const [originalPrice, setOriginalPrice] = useState(0);
    const [salePrice, setSalePrice] = useState(0);
    const [stock, setStock] = useState(0);
    const [minStock, setMinStock] = useState(5);

    const [saleStart, setSaleStart] = useState('');
    const [saleEnd, setSaleEnd] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [detailDesc, setDetailDesc] = useState(''); // State này sẽ dùng cho Quill
    
    const [size, setSize] = useState('');
    const [characteristics, setCharacteristics] = useState('');
    const [fengShui, setFengShui] = useState('');

    const [active, setActive] = useState(true);
    const [images, setImages] = useState([]); 
    const [uploading, setUploading] = useState(false);

    // --- Cấu hình cho React Quill ---
    const quillRef = useRef(null);
    const API_BASE = 'https://localhost:7298'; // Định nghĩa base URL

    // Hàm upload ảnh riêng cho Editor (trả về URL để chèn vào bài viết)
    const uploadFileForEditor = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            // Sử dụng endpoint upload hiện có 
            const res = await fetch(`${API_BASE}/api/Upload`, {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                return data.url; // Trả về đường dẫn ảnh (ví dụ: /images/abc.jpg)
            }
        } catch (err) {
            console.error("Upload ảnh editor lỗi:", err);
        }
        return null;
    };

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                const url = await uploadFileForEditor(file);
                if (url) {
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection();
                    // Chèn ảnh vào editor với đường dẫn đầy đủ
                    quill.insertEmbed(range.index, 'image', `${API_BASE}${url}`);
                }
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['image', 'link'], // Bỏ video nếu không cần thiết
                ['clean']
            ],
            handlers: { image: imageHandler }
        }
    }), []);

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'align',
        'image', 'link'
    ];

    // --- Logic cũ giữ nguyên ---
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); 
    };

    useEffect(() => {
        if (initialData) {
            setCode(initialData.productCode);
            setName(initialData.productName);
            setCatId(initialData.categoryId);
            setOriginalPrice(initialData.originalPrice);
            setSalePrice(initialData.salePrice || 0);
            setStock(initialData.stockQuantity || 0);
            setMinStock(initialData.minStockAlert || 5);
            setSaleStart(formatDateForInput(initialData.saleStartDate));
            setSaleEnd(formatDateForInput(initialData.saleEndDate));
            setShortDesc(initialData.shortDescription || '');
            
            setDetailDesc(initialData.detailDescription || ''); // Load nội dung HTML vào đây

            setSize(initialData.size || '');
            setCharacteristics(initialData.characteristics || '');
            setFengShui(initialData.fengShuiTags || '');
            setActive(initialData.isActive ?? true);
            if (initialData.tblProductImages) {
                setImages(initialData.tblProductImages);
            }
        } else {
            setCode('');
            setName('');
            setCatId(categories.length > 0 ? categories[0].categoryId : '');
            setOriginalPrice(0);
            setSalePrice(0);
            setStock(0);
            setMinStock(5);
            setSaleStart('');
            setSaleEnd('');
            setShortDesc('');
            setDetailDesc('');
            setSize('');
            setCharacteristics('');
            setFengShui('');
            setActive(true);
            setImages([]);
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
                //  Logic upload ảnh sản phẩm (Product Image)
                const res = await fetch(`${API_BASE}/api/Upload`, {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    const isFirst = (images.length + newImages.length) === 0;
                    
                    newImages.push({
                        imageUrl: data.url,
                        isThumbnail: isFirst, 
                        displayOrder: 0
                    });
                }
            } catch (err) {
                console.error("Upload lỗi:", err);
                alert("Lỗi upload ảnh!");
            }
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
        const newArr = images.map((img, idx) => ({
            ...img,
            isThumbnail: idx === index 
        }));
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
            shortDescription: shortDesc,
            
            detailDescription: detailDesc, // Giá trị này giờ là HTML từ Quill

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
                width: '900px', // Tăng width lên một chút để editor rộng rãi hơn
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
                            <select value={catId} onChange={e => setCatId(e.target.value)} style={{ width: '100%', padding: '6px' }}>
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map(c => (
                                    <option key={c.categoryId} value={c.categoryId}>
                                        {c.categoryName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Kích thước (Size):</label>
                            <input type="text" value={size} onChange={e => setSize(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Tags Phong thủy:</label>
                            <input type="text" value={fengShui} onChange={e => setFengShui(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                        </div>
                    </div>

                    {/* Cột Phải */}
                    <div>
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

                        <div style={{ display:'flex', gap:'10px' }}>
                            <div style={{ marginBottom: '10px', flex:1 }}>
                                <label>Tồn kho:</label>
                                <input type="number" value={stock} onChange={e => setStock(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                            </div>
                            <div style={{ marginBottom: '10px', flex:1 }}>
                                <label>Cảnh báo min:</label>
                                <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <label>Ngày bắt đầu KM:</label>
                            <input type="datetime-local" value={saleStart} onChange={e => setSaleStart(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Ngày kết thúc KM:</label>
                            <input type="datetime-local" value={saleEnd} onChange={e => setSaleEnd(e.target.value)} style={{ width: '100%', padding: '6px' }} />
                        </div>
                    </div>
                </div>

                {/* Phần Hình ảnh sản phẩm (Giữ nguyên) */}
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <h4>Hình ảnh sản phẩm</h4>
                    <div style={{ marginBottom: '10px' }}>
                        <input type="file" multiple onChange={handleFileChange} disabled={uploading} />
                        {uploading && <span> Đang tải lên...</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {images.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative', border: img.isThumbnail ? '2px solid green' : '1px solid #ddd', padding: '2px' }}>
                                <img 
                                    src={`${API_BASE}${img.imageUrl}`} // Dùng API_BASE thay vì hardcode
                                    alt="product" 
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }} 
                                />
                                <button 
                                    onClick={() => handleRemoveImage(idx)}
                                    style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', cursor: 'pointer', fontSize:'10px' }}
                                >X</button>
                                <div style={{ textAlign: 'center', fontSize: '11px', marginTop: '2px' }}>
                                    <input 
                                        type="radio" 
                                        name="thumb" 
                                        checked={img.isThumbnail} 
                                        onChange={() => handleSetThumbnail(idx)} 
                                    /> Đại diện
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div style={{ marginBottom: '10px', marginTop: '10px' }}>
                    <label>Mô tả ngắn:</label>
                    <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} style={{ width: '100%', height: '50px', padding:'5px' }} />
                </div>
                
                {/* --- PHẦN THAY ĐỔI CHÍNH: Thay Textarea bằng ReactQuill --- */}
                <div style={{ marginBottom: '60px' }}> 
                    <label style={{display: 'block', marginBottom: '5px'}}>Mô tả chi tiết:</label>
                    <ReactQuill 
                        ref={quillRef}
                        theme="snow" 
                        value={detailDesc} 
                        onChange={setDetailDesc} 
                        modules={modules}
                        formats={formats}
                        style={{ height: '200px' }} // Chiều cao cho vùng soạn thảo
                    />
                </div>
                {/* -------------------------------------------------------- */}

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