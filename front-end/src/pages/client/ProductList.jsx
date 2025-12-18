import React, { useState } from 'react';

// 1. Khai báo hàm Component (Phần này bạn đang thiếu)
const ProductList = () => {
  // Dữ liệu mẫu (Sau này sẽ gọi API lấy thật)
  const [products] = useState([
    { id: 1, name: 'Cây Xương Rồng', price: 50000, image: 'https://placehold.co/300' },
    { id: 2, name: 'Cây Kim Tiền', price: 120000, image: 'https://placehold.co/300' },
    { id: 3, name: 'Cây Lưỡi Hổ', price: 90000, image: 'https://placehold.co/300' },
    { id: 4, name: 'Sen Đá', price: 30000, image: 'https://placehold.co/300' },
  ]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Danh sách sản phẩm</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-48 object-cover rounded mb-4"
            />
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-red-600 font-bold my-2">{product.price.toLocaleString()} đ</p>
            <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Thêm vào giỏ
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 2. Xuất mặc định (Dòng này bạn đã có, nhưng cần hàm ở trên mới chạy được)
export default ProductList;