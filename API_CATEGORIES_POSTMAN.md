# API Categories - Postman Collection

## Base URL
```
http://localhost:3000
```

## Authentication
Tất cả các endpoint (trừ GET /api/categories) đều yêu cầu authentication header:
```
Authorization: Bearer <your_jwt_token>
```

Để lấy token:
1. Đăng nhập tại `/api/auth/login`
2. Copy token từ response
3. Hoặc lấy từ localStorage: `localStorage.getItem('auth_token')`

---

## 1. GET /api/categories
**Lấy danh sách tất cả categories**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/categories`
- **Headers:** Không cần
- **Body:** Không có

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmir...",
      "title": "Điện thoại",
      "slug": "dien-thoai",
      "img": "/uploads/categories/...",
      "description": "Mô tả danh mục",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "_count": {
        "products": 10
      }
    }
  ]
}
```

---

## 2. GET /api/categories/[id]
**Lấy thông tin 1 category**

- **Method:** `GET`
- **URL:** `http://localhost:3000/api/categories/{categoryId}`
- **Headers:** Không cần
- **Body:** Không có

**Ví dụ:**
```
GET http://localhost:3000/api/categories/cmir50neu0001ccrhh8kr9lz9
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmir...",
    "title": "Điện thoại",
    "slug": "dien-thoai",
    "img": "/uploads/categories/...",
    "description": "Mô tả danh mục",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "_count": {
      "products": 10
    }
  }
}
```

---

## 3. POST /api/categories
**Tạo category mới**

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/categories`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer <your_jwt_token>
  ```
- **Body (JSON):**
```json
{
  "title": "Laptop",
  "slug": "laptop",
  "img": "/uploads/categories/laptop.jpg",
  "description": "Danh mục laptop và máy tính"
}
```

**Required fields:**
- `title` (string, required)
- `slug` (string, required, unique)

**Optional fields:**
- `img` (string, nullable)
- `description` (string, nullable)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "cmir...",
    "title": "Laptop",
    "slug": "laptop",
    "img": "/uploads/categories/laptop.jpg",
    "description": "Danh mục laptop và máy tính",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Title and slug are required"
}
```

**Error (403):**
```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions"
}
```

---

## 4. PATCH /api/categories/[id]
**Cập nhật category**

- **Method:** `PATCH`
- **URL:** `http://localhost:3000/api/categories/{categoryId}`
- **Headers:**
  ```
  Content-Type: application/json
  Authorization: Bearer <your_jwt_token>
  ```
- **Body (JSON):**
```json
{
  "title": "Laptop & Máy tính",
  "slug": "laptop-may-tinh",
  "img": "/uploads/categories/laptop-new.jpg",
  "description": "Danh mục laptop và máy tính đã cập nhật"
}
```

**Tất cả fields đều optional** - chỉ gửi fields muốn cập nhật

**Ví dụ:**
```
PATCH http://localhost:3000/api/categories/cmir50neu0001ccrhh8kr9lz9
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cmir...",
    "title": "Laptop & Máy tính",
    "slug": "laptop-may-tinh",
    "img": "/uploads/categories/laptop-new.jpg",
    "description": "Danh mục laptop và máy tính đã cập nhật",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## 5. DELETE /api/categories/[id]
**Xóa category**

- **Method:** `DELETE`
- **URL:** `http://localhost:3000/api/categories/{categoryId}`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```
- **Body:** Không có

**Ví dụ:**
```
DELETE http://localhost:3000/api/categories/cmir50neu0001ccrhh8kr9lz9
```

**Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Cannot delete category. It has 10 product(s)."
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Category not found"
}
```

---

## 6. POST /api/categories/upload-image
**Upload hình ảnh cho category**

- **Method:** `POST`
- **URL:** `http://localhost:3000/api/categories/upload-image`
- **Headers:**
  ```
  Authorization: Bearer <your_jwt_token>
  ```
  **Lưu ý:** Không set `Content-Type` header, Postman sẽ tự động set `multipart/form-data`
- **Body (form-data):**
  - Key: `image`
  - Type: `File`
  - Value: Chọn file ảnh (JPEG, PNG, WebP, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "/uploads/categories/category-1765364871606-abc123.jpg"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Invalid file type. Only JPEG, PNG, and WebP are allowed."
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "File size exceeds 5MB limit"
}
```

---

## Postman Collection Setup

### 1. Tạo Environment Variables
Trong Postman, tạo environment với:
- `base_url`: `http://localhost:3000`
- `auth_token`: `<your_jwt_token>` (cập nhật sau khi login)

### 2. Pre-request Script (để tự động lấy token)
```javascript
// Nếu token chưa có, có thể gọi login API trước
if (!pm.environment.get("auth_token")) {
    // Gọi login API
    pm.sendRequest({
        url: pm.environment.get("base_url") + "/api/auth/login",
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                email: "minhtai2019cb2@gmail.com",
                password: "your_password"
            })
        }
    }, function (err, res) {
        if (!err) {
            const jsonData = res.json();
            if (jsonData.success && jsonData.data.token) {
                pm.environment.set("auth_token", jsonData.data.token);
            }
        }
    });
}
```

### 3. Headers Template
Để tự động thêm Authorization header, trong Postman Collection:
- Vào **Collection** → **Authorization**
- Type: `Bearer Token`
- Token: `{{auth_token}}`

---

## Test Flow

1. **Lấy danh sách categories:**
   ```
   GET {{base_url}}/api/categories
   ```

2. **Tạo category mới:**
   ```
   POST {{base_url}}/api/categories
   Body: {
     "title": "Test Category",
     "slug": "test-category",
     "description": "Test description"
   }
   ```

3. **Upload ảnh:**
   ```
   POST {{base_url}}/api/categories/upload-image
   Body (form-data): image = [chọn file]
   ```

4. **Cập nhật category với ảnh:**
   ```
   PATCH {{base_url}}/api/categories/{categoryId}
   Body: {
     "img": "/uploads/categories/..."
   }
   ```

5. **Xóa category:**
   ```
   DELETE {{base_url}}/api/categories/{categoryId}
   ```

---

## Lưu ý

1. **Permission:** Cần có permission `categories.manage` để thực hiện POST, PATCH, DELETE
2. **Slug:** Phải unique, không được trùng với category khác
3. **Xóa category:** Chỉ xóa được khi category không có sản phẩm nào
4. **Upload ảnh:** File sẽ được lưu tại `public/uploads/categories/`
5. **Token:** Token có thể hết hạn, cần login lại để lấy token mới

