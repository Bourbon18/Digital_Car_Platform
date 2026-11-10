// Seed data riêng cho DB test E2E (Docker local + CI) — KHÔNG phải prisma/seed.ts (file đó
// bị .gitignore loại trừ có chủ đích vì từng chứa mật khẩu demo của DB production thật).
// File này an toàn để commit: chỉ chạy nhắm vào DB test tạm thời, cô lập hoàn toàn, không ai
// truy cập được từ bên ngoài — mật khẩu demo ở đây không có rủi ro bảo mật nào.
import { PrismaClient, UserRole, UserStatus, ListingStatus, ListingType, VehicleCondition, DealerVerificationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const brands = [
  { name: "Toyota", slug: "toyota", models: ["Camry", "Fortuner", "Vios", "Corolla Cross", "Innova", "Hilux", "Land Cruiser", "Rush", "Yaris", "Wigo"] },
  { name: "Honda", slug: "honda", models: ["CR-V", "HR-V", "City", "Civic", "Accord", "Pilot", "Jazz", "BR-V", "WR-V", "Odyssey"] },
  { name: "Hyundai", slug: "hyundai", models: ["Tucson", "Santa Fe", "Accent", "Elantra", "Creta", "Ioniq 5", "Stargazer", "Palisade", "Kona", "Sonata"] },
  { name: "Kia", slug: "kia", models: ["Seltos", "Sorento", "Morning", "K3", "Carnival", "Sportage", "Sonet", "EV6", "Stinger", "Cerato"] },
  { name: "Ford", slug: "ford", models: ["Ranger", "Everest", "Territory", "Explorer", "Transit", "EcoSport", "Escape", "Mustang Mach-E", "F-150", "Bronco"] },
  { name: "VinFast", slug: "vinfast", models: ["VF3", "VF5", "VF6", "VF7", "VF8", "VF9", "VF e34", "VF Fadil", "Lux A2.0", "Lux SA2.0"] },
  { name: "Mazda", slug: "mazda", models: ["CX-5", "CX-3", "Mazda3", "Mazda6", "CX-8", "CX-30", "CX-50", "MX-5", "BT-50", "CX-60"] },
  { name: "Mitsubishi", slug: "mitsubishi", models: ["Outlander", "Xpander", "Xforce", "Triton", "Pajero Sport", "Eclipse Cross", "Attrage", "Mirage", "Galant", "Montero"] },
  { name: "Suzuki", slug: "suzuki", models: ["XL7", "Swift", "Ertiga", "Vitara", "Jimny", "Baleno", "Ciaz", "Super Carry Pro", "Carry", "Alto"] },
  { name: "Chevrolet", slug: "chevrolet", models: ["Colorado", "Trailblazer", "Trax", "Spark", "Captiva", "Cruze", "Aveo", "Malibu", "Blazer", "Equinox"] },
  { name: "Nissan", slug: "nissan", models: ["X-Trail", "Terra", "Navara", "Kicks", "Almera", "Sunny", "Frontier", "Patrol", "Teana", "Juke"] },
  { name: "Mercedes-Benz", slug: "mercedes-benz", models: ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "GLS", "A-Class", "CLA", "GLB", "EQS"] },
  { name: "BMW", slug: "bmw", models: ["3 Series", "5 Series", "7 Series", "X3", "X5", "X7", "i4", "iX", "M3", "M5"] },
  { name: "Audi", slug: "audi", models: ["A4", "A6", "Q5", "Q7", "Q8", "A3", "Q3", "e-tron", "RS6", "TT"] },
  { name: "Lexus", slug: "lexus", models: ["LX", "RX", "NX", "ES", "GX", "IS", "UX", "LC", "LS", "RZ"] },
  { name: "Volvo", slug: "volvo", models: ["XC90", "XC60", "XC40", "S90", "V60", "S60", "C40 Recharge", "EX90", "V90", "S40"] },
  { name: "Subaru", slug: "subaru", models: ["Forester", "Outback", "XV", "Levorg", "WRX", "BRZ", "Solterra", "Impreza", "Legacy", "Ascent"] },
  { name: "Peugeot", slug: "peugeot", models: ["3008", "5008", "2008", "508", "408", "308", "e-208", "Partner", "Expert", "Boxer"] },
  { name: "MG", slug: "mg", models: ["HS", "ZS EV", "RX8", "5", "ZS", "VS", "Marvel R", "EP", "Extender", "T60"] },
  { name: "Chery", slug: "chery", models: ["Omoda 5", "Omoda C5", "Tiggo 7 Pro", "Tiggo 8 Pro", "Arrizo 6 Pro", "QQ Ice Cream", "Tiggo 4 Pro"] },
];

