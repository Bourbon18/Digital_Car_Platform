import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/mua-xe", "/thue-xe", "/xe/"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/payment/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
