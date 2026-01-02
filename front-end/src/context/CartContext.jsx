import React, { createContext, useState, useEffect } from 'react';
import { API_BASE } from '../utils/apiConfig.jsx';
export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    //const API_BASE = 'https://localhost:7298'; 

    // --- CÁC HÀM HELPER ---
    const getUser = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try { return JSON.parse(userStr); } catch (e) { return null; }
        }
        return null;
    };

    const isCustomer = (user) => {
        if (!user) return true; 
        return user.roleId === 2; 
    };

    const syncLocalStorage = (items) => {
        const user = getUser();
        if (!user) { 
            localStorage.setItem('shoppingCart', JSON.stringify(items));
        }
    };

    // --- FIX VẤN ĐỀ 2: HOÀN THIỆN HÀM CLEAR CART ---
    const clearCart = () => {
        // 1. Xóa State
        setCartItems([]); 
        
        // 2. Xóa Local Storage (cho khách vãng lai)
        localStorage.removeItem('shoppingCart');
    };

    // --- QUAN TRỌNG: Hàm chuẩn hóa dữ liệu từ API ---
    const mapApiDataToCart = (data) => {
        if (!Array.isArray(data)) return [];
        return data.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            salePrice: item.salePrice, 
            originalPrice: item.originalPrice, 
            price: (item.salePrice && item.salePrice > 0) ? item.salePrice : (item.originalPrice || 0),
            image: item.imageUrl || item.image || '', 
            quantity: item.quantity
        }));
    };

    // --- 1. LOAD GIỎ HÀNG ---
    useEffect(() => {
        const user = getUser();
        if (user && !isCustomer(user)) { setCartItems([]); return; }

        const userId = user?.userId;

        if (userId) {
            // DB: Load từ API
            fetch(`${API_BASE}/api/Cart/get-cart/${userId}`)
                .then(res => { if (!res.ok) return []; return res.json(); })
                .then(data => {
                    setCartItems(mapApiDataToCart(data));
                })
                .catch(err => { console.error("Lỗi load cart:", err); setCartItems([]); });
        } else {
            // Local: Load từ Storage
            const storedCart = localStorage.getItem('shoppingCart');
            if (storedCart) {
                try {
                    const parsed = JSON.parse(storedCart);
                    if (Array.isArray(parsed)) setCartItems(parsed);
                } catch (e) { setCartItems([]); }
            }
        }
    }, []);

    const refreshCart = async () => {
        const user = getUser();
        if (user && !isCustomer(user)) { setCartItems([]); return; }
        const userId = user?.userId;

        if (userId) {
            try {
                const res = await fetch(`${API_BASE}/api/Cart/get-cart/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCartItems(mapApiDataToCart(data));
                } else { setCartItems([]); }
            } catch (err) { setCartItems([]); }
        } else {
            const storedCart = localStorage.getItem('shoppingCart');
            setCartItems(storedCart ? JSON.parse(storedCart) : []);
        }
    };

    // --- 2. THÊM VÀO GIỎ (ĐÃ SỬA LỖI DOUBLE ALERT) ---
    const addToCart = async (product) => {
        const user = getUser();
        if (user && !isCustomer(user)) { alert("Quản trị viên không thể mua hàng!"); return; }

        const userId = user?.userId;

        if (userId) {
            // --- LOGIC DB (GIỮ NGUYÊN) ---
            try {
                const res = await fetch(`${API_BASE}/api/Cart/add-to-cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: parseInt(userId), 
                        variantId: product.variantId, 
                        quantity: product.quantity 
                    })
                });
                
                if (res.ok) {
                    refreshCart(); 
                    alert("Đã thêm vào giỏ hàng!");
                } else {
                    alert("Lỗi khi thêm vào giỏ hàng (API).");
                }
            } catch (error) {
                console.error("Lỗi thêm giỏ hàng DB", error);
                alert("Lỗi kết nối server!");
            }
        } else {
            // --- LOGIC LOCAL STORAGE (ĐÃ SỬA) ---
            // 1. Tính toán giỏ hàng mới dựa trên state hiện tại
            let currentCart = [...cartItems];
            const existIndex = currentCart.findIndex(x => x.variantId === product.variantId);
            
            if (existIndex !== -1) {
                // Nếu đã tồn tại -> Tăng số lượng
                currentCart[existIndex] = {
                    ...currentCart[existIndex],
                    quantity: currentCart[existIndex].quantity + product.quantity
                };
            } else {
                // Nếu chưa -> Thêm mới
                currentCart.push({ 
                    productId: product.productId,
                    variantId: product.variantId,
                    productName: product.productName,
                    variantName: product.variantName,
                    originalPrice: product.originalPrice || product.price,
                    salePrice: product.salePrice || 0,
                    price: product.price || product.salePrice || product.originalPrice, 
                    image: product.imageUrl || product.image || '', 
                    quantity: product.quantity 
                });
            }

            // 2. Cập nhật State
            setCartItems(currentCart);

            // 3. Đồng bộ LocalStorage
            syncLocalStorage(currentCart);

            // 4. Alert 1 lần duy nhất
            alert("Đã thêm vào giỏ (Local)!");
        }
    };

    // --- 3. XÓA SẢN PHẨM ---
    const removeFromCart = async (variantId) => {
        const user = getUser();
        const userId = user?.userId;

        if (userId) {
            await fetch(`${API_BASE}/api/Cart/remove-item?userId=${userId}&variantId=${variantId}`, { method: 'DELETE' });
        }
        
        setCartItems(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const newCart = safePrev.filter(item => item.variantId !== variantId);
            syncLocalStorage(newCart);
            return newCart;
        });
    };

    // --- 4. CẬP NHẬT SỐ LƯỢNG ---
    const updateQuantity = async (variantId, newQuantity) => {
        if (newQuantity < 1) return;

        const user = getUser();
        const userId = user?.userId;

        if (userId) {
            await fetch(`${API_BASE}/api/Cart/update-quantity`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId), variantId: variantId, quantity: newQuantity })
            });
        }

        setCartItems(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const newCart = safePrev.map(item => 
                item.variantId === variantId ? { ...item, quantity: newQuantity } : item
            );
            syncLocalStorage(newCart);
            return newCart;
        });
    };

    // --- TÍNH TOÁN ---
    const validItems = Array.isArray(cartItems) ? cartItems : [];
    const cartCount = validItems.reduce((total, item) => total + (item.quantity || 0), 0);
    
    const totalAmount = validItems.reduce((total, item) => {
        const finalPrice = (item.salePrice && item.salePrice > 0) ? item.salePrice : (item.price || item.originalPrice || 0);
        return total + (finalPrice * (item.quantity || 0));
    }, 0);

    return (
        <CartContext.Provider value={{ 
            cartItems, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            cartCount, 
            totalAmount, 
            refreshCart,
            clearCart // <-- Đã export hàm này để dùng ở trang Checkout
        }}>
            {children}
        </CartContext.Provider>
    );
};