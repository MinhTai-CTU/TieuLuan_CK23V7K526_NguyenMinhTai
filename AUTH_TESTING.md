# Hướng dẫn Test Authentication

## API Endpoints

### 1. Register (Đăng ký)

**POST** `/api/auth/register`

```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "test@example.com",
      "name": "Test User",
      "roles": ["CUSTOMER"]
    }
  }
}
```

### 2. Login (Đăng nhập)

**POST** `/api/auth/login`

```json
{
  "email": "demo@nextmerce.com",
  "password": "customer123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "demo@nextmerce.com",
      "name": "Demo Customer",
      "roles": ["CUSTOMER"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Current User (Lấy thông tin user hiện tại)

**GET** `/api/auth/me`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "demo@nextmerce.com",
      "name": "Demo Customer",
      "roles": ["CUSTOMER"],
      "permissions": [
        "products.view",
        "products.search",
        "orders.create",
        ...
      ]
    }
  }
}
```

## Users mẫu (sau khi seed)

| Email                 | Password      | Role     |
| --------------------- | ------------- | -------- |
| `demo@nextmerce.com`  | `customer123` | CUSTOMER |
| `staff@nextmerce.com` | `staff123`    | STAFF    |
| `admin@nextmerce.com` | `admin123`    | ADMIN    |

## Cách Test với cURL

### 1. Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@nextmerce.com","password":"customer123"}'
```

### 3. Get Current User (sau khi login, copy token từ response)

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Test API với Permission Check

Ví dụ: Tạo sản phẩm (cần permission `products.create`)

```bash
# Login as staff để lấy token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@nextmerce.com","password":"staff123"}' | jq -r '.data.token')

# Tạo sản phẩm với token
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Product",
    "slug": "test-product",
    "price": 99.99,
    "stock": 10
  }'
```

## Cách Test với Postman/Thunder Client

### 1. Register

- Method: `POST`
- URL: `http://localhost:3000/api/auth/register`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

### 2. Login

- Method: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Headers: `Content-Type: application/json`
- Body (JSON):

```json
{
  "email": "demo@nextmerce.com",
  "password": "customer123"
}
```

### 3. Get Current User

- Method: `GET`
- URL: `http://localhost:3000/api/auth/me`
- Headers:
  - `Authorization: Bearer <token từ login>`

## Test Permission trong API Routes

Ví dụ: Tạo API route có permission check

```typescript
// src/app/api/products/route.ts
import { requirePermission, PERMISSIONS } from "@/middleware/auth";

export async function POST(request: NextRequest) {
  const check = await requirePermission(request, PERMISSIONS.PRODUCTS_CREATE);
  if (check) return check; // 403 nếu không có quyền

  // User có quyền, tiếp tục...
}
```

## Lưu ý

1. **JWT Token**: Token có thời hạn 7 ngày (có thể config trong `.env` với `JWT_EXPIRES_IN`)
2. **Password**: Passwords được hash bằng bcrypt với 12 salt rounds
3. **Fallback**: Nếu không có JWT token, middleware sẽ fallback về `x-user-id` header (cho development)

## Troubleshooting

### Lỗi "Invalid or expired token"

- Kiểm tra token có đúng format không
- Kiểm tra token có hết hạn không
- Kiểm tra `JWT_SECRET` trong `.env`

### Lỗi "User not found"

- Chạy lại seed: `npm run db:seed`
- Kiểm tra email có đúng không

### Lỗi "Forbidden: Insufficient permissions"

- User không có permission cần thiết
- Kiểm tra roles và permissions của user trong database
