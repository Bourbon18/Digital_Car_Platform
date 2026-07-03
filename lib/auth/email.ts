import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const appName = process.env.NEXT_PUBLIC_APP_NAME || "Fast";

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `[${appName}] Xác nhận địa chỉ email của bạn`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Chào mừng đến với ${appName}!</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký. Vui lòng nhấn nút bên dưới để xác thực email của bạn:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Xác Nhận Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link này sẽ hết hạn sau 24 giờ.</p>
        <p style="color: #666; font-size: 14px;">Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `[${appName}] Đặt lại mật khẩu`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Đặt Lại Mật Khẩu</h2>
        <p>Xin chào <strong>${name || email}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Đặt Lại Mật Khẩu
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link này sẽ hết hạn sau 1 giờ.</p>
        <p style="color: #666; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
      </div>
    `,
  });
}

export async function sendBookingConfirmationEmail(
  sellerEmail: string,
  sellerName: string,
  buyerName: string,
  carTitle: string,
  startDate: string,
  endDate: string,
  totalAmount: string,
  bookingId: string
) {
  const bookingUrl = `${appUrl}/dashboard/rentals/${bookingId}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: sellerEmail,
    subject: `[${appName}] Bạn có booking mới — ${carTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bạn Có Booking Mới!</h2>
        <p>Xin chào <strong>${sellerName}</strong>,</p>
        <p><strong>${buyerName}</strong> đã đặt thuê xe <strong>${carTitle}</strong> của bạn.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Ngày nhận xe:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${startDate}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Ngày trả xe:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${endDate}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Tổng tiền:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${totalAmount}</td></tr>
        </table>
        <div style="text-align: center; margin: 30px 0; gap: 10px; display: flex; justify-content: center;">
          <a href="${bookingUrl}?action=confirm" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
            Xác Nhận
          </a>
          <a href="${bookingUrl}?action=reject" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Từ Chối
          </a>
        </div>
      </div>
    `,
  });
}

export async function sendEmailChangeVerification(newEmail: string, name: string, token: string) {
  const verifyUrl = `${appUrl}/api/auth/verify-email-change?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: newEmail,
    subject: `[${appName}] Xác nhận đổi địa chỉ email`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Xác Nhận Đổi Email</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Bạn vừa yêu cầu đổi email sang địa chỉ này. Nhấn nút bên dưới để xác nhận:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Xác Nhận Đổi Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link này sẽ hết hạn sau 24 giờ.</p>
        <p style="color: #666; font-size: 14px;">Nếu bạn không yêu cầu đổi email, hãy bỏ qua email này. Email cũ của bạn vẫn được giữ nguyên.</p>
      </div>
    `,
  });
}

export async function sendGenericEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}