async function main() {
  console.log("🌱 Seeding E2E test database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@fast.vn" },
    update: {},
    create: {
      email: "admin@fast.vn",
      passwordHash: adminPassword,
      name: "Admin",
      role: UserRole.admin,
      status: UserStatus.active,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Seed brands and models
  for (const brand of brands) {
    const createdBrand = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: { active: true },
      create: {
        name: brand.name,
        slug: brand.slug,
        active: true,
      },
    });

    for (const modelName of brand.models) {
      const modelSlug = modelName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      await prisma.carModel.upsert({
        where: { brandId_slug: { brandId: createdBrand.id, slug: modelSlug } },
        update: { active: true },
        create: {
          brandId: createdBrand.id,
          name: modelName,
          slug: modelSlug,
          active: true,
        },
      });
    }
    console.log(`✅ Brand: ${brand.name} (${brand.models.length} models)`);
  }

  // Create a demo dealer user
  const dealerPassword = await bcrypt.hash("Dealer@123456", 12);
  const dealer = await prisma.user.upsert({
    where: { email: "dealer@fast.vn" },
    update: {},
    create: {
      email: "dealer@fast.vn",
      passwordHash: dealerPassword,
      name: "Đại Lý Ô Tô Sài Gòn",
      phone: "0281234567",
      role: UserRole.dealer,
      status: UserStatus.active,
      emailVerified: new Date(),
    },
  });
  await prisma.dealerProfile.upsert({
    where: { userId: dealer.id },
    update: {},
    create: {
      userId: dealer.id,
      businessName: "Đại Lý Ô Tô Sài Gòn",
      showroomAddress: "123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
      verificationStatus: DealerVerificationStatus.verified,
      verifiedAt: new Date(),
    },
  });
  console.log(`✅ Demo dealer: ${dealer.email}`);

  // Create a demo buyer user
  const buyerPassword = await bcrypt.hash("Buyer@123456", 12);
  const _buyer = await prisma.user.upsert({
    where: { email: "buyer@fast.vn" },
    update: {},
    create: {
      email: "buyer@fast.vn",
      passwordHash: buyerPassword,
      name: "Trần Thị Lan",
      phone: "0912345678",
      role: UserRole.buyer,
      status: UserStatus.active,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Demo buyer: ${_buyer.email}`);

  // Create a demo seller user
  const sellerPassword = await bcrypt.hash("Seller@123456", 12);
  const seller = await prisma.user.upsert({
    where: { email: "seller@fast.vn" },
    update: {},
    create: {
      email: "seller@fast.vn",
      passwordHash: sellerPassword,
      name: "Nguyễn Văn Minh",
      phone: "0901234567",
      role: UserRole.individual_seller,
      status: UserStatus.active,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Demo seller: ${seller.email}`);

  // Seed dealer listings
  const dealerListings = [
    { brand: "Toyota", model: "Camry", year: 2024, price: 1269000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Toyota Camry 2.5Q 2024 - Mới 100% giao ngay" },
    { brand: "Toyota", model: "Fortuner", year: 2024, price: 1399000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Toyota Fortuner Legender 2.8 4x4 2024 - Còn hàng" },
    { brand: "Toyota", model: "Corolla Cross", year: 2024, price: 820000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Toyota Corolla Cross HV 2024 - Hybrid tiết kiệm" },
    { brand: "Toyota", model: "Rush", year: 2024, price: 668000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Toyota Rush 1.5S AT 2024 - Xe gia đình 7 chỗ" },
    { brand: "Toyota", model: "Vios", year: 2024, price: 479000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Toyota Vios 1.5E CVT 2024 - Tiết kiệm, bền bỉ" },
    { brand: "Honda", model: "CR-V", year: 2024, price: 1119000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Honda CR-V e:HEV RS 2024 - Hybrid cao cấp" },
    { brand: "Honda", model: "HR-V", year: 2024, price: 699000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Honda HR-V L 2024 - SUV đô thị phong cách" },
    { brand: "Honda", model: "City", year: 2024, price: 529000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Honda City RS 2024 - Sedan hạng B bán chạy nhất" },
    { brand: "Hyundai", model: "Santa Fe", year: 2024, price: 1190000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Hyundai Santa Fe Calligraphy 2024 - Hoàn toàn mới" },
    { brand: "Hyundai", model: "Tucson", year: 2024, price: 839000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Hyundai Tucson 2.0 Đặc Biệt 2024 - Full option" },
    { brand: "Kia", model: "Carnival", year: 2024, price: 1199000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Kia Carnival 2.2D Premium 2024 - MPV sang trọng 8 chỗ" },
    { brand: "Kia", model: "Sorento", year: 2024, price: 1099000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Kia Sorento 2.2D Signature AWD 2024 - SUV 7 chỗ" },
  ];

  for (const item of dealerListings) {
    const brandRecord = await prisma.brand.findUnique({ where: { slug: item.brand.toLowerCase().replace(/\s+/g, "-") } });
    if (!brandRecord) continue;
    const modelSlug = item.model.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const modelRecord = await prisma.carModel.findUnique({
      where: { brandId_slug: { brandId: brandRecord.id, slug: modelSlug } },
    });
    if (!modelRecord) continue;
    const baseSlug = `dl-${item.brand}-${item.model}-${item.year}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
    await prisma.listing.upsert({
      where: { slug: uniqueSlug },
      update: {},
      create: {
        userId: dealer.id,
        brandId: brandRecord.id,
        modelId: modelRecord.id,
        title: item.title,
        slug: uniqueSlug,
        year: item.year,
        mileage: 0,
        color: ["Trắng", "Đen", "Bạc", "Đỏ"][Math.floor(Math.random() * 4)],
        condition: VehicleCondition.new,
        listingType: ListingType.for_sale,
        price: item.price,
        description: `${item.title}. Xe chính hãng nhập khẩu/lắp ráp, bảo hành 3 năm hoặc 100.000km. Hỗ trợ vay ngân hàng lên đến 80%, thủ tục nhanh gọn. Liên hệ showroom để lái thử và nhận báo giá tốt nhất.`,
        status: ListingStatus.active,
        city: item.city,
        address: "123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
      },
    });
  }
  console.log(`✅ Dealer listings: ${dealerListings.length} tin đăng`);

  // Seed demo listings
  const demoListings = [
    { brand: "Toyota", model: "Camry", year: 2022, price: 1050000000, type: "for_sale", condition: "used", city: "Hồ Chí Minh", title: "Toyota Camry 2.5Q 2022 - Xe đẹp như mới" },
    { brand: "Toyota", model: "Fortuner", year: 2021, price: 1150000000, type: "for_sale", condition: "used", city: "Hà Nội", title: "Toyota Fortuner 2.8 Legender 4x4 2021" },
    { brand: "Toyota", model: "Innova", year: 2020, price: 680000000, type: "for_sale", condition: "used", city: "Đà Nẵng", title: "Toyota Innova 2.0E 2020 gia đình sử dụng" },
    { brand: "Honda", model: "CR-V", year: 2023, price: 1190000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "Honda CR-V L 2023 - Mới 100% chưa lăn bánh" },
    { brand: "Honda", model: "City", year: 2022, price: 550000000, type: "for_sale", condition: "used", city: "Bình Dương", title: "Honda City RS 2022 - Full option giá tốt" },
    { brand: "VinFast", model: "VF8", year: 2023, price: 1090000000, type: "for_sale", condition: "new", city: "Hà Nội", title: "VinFast VF8 Plus 2023 - Xe điện thuần túy" },
    { brand: "VinFast", model: "VF5", year: 2023, price: 458000000, type: "for_sale", condition: "new", city: "Hồ Chí Minh", title: "VinFast VF5 Plus 2023 - Xe đô thị tiết kiệm" },
    { brand: "Mazda", model: "CX-5", year: 2022, price: 869000000, type: "for_sale", condition: "used", city: "Hà Nội", title: "Mazda CX-5 2.5 Signature Premium 2022" },
    { brand: "Hyundai", model: "Tucson", year: 2022, price: 799000000, type: "for_sale", condition: "used", city: "Đà Nẵng", title: "Hyundai Tucson 2.0 Đặc biệt 2022 đẹp xuất sắc" },
    { brand: "Kia", model: "Seltos", year: 2022, price: 699000000, type: "for_sale", condition: "used", city: "Cần Thơ", title: "Kia Seltos 1.4 Premium 2022 xe gia đình" },
    { brand: "Ford", model: "Ranger", year: 2021, price: 720000000, type: "for_sale", condition: "used", city: "Hồ Chí Minh", title: "Ford Ranger Wildtrak 2.0 Bi-Turbo 4x4 2021" },
    { brand: "Mercedes-Benz", model: "C-Class", year: 2022, price: 1850000000, type: "for_sale", condition: "used", city: "Hà Nội", title: "Mercedes-Benz C200 Avantgarde 2022 lướt 10.000km" },
    // Rental listings
    { brand: "Toyota", model: "Camry", year: 2023, price: 0, pricePerDay: 1800000, type: "for_rent", condition: "new", city: "Hồ Chí Minh", title: "Toyota Camry 2023 cho thuê tự lái TP.HCM" },
    { brand: "Honda", model: "CR-V", year: 2022, price: 0, pricePerDay: 1500000, type: "for_rent", condition: "used", city: "Hà Nội", title: "Honda CR-V 2022 cho thuê ngày/tuần/tháng HN" },
    { brand: "VinFast", model: "VF8", year: 2023, price: 0, pricePerDay: 2000000, type: "for_rent", condition: "new", city: "Hà Nội", title: "VinFast VF8 2023 thuê xe điện trải nghiệm" },
  ];

  for (const item of demoListings) {
    const brandRecord = await prisma.brand.findUnique({ where: { slug: item.brand.toLowerCase().replace(/\s+/g, "-") } });
    if (!brandRecord) continue;

    const modelSlug = item.model.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const modelRecord = await prisma.carModel.findUnique({
      where: { brandId_slug: { brandId: brandRecord.id, slug: modelSlug } },
    });
    if (!modelRecord) continue;

    const baseSlug = `${item.brand}-${item.model}-${item.year}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

    await prisma.listing.upsert({
      where: { slug: uniqueSlug },
      update: {},
      create: {
        userId: seller.id,
        brandId: brandRecord.id,
        modelId: modelRecord.id,
        title: item.title,
        slug: uniqueSlug,
        year: item.year,
        mileage: item.condition === "new" ? 0 : Math.floor(Math.random() * 80000) + 5000,
        color: ["Trắng", "Đen", "Bạc", "Xám", "Đỏ", "Xanh"][Math.floor(Math.random() * 6)],
        condition: item.condition === "new" ? VehicleCondition.new : VehicleCondition.used,
        listingType: item.type === "for_sale" ? ListingType.for_sale : ListingType.for_rent,
        price: item.price,
        pricePerDay: item.pricePerDay ?? null,
        description: `${item.title}. Xe được bảo dưỡng định kỳ, đầy đủ hồ sơ giấy tờ gốc. Liên hệ để được tư vấn và xem xe trực tiếp.`,
        status: ListingStatus.active,
        city: item.city,
      },
    });
  }
  console.log(`✅ Demo listings: ${demoListings.length} tin đăng`);

  console.log("✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
