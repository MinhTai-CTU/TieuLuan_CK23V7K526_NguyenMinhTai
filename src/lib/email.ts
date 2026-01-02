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
 * Send account ban notification email
 */
export async function sendBanNotificationEmail(
  email: string,
  name: string | null,
  reason: string | null
): Promise<void> {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "NextMerce"}" <${process.env.SMTP_FROM_EMAIL || emailConfig.auth.user}>`,
    to: email,
    subject: "Thông báo: Tài khoản của bạn đã bị khóa",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo khóa tài khoản</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Thông báo khóa tài khoản</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Xin chào ${name || "bạn"},</p>
          
          <p style="font-size: 16px;">
            Chúng tôi rất tiếc phải thông báo rằng tài khoản của bạn tại NextMerce đã bị khóa.
          </p>
          
          ${
            reason
              ? `
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="font-size: 14px; font-weight: bold; color: #856404; margin: 0 0 10px 0;">Lý do khóa tài khoản:</p>
            <p style="font-size: 14px; color: #856404; margin: 0;">${reason}</p>
          </div>
          `
              : ""
          }
          
          <p style="font-size: 16px;">
            Tài khoản của bạn hiện không thể sử dụng các tính năng của hệ thống. 
            Nếu bạn cho rằng đây là sự nhầm lẫn hoặc muốn khiếu nại, vui lòng liên hệ với chúng tôi.
          </p>
          
          <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="font-size: 14px; color: #1565c0; margin: 0;">
              <strong>Liên hệ hỗ trợ:</strong><br>
              Email: ${process.env.SMTP_FROM_EMAIL || "support@nextmerce.com"}<br>
              Hoặc truy cập trang liên hệ trên website của chúng tôi.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Email này được gửi tự động từ hệ thống NextMerce. Vui lòng không trả lời email này.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Thông báo khóa tài khoản
      
      Xin chào ${name || "bạn"},
      
      Chúng tôi rất tiếc phải thông báo rằng tài khoản của bạn tại NextMerce đã bị khóa.
      
      ${reason ? `Lý do khóa tài khoản: ${reason}` : ""}
      
      Tài khoản của bạn hiện không thể sử dụng các tính năng của hệ thống. 
      Nếu bạn cho rằng đây là sự nhầm lẫn hoặc muốn khiếu nại, vui lòng liên hệ với chúng tôi.
      
      Liên hệ hỗ trợ: ${process.env.SMTP_FROM_EMAIL || "support@nextmerce.com"}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Ban notification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending ban notification email:", error);
    throw new Error("Failed to send ban notification email");
  }
}

/**
 * Send account unban notification email
 */
export async function sendUnbanNotificationEmail(
  email: string,
  name: string | null
): Promise<void> {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "NextMerce"}" <${process.env.SMTP_FROM_EMAIL || emailConfig.auth.user}>`,
    to: email,
    subject: "Thông báo: Tài khoản của bạn đã được mở khóa",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo mở khóa tài khoản</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Tài khoản đã được mở khóa</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Xin chào ${name || "bạn"},</p>
          
          <p style="font-size: 16px;">
            Chúng tôi vui mừng thông báo rằng tài khoản của bạn tại NextMerce đã được mở khóa.
          </p>
          
          <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p style="font-size: 14px; color: #065f46; margin: 0;">
              Bạn có thể tiếp tục sử dụng tất cả các tính năng của hệ thống như bình thường.
            </p>
          </div>
          
          <p style="font-size: 16px;">
            Cảm ơn bạn đã kiên nhẫn. Chúng tôi hy vọng bạn sẽ có trải nghiệm tốt hơn trên NextMerce.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" 
               style="display: inline-block; background: #10b981; color: white; 
                      padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                      font-weight: bold; font-size: 16px;">
              Truy cập NextMerce
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Email này được gửi tự động từ hệ thống NextMerce. Vui lòng không trả lời email này.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Tài khoản đã được mở khóa
      
      Xin chào ${name || "bạn"},
      
      Chúng tôi vui mừng thông báo rằng tài khoản của bạn tại NextMerce đã được mở khóa.
      
      Bạn có thể tiếp tục sử dụng tất cả các tính năng của hệ thống như bình thường.
      
      Cảm ơn bạn đã kiên nhẫn. Chúng tôi hy vọng bạn sẽ có trải nghiệm tốt hơn trên NextMerce.
      
      Truy cập: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Unban notification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending unban notification email:", error);
    throw new Error("Failed to send unban notification email");
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

/**
 * Gửi email đặt lại mật khẩu
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string | null
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "NextMerce"}" <${process.env.SMTP_FROM_EMAIL || emailConfig.auth.user}>`,
    to: email,
    subject: "Yêu cầu đặt lại mật khẩu",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3C50E0 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Đặt lại mật khẩu</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px;">Xin chào ${name || "bạn"},</p>
          
          <p style="font-size: 16px;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #3C50E0; color: white; 
                      padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                      font-weight: bold; font-size: 16px;">
              Đặt lại mật khẩu ngay
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Link này sẽ hết hạn sau 1 giờ vì lý do bảo mật.
          </p>

           <p style="font-size: 12px; color: #667eea; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
            ${resetUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Email được gửi tự động. Vui lòng không trả lời.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Yêu cầu đặt lại mật khẩu
      
      Xin chào ${name || "bạn"},
      
      Vui lòng truy cập đường dẫn sau để đặt lại mật khẩu của bạn:
      ${resetUrl}
      
      Link có hiệu lực trong 1 giờ.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}
