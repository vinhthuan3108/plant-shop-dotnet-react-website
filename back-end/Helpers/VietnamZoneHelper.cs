using System.Collections.Generic;
using System.Linq;

namespace back_end.Helpers
{
    public static class VietnamZoneHelper
    {
        // 1 = Miền Bắc, 2 = Miền Trung, 3 = Miền Nam
        public enum Region
        {
            North = 1,
            Central = 2,
            South = 3,
            Unknown = 0
        }

        // Danh sách Map cứng mã tỉnh sang Miền
        // (Đây là danh sách tương đối chuẩn, bạn có thể điều chỉnh nếu muốn)
        private static readonly Dictionary<string, Region> ProvinceRegionMap = new Dictionary<string, Region>
        {
            // --- MIỀN BẮC (Mã thường từ 01 -> 37 + một số tỉnh miền núi) ---
            { "01", Region.North }, // Hà Nội
            { "02", Region.North }, // Hà Giang
            { "04", Region.North }, // Cao Bằng
            { "06", Region.North }, // Bắc Kạn
            { "08", Region.North }, // Tuyên Quang
            { "10", Region.North }, // Lào Cai
            { "11", Region.North }, // Điện Biên
            { "12", Region.North }, // Lai Châu
            { "14", Region.North }, // Sơn La
            { "15", Region.North }, // Yên Bái
            { "17", Region.North }, // Hòa Bình
            { "19", Region.North }, // Thái Nguyên
            { "20", Region.North }, // Lạng Sơn
            { "22", Region.North }, // Quảng Ninh
            { "24", Region.North }, // Bắc Giang
            { "25", Region.North }, // Phú Thọ
            { "26", Region.North }, // Vĩnh Phúc
            { "27", Region.North }, // Bắc Ninh
            { "30", Region.North }, // Hải Dương
            { "31", Region.North }, // Hải Phòng
            { "33", Region.North }, // Hưng Yên
            { "34", Region.North }, // Thái Bình
            { "35", Region.North }, // Hà Nam
            { "36", Region.North }, // Nam Định
            { "37", Region.North }, // Ninh Bình

            // --- MIỀN TRUNG (Từ Thanh Hóa -> Bình Thuận + Tây Nguyên) ---
            { "38", Region.Central }, // Thanh Hóa
            { "40", Region.Central }, // Nghệ An
            { "42", Region.Central }, // Hà Tĩnh
            { "44", Region.Central }, // Quảng Bình
            { "45", Region.Central }, // Quảng Trị
            { "46", Region.Central }, // Thừa Thiên Huế
            { "48", Region.Central }, // Đà Nẵng
            { "49", Region.Central }, // Quảng Nam
            { "51", Region.Central }, // Quảng Ngãi
            { "52", Region.Central }, // Bình Định
            { "54", Region.Central }, // Phú Yên
            { "56", Region.Central }, // Khánh Hòa
            { "58", Region.Central }, // Ninh Thuận
            { "60", Region.Central }, // Bình Thuận
            { "62", Region.Central }, // Kon Tum
            { "64", Region.Central }, // Gia Lai
            { "66", Region.Central }, // Đắk Lắk
            { "67", Region.Central }, // Đắk Nông
            { "68", Region.Central }, // Lâm Đồng

            // --- MIỀN NAM (Đông Nam Bộ + Tây Nam Bộ) ---
            { "70", Region.South }, // Bình Phước
            { "72", Region.South }, // Tây Ninh
            { "74", Region.South }, // Bình Dương
            { "75", Region.South }, // Đồng Nai
            { "77", Region.South }, // Bà Rịa - Vũng Tàu
            { "79", Region.South }, // Hồ Chí Minh
            { "80", Region.South }, // Long An
            { "82", Region.South }, // Tiền Giang
            { "83", Region.South }, // Bến Tre
            { "84", Region.South }, // Trà Vinh
            { "86", Region.South }, // Vĩnh Long
            { "87", Region.South }, // Đồng Tháp
            { "89", Region.South }, // An Giang
            { "91", Region.South }, // Kiên Giang
            { "92", Region.South }, // Cần Thơ
            { "93", Region.South }, // Hậu Giang
            { "94", Region.South }, // Sóc Trăng
            { "95", Region.South }, // Bạc Liêu
            { "96", Region.South }, // Cà Mau
        };

        public static Region GetRegion(string provinceCode)
        {
            if (string.IsNullOrEmpty(provinceCode)) return Region.Unknown;
            return ProvinceRegionMap.ContainsKey(provinceCode) ? ProvinceRegionMap[provinceCode] : Region.Unknown;
        }

        public static string DetermineZoneType(string storeProvCode, string custProvCode)
        {
            if (string.IsNullOrEmpty(storeProvCode) || string.IsNullOrEmpty(custProvCode)) return "INTER_REGION"; // Mặc định tính đắt nhất nếu lỗi

            // 1. Nội Tỉnh
            if (storeProvCode == custProvCode) return "INNER_PROVINCE";

            // 2. Kiểm tra vùng
            Region storeRegion = GetRegion(storeProvCode);
            Region custRegion = GetRegion(custProvCode);

            // 3. Nội Miền (Khác tỉnh nhưng cùng miền)
            if (storeRegion == custRegion && storeRegion != Region.Unknown) return "INNER_REGION";

            // 4. Liên Miền (Khác miền)
            return "INTER_REGION";
        }
    }
}