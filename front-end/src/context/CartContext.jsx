import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const BASE_URL = 'https://localhost:7298'; 

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
        return user.roleId === 2; // Giả sử Role 2 là khách
    };

    const syncLocalStorage = (items) => {
        const user = getUser();
        if (!user) { 
            localStorage.setItem('shoppingCart', JSON.stringify(items));
        }
    };

    // --- 1. LOAD GIỎ HÀNG ---
    useEffect(() => {
        const user = getUser();
        if (user && !isCustomer(user)) { setCartItems([]); return; }

        const userId = user?.userId;

        if (userId) {
            // DB: Load từ API
            fetch(`${BASE_URL}/api/Cart/get-cart/${userId}`)
                .then(res => { if (!res.ok) return []; return res.json(); })
                .then(data => {
                    setCartItems(Array.isArray(data) ? data : []);
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
                const res = await fetch(`${BASE_URL}/api/Cart/get-cart/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCartItems(Array.isArray(data) ? data : []);
                } else { setCartItems([]); }
            } catch (err) { setCartItems([]); }
        } else {
            const storedCart = localStorage.getItem('shoppingCart');
            setCartItems(storedCart ? JSON.parse(storedCart) : []);
        }
    };

    // --- 2. THÊM VÀO GIỎ (SỬA LỖI item is not defined) ---
    const addToCart = async (product) => {
        const user = getUser();
        if (user && !isCustomer(user)) { alert("Quản trị viên không thể mua hàng!"); return; }

        const userId = user?.userId;

        if (userId) {
            // --- LOGIC DB ---
            try {
                const res = await fetch(`${BASE_URL}/api/Cart/add-to-cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: parseInt(userId), 
                        variantId: product.variantId, // Sửa item -> product
                        quantity: product.quantity    // Sửa item -> product
                    })
                });
                
                if (res.ok) {
                    refreshCart(); // Tải lại để đồng bộ
                    alert("Đã thêm vào giỏ hàng!");
                } else {
                    alert("Lỗi khi thêm vào giỏ hàng (API).");
                }
            } catch (error) {
                console.error("Lỗi thêm giỏ hàng DB", error);
                alert("Lỗi kết nối server!");
            }
        } else {
            // --- LOGIC LOCAL STORAGE (KHÁCH VÃNG LAI) ---
            setCartItems(prev => {
                const safePrev = Array.isArray(prev) ? prev : [];
                // Sửa: Tìm theo variantId thay vì productId
                const exist = safePrev.find(x => x.variantId === product.variantId);
                let newCart;
                
                if (exist) {
                    newCart = safePrev.map(x => x.variantId === product.variantId ? { ...x, quantity: x.quantity + product.quantity } : x);
                } else {
                    newCart = [...safePrev, { 
                        productId: product.productId, // Vẫn lưu productId để link
                        variantId: product.variantId, // QUAN TRỌNG
                        productName: product.productName,
                        variantName: product.variantName, // Lưu tên phân loại
                        price: product.price || product.salePrice || product.originalPrice, 
                        imageUrl: product.imageUrl || '', 
                        quantity: product.quantity 
                    }];
                }
                syncLocalStorage(newCart);
                alert("Đã thêm vào giỏ (Local)!");
                return newCart;
            });
        }
    };

    // --- 3. XÓA SẢN PHẨM (Sửa dùng variantId) ---
    const removeFromCart = async (variantId) => {
        const user = getUser();
        const userId = user?.userId;

        if (userId) {
            // Gọi API xóa theo variantId (Controller đã sửa ở bước trước)
            await fetch(`${BASE_URL}/api/Cart/remove-item?userId=${userId}&variantId=${variantId}`, { method: 'DELETE' });
        }
        
        setCartItems(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            // Lọc bỏ item có variantId trùng khớp
            const newCart = safePrev.filter(item => item.variantId !== variantId);
            syncLocalStorage(newCart);
            return newCart;
        });
    };

    // --- 4. CẬP NHẬT SỐ LƯỢNG (Sửa dùng variantId) ---
    const updateQuantity = async (variantId, newQuantity) => {
        if (newQuantity < 1) return;

        const user = getUser();
        const userId = user?.userId;

        if (userId) {
            await fetch(`${BASE_URL}/api/Cart/update-quantity`, {
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

    const validItems = Array.isArray(cartItems) ? cartItems : [];
    const cartCount = validItems.reduce((total, item) => total + (item.quantity || 0), 0);
    const cartTotal = validItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, cartCount, cartTotal, refreshCart }}>
            {children}
        </CartContext.Provider>
    );
};