export const VN_CITIES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng",
  "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh",
  "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên",
  "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng",
  "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An",
  "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình",
  "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng",
  "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa",
  "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh", "Tuyên Quang",
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

// Tên tiếng Anh cho một số tỉnh/thành có dạng riêng; còn lại bỏ dấu tự động.
const CITY_EN_OVERRIDE: Record<string, string> = {
  "TP. Hồ Chí Minh": "Ho Chi Minh City",
  "Hà Nội": "Hanoi",
  "Thừa Thiên Huế": "Hue",
  "Bà Rịa - Vũng Tàu": "Ba Ria - Vung Tau",
};

function stripVietnamese(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** Nhãn thành phố theo ngôn ngữ. VI giữ nguyên; EN bỏ dấu (hoặc dùng override). */
export function cityLabel(city: string, locale: string): string {
  if (locale !== "en") return city;
  return CITY_EN_OVERRIDE[city] ?? stripVietnamese(city);
}
