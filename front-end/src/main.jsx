import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; 
import { CartProvider } from './context/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css'; // <-- Thêm dòng này
import 'bootstrap/dist/js/bootstrap.bundle.min'; // (Tùy chọn) Để dùng các tính năng JS của Bootstrap
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>

    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
