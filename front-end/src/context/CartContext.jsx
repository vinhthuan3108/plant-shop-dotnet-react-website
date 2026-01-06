import React, { createContext, useState, useEffect } from 'react';
import Swal from 'sweetalert2'; 
import { API_BASE } from '../utils/apiConfig.jsx';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Luôn đảm bảo cartItems là mảng để tránh lỗi .map hoặc .reduce
    const [cartItems, setCartItems] = useState([]);

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
        // Chỉ lưu vào local storage nếu KHÔNG phải là user đăng nhập (hoặc tùy logic dự án của bạn)
        // Ở đây logic là: Nếu chưa đăng nhập thì lưu Local
        if (!user) { 
            localStorage.setItem('shoppingCart', JSON.stringify(items));
        }
    };

    // --- QUAN TRỌNG: Hàm chuẩn hóa dữ liệu đầu vào ---
    // Giúp đồng bộ cấu trúc dữ liệu giữa API và LocalStorage
    const mapProductToCartItem = (product) => {
        return {
            productId: product.productId,
            variantId: product.variantId,
            productName: product.productName,
            variantName: product.variantName,
            originalPrice: product.originalPrice || product.price || 0,
            salePrice: product.salePrice || 0,
            // Giá bán thực tế (ưu tiên giá sale)
            price: (product.salePrice && product.salePrice > 0) ? product.salePrice : (product.originalPrice || product.price || 0),
            image: product.imageUrl || product.image || '',
            quantity: product.quantity
        };
    };

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

    // --- 2. THÊM VÀO GIỎ (FULL LOGIC) ---
    const addToCart = async (product, showAlert = true) => {
        const user = getUser();
        
        // Check quyền Admin
        if (user && !isCustomer(user)) { 
            if (showAlert) { 
                Swal.fire({ icon: 'error', title: 'Hạn chế', text: 'Quản trị viên không thể mua hàng!' });
            }
            return false; 
        }

        const userId = user?.userId;
        let success = false; // Biến cờ đánh dấu kết quả

        if (userId) {
            // ============ LOGIC DB (ĐÃ ĐĂNG NHẬP) ============
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
                    await refreshCart(); // Tải lại giỏ hàng từ server
                    success = true;
                } else {
                    if (showAlert) Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể thêm vào giỏ hàng (Lỗi API).' });
                }
            } catch (error) {
                console.error("Lỗi thêm giỏ hàng DB", error);
                if (showAlert) Swal.fire({ icon: 'error', title: 'Lỗi kết nối', text: 'Không thể kết nối đến máy chủ!' });
            }
        } else {
            // ============ LOGIC LOCAL STORAGE (KHÁCH VÃNG LAI) ============
            // 1. Sao chép mảng state hiện tại để xử lý
            let currentCart = [...cartItems];
            
            // 2. Kiểm tra sản phẩm đã tồn tại chưa
            const existIndex = currentCart.findIndex(x => x.variantId === product.variantId);
            
            if (existIndex !== -1) {
                // Nếu đã tồn tại -> Cộng dồn số lượng
                currentCart[existIndex] = {
                    ...currentCart[existIndex],
                    quantity: currentCart[existIndex].quantity + product.quantity
                };
            } else {
                // Nếu chưa -> Thêm mới vào mảng
                // Sử dụng hàm helper mapProductToCartItem để đảm bảo đủ trường dữ liệu
                const newItem = mapProductToCartItem(product);
                currentCart.push(newItem);
            }

            // 3. Cập nhật State
            setCartItems(currentCart);

            // 4. Đồng bộ xuống Local Storage
            syncLocalStorage(currentCart);
            
            success = true;
        }

        // ============ THÔNG BÁO CHUNG ============
        if (success && showAlert) {
            Swal.fire({
                icon: 'success',
                title: 'Đã thêm!',
                text: 'Sản phẩm đã được thêm vào giỏ hàng.',
                timer: 1500,
                showConfirmButton: false
            });
        }

        return success;
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

    // --- 5. CLEAR CART (ĐĂNG XUẤT / THANH TOÁN XONG) ---
    const clearCart = async () => {
        const user = getUser();
        const userId = user?.userId;

        // 1. Xóa trên Server (nếu user đang đăng nhập)
        if (userId && cartItems.length > 0) {
            try {
                const deletePromises = cartItems.map(item => 
                    fetch(`${API_BASE}/api/Cart/remove-item?userId=${userId}&variantId=${item.variantId}`, { 
                        method: 'DELETE' 
                    })
                );
                await Promise.all(deletePromises);
            } catch (err) {
                console.error("Lỗi xóa data server:", err);
            }
        }

        // 2. Xóa State & Local Storage
        setCartItems([]);
        localStorage.removeItem('shoppingCart');
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
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};