import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductModal from '../../components/admin/ProductModal';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

function Products() {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [priceBounds, setPriceBounds] = useState({ min: 0, max: 100000000 });
    
    // --- STATE PHÂN TRANG (MỚI) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị mỗi trang

    const isFirstLoad = useRef(true);

    // --- STATE BỘ LỌC ---
    const [filters, setFilters] = useState({
        keyword: '',
        categoryId: '',
        stockStatus: '',
        isActive: '',
        minPrice: 0,
        maxPrice: 100000000,
        sortByPrice: '', 
        isOnSale: ''     
    });

    const navigate = useNavigate();
    const BASE_URL = 'https://localhost:7298';
    const API_URL = `${BASE_URL}/api/TblProducts`;
    const CAT_API_URL = `${BASE_URL}/api/TblCategories`;

    // --- LOGIC GỌI API ---
    const fetchProducts = () => {
        const params = new URLSearchParams();
        if (filters.keyword) params.append('keyword', filters.keyword);
        if (filters.categoryId) params.append('categoryId', filters.categoryId);
        if (filters.stockStatus) params.append('stockStatus', filters.stockStatus);
        if (filters.isActive) params.append('isActive', filters.isActive);
        params.append('minPrice', filters.minPrice);
        params.append('maxPrice', filters.maxPrice);
        if (filters.sortByPrice) params.append('sortByPrice', filters.sortByPrice);
        if (filters.isOnSale) params.append('isOnSale', filters.isOnSale);

        fetch(`${API_URL}/filter?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                // Reset về trang 1 khi lọc dữ liệu
                setCurrentPage(1); 

                if (isFirstLoad.current && data.length > 0) {
                    const prices = data.map(p => p.salePrice || p.originalPrice);
                    const minVal = Math.min(...prices);
                    const maxVal = Math.max(...prices);
                    // setPriceBounds({ min: minVal, max: maxVal });
                    // setFilters(prev => ({ ...prev, minPrice: minVal, maxPrice: maxVal }));
                    setPriceBounds({ min: 0, max: maxVal }); 
                    
                    // Cập nhật bộ lọc hiện tại theo bounds mới
                    setFilters(prev => ({ ...prev, minPrice: 0, maxPrice: maxVal }));
                    isFirstLoad.current = false;
                }
            })
            .catch(err => console.error("Lỗi tải sản phẩm:", err));
    };

    const fetchCategories = () => {
        fetch(CAT_API_URL).then(res => res.json()).then(data => setCategories(data)).catch(err => console.error(err));
    };

    useEffect(() => {
        fetchCategories();
        fetchProducts(); 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- LOGIC PHÂN TRANG (MỚI) ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = products.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(products.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // --- HANDLERS ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSliderChange = (value) => {
        setFilters(prev => ({ ...prev, minPrice: value[0], maxPrice: value[1] }));
    };

    const handleResetFilter = () => {
        setFilters({
            keyword: '',
            categoryId: '',
            stockStatus: '',
            isActive: '',
            minPrice: priceBounds.min,
            maxPrice: priceBounds.max,
            sortByPrice: '',
            isOnSale: ''
        });
        const params = new URLSearchParams();
        params.append('minPrice', priceBounds.min);
        params.append('maxPrice', priceBounds.max);
        fetch(`${API_URL}/filter?${params.toString()}`).then(res => res.json()).then(data => {
            setProducts(data);
            setCurrentPage(1);
        });
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const getThumbnailUrl = (product) => {
        if (product.thumbnail) return `${BASE_URL}${product.thumbnail}`;
        if (product.tblProductImages && product.tblProductImages.length > 0) {
             const thumb = product.tblProductImages.find(img => img.isThumbnail === true);
             return thumb ? `${BASE_URL}${thumb.imageUrl}` : `${BASE_URL}${product.tblProductImages[0].imageUrl}`;
        }
        return null;
    };

    const getCategoryName = (catId) => { 
        const cat = categories.find(c => c.categoryId === catId); 
        return cat ? cat.categoryName : '---';
    };

    const handleOpenAdd = () => { setEditingItem(null); setIsModalOpen(true); };

    const handleOpenEdit = async (item) => {
        try {
            const res = await fetch(`${API_URL}/${item.productId}`);
            if (res.ok) { 
                const fullData = await res.json(); 
                setEditingItem(fullData); 
                setIsModalOpen(true);
            }
        } catch (error) { console.error(error); }
    };

    // --- SỬA LẠI HÀM XÓA ĐỂ HIỆN MÃ & TÊN ---
    const handleDelete = async (item) => {
        if (window.confirm(`Bạn có chắc muốn xóa sản phẩm này không?\n\n- Mã: ${item.productCode}\n- Tên: ${item.productName}`)) {
            try {
                await fetch(`${API_URL}/${item.productId}`, { method: 'DELETE' });
                fetchProducts();
            } catch (error) {
                console.error("Lỗi khi xóa:", error);
                alert("Đã xảy ra lỗi khi xóa sản phẩm.");
            }
        }
    };

    const handleSaveFromModal = async (formData) => {
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `${API_URL}/${editingItem.productId}` : API_URL;
        if (editingItem) formData.productId = editingItem.productId;

        try {
            const res = await fetch(url, { 
                method, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(formData) 
            });

            if (res.ok) { 
                setIsModalOpen(false);
                fetchProducts(); 
                alert("Lưu thành công!"); 
            } else { 
                const text = await res.text();
                try {
                    const errData = JSON.parse(text);
                    alert('Lỗi: ' + (errData.title || 'Có lỗi xảy ra')); 
                } catch (e) {
                    console.error("Server Error HTML:", text);
                    alert('Lỗi hệ thống (Chi tiết trong Console). Mã lỗi: ' + res.status);
                }
            }
        } catch (error) { 
            console.error("Network Error:", error);
            alert("Lỗi kết nối tới máy chủ!");
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản Lý Sản Phẩm</h2>
            
            {/* KHỐI BỘ LỌC */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
                    {/* Danh mục */}
                    <div>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px', color:'#4e73df'}}>Danh mục</label>
                        <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}>
                            <option value="">-- Tất cả --</option>
                            {categories.map(c => (<option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>))}
                        </select>
                    </div>
                    {/* Trạng thái */}
                    <div>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px', color:'#4e73df'}}>Trạng thái</label>
                        <select name="isActive" value={filters.isActive} onChange={handleFilterChange} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}>
                            <option value="">-- Tất cả --</option>
                            <option value="true">Đang bán</option>
                            <option value="false">Ngừng bán</option>
                        </select>
                    </div>
                    {/* Sắp xếp giá */}
                    <div>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px', color:'#4e73df'}}>Sắp xếp giá</label>
                        <select name="sortByPrice" value={filters.sortByPrice} onChange={handleFilterChange} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: filters.sortByPrice ? '#e8f0fe' : 'white', outline: 'none' }}>
                            <option value="">-- Mặc định --</option>
                            <option value="asc">💰 Giá tăng dần</option>
                            <option value="desc">💎 Giá giảm dần</option>
                        </select>
                    </div>
                    {/* Chương trình KM */}
                    <div>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px', color:'#4e73df'}}>Chương trình KM</label>
                        <select name="isOnSale" value={filters.isOnSale} onChange={handleFilterChange} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', color: filters.isOnSale === 'true' ? '#e74a3b' : 'inherit', fontWeight: filters.isOnSale === 'true' ? 'bold' : 'normal', outline: 'none' }}>
                            <option value="">-- Tất cả --</option>
                            <option value="true">🔥 Đang Sale</option>
                            <option value="false">Không Sale</option>
                        </select>
                    </div>
                    {/* Tồn kho */}
                    <div>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px', color:'#4e73df'}}>Tồn kho</label>
                        <select name="stockStatus" value={filters.stockStatus} onChange={handleFilterChange} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }}>
                            <option value="">-- Tất cả --</option>
                            <option value="available">Còn hàng</option>
                            <option value="low_stock">⚠️ Sắp hết</option>
                            <option value="out_of_stock">❌ Hết hàng</option>
                        </select>
                    </div>
                </div>

                {/* TỪ KHÓA - SLIDER GIÁ - NÚT BẤM */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 200px', gap: '20px', alignItems: 'start' }}>
                    {/* Ô Tìm kiếm */}
                    <div>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize:'13px', color:'#4e73df'}}>TÌM KIẾM TỪ KHÓA</label>
                        <input type="text" name="keyword" placeholder="Nhập tên cây, mã số..." value={filters.keyword} onChange={handleFilterChange} style={{ width: '100%', padding: '9px 10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' }} />
                    </div>
                    {/* Thanh trượt giá */}
                    <div>
                        <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize:'13px', color:'#4e73df'}}>KHOẢNG GIÁ</label>
                        <div style={{ padding: '5px 10px 0 5px' }}>
                            <Slider range min={priceBounds.min} max={priceBounds.max} step={10000} value={[filters.minPrice, filters.maxPrice]} onChange={handleSliderChange} trackStyle={[{ backgroundColor: '#4e73df', height: 6 }]} handleStyle={[{ borderColor: '#4e73df', backgroundColor: '#fff', opacity: 1, marginTop: -4 }, { borderColor: '#4e73df', backgroundColor: '#fff', opacity: 1, marginTop: -4 }]} railStyle={{ backgroundColor: '#e9ecef', height: 6 }} />
                        </div>
                        <div style={{ marginTop: '12px', textAlign: 'center', fontWeight: '500', fontSize: '13px', color: '#666' }}>
                            {formatCurrency(filters.minPrice)} — {formatCurrency(filters.maxPrice)}
                        </div>
                    </div>
                    {/* Nút bấm */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '27px' }}>
                        <button onClick={fetchProducts} style={{ flex: 1, padding: '9px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
                            🔍 Tìm
                        </button>
                        <button onClick={handleResetFilter} style={{ flex: 1, padding: '9px', background: '#f8f9fa', color: '#666', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button onClick={handleOpenAdd} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Thêm Sản Phẩm</button>
                <button onClick={() => navigate('/admin/categories')} style={{ padding: '10px 20px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📁 Quản lý Danh mục</button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            {/* CỘT STT MỚI */}
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Mã SP</th>
                            <th style={{ padding: '12px', width: '80px', textAlign: 'center' }}>Ảnh</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Tên Sản Phẩm</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Danh mục</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Giá bán</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Tồn kho</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map((item, index) => {
                            const thumbUrl = getThumbnailUrl(item);
                            const isLowStock = item.stockQuantity <= (item.minStockAlert || 5) && item.stockQuantity > 0;
                            const isOutOfStock = item.stockQuantity <= 0;
                            const rowStyle = { borderBottom: '1px solid #eee', backgroundColor: isOutOfStock ? '#fff3f3' : (index % 2 === 0 ? 'white' : '#f9f9f9') };
                            
                            // TÍNH TOÁN STT
                            const stt = (currentPage - 1) * itemsPerPage + index + 1;

                            return (
                                <tr key={item.productId} style={rowStyle}>
                                    {/* HIỂN THỊ STT */}
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>
                                    
                                    <td style={{ padding: '12px', color: '#666' }}>{item.productCode}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {thumbUrl ? <img src={thumbUrl} alt="thumb" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} /> : <div style={{width:'45px', height:'45px', background:'#eee', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#999'}}>No Img</div>}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{fontWeight: 'bold', color: '#333'}}>{item.productName}</div>
                                        {item.salePrice > 0 && item.salePrice < item.originalPrice && <span style={{fontSize:'11px', background:'#e74a3b', color:'white', padding:'2px 6px', borderRadius:'10px', marginLeft:'5px'}}>Sale</span>}
                                    </td>
                                    <td style={{ padding: '12px' }}><span style={{background:'#e3e6f0', padding:'3px 8px', borderRadius:'12px', fontSize:'12px', color:'#5a5c69'}}>{item.categoryName || getCategoryName(item.categoryId)}</span></td>
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>
                                        {item.salePrice > 0 ? (<div><div style={{color:'#e74a3b'}}>{item.salePrice.toLocaleString('vi-VN')} đ</div><div style={{textDecoration:'line-through', fontSize:'11px', color:'#999'}}>{item.originalPrice.toLocaleString('vi-VN')} đ</div></div>) : (<span>{item.originalPrice.toLocaleString('vi-VN')} đ</span>)}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {isOutOfStock ? <span style={{color:'red', fontWeight:'bold', fontSize:'12px'}}>Hết hàng</span> : (isLowStock ? <span style={{color:'#f6c23e', fontWeight:'bold'}}>{item.stockQuantity} ⚠️</span> : item.stockQuantity)}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>{item.isActive ? <span style={{color: '#1cc88a', fontSize:'12px', fontWeight:'bold'}}>● Đang bán</span> : <span style={{color: '#858796', fontSize:'12px'}}>● Ngừng bán</span>}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button onClick={() => handleOpenEdit(item)} style={{ marginRight: '8px', cursor: 'pointer', background:'transparent', color:'#4e73df', border:'1px solid #4e73df', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}>Sửa</button>
                                        {/* TRUYỀN ITEM VÀO HÀM DELETE */}
                                        <button onClick={() => handleDelete(item)} style={{ cursor: 'pointer', background:'transparent', color:'#e74a3b', border:'1px solid #e74a3b', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}>Xóa</button>
                                    </td>
                                </tr>
                            );
                        }) : (<tr><td colSpan="9" style={{textAlign:'center', padding:'30px', color:'#888'}}>Không tìm thấy sản phẩm nào phù hợp.</td></tr>)}
                    </tbody>
                </table>

                {/* --- THANH PHÂN TRANG UI --- */}
                {products.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '5px', borderTop: '1px solid #eee' }}>
                        
                        {/* NHÓM NÚT TRÁI: Chỉ hiện khi không phải trang 1 */}
                        {currentPage > 1 && (
                            <>
                                {/* Nút về Trang đầu */}
                                <button 
                                    onClick={() => paginate(1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Về trang đầu"
                                >
                                    &#171; Đầu
                                </button>

                                {/* Nút Trước */}
                                <button 
                                    onClick={() => paginate(currentPage - 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    &lsaquo; Trước
                                </button>
                            </>
                        )}

                        {/* DANH SÁCH SỐ TRANG (Tối đa 10 số) */}
                        {(() => {
                            let startPage, endPage;
                            // Nếu tổng số trang <= 10 thì hiện hết
                            if (totalPages <= 10) {
                                startPage = 1;
                                endPage = totalPages;
                            } else {
                                // Nếu tổng > 10, tính toán cửa sổ trượt
                                if (currentPage <= 6) {
                                    startPage = 1;
                                    endPage = 10;
                                } else if (currentPage + 4 >= totalPages) {
                                    startPage = totalPages - 9;
                                    endPage = totalPages;
                                } else {
                                    startPage = currentPage - 5;
                                    endPage = currentPage + 4;
                                }
                            }

                            // Tạo mảng số trang để map
                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(i);
                            }

                            return pages.map(number => (
                                <button 
                                    key={number} 
                                    onClick={() => paginate(number)}
                                    style={{ 
                                        padding: '6px 12px', 
                                        border: '1px solid #ddd', 
                                        background: currentPage === number ? '#4e73df' : 'white', 
                                        color: currentPage === number ? 'white' : '#333',
                                        cursor: 'pointer', 
                                        borderRadius: '4px',
                                        fontWeight: currentPage === number ? 'bold' : 'normal',
                                        fontSize: '13px',
                                        minWidth: '32px' // Đảm bảo nút số tròn trịa
                                    }}
                                >
                                    {number}
                                </button>
                            ));
                        })()}

                        {/* NHÓM NÚT PHẢI: Chỉ hiện khi không phải trang cuối */}
                        {currentPage < totalPages && (
                            <>
                                {/* Nút Sau */}
                                <button 
                                    onClick={() => paginate(currentPage + 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    Sau &rsaquo;
                                </button>

                                {/* Nút đến Trang cuối */}
                                <button 
                                    onClick={() => paginate(totalPages)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Đến trang cuối"
                                >
                                    Cuối &#187;
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <ProductModal 
                    key={editingItem ? editingItem.productId : 'new'} 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSubmit={handleSaveFromModal} 
                    initialData={editingItem} 
                    categories={categories} 
                />
            )}
        </div>
    );
}

export default Products;