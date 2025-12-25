import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    
    const BASE_URL = 'https://localhost:7298'; 

    // Hàm lấy User từ localStorage
    const getUser = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    // Hàm kiểm tra xem user có phải là Khách hàng không
    // (Giả sử RoleId = 2 là khách hàng, các role khác là admin/staff)
    // Bạn cần check lại DB xem RoleId của khách hàng là mấy. Thường là 2 hoặc null.
    const isCustomer = (user) => {
        if (!user) return true; // Chưa đăng nhập -> Coi là khách vãng lai
        // Nếu roleId = 2 là khách hàng. Các role 1,3,4 là quản trị
        return user.roleId === 2; 
    };

    // 1. Load giỏ hàng
    useEffect(() => {
        const user = getUser();
        
        // Nếu là Admin/Nhân viên -> Không load giỏ hàng, return luôn để tránh lỗi API
        if (user && !isCustomer(user)) {
            setCartItems([]);
            return;
        }

        const userId = user?.userId;

        if (userId) {
            // NẾU CÓ USER ID (Và là khách hàng) -> Gọi API
            fetch(`${BASE_URL}/api/Cart/get-cart/${userId}`)
                .then(res => {
                    // Nếu lỗi 404 (chưa có giỏ) hoặc 401/403 -> Không throw lỗi để tránh crash
                    if (!res.ok) {
                        return []; 
                    }
                    return res.json();
                })
                .then(data => {
                    if (Array.isArray(data)) {
                        setCartItems(data);
                    } else {
                        setCartItems([]);
                    }
                })
                .catch(err => {
                    console.error("Lỗi load cart:", err);
                    setCartItems([]);
                });
        } else {
            // NẾU KHÔNG CÓ USER ID -> Dùng LocalStorage (Khách vãng lai)
            const storedCart = localStorage.getItem('shoppingCart');
            if (storedCart) {
                try {
                    const parsed = JSON.parse(storedCart);
                    if (Array.isArray(parsed)) setCartItems(parsed);
                } catch (e) {
                    setCartItems([]);
                }
            }
        }
    }, []);

    // Helper: Sync LocalStorage (Chỉ dùng cho khách vãng lai)
    const syncLocalStorage = (items) => {
        const user = getUser();
        if (!user) { // Chỉ lưu local nếu chưa đăng nhập
            localStorage.setItem('shoppingCart', JSON.stringify(items));
        }
    };

    const refreshCart = async () => {
        const user = getUser();
        
        // Nếu là Admin -> Dừng luôn
        if (user && !isCustomer(user)) {
            setCartItems([]);
            return;
        }

        const userId = user?.userId;

        if (userId) {
            try {
                const res = await fetch(`${BASE_URL}/api/Cart/get-cart/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCartItems(Array.isArray(data) ? data : []);
                } else {
                    setCartItems([]);
                }
            } catch (err) {
                setCartItems([]);
            }
        } else {
            // Khách vãng lai
            const storedCart = localStorage.getItem('shoppingCart');
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            } else {
                setCartItems([]);
            }
        }
    };

    // 2. Thêm vào giỏ
    const addToCart = async (product) => {
        const user = getUser();

        // CHẶN ADMIN MUA HÀNG (Nếu muốn)
        if (user && !isCustomer(user)) {
            alert("Tài khoản quản trị không thể mua hàng!");
            return;
        }

        const userId = user?.userId;

        if (userId) {
            // --- CÓ MẠNG (DB) ---
            try {
                const res = await fetch(`${BASE_URL}/api/Cart/add-to-cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: parseInt(userId), 
                        productId: product.productId, 
                        quantity: 1 
                    })
                });
                
                if (res.ok) {
                    refreshCart(); // Tải lại giỏ hàng
                    alert("Đã thêm vào giỏ!");
                } else {
                    alert("Lỗi khi thêm vào giỏ hàng");
                }
            } catch (error) {
                console.error("Lỗi thêm giỏ hàng DB", error);
                alert("Lỗi kết nối server!");
            }
        } else {
            // --- KHÁCH VÃNG LAI (Local) ---
            setCartItems(prev => {
                // Kiểm tra prev có phải mảng không trước khi find
                const safePrev = Array.isArray(prev) ? prev : [];
                const exist = safePrev.find(x => x.productId === product.productId);
                let newCart;
                
                if (exist) {
                    newCart = safePrev.map(x => x.productId === product.productId ? { ...x, quantity: x.quantity + 1 } : x);
                } else {
                    newCart = [...safePrev, { 
                        productId: product.productId, 
                        productName: product.productName, 
                        price: product.salePrice || product.originalPrice, 
                        imageUrl: product.tblProductImages?.[0]?.imageUrl || '', 
                        quantity: 1 
                    }];
                }
                syncLocalStorage(newCart);
                alert("Đã thêm vào giỏ (Local)!");
                return newCart;
            });
        }
    };

    // 3. Xóa sản phẩm
    const removeFromCart = async (productId) => {
        const user = getUser();
        const userId = user?.userId;

        if (userId) {
            await fetch(`${BASE_URL}/api/Cart/remove-item?userId=${userId}&productId=${productId}`, { method: 'DELETE' });
        }
        
        setCartItems(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const newCart = safePrev.filter(item => item.productId !== productId);
            syncLocalStorage(newCart);
            return newCart;
        });
    };

    // 4. Cập nhật số lượng
    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return;

        const user = getUser();
        const userId = user?.userId;

        if (userId) {
            await fetch(`${BASE_URL}/api/Cart/update-quantity`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId), productId, quantity: newQuantity })
            });
        }

        setCartItems(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            const newCart = safePrev.map(item => 
                item.productId === productId ? { ...item, quantity: newQuantity } : item
            );
            syncLocalStorage(newCart);
            return newCart;
        });
    };

    const validItems = Array.isArray(cartItems) ? cartItems : [];
    const cartCount = validItems.reduce((total, item) => total + (item.quantity || 0), 0);
    const cartTotal = validItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);

    return (
        <CartContext.Provider value={{ 
            cartItems, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            cartCount, 
            cartTotal,
            refreshCart
        }}>
            {children}
        </CartContext.Provider>
    );
};