# OAuth Setup Guide - Google & Facebook

## Google OAuth Setup

### 1. Tạo OAuth 2.0 Credentials

1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. Chọn hoặc tạo project mới
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**

### 2. Cấu hình OAuth Client

#### Authorized JavaScript origins (JavaScript Origins)

Thêm các URL sau:

**Development:**

```
http://localhost:3000
```

**Production:**

```
https://yourdomain.com
https://www.yourdomain.com
```

#### Authorized redirect URIs

Thêm các URL sau:

**Development:**

```
http://localhost:3000/api/auth/callback/google
```

**Production:**

```
https://yourdomain.com/api/auth/callback/google
https://www.yourdomain.com/api/auth/callback/google
```

### 3. Lấy Credentials

- **Client ID**: Copy vào `GOOGLE_CLIENT_ID` trong `.env`
- **Client Secret**: Copy vào `GOOGLE_CLIENT_SECRET` trong `.env`

---

## Facebook OAuth Setup

### 1. Tạo Facebook App

1. Vào [Facebook Developers](https://developers.facebook.com)
2. Click **My Apps** > **Create App**
3. Chọn **Consumer** hoặc **Business**
4. Điền App Name và Contact Email

### 2. Thêm Facebook Login Product

1. Vào **Add Product** > **Facebook Login** > **Set Up**
2. Chọn **Web** platform

### 3. Cấu hình Facebook Login

#### Valid OAuth Redirect URIs

Thêm các URL sau:

**Development:**

```
http://localhost:3000/api/auth/callback/facebook
```

**Production:**

```
https://yourdomain.com/api/auth/callback/facebook
https://www.yourdomain.com/api/auth/callback/facebook
```

#### Site URL (nếu có)

**Development:**

```
http://localhost:3000
```

**Production:**

```
https://yourdomain.com
```

### 4. Cấu hình App Settings

Vào **Settings** > **Basic**:

- **App Domains**:
  - Development: `localhost`
  - Production: `yourdomain.com`

- **Privacy Policy URL**: (Required for production)
  - Production: `https://yourdomain.com/privacy-policy`

- **Terms of Service URL**: (Optional)
  - Production: `https://yourdomain.com/terms`

### 5. Lấy Credentials

1. Vào **Settings** > **Basic**
2. **App ID**: Copy vào `FACEBOOK_CLIENT_ID` trong `.env`
3. **App Secret**: Click **Show** và copy vào `FACEBOOK_CLIENT_SECRET` trong `.env`

### 6. Cấu hình Permissions (Optional)

Vào **Facebook Login** > **Settings**:

- **Valid OAuth Redirect URIs**: Đã thêm ở bước 3
- **Deauthorize Callback URL**: (Optional)
  - Production: `https://yourdomain.com/api/auth/facebook/deauthorize`

---

## Environment Variables

Thêm vào file `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"  # Development
# NEXTAUTH_URL="https://yourdomain.com"  # Production
NEXTAUTH_SECRET="your-secret-key-here"
```

---

## Tóm tắt URLs cần thêm

### Google OAuth

**Authorized JavaScript origins:**

- `http://localhost:3000` (Development)
- `https://yourdomain.com` (Production)

**Authorized redirect URIs:**

- `http://localhost:3000/api/auth/callback/google` (Development)
- `https://yourdomain.com/api/auth/callback/google` (Production)

### Facebook OAuth

**Valid OAuth Redirect URIs:**

- `http://localhost:3000/api/auth/callback/facebook` (Development)
- `https://yourdomain.com/api/auth/callback/facebook` (Production)

**Site URL:**

- `http://localhost:3000` (Development)
- `https://yourdomain.com` (Production)

---

## Lưu ý quan trọng

1. **Development vs Production**:
   - Development: Dùng `http://localhost:3000`
   - Production: Dùng `https://yourdomain.com` (phải có HTTPS)

2. **Facebook App Review**:
   - Development: Có thể test với tài khoản admin/developer
   - Production: Cần submit app để review nếu muốn public

3. **Google OAuth Consent Screen**:
   - Cần cấu hình OAuth consent screen trước khi tạo credentials
   - Chọn User Type: External (cho public) hoặc Internal (cho G Suite)

4. **Security**:
   - Không commit `.env` file vào Git
   - Sử dụng environment variables trong production
   - Rotate secrets định kỳ

---

## Testing

Sau khi setup xong:

1. Restart development server: `npm run dev`
2. Vào `/signin` hoặc `/signup`
3. Click "Sign In with Google" hoặc "Sign In with Facebook"
4. Kiểm tra xem có redirect đúng không

---

## Troubleshooting

### Google OAuth Error: "redirect_uri_mismatch"

- Kiểm tra lại Authorized redirect URIs trong Google Console
- Đảm bảo URL chính xác (không có trailing slash)

### Facebook OAuth Error: "Invalid OAuth Redirect URI"

- Kiểm tra lại Valid OAuth Redirect URIs trong Facebook App Settings
- Đảm bảo URL chính xác và match với `NEXTAUTH_URL`

### "App Not Setup" (Facebook)

- Đảm bảo đã thêm Facebook Login product
- Kiểm tra App Status trong App Review
