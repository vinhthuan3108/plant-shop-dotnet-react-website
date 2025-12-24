import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductModal from '../../components/admin/ProductModal';

function Products() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // 1. MỚI: State cho bộ lọc
    const [filters, setFilters] = useState({
        keyword: '',
        categoryId: '',
        stockStatus: '', // '', 'out_of_stock', 'low_stock', 'available'
        isActive: '',    // '', 'true', 'false'
        minPrice: '',
        maxPrice: ''
    });

    const navigate = useNavigate();

    const BASE_URL = 'https://localhost:7298';
    const API_URL = `${BASE_URL}/api/TblProducts`;
    const CAT_API_URL = `${BASE_URL}/api/TblCategories`;

    // 2. MỚI: Hàm fetch sản phẩm có áp dụng lọc
    const fetchProducts = () => {
        // Tạo query string từ state filters
        const params = new URLSearchParams();
        
        if (filters.keyword) params.append('keyword', filters.keyword);
        if (filters.categoryId) params.append('categoryId', filters.categoryId);
        if (filters.stockStatus) params.append('stockStatus', filters.stockStatus);
        if (filters.isActive) params.append('isActive', filters.isActive);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

        // Gọi API Filter mới thay vì API gốc
        fetch(`${API_URL}/filter?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                // API filter đã sort sẵn ở backend, nhưng sort lại ở client cho chắc nếu cần
                setProducts(data);
            })
            .catch(err => console.error("Lỗi tải sản phẩm:", err));
    };

    const fetchCategories = () => {
        fetch(CAT_API_URL)
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error(err));
    };

    // Load dữ liệu lần đầu
    useEffect(() => {
        fetchCategories();
        fetchProducts(); 
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Chỉ chạy 1 lần khi mount, việc lọc sẽ kích hoạt khi nhấn nút "Tìm kiếm"

    // 3. MỚI: Hàm xử lý thay đổi input lọc
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 4. MỚI: Hàm reset bộ lọc
    const handleResetFilter = () => {
        setFilters({
            keyword: '',
            categoryId: '',
            stockStatus: '',
            isActive: '',
            minPrice: '',
            maxPrice: ''
        });
        // Sau khi reset state, cần gọi lại fetchProducts. 
        // Tuy nhiên do setState là bất đồng bộ, ta có thể reload trang hoặc gọi fetch với params rỗng thủ công.
        // Cách đơn giản nhất để UX mượt là gọi fetch với object rỗng:
        fetch(`${API_URL}/filter`) 
            .then(res => res.json())
            .then(data => setProducts(data));
    };

    const getCategoryName = (catId) => { // (Giữ nguyên hoặc dùng categoryName từ API trả về)
        // API Filter mới đã trả về CategoryName, nhưng giữ logic này để fallback
        const cat = categories.find(c => c.categoryId === catId);
        return cat ? cat.categoryName : '---';
    };

    // 5. CẬP NHẬT: Hàm lấy URL ảnh (Hỗ trợ cả API cũ và API Filter mới)
    const getThumbnailUrl = (product) => {
        // Ưu tiên trường 'thumbnail' từ API Filter mới
        if (product.thumbnail) {
            return `${BASE_URL}${product.thumbnail}`;
        }
        
        // Fallback cho trường hợp data cũ hoặc sau khi Edit/Add (nếu chưa reload lại list filter)
        if (product.tblProductImages && product.tblProductImages.length > 0) {
             const thumb = product.tblProductImages.find(img => img.isThumbnail === true);
             return thumb ? `${BASE_URL}${thumb.imageUrl}` : `${BASE_URL}${product.tblProductImages[0].imageUrl}`;
        }
        
        return null;
    };

    // ... (Các hàm handleOpenAdd, handleOpenEdit, handleDelete, handleSaveFromModal GIỮ NGUYÊN KHÔNG ĐỔI)
    const handleOpenAdd = () => { setEditingItem(null); setIsModalOpen(true); };
    const handleOpenEdit = async (item) => {
        try {
            // 1. Gọi API lấy chi tiết sản phẩm theo ID để có đầy đủ danh sách ảnh
            const res = await fetch(`${API_URL}/${item.productId}`);
            
            if (res.ok) {
                const fullData = await res.json();
                
                // 2. Set dữ liệu đầy đủ này vào state để mở Modal
                setEditingItem(fullData);
                setIsModalOpen(true);
            } else {
                alert("Không thể tải chi tiết sản phẩm!");
            }
        } catch (error) {
            console.error("Lỗi lấy chi tiết sản phẩm:", error);
        }
    };
    
    const handleDelete = async (id) => {
        if (window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) {
            try {
                const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (res.ok) fetchProducts(); // Tải lại danh sách sau khi xóa
                else alert('Lỗi khi xóa!');
            } catch (error) { console.error(error); }
        }
    };

    const handleSaveFromModal = async (formData) => {
        const method = editingItem ? 'PUT' : 'POST';
        const url = editingItem ? `${API_URL}/${editingItem.productId}` : API_URL;
        if (editingItem) formData.productId = editingItem.productId;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchProducts(); // Tải lại danh sách sau khi lưu
            } else {
                const err = await res.json();
                alert('Lỗi: ' + (err.title || 'Kiểm tra dữ liệu'));
            }
        } catch (error) { console.error(error); }
    };

    // --- RENDER ---
    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản Lý Sản Phẩm</h2>
            
            {/* --- BLOCK: BỘ LỌC TÌM KIẾM --- */}
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'end' }}>
                    
                    {/* Tìm kiếm từ khóa */}
                    <div style={{ flex: '1 1 200px' }}>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px'}}>Từ khóa</label>
                        <input 
                            type="text" name="keyword"
                            placeholder="Tên cây, mã số..."
                            value={filters.keyword} onChange={handleFilterChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                    </div>

                    {/* Chọn danh mục */}
                    <div style={{ flex: '0 1 180px' }}>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px'}}>Danh mục</label>
                        <select 
                            name="categoryId" 
                            value={filters.categoryId} onChange={handleFilterChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="">-- Tất cả --</option>
                            {categories.map(c => (
                                <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Lọc Tồn kho */}
                    <div style={{ flex: '0 1 180px' }}>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px'}}>Tồn kho</label>
                        <select 
                            name="stockStatus" 
                            value={filters.stockStatus} onChange={handleFilterChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', borderColor: filters.stockStatus === 'low_stock' ? '#e74a3b' : '#ddd' }}
                        >
                            <option value="">-- Tất cả --</option>
                            <option value="available">Còn hàng</option>
                            <option value="low_stock">⚠️ Sắp hết hàng</option>
                            <option value="out_of_stock">❌ Hết hàng</option>
                        </select>
                    </div>

                    {/* Lọc Trạng thái */}
                    <div style={{ flex: '0 1 150px' }}>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px'}}>Trạng thái</label>
                        <select 
                            name="isActive" 
                            value={filters.isActive} onChange={handleFilterChange}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="">-- Tất cả --</option>
                            <option value="true">Đang bán</option>
                            <option value="false">Ngừng bán</option>
                        </select>
                    </div>

                    {/* Khoảng giá */}
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'end' }}>
                        <div>
                             <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px'}}>Giá từ</label>
                             <input type="number" name="minPrice" placeholder="0" value={filters.minPrice} onChange={handleFilterChange} style={{ width: '80px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                        <span style={{marginBottom: '10px'}}>-</span>
                        <div>
                             <label style={{display: 'block', marginBottom: '5px', fontWeight: '500', fontSize:'13px'}}>Đến</label>
                             <input type="number" name="maxPrice" placeholder="Max" value={filters.maxPrice} onChange={handleFilterChange} style={{ width: '80px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </div>
                    </div>

                    {/* Nút thao tác */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={fetchProducts} style={{ padding: '8px 20px', background: '#4e73df', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                             🔍 Tìm kiếm
                        </button>
                        <button onClick={handleResetFilter} style={{ padding: '8px 15px', background: '#f8f9fa', color: '#666', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                             Reset
                        </button>
                    </div>
                </div>
            </div>
            {/* --- END BLOCK BỘ LỌC --- */}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button 
                    onClick={handleOpenAdd} 
                    style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    + Thêm Sản Phẩm
                </button>

                <button 
                    onClick={() => navigate('/admin/categories')}
                    style={{ padding: '10px 20px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    📁 Quản lý Danh mục
                </button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Mã SP</th>
                            <th style={{ padding: '12px', width: '80px', textAlign: 'center' }}>Ảnh</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Tên Sản Phẩm</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Danh mục</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Giá bán</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Tồn kho</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? products.map((item, index) => {
                            const thumbUrl = getThumbnailUrl(item);
                            // Highlight dòng sắp hết hàng
                            const isLowStock = item.stockQuantity <= (item.minStockAlert || 5) && item.stockQuantity > 0;
                            const isOutOfStock = item.stockQuantity <= 0;
                            
                            const rowStyle = { 
                                borderBottom: '1px solid #eee',
                                backgroundColor: isOutOfStock ? '#fff3f3' : (index % 2 === 0 ? 'white' : '#f9f9f9')
                            };

                            return (
                                <tr key={item.productId} style={rowStyle}>
                                    <td style={{ padding: '12px', color: '#666' }}>{item.productCode}</td>
                                    
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {thumbUrl ? (
                                            <img src={thumbUrl} alt="thumb" style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                                        ) : (
                                            <div style={{width:'45px', height:'45px', background:'#eee', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#999'}}>No Img</div>
                                        )}
                                    </td>

                                    <td style={{ padding: '12px' }}>
                                        <div style={{fontWeight: 'bold', color: '#333'}}>{item.productName}</div>
                                        {/* Hiển thị badge nếu đang Sale */}
                                        {item.salePrice && item.salePrice < item.originalPrice && 
                                            <span style={{fontSize:'11px', background:'#e74a3b', color:'white', padding:'2px 6px', borderRadius:'10px', marginLeft:'5px'}}>Sale</span>
                                        }
                                    </td>
                                    
                                    <td style={{ padding: '12px' }}>
                                        <span style={{background:'#e3e6f0', padding:'3px 8px', borderRadius:'12px', fontSize:'12px', color:'#5a5c69'}}>
                                            {item.categoryName || getCategoryName(item.categoryId)}
                                        </span>
                                    </td>
                                    
                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>
                                        {item.salePrice ? (
                                            <div>
                                                <div style={{color:'#e74a3b'}}>{item.salePrice.toLocaleString('vi-VN')} đ</div>
                                                <div style={{textDecoration:'line-through', fontSize:'11px', color:'#999'}}>{item.originalPrice.toLocaleString('vi-VN')} đ</div>
                                            </div>
                                        ) : (
                                            <span>{item.originalPrice.toLocaleString('vi-VN')} đ</span>
                                        )}
                                    </td>
                                    
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {isOutOfStock ? 
                                            <span style={{color:'red', fontWeight:'bold', fontSize:'12px'}}>Hết hàng</span> :
                                            (isLowStock ? 
                                                <span style={{color:'#f6c23e', fontWeight:'bold'}}>{item.stockQuantity} ⚠️</span> :
                                                item.stockQuantity
                                            )
                                        }
                                    </td>
                                    
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {item.isActive ? 
                                            <span style={{color: '#1cc88a', fontSize:'12px', fontWeight:'bold'}}>● Đang bán</span> : 
                                            <span style={{color: '#858796', fontSize:'12px'}}>● Ngừng bán</span>
                                        }
                                    </td>
                                    
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button onClick={() => handleOpenEdit(item)} style={{ marginRight: '8px', cursor: 'pointer', background:'transparent', color:'#4e73df', border:'1px solid #4e73df', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}>Sửa</button>
                                        <button onClick={() => handleDelete(item.productId)} style={{ cursor: 'pointer', background:'transparent', color:'#e74a3b', border:'1px solid #e74a3b', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}>Xóa</button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="8" style={{textAlign:'center', padding:'30px', color:'#888'}}>
                                    Không tìm thấy sản phẩm nào phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
                        
            <ProductModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveFromModal}
                initialData={editingItem}
                categories={categories}
            />
        </div>
    );
}

export default Products;