# Hệ thống Phân quyền (Role-Based Access Control)

## Tổng quan

Hệ thống phân quyền sử dụng mô hình **Role-Based Access Control (RBAC)** với khả năng:

- Mỗi user có thể có **nhiều roles**
- Mỗi role có **nhiều permissions**
- Permissions được kiểm tra ở API routes và frontend

## Cấu trúc

### Roles (Vai trò)

1. **CUSTOMER** - Khách hàng
   - Xem sản phẩm, tìm kiếm
   - Tạo đơn hàng
   - Quản lý wishlist, profile
   - Viết reviews

2. **STAFF** - Nhân viên
   - Tất cả quyền của Customer
   - Quản lý sản phẩm (CRUD)
   - Quản lý danh mục
   - Xem và cập nhật đơn hàng
   - Quản lý testimonials
   - Xem báo cáo cơ bản

3. **ADMIN** - Quản trị viên
   - Tất cả quyền của Staff
   - Quản lý users, roles, permissions
   - Cài đặt hệ thống
   - Quản lý blog posts
   - Xem tất cả báo cáo

### Permissions (Quyền)

Permissions được định dạng: `resource.action`

Ví dụ:

- `products.view` - Xem sản phẩm
- `products.create` - Tạo sản phẩm
- `orders.update` - Cập nhật đơn hàng
- `users.manage` - Quản lý users

## Sử dụng trong Code

### 1. Kiểm tra Permission trong API Routes

```typescript
import { requirePermission, PERMISSIONS } from "@/middleware/auth";

export async function POST(request: NextRequest) {
  // Kiểm tra permission
  const permissionCheck = await requirePermission(
    request,
    PERMISSIONS.PRODUCTS_CREATE
  );
  if (permissionCheck) {
    return permissionCheck; // Trả về 403 nếu không có quyền
  }

  // User có quyền, tiếp tục xử lý
  // ...
}
```

### 2. Kiểm tra Role

```typescript
import { requireRole, ROLES } from "@/middleware/auth";

export async function GET(request: NextRequest) {
  const roleCheck = await requireRole(request, ROLES.ADMIN);
  if (roleCheck) {
    return roleCheck; // Trả về 403 nếu không có role
  }

  // User có role ADMIN, tiếp tục xử lý
  // ...
}
```

### 3. Kiểm tra Permission trong Business Logic

```typescript
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

const userId = getUserId(request);
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const canCreate = await hasPermission(userId, PERMISSIONS.PRODUCTS_CREATE);
if (!canCreate) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### 4. Lấy tất cả Permissions của User

```typescript
import { getUserPermissions } from "@/lib/permissions";

const permissions = await getUserPermissions(userId);
// Returns: ["products.view", "products.search", "orders.create", ...]
```

### 5. Lấy tất cả Roles của User

```typescript
import { getUserRoles } from "@/lib/permissions";

const roles = await getUserRoles(userId);
// Returns: ["CUSTOMER", "STAFF"]
```

## Users mẫu

Sau khi seed, có 3 users mẫu:

1. **Customer**
   - Email: `demo@nextmerce.com`
   - Password: `demo` (placeholder hash)
   - Roles: CUSTOMER

2. **Staff**
   - Email: `staff@nextmerce.com`
   - Password: `staff` (placeholder hash)
   - Roles: STAFF

3. **Admin**
   - Email: `admin@nextmerce.com`
   - Password: `admin` (placeholder hash)
   - Roles: ADMIN

## Gán nhiều Roles cho User

```typescript
// User có thể có nhiều roles
await prisma.user.update({
  where: { id: userId },
  data: {
    userRoles: {
      create: [
        { roleId: customerRoleId },
        { roleId: staffRoleId }, // User vừa là Customer vừa là Staff
      ],
    },
  },
});
```

## Constants

### Permissions

```typescript
import { PERMISSIONS } from "@/lib/permissions";

PERMISSIONS.PRODUCTS_VIEW;
PERMISSIONS.PRODUCTS_CREATE;
PERMISSIONS.ORDERS_UPDATE;
PERMISSIONS.USERS_MANAGE;
// ... và nhiều hơn nữa
```

### Roles

```typescript
import { ROLES } from "@/lib/permissions";

ROLES.CUSTOMER;
ROLES.STAFF;
ROLES.ADMIN;
```

## Authentication

✅ **Đã implement JWT Authentication**:

- JWT token generation và verification
- Password hashing với bcrypt (12 salt rounds)
- Middleware `requireAuth` verify JWT từ Authorization header
- Fallback: `x-user-id` header cho development/testing

### API Endpoints

- **POST** `/api/auth/register` - Đăng ký user mới (tự động gán role CUSTOMER)
- **POST** `/api/auth/login` - Đăng nhập, trả về JWT token
- **GET** `/api/auth/me` - Lấy thông tin user hiện tại (cần token)
- **GET** `/api/test-auth` - Test authentication và permissions

### Sử dụng Token

Thêm header vào request:

```
Authorization: Bearer <your-jwt-token>
```

Xem file `AUTH_TESTING.md` để biết chi tiết cách test.

## Ví dụ API Route với Permission Check

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, PERMISSIONS } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Check permission
  const permissionCheck = await requirePermission(
    request,
    PERMISSIONS.PRODUCTS_CREATE
  );
  if (permissionCheck) {
    return permissionCheck;
  }

  // User has permission, create product
  const body = await request.json();
  const product = await prisma.product.create({
    data: body,
  });

  return NextResponse.json({ success: true, data: product });
}
```
