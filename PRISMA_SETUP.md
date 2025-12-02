# Prisma Setup Guide

## Bước 1: Cài đặt dependencies

```bash
npm install
```

## Bước 2: Setup Database

1. Tạo file `.env` trong root directory (xem `ENV_SETUP.md`)
2. Thêm `DATABASE_URL` với connection string của PostgreSQL

## Bước 3: Generate Prisma Client

```bash
npm run db:generate
```

## Bước 4: Push schema to database

```bash
npm run db:push
```

Hoặc nếu muốn dùng migrations:

```bash
npm run db:migrate
```

## Bước 5: Seed database (optional)

```bash
npm run db:seed
```

Script seeding sẽ tạo:

- Categories từ `categoryData`
- Products + hình ảnh từ `shopData`
- Blogs từ dữ liệu demo blog
- Testimonials từ `testimonialsData`
- Demo user + sample orders (bao gồm shipping & order items)

## Bước 6: Open Prisma Studio (optional)

```bash
npm run db:studio
```

Prisma Studio sẽ mở tại http://localhost:5555 để bạn có thể xem và quản lý data.

## API Routes đã tạo

### Products

- `GET /api/products` - Lấy tất cả products
- `GET /api/products?categoryId=xxx` - Lọc theo category
- `GET /api/products/[id]` - Lấy product theo ID
- `POST /api/products` - Tạo product mới
- `PUT /api/products/[id]` - Cập nhật product
- `DELETE /api/products/[id]` - Xóa product

### Categories

- `GET /api/categories` - Lấy tất cả categories
- `POST /api/categories` - Tạo category mới

### Orders

- `GET /api/orders` - Lấy tất cả orders
- `GET /api/orders?userId=xxx` - Lọc theo user
- `GET /api/orders?status=xxx` - Lọc theo status
- `GET /api/order` - Alias cho /api/orders (backward compatibility)
- `GET /api/orders/[id]` - Lấy order theo ID
- `POST /api/orders` - Tạo order mới
- `PUT /api/orders/[id]` - Cập nhật order status

## Testing API

Sau khi chạy `npm run dev`, bạn có thể test API bằng:

```bash
# Get all products
curl http://localhost:3000/api/products

# Get single product
curl http://localhost:3000/api/products/[id]

# Get all categories
curl http://localhost:3000/api/categories
```
