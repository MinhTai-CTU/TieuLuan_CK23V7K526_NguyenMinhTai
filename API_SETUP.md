# 🚀 API Setup Complete!

Đã setup thành công Next.js API Routes với Prisma + PostgreSQL.

## 📁 Cấu trúc đã tạo

```
nextjs-ecommerce-template/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data script
├── src/
│   ├── lib/
│   │   └── prisma.ts      # Prisma client singleton
│   └── app/
│       └── api/
│           ├── products/
│           │   ├── route.ts           # GET, POST /api/products
│           │   └── [id]/route.ts     # GET, PUT, DELETE /api/products/[id]
│           ├── categories/
│           │   └── route.ts           # GET, POST /api/categories
│           ├── orders/
│           │   ├── route.ts           # GET, POST /api/orders
│           │   └── [id]/route.ts     # GET, PUT /api/orders/[id]
│           └── order/
│               └── route.ts           # GET /api/order (backward compat)
├── ENV_SETUP.md           # Hướng dẫn setup environment
└── PRISMA_SETUP.md        # Hướng dẫn setup Prisma
```

## ⚡ Quick Start

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Setup Database
- Tạo file `.env` (xem `ENV_SETUP.md`)
- Thêm `DATABASE_URL` với PostgreSQL connection string

### 3. Setup Prisma
```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed database với sample data
npm run db:seed
```

### 4. Chạy development server
```bash
npm run dev
```

## 📡 API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Lấy tất cả products |
| GET | `/api/products?categoryId=xxx` | Lọc theo category |
| GET | `/api/products/[id]` | Lấy product theo ID |
| POST | `/api/products` | Tạo product mới |
| PUT | `/api/products/[id]` | Cập nhật product |
| DELETE | `/api/products/[id]` | Xóa product |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Lấy tất cả categories |
| POST | `/api/categories` | Tạo category mới |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Lấy tất cả orders |
| GET | `/api/orders?userId=xxx` | Lọc theo user |
| GET | `/api/orders?status=xxx` | Lọc theo status |
| GET | `/api/order` | Alias cho /api/orders |
| GET | `/api/orders/[id]` | Lấy order theo ID |
| POST | `/api/orders` | Tạo order mới |
| PUT | `/api/orders/[id]` | Cập nhật order status |

## 🧪 Test API

### Get all products
```bash
curl http://localhost:3000/api/products
```

### Create product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Product",
    "slug": "test-product",
    "price": 99.99,
    "discountedPrice": 79.99,
    "stock": 100,
    "images": [
      {"url": "/images/test.jpg", "type": "THUMBNAIL"}
    ]
  }'
```

### Get all categories
```bash
curl http://localhost:3000/api/categories
```

## 🗄️ Database Models

Đã tạo các models sau trong Prisma schema:
- `User` - Người dùng
- `Category` - Danh mục sản phẩm
- `Product` - Sản phẩm
- `ProductImage` - Hình ảnh sản phẩm
- `Order` - Đơn hàng
- `OrderItem` - Chi tiết đơn hàng
- `Shipping` - Thông tin giao hàng
- `Address` - Địa chỉ người dùng
- `WishlistItem` - Sản phẩm yêu thích
- `Blog` - Bài viết blog
- `Testimonial` - Đánh giá khách hàng

## 🔧 Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Open Prisma Studio (GUI)
npm run db:studio

# Seed database
npm run db:seed
```

## 📝 Next Steps

1. ✅ Setup Prisma - Done
2. ✅ Create API Routes - Done
3. ⏭️ Tích hợp API vào frontend components
4. ⏭️ Thêm authentication
5. ⏭️ Thêm validation & error handling nâng cao

## 🆘 Troubleshooting

### Lỗi: "Prisma Client has not been generated"
```bash
npm run db:generate
```

### Lỗi: "Can't reach database server"
- Kiểm tra `DATABASE_URL` trong `.env`
- Đảm bảo PostgreSQL đang chạy
- Kiểm tra firewall/network

### Lỗi: "Schema validation error"
```bash
npm run db:push
```

## 📚 Tài liệu tham khảo

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [PostgreSQL](https://www.postgresql.org/docs/)

