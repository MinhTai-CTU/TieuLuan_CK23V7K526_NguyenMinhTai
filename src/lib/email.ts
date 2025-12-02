import nodemailer from "nodemailer";

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string | null
): Promise<void> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "NextMerce"}" <${process.env.SMTP_FROM_EMAIL || emailConfig.auth.user}>`,
    to: email,
    subject: "Xác nhận email đăng ký tài khoản",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Chào mừng đến với NextMerce!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Xin chào ${name || "bạn"},</p>
          
          <p style="font-size: 16px;">
            Cảm ơn bạn đã đăng ký tài khoản tại NextMerce. Để hoàn tất quá trình đăng ký, 
            vui lòng xác nhận địa chỉ email của bạn bằng cách nhấp vào nút bên dưới:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: #667eea; color: white; 
                      padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                      font-weight: bold; font-size: 16px;">
              Xác nhận email
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Hoặc copy và dán link sau vào trình duyệt:
          </p>
          <p style="font-size: 12px; color: #667eea; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
            ${verificationUrl}
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Link này sẽ hết hạn sau 24 giờ. Nếu bạn không thực hiện yêu cầu này, 
            vui lòng bỏ qua email này.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Nếu bạn không phải người đăng ký tài khoản này, vui lòng bỏ qua email này.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Chào mừng đến với NextMerce!
      
      Xin chào ${name || "bạn"},
      
      Cảm ơn bạn đã đăng ký tài khoản tại NextMerce. Để hoàn tất quá trình đăng ký, 
      vui lòng xác nhận địa chỉ email của bạn bằng cách truy cập link sau:
      
      ${verificationUrl}
      
      Link này sẽ hết hạn sau 24 giờ.
      
      Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

/**
 * Verify email transporter configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
}
