# Environment Variables Setup

Tạo file `.env` trong thư mục root của project với nội dung sau:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Email Configuration (for email verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="your-email@gmail.com"
SMTP_FROM_NAME="NextMerce"

# App URL (for email verification links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# NextAuth OAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# GOSHIP API (Shipping Service)
GOSHIP_TOKEN="your-goship-api-token"
```

## OAuth Setup

Xem file `OAUTH_SETUP.md` để biết chi tiết cách setup Google và Facebook OAuth, bao gồm:

- Authorized JavaScript origins
- Authorized redirect URIs
- Hướng dẫn từng bước

# Node Environment

NODE_ENV="development"

```

## Lưu ý về JWT_SECRET

- **Development**: Có thể dùng bất kỳ string nào
- **Production**: Nên dùng một secret key mạnh, ít nhất 32 ký tự
- Generate secret: `openssl rand -base64 32`

## Hướng dẫn setup Database:

### Option 1: Local PostgreSQL

1. Cài đặt PostgreSQL trên máy local
2. Tạo database: `createdb ecommerce_db`
3. Cập nhật DATABASE_URL với thông tin của bạn

### Option 2: Cloud Database (Recommended)

- **Supabase**: https://supabase.com (Free tier available)
- **Railway**: https://railway.app (Free tier available)
- **Neon**: https://neon.tech (Free tier available)
- **Vercel Postgres**: https://vercel.com/storage/postgres

Sau khi có database URL, copy vào file `.env`
```
