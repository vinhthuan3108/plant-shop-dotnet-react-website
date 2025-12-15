import { useState, useEffect } from 'react';

function Categories() {
    const [categories, setCategories] = useState([]);
    // Thêm state để kiểm soát lỗi hoặc đang tải
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // LƯU Ý: Thay đổi cổng bằng cổng backend của bạn
        fetch('https://localhost:7298/api/TblCategories')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Mạng lỗi hoặc không tìm thấy API');
                }
                return response.json();
            })
            .then(data => {
                // Lọc dữ liệu: Chỉ hiện những cái chưa bị xóa (IsDeleted = false) và đang hoạt động (IsActive = true)
                // Nếu muốn hiện hết thì bỏ dòng filter đi
                const activeCategories = data.filter(item => item.isDeleted === false && item.isActive === true);
                
                setCategories(activeCategories);
                setLoading(false);
            })
            .catch(error => {
                console.error('Lỗi:', error);
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Đang tải dữ liệu...</p>;

    return (
        <div>
            <h2>Danh Mục Sản Phẩm</h2>
            <ul>
                {categories.map((item) => (
                    // C# là CategoryId -> React là categoryId (chữ thường đầu)
                    <li key={item.categoryId}> 
                        <strong>{item.categoryName}</strong> 
                        {item.description && <span> - {item.description}</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Categories;