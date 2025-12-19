import React, { useState } from 'react';
import './ProductList.css'; // Import CSS

const ProductList = () => {
  const [products] = useState([
    { id: 1, name: 'Cây Xương Rồng', price: 50000, image: 'https://placehold.co/300' },
    { id: 2, name: 'Cây Kim Tiền', price: 120000, image: 'https://placehold.co/300' },
    { id: 3, name: 'Cây Lưỡi Hổ', price: 90000, image: 'https://placehold.co/300' },
    { id: 4, name: 'Sen Đá', price: 30000, image: 'https://placehold.co/300' },
  ]);

  return (
    <div className="product-page">
      <h2 className="page-title">Sản phẩm nổi bật</h2>
      <div className="product-grid">
        {products.map((p) => (
          <div key={p.id} className="product-card">
            <img src={p.image} alt={p.name} className="product-img" />
            <h3 className="product-name">{p.name}</h3>
            <span className="product-price">{p.price.toLocaleString()} đ</span>
            <button className="add-btn">Thêm vào giỏ</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;