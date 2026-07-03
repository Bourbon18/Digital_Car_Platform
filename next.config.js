/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Ảnh chứng từ (<1MB) gửi dạng base64 → ~1.3MB. Nới giới hạn body để không
      // vượt mặc định 1MB. Client đã chặn ảnh ≥ 1MB nên đây chỉ là biên an toàn.
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
