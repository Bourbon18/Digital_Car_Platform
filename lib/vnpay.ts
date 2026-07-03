import crypto from "crypto";

export interface VNPayParams {
  vnp_Version: string;
  vnp_Command: string;
  vnp_TmnCode: string;
  vnp_Amount: string;
  vnp_CurrCode: string;
  vnp_TxnRef: string;
  vnp_OrderInfo: string;
  vnp_OrderType: string;
  vnp_Locale: string;
  vnp_ReturnUrl: string;
  vnp_IpAddr: string;
  vnp_CreateDate: string;
  vnp_ExpireDate?: string;
  [key: string]: string | undefined;
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

export function createVNPayUrl(
  bookingId: string,
  amount: number,
  orderInfo: string,
  ipAddr: string,
  returnUrl: string
): string {
  const tmnCode = process.env.VNPAY_TMN_CODE!;
  const secretKey = process.env.VNPAY_HASH_SECRET!;
  const vnpUrl = process.env.VNPAY_URL!;

  const now = new Date();
  const createDate = formatDate(now);
  const expireDate = formatDate(new Date(now.getTime() + 15 * 60 * 1000));

  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(Math.round(amount * 100)),
    vnp_CurrCode: "VND",
    vnp_TxnRef: bookingId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const sortedParams = sortObject(params);
  const queryString = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac("sha512", secretKey).update(queryString).digest("hex");

  return `${vnpUrl}?${queryString}&vnp_SecureHash=${hmac}`;
}

export function verifyVNPayCallback(query: Record<string, string>): boolean {
  const secretKey = process.env.VNPAY_HASH_SECRET!;
  const secureHash = query["vnp_SecureHash"];
  if (!secureHash) return false;

  const params = { ...query };
  delete params["vnp_SecureHash"];
  delete params["vnp_SecureHashType"];

  const sortedParams = sortObject(params as Record<string, string>);
  const queryString = new URLSearchParams(sortedParams).toString();
  const hmac = crypto.createHmac("sha512", secretKey).update(queryString).digest("hex");

  return hmac === secureHash;
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}` +
    `${pad(d.getMonth() + 1)}` +
    `${pad(d.getDate())}` +
    `${pad(d.getHours())}` +
    `${pad(d.getMinutes())}` +
    `${pad(d.getSeconds())}`
  );
}
