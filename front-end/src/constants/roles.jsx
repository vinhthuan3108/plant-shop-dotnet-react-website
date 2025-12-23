// src/constants/roles.js

// 1. ĐỊNH NGHĨA ROLE ID (Khớp với Database của bạn)
export const ROLES = {
  ADMIN: 1,
  CUSTOMER: 2,
  SALES: 3,     // Nhân viên bán hàng
  WAREHOUSE: 4, // Nhân viên kho
};

// 2. CẤU HÌNH MENU SIDEBAR
export const MENU_ITEMS = [
  {
    id: 'products',
    title: "🌿 Quản lý sản phẩm",
    path: "/admin/products",
    // Cả Admin, Bán hàng, Kho đều cần xem sản phẩm để làm việc
    permissions: [ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE],
  },
  {
    id: 'stats',
    title: "📊 Báo cáo & Thống kê",
    // Kho không cần xem doanh thu
    permissions: [ROLES.ADMIN, ROLES.SALES],
    children: [
      { title: "💰 Doanh thu", path: "/admin/statistics", permissions: [ROLES.ADMIN, ROLES.SALES] },
      { title: "📦 Sản phẩm bán chạy", path: "/admin/statistics/products", permissions: [ROLES.ADMIN, ROLES.SALES] },
    ]
  },
  {
    id: 'orders',
    title: "🧾 Quản lý đơn hàng",
    path: "/admin/orders",
    permissions: [ROLES.ADMIN, ROLES.SALES], // Kho chỉ xuất hàng, ko xử lý đơn
  },
  {
    id: 'vouchers',
    title: "🎟️ Quản lý mã giảm giá",
    path: "/admin/vouchers",
    permissions: [ROLES.ADMIN, ROLES.SALES],
  },
  {
    id: 'contacts',
    title: "📩 Quản lý liên hệ",
    path: "/admin/contacts",
    permissions: [ROLES.ADMIN, ROLES.SALES],
  },
  {
    id: 'posts',
    title: "📰 Quản lý bài đăng",
    path: "/admin/posts",
    permissions: [ROLES.ADMIN, ROLES.SALES],
  },
  {
    id: 'inventory',
    title: "🏭 Quản lý Kho",
    permissions: [ROLES.ADMIN, ROLES.WAREHOUSE], // Bán hàng không được vào
    children: [
      { title: "📥 Tạo Phiếu nhập", path: "/admin/imports", permissions: [ROLES.ADMIN, ROLES.WAREHOUSE] },
      { title: "📜 Lịch sử nhập kho", path: "/admin/import-history", permissions: [ROLES.ADMIN, ROLES.WAREHOUSE] },
      { title: "⚖️ Điều chỉnh tồn kho", path: "/admin/inventory-adjustment", permissions: [ROLES.ADMIN, ROLES.WAREHOUSE] },
      { title: "🤝 Quản lý nhà cung cấp", path: "/admin/suppliers", permissions: [ROLES.ADMIN, ROLES.WAREHOUSE] },
    ]
  },
  {
    id: 'banners',
    title: "🖼️ Quản lý Banner",
    path: "/admin/banners",
    permissions: [ROLES.ADMIN, ROLES.SALES],
  },
   {
    id: 'testimonial',
    title: "🖼️ Quản lý đánh giá giả",
    path: "/admin/testimonial",
    permissions: [ROLES.ADMIN, ROLES.SALES],
  },
  {
    id: 'config',
    title: "⚙️ Quản lý cấu hình",
    path: "/admin/system-config",
    permissions: [ROLES.ADMIN], // Chỉ Admin
  },
  {
    id: 'users',
    title: "👥 Quản lý Tài khoản",
    path: "/admin/users",
    permissions: [ROLES.ADMIN], // Chỉ Admin
  },
  {
    id: 'backup',
    title: "💾 Backup Dữ liệu",
    path: "/admin/backup",
    permissions: [ROLES.ADMIN], // Chỉ Admin
  },
];