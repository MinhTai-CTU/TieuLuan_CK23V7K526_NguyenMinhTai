# Email Verification Setup Guide

## Tổng quan

Hệ thống email verification đã được implement với các tính năng:

- Tự động tạo verification token khi đăng ký
- Gửi email xác nhận với link verification
- Trang verify email với UI đẹp
- Kiểm tra email đã verify trước khi đăng nhập
- Token hết hạn sau 24 giờ

## Cấu hình Email (SMTP)

### 1. Gmail Setup

1. Vào [Google Account Settings](https://myaccount.google.com/)
2. Bật **2-Step Verification**
3. Tạo **App Password**:
   - Vào Security → 2-Step Verification → App passwords
   - Chọn "Mail" và "Other (Custom name)"
   - Nhập tên: "NextMerce"
   - Copy password được tạo

4. Thêm vào `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password-here"
SMTP_FROM_EMAIL="your-email@gmail.com"
SMTP_FROM_NAME="NextMerce"
```

### 2. Outlook/Hotmail Setup

```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@outlook.com"
SMTP_PASSWORD="your-password"
SMTP_FROM_EMAIL="your-email@outlook.com"
SMTP_FROM_NAME="NextMerce"
```

### 3. SendGrid Setup

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_FROM_NAME="NextMerce"
```

### 4. Mailgun Setup

```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-mailgun-username"
SMTP_PASSWORD="your-mailgun-password"
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_FROM_NAME="NextMerce"
```

## Environment Variables

Thêm vào file `.env`:

```env
# App URL (for email verification links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Development
# NEXT_PUBLIC_APP_URL="https://yourdomain.com"  # Production
```

## Flow hoạt động

### 1. Đăng ký (Register)

1. User điền form đăng ký
2. System tạo user với `emailVerified: false`
3. System tạo `verificationToken` (32 bytes hex)
4. System gửi email với link: `/verify-email?token=xxx`
5. User nhận email và click vào link

### 2. Xác nhận Email (Verify)

1. User click link trong email
2. Navigate đến `/verify-email?token=xxx`
3. Frontend gọi API `/api/auth/verify-email?token=xxx`
4. Backend kiểm tra token:
   - Token hợp lệ?
   - Email đã verify chưa?
   - Token hết hạn chưa? (24h)
5. Nếu hợp lệ: Set `emailVerified: true`, xóa `verificationToken`
6. Redirect về `/signin`

### 3. Đăng nhập (Login)

1. User đăng nhập
2. System kiểm tra `emailVerified`
3. Nếu chưa verify: Trả về lỗi "Please verify your email"
4. Nếu đã verify: Cho phép đăng nhập

## API Endpoints

### POST `/api/auth/register`

Tạo tài khoản mới và gửi email verification.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "name": "User Name",
      "emailVerified": false,
      "roles": ["CUSTOMER"]
    }
  }
}
```

### GET `/api/auth/verify-email?token=xxx`

Xác nhận email với token.

**Response (Success):**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Invalid or expired verification token"
}
```

### POST `/api/auth/login`

Đăng nhập (chỉ cho phép nếu email đã verify).

**Response (Email chưa verify):**

```json
{
  "success": false,
  "error": "Please verify your email before logging in. Check your inbox for the verification link.",
  "requiresVerification": true
}
```

## Database Schema

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  emailVerified     Boolean   @default(false)
  verificationToken String?
  verifiedAt        DateTime?
  // ... other fields
}
```

## Testing

### Test với Gmail

1. Setup Gmail SMTP như hướng dẫn trên
2. Đăng ký tài khoản mới
3. Kiểm tra inbox (có thể trong Spam)
4. Click link verification
5. Thử đăng nhập

### Test Development (không gửi email thật)

Có thể comment phần gửi email trong `register/route.ts` để test flow mà không cần setup SMTP.

## Troubleshooting

### Email không được gửi

1. Kiểm tra SMTP credentials trong `.env`
2. Kiểm tra firewall/network
3. Kiểm tra console logs để xem lỗi
4. Test với `verifyEmailConfig()` function

### Token không hợp lệ

- Token hết hạn sau 24 giờ
- Token bị xóa sau khi verify thành công
- Mỗi user chỉ có 1 token tại một thời điểm

### Email vào Spam

- Setup SPF, DKIM records cho domain
- Sử dụng email service provider (SendGrid, Mailgun)
- Kiểm tra email content
