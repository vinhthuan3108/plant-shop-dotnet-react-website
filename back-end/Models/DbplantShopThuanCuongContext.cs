using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace back_end.Models;

public partial class DbplantShopThuanCuongContext : DbContext
{
    public DbplantShopThuanCuongContext()
    {
    }

    public DbplantShopThuanCuongContext(DbContextOptions<DbplantShopThuanCuongContext> options)
        : base(options)
    {
    }

    public virtual DbSet<TblBanner> TblBanners { get; set; }

    public virtual DbSet<TblCart> TblCarts { get; set; }

    public virtual DbSet<TblCartItem> TblCartItems { get; set; }

    public virtual DbSet<TblCategory> TblCategories { get; set; }

    public virtual DbSet<TblContact> TblContacts { get; set; }

    public virtual DbSet<TblImportReceipt> TblImportReceipts { get; set; }

    public virtual DbSet<TblImportReceiptDetail> TblImportReceiptDetails { get; set; }

    public virtual DbSet<TblInventoryAdjustment> TblInventoryAdjustments { get; set; }

    public virtual DbSet<TblOrder> TblOrders { get; set; }

    public virtual DbSet<TblOrderDetail> TblOrderDetails { get; set; }

    public virtual DbSet<TblPost> TblPosts { get; set; }

    public virtual DbSet<TblPostCategory> TblPostCategories { get; set; }

    public virtual DbSet<TblProduct> TblProducts { get; set; }

    public virtual DbSet<TblProductImage> TblProductImages { get; set; }
    public virtual DbSet<TblProductVariant> TblProductVariants { get; set; }

    public virtual DbSet<TblRole> TblRoles { get; set; }
    public virtual DbSet<TblShippingRule> TblShippingRules { get; set; }
    public virtual DbSet<TblSupplier> TblSuppliers { get; set; }
    public virtual DbSet<TblQandA> TblQandAs { get; set; }
    public virtual DbSet<TblSystemConfig> TblSystemConfigs { get; set; }

    public virtual DbSet<TblUser> TblUsers { get; set; }

    public virtual DbSet<TblUserAddress> TblUserAddresses { get; set; }

    public virtual DbSet<TblVoucher> TblVouchers { get; set; }
    public virtual DbSet<TblTestimonial> TblTestimonials { get; set; }
    public virtual DbSet<TblNew> TblNews { get; set; }

   protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
       => optionsBuilder.UseSqlServer("Server=DELL;Database=DBPlantShop;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TblBanner>(entity =>
        {
            entity.HasKey(e => e.BannerId).HasName("PK__TblBanne__32E86AD17BDAC2E3");

            entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Title).HasMaxLength(100);
        });

        modelBuilder.Entity<TblCart>(entity =>
        {
            entity.HasKey(e => e.CartId).HasName("PK__TblCarts__51BCD7B723F7B91F");

            entity.HasIndex(e => e.UserId, "UQ__TblCarts__1788CC4D34E016A5").IsUnique();

            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.User).WithOne(p => p.TblCart)
                .HasForeignKey<TblCart>(d => d.UserId)
                .HasConstraintName("FK__TblCarts__UserId__00200768");
        });

        modelBuilder.Entity<TblCartItem>(entity =>
        {
            entity.HasKey(e => e.CartItemId).HasName("PK__TblCartI__488B0B0ABD011A1A");
            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.Cart).WithMany(p => p.TblCartItems)
                .HasForeignKey(d => d.CartId)
                .HasConstraintName("FK__TblCartIt__CartI__03F0984C");

            // SỬA: Trỏ về Variant
            entity.HasOne(d => d.Variant).WithMany(p => p.TblCartItems)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TblCategory>(entity =>
        {
            entity.HasKey(e => e.CategoryId).HasName("PK__TblCateg__19093A0BE4C094A3");

            entity.HasIndex(e => e.CategoryName, "UQ__TblCateg__8517B2E0A1803A20").IsUnique();

            entity.Property(e => e.CategoryName).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
        });

        modelBuilder.Entity<TblContact>(entity =>
        {
            entity.HasKey(e => e.ContactId).HasName("PK__TblConta__5C66259B2D7C5082");

            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.SentAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("New");
            entity.Property(e => e.Subject).HasMaxLength(200);
        });

        modelBuilder.Entity<TblImportReceipt>(entity =>
        {
            entity.HasKey(e => e.ReceiptId).HasName("PK__TblImpor__CC08C420B9BC9759");

            entity.Property(e => e.ImportDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.TotalAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Creator).WithMany(p => p.TblImportReceipts)
                .HasForeignKey(d => d.CreatorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TblImport__Creat__5DCAEF64");

            entity.HasOne(d => d.Supplier).WithMany(p => p.TblImportReceipts)
                .HasForeignKey(d => d.SupplierId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TblImport__Suppl__5CD6CB2B");
        });
        modelBuilder.Entity<TblShippingRule>(entity =>
        {
            entity.HasKey(e => e.RuleId);
            entity.ToTable("TblShippingRules");
        });
        modelBuilder.Entity<TblImportReceiptDetail>(entity =>
        {
            entity.HasKey(e => e.DetailId).HasName("PK__TblImpor__135C316DF56D9E1E");
            entity.Property(e => e.ImportPrice).HasColumnType("decimal(18, 2)");

            // SỬA: Trỏ về Variant
            entity.HasOne(d => d.Variant).WithMany(p => p.TblImportReceiptDetails)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.Receipt).WithMany(p => p.TblImportReceiptDetails)
                .HasForeignKey(d => d.ReceiptId)
                .HasConstraintName("FK__TblImport__Recei__628FA481");
        });

        modelBuilder.Entity<TblInventoryAdjustment>(entity =>
        {
            entity.HasKey(e => e.AdjustmentId).HasName("PK__TblInven__E60DB893C96B386D");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnType("datetime");
            entity.Property(e => e.Reason).HasMaxLength(200);

            // SỬA: Trỏ về Variant
            entity.HasOne(d => d.Variant).WithMany(p => p.TblInventoryAdjustments)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.User).WithMany(p => p.TblInventoryAdjustments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TblInvent__UserI__68487DD7");
        });

        modelBuilder.Entity<TblOrder>(entity =>
        {
            entity.HasKey(e => e.OrderId).HasName("PK__TblOrder__C3905BCFB4A403FF");

            entity.Property(e => e.DiscountAmount)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OrderDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.OrderStatus)
                .HasMaxLength(50)
                .HasDefaultValue("Pending");
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(50)
                .HasDefaultValue("Unpaid");
            entity.Property(e => e.RecipientName).HasMaxLength(100);
            entity.Property(e => e.RecipientPhone).HasMaxLength(20);
            entity.Property(e => e.ShippingAddress).HasMaxLength(500);
            entity.Property(e => e.ShippingFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SubTotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.User).WithMany(p => p.TblOrders)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__TblOrders__UserI__75A278F5");

            entity.HasOne(d => d.Voucher).WithMany(p => p.TblOrders)
                .HasForeignKey(d => d.VoucherId)
                .HasConstraintName("FK__TblOrders__Vouch__76969D2E");
        });

        modelBuilder.Entity<TblOrderDetail>(entity =>
        {
            entity.HasKey(e => e.OrderDetailId).HasName("PK__TblOrder__D3B9D36C42DD7464");

            entity.Property(e => e.CostPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.PriceAtTime).HasColumnType("decimal(18, 2)");

            // Thêm mapping cột tên lưu trữ
            entity.Property(e => e.ProductName).HasMaxLength(200);
            entity.Property(e => e.VariantName).HasMaxLength(200);

            entity.HasOne(d => d.Order).WithMany(p => p.TblOrderDetails)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK__TblOrderD__Order__7A672E12");

            // SỬA: Trỏ về Variant
            entity.HasOne(d => d.Variant).WithMany(p => p.TblOrderDetails)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<TblPost>(entity =>
        {
            entity.HasKey(e => e.PostId).HasName("PK__TblPosts__AA126018FC952EB8");

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);
            entity.Property(e => e.PublishedAt).HasColumnType("datetime");
            entity.Property(e => e.ShortDescription).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("Draft");
            entity.Property(e => e.Tags).HasMaxLength(200);
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.Author).WithMany(p => p.TblPosts)
                .HasForeignKey(d => d.AuthorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TblPosts__Author__0D7A0286");

            entity.HasOne(d => d.PostCategory).WithMany(p => p.TblPosts)
                .HasForeignKey(d => d.PostCategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TblPosts__PostCa__0C85DE4D");
        });

        modelBuilder.Entity<TblPostCategory>(entity =>
        {
            entity.HasKey(e => e.PostCategoryId).HasName("PK__TblPostC__FE61E30937387763");

            entity.Property(e => e.CategoryName).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(255);
        });

        modelBuilder.Entity<TblProduct>(entity =>
        {
            entity.HasKey(e => e.ProductId).HasName("PK__TblProdu__B40CC6CD4267F477");
            entity.HasIndex(e => e.ProductCode, "UQ__TblProdu__2F4E024FE41FB400").IsUnique();

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())").HasColumnType("datetime");
            entity.Property(e => e.DeletedAt).HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);

            // Đã xóa mapping của Price, Stock, Size...
            entity.Property(e => e.ProductCode).HasMaxLength(50);
            entity.Property(e => e.ProductName).HasMaxLength(200);
            entity.Property(e => e.ShortDescription).HasMaxLength(500);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(getdate())").HasColumnType("datetime");

            entity.HasOne(d => d.Category).WithMany(p => p.TblProducts)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TblProduc__Categ__5165187F");
        });

        modelBuilder.Entity<TblProductImage>(entity =>
        {
            entity.HasKey(e => e.ImageId).HasName("PK__TblProdu__7516F70CEA398759");

            entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            entity.Property(e => e.IsThumbnail).HasDefaultValue(false);

            entity.HasOne(d => d.Product).WithMany(p => p.TblProductImages)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("FK__TblProduc__Produ__5629CD9C");
        });

        modelBuilder.Entity<TblProductVariant>(entity =>
        {
            entity.HasKey(e => e.VariantId);

            entity.Property(e => e.VariantName).HasMaxLength(200);
            entity.Property(e => e.OriginalPrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.SalePrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.StockQuantity).HasDefaultValue(0);

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);

            // Khóa ngoại trỏ về Product
            entity.HasOne(d => d.Product).WithMany(p => p.TblProductVariants)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.Cascade); // Xóa Product thì xóa luôn Variant

            // Khóa ngoại trỏ về Image (Ảnh đại diện cho variant)
            entity.HasOne(d => d.Image).WithMany(p => p.TblProductVariants)
                .HasForeignKey(d => d.ImageId);
        });

        modelBuilder.Entity<TblRole>(entity =>
        {
            entity.HasKey(e => e.RoleId).HasName("PK__TblRoles__8AFACE1A30223372");

            entity.HasIndex(e => e.RoleName, "UQ__TblRoles__8A2B61606CD34928").IsUnique();

            entity.Property(e => e.Description).HasMaxLength(255);
            entity.Property(e => e.RoleName).HasMaxLength(50);
        });

        modelBuilder.Entity<TblSupplier>(entity =>
        {
            entity.HasKey(e => e.SupplierId).HasName("PK__TblSuppl__4BE666B4E4A46B46");

            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.SupplierName).HasMaxLength(200);
        });

        modelBuilder.Entity<TblSystemConfig>(entity =>
        {
            entity.HasKey(e => e.ConfigKey).HasName("PK__TblSyste__4A306785FA00D7CB");

            entity.Property(e => e.ConfigKey).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(255);
        });

        modelBuilder.Entity<TblUser>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__TblUsers__1788CC4C4726DC99");

            entity.HasIndex(e => e.Email, "UQ__TblUsers__A9D10534D4A39AA5").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.DateofBirth).HasColumnType("datetime");
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.Gender).HasMaxLength(10);
            entity.Property(e => e.IsActive).HasDefaultValue(false);
            entity.Property(e => e.LastLogin).HasColumnType("datetime");
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.Role).WithMany(p => p.TblUsers)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__TblUsers__RoleId__3E52440B");
        });

        modelBuilder.Entity<TblUserAddress>(entity =>
        {
            entity.HasKey(e => e.AddressId).HasName("PK__TblUserA__091C2AFBB06DBDBD");

            entity.Property(e => e.AddressDetail).HasMaxLength(255);
            entity.Property(e => e.District).HasMaxLength(100);
            entity.Property(e => e.IsDefault).HasDefaultValue(false);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Province).HasMaxLength(100);
            entity.Property(e => e.RecipientName).HasMaxLength(100);
            entity.Property(e => e.Ward).HasMaxLength(100);

            entity.HasOne(d => d.User).WithMany(p => p.TblUserAddresses)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__TblUserAd__UserI__4222D4EF");
        });

        modelBuilder.Entity<TblVoucher>(entity =>
        {
            entity.HasKey(e => e.VoucherId).HasName("PK__TblVouch__3AEE792101D35EEA");

            entity.HasIndex(e => e.Code, "UQ__TblVouch__A25C5AA73FE97250").IsUnique();

            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.DiscountType).HasMaxLength(20);
            entity.Property(e => e.DiscountValue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MaxDiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MinOrderValue)
                .HasDefaultValue(0m)
                .HasColumnType("decimal(18, 2)");
            entity.Property(e => e.StartDate).HasColumnType("datetime");
            entity.Property(e => e.UsageCount).HasDefaultValue(0);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
