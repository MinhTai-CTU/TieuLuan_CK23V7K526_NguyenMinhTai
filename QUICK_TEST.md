# Quick Test Guide - Authentication & Permissions

## 🚀 Test nhanh với cURL

### 1. Login và lấy token

```bash
# Login as Customer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"demo@nextmerce.com\",\"password\":\"customer123\"}"

# Login as Staff
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"staff@nextmerce.com\",\"password\":\"staff123\"}"

# Login as Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@nextmerce.com\",\"password\":\"admin123\"}"
```

**Response sẽ có token:**

```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Test Authentication (lấy thông tin user hiện tại)

```bash
# Thay YOUR_TOKEN bằng token từ bước 1
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Permissions

```bash
# Test endpoint để xem roles và permissions
curl -X GET http://localhost:3000/api/test-auth \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 Users mẫu

| Email                 | Password      | Role     | Permissions                                                                                                                                                   |
| --------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `demo@nextmerce.com`  | `customer123` | CUSTOMER | products.view, products.search, orders.create, orders.view.own, wishlist.manage, reviews.create, profile.manage                                               |
| `staff@nextmerce.com` | `staff123`    | STAFF    | Tất cả của Customer + products.create, products.update, products.delete, categories.manage, orders.view.all, orders.update, testimonials.manage, reports.view |
| `admin@nextmerce.com` | `admin123`    | ADMIN    | Tất cả permissions                                                                                                                                            |

## 🧪 Test với Postman/Thunder Client

### Collection Setup

1. **Register** (POST `/api/auth/register`)
   - Body: `{"email":"test@example.com","password":"test123","name":"Test User"}`

2. **Login** (POST `/api/auth/login`)
   - Body: `{"email":"demo@nextmerce.com","password":"customer123"}`
   - Save token từ response vào variable `token`

3. **Get Current User** (GET `/api/auth/me`)
   - Header: `Authorization: Bearer {{token}}`

4. **Test Auth** (GET `/api/test-auth`)
   - Header: `Authorization: Bearer {{token}}`

## ✅ Checklist Test

- [ ] Register user mới
- [ ] Login với customer account
- [ ] Login với staff account
- [ ] Login với admin account
- [ ] Get current user với token
- [ ] Test permissions với `/api/test-auth`
- [ ] Test tạo product (cần staff/admin)
- [ ] Test quản lý users (cần admin)

## 🔧 Troubleshooting

**Lỗi "Invalid or expired token"**

- Kiểm tra token có đúng format không
- Token có thể đã hết hạn (mặc định 7 ngày)

**Lỗi "User not found"**

- Chạy lại seed: `npm run db:seed`

**Lỗi "Forbidden"**

- User không có permission cần thiết
- Kiểm tra role của user
