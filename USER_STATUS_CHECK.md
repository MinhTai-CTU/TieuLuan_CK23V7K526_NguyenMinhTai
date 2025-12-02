# User Status Check System

## Tổng quan

Hệ thống tự động kiểm tra trạng thái user mỗi khi vào trang web để đảm bảo:

- User account vẫn còn active (chưa bị ban)
- Email đã được verify
- Token vẫn còn hợp lệ

Nếu user bị khóa hoặc không hợp lệ, hệ thống sẽ tự động:

- Xóa thông tin từ localStorage
- Đăng xuất user
- Hiển thị thông báo lỗi
- Redirect về trang signin

## Database Schema

### User Model Fields

```prisma
model User {
  isActive      Boolean   @default(true)  // Account status
  bannedAt      DateTime?                 // When user was banned
  bannedReason  String?                   // Reason for ban
  // ... other fields
}
```

## Components & Hooks

### 1. UserStatusChecker Component

Component tự động chạy khi app load để kiểm tra user status.

**Location:** `src/components/Auth/UserStatusChecker.tsx`

**Chức năng:**

- Kiểm tra token trong localStorage
- Gọi API `/api/auth/check-status`
- Xóa auth data nếu user không hợp lệ
- Hiển thị thông báo lỗi phù hợp
- Redirect về signin nếu cần

**Khi nào chạy:**

- Mỗi khi app load (component mount)
- Chỉ chạy 1 lần (prevent duplicate calls)

### 2. useUserStatus Hook

Hook để check user status programmatically.

**Location:** `src/hooks/useUserStatus.ts`

**Usage:**

```typescript
const { isChecking, isValid } = useUserStatus();
```

## API Endpoints

### GET `/api/auth/check-status`

Kiểm tra trạng thái user hiện tại.

**Headers:**

```
Authorization: Bearer <token>
```

**Response (Valid):**

```json
{
  "success": true,
  "isValid": true,
  "data": {
    "id": "...",
    "email": "...",
    "isActive": true,
    "emailVerified": true
  }
}
```

**Response (Banned):**

```json
{
  "success": false,
  "isValid": false,
  "isBanned": true,
  "error": "Your account has been banned",
  "bannedAt": "2025-01-01T00:00:00Z",
  "bannedReason": "Violation of terms"
}
```

**Response (Not Verified):**

```json
{
  "success": false,
  "isValid": false,
  "requiresVerification": true,
  "error": "Email not verified"
}
```

### PUT `/api/admin/users/[id]/ban`

Ban một user account (Admin only).

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Body:**

```json
{
  "reason": "Violation of terms of service"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User has been banned",
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "isActive": false,
      "bannedAt": "2025-01-01T00:00:00Z",
      "bannedReason": "Violation of terms"
    }
  }
}
```

### PUT `/api/admin/users/[id]/unban`

Unban một user account (Admin only).

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Response:**

```json
{
  "success": true,
  "message": "User has been unbanned",
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "isActive": true,
      "bannedAt": null,
      "bannedReason": null
    }
  }
}
```

## Flow hoạt động

### 1. User vào trang web

1. App load → `UserStatusChecker` component mount
2. Component kiểm tra token trong localStorage
3. Nếu có token → Gọi API `/api/auth/check-status`
4. API kiểm tra:
   - Token hợp lệ?
   - User còn tồn tại?
   - `isActive === true`?
   - `emailVerified === true`?

### 2. Nếu user hợp lệ

- Không làm gì, user tiếp tục sử dụng app

### 3. Nếu user không hợp lệ

- Xóa token và user data từ localStorage
- Gọi `logout()` để clear auth state
- Hiển thị toast error với message phù hợp:
  - Banned: "Your account has been banned. Reason: ..."
  - Not verified: "Please verify your email..."
  - Token expired: "Your session has expired..."
- Redirect về `/signin` (nếu chưa ở đó)

## Login Protection

API `/api/auth/login` cũng kiểm tra:

- Email đã verify chưa?
- Account còn active không?

Nếu không → Trả về lỗi và không cho đăng nhập.

## Admin Functions

### Ban User

```bash
curl -X PUT http://localhost:3000/api/admin/users/USER_ID/ban \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Violation of terms"}'
```

### Unban User

```bash
curl -X PUT http://localhost:3000/api/admin/users/USER_ID/unban \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Testing

### Test ban user

1. Login với user bất kỳ
2. Admin ban user đó qua API
3. Refresh trang web
4. User sẽ tự động bị logout và hiển thị thông báo "Your account has been banned"

### Test với Prisma Studio

```bash
npm run db:studio
```

1. Mở User table
2. Set `isActive = false` cho một user
3. Set `bannedAt = now()` và `bannedReason = "Test ban"`
4. Refresh trang web với user đó
5. User sẽ tự động bị logout

## Lưu ý

1. **Performance**: UserStatusChecker chỉ chạy 1 lần khi app load, không block UI
2. **Network Errors**: Nếu có lỗi network, không clear auth (có thể là lỗi tạm thời)
3. **Token Expiry**: JWT token vẫn có thể hết hạn, nhưng check-status sẽ phát hiện và clear auth
4. **Real-time**: Nếu user bị ban trong khi đang dùng app, sẽ phát hiện khi:
   - Refresh trang
   - Navigate sang trang khác (nếu có check)
   - Gọi API bất kỳ (API sẽ check và trả về 403)

## Security

- Tất cả API routes đều check `isActive` trước khi cho phép truy cập
- User bị ban không thể đăng nhập lại
- Token của user bị ban sẽ không còn hợp lệ
- Admin có thể ban/unban user qua API với permission check
