import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Luôn khởi tạo là mảng rỗng [] để tránh lỗi .reduce
    const [cartItems, setCartItems] = useState([]);
    
    const BASE_URL = 'https://localhost:7298'; 

    // Hàm lấy userId an toàn
    const getUserId = () => {
        const id = localStorage.getItem('userId');
        // Kiểm tra kỹ: phải tồn tại, không phải null, không phải chuỗi "undefined"
        if (id && id !== 'null' && id !== 'undefined') {
            return id;
        }
        return null;
    };

    // 1. Load giỏ hàng
    useEffect(() => {
        const userId = getUserId();

        if (userId) {
            // NẾU CÓ USER ID -> Gọi API
            fetch(`${BASE_URL}/api/Cart/get-cart/${userId}`)
                .then(res => {
                    if (!res.ok) throw new Error("Lỗi API");
                    return res.json();
                })
                .then(data => {
                    // Kiểm tra nếu data là mảng thì mới set, không thì set rỗng
                    if (Array.isArray(data)) {
                        setCartItems(data);
                    } else {
                        setCartItems([]);
                    }
                })
                .catch(err => {
                    console.error("Lỗi load cart:", err);
                    setCartItems([]); // Nếu lỗi, set về mảng rỗng để không bị crash trang
                });
        } else {
            // NẾU KHÔNG CÓ USER ID -> Dùng LocalStorage
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

    // Helper: Sync LocalStorage (Chỉ dùng cho khách)
    const syncLocalStorage = (items) => {
        if (!getUserId()) {
            localStorage.setItem('shoppingCart', JSON.stringify(items));
        }
    };
    const refreshCart = async () => {
        const userId = getUserId(); // Kiểm tra lại userId sau khi đã login/logout

        if (userId) {
            // Nếu vừa đăng nhập -> Lấy giỏ từ DB
            try {
                const res = await fetch(`https://localhost:7298/api/Cart/get-cart/${userId}`);
                const data = await res.json();
                setCartItems(Array.isArray(data) ? data : []);
            } catch (err) {
                setCartItems([]);
            }
        } else {
            // Nếu vừa đăng xuất -> Lấy lại giỏ hàng của khách (từ LocalStorage) hoặc rỗng
            const storedCart = localStorage.getItem('shoppingCart');
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            } else {
                setCartItems([]); // Về 0
            }
        }
    };
    // 2. Thêm vào giỏ
    const addToCart = async (product) => {
        const userId = getUserId();

        if (userId) {
            // --- CÓ MẠNG (DB) ---
            try {
                await fetch(`${BASE_URL}/api/Cart/add-to-cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: parseInt(userId), 
                        productId: product.productId, 
                        quantity: 1 
                    })
                });
                
                // Gọi lại API lấy giỏ hàng mới nhất để đồng bộ
                const res = await fetch(`${BASE_URL}/api/Cart/get-cart/${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setCartItems(data);
                }
                alert("Đã thêm vào giỏ (DB)!");
            } catch (error) {
                console.error("Lỗi thêm giỏ hàng DB", error);
                alert("Lỗi kết nối server!");
            }
        } else {
            // --- KHÁCH VÃNG LAI (Local) ---
            setCartItems(prev => {
                const exist = prev.find(x => x.productId === product.productId);
                let newCart;
                if (exist) {
                    newCart = prev.map(x => x.productId === product.productId ? { ...x, quantity: x.quantity + 1 } : x);
                } else {
                    newCart = [...prev, { 
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
        const userId = getUserId();
        if (userId) {
            await fetch(`${BASE_URL}/api/Cart/remove-item?userId=${userId}&productId=${productId}`, { method: 'DELETE' });
        }
        
        setCartItems(prev => {
            const newCart = prev.filter(item => item.productId !== productId);
            syncLocalStorage(newCart);
            return newCart;
        });
    };

    // 4. Cập nhật số lượng
    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return;

        const userId = getUserId();
        if (userId) {
            await fetch(`${BASE_URL}/api/Cart/update-quantity`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId), productId, quantity: newQuantity })
            });
        }

        setCartItems(prev => {
            const newCart = prev.map(item => 
                item.productId === productId ? { ...item, quantity: newQuantity } : item
            );
            syncLocalStorage(newCart);
            return newCart;
        });
    };

    // TÍNH TOÁN AN TOÀN (Tránh lỗi .reduce)
    // Dùng toán tử ?. hoặc kiểm tra Array.isArray để chắc chắn không crash
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
            refreshCart // <--- Nhớ thêm cái này vào đây
        }}>
            {children}
        </CartContext.Provider>
    );
};