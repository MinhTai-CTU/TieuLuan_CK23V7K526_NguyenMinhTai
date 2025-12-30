# 📦 Luồng Hoạt Động Của Shopping Cart

## Tổng Quan

Hệ thống cart sử dụng **Hybrid Approach** kết hợp:
- **localStorage** cho guest users (chưa đăng nhập)
- **Database** cho logged-in users (đã đăng nhập)
- **Zustand Persist Middleware** để cache và đồng bộ

---

## 🔄 LUỒNG KHI CHƯA ĐĂNG NHẬP (Guest User)

### 1. Khởi Động Ứng Dụng

```
App Start
  ↓
CartLoader Component Mount
  ↓
Zustand Persist Middleware Rehydrate
  ├─ Load từ localStorage (key: "cart_cache")
  ├─ Hiển thị items ngay lập tức (không flicker)
  └─ Set isInitialized = true
  ↓
CartLoader useEffect Trigger
  ├─ Kiểm tra isInitialized = true
  └─ Gọi loadCart()
  ↓
loadCart() trong cart-store
  ├─ Kiểm tra: isAuthenticated() = false
  ├─ Kiểm tra: items.length > 0?
  │   ├─ Nếu CÓ: Items đã load từ persist cache
  │   │   └─ Enrich với giá mới từ API (background)
  │   └─ Nếu KHÔNG: Load từ guest_cart metadata
  │       ├─ Load từ localStorage (key: "guest_cart")
  │       ├─ Enrich items (fetch product details từ API)
  │       └─ Set items vào store
```

### 2. Thêm Sản Phẩm Vào Cart

```
User Click "Add to Cart"
  ↓
addItemToCart(item) trong cart-store
  ├─ Kiểm tra: isAuthenticated() = false
  ├─ Kiểm tra: Item đã tồn tại?
  │   ├─ Nếu CÓ: Tăng quantity
  │   └─ Nếu KHÔNG: Thêm item mới
  ├─ Update Zustand Store
  │   └─ Persist middleware tự động lưu vào localStorage
  ├─ Save Guest Cart Metadata
  │   └─ Lưu vào localStorage (key: "guest_cart")
  │       └─ Chỉ lưu: productId, productVariantId, quantity, selectedOptions
  └─ UI Update ngay lập tức
```

**Lưu ý:**
- ✅ Giá và thông tin sản phẩm được fetch từ API khi render (tránh hack giá)
- ✅ Chỉ lưu metadata vào `guest_cart` (productId, quantity, options)
- ✅ Full cart data (với giá, hình ảnh) được lưu vào `cart_cache` bởi persist middleware

### 3. Cập Nhật/Xóa Sản Phẩm

```
User Action (Update Quantity / Remove Item)
  ↓
updateCartItemQuantity() / removeItemFromCart()
  ├─ Kiểm tra: isAuthenticated() = false
  ├─ Update Zustand Store
  │   └─ Persist middleware tự động lưu vào localStorage
  ├─ Update Guest Cart Metadata
  │   └─ Cập nhật localStorage (key: "guest_cart")
  └─ UI Update ngay lập tức
```

### 4. Reload Trang (F5)

```
Page Reload
  ↓
Zustand Persist Middleware Rehydrate
  ├─ Load từ localStorage (key: "cart_cache")
  ├─ Hiển thị items ngay lập tức (không flicker)
  └─ Set isInitialized = true
  ↓
CartLoader useEffect Trigger
  └─ Gọi loadCart()
  ↓
loadCart() trong cart-store
  ├─ Kiểm tra: items.length > 0 (đã có từ persist)
  ├─ Enrich với giá mới từ API (background)
  └─ Update items nếu giá thay đổi
```

---

## 🔐 LUỒNG KHI ĐÃ ĐĂNG NHẬP (Logged-in User)

### 1. Khởi Động Ứng Dụng

```
App Start
  ↓
CartLoader Component Mount
  ↓
Zustand Persist Middleware Rehydrate
  ├─ Load từ localStorage (key: "cart_cache")
  ├─ Hiển thị items ngay lập tức (không flicker)
  └─ Set isInitialized = true
  ↓
CartLoader useEffect Trigger
  ├─ Kiểm tra isInitialized = true
  └─ Gọi loadCart()
  ↓
loadCart() trong cart-store
  ├─ Kiểm tra: isAuthenticated() = true
  ├─ Gọi API: GET /api/cart
  │   ├─ Verify token
  │   ├─ Query database: CartItem WHERE userId = ...
  │   ├─ Include: product, productVariant, images
  │   └─ Return cart items
  ├─ Map API response → CartItem format
  ├─ Update Zustand Store
  │   └─ Persist middleware tự động lưu vào localStorage (cache)
  └─ UI Update
```

### 2. Thêm Sản Phẩm Vào Cart

```
User Click "Add to Cart"
  ↓
addItemToCart(item) trong cart-store
  ├─ Kiểm tra: isAuthenticated() = true
  ├─ Gọi API: POST /api/cart
  │   ├─ Verify token
  │   ├─ Kiểm tra: Item đã tồn tại?
  │   │   ├─ Nếu CÓ: Update quantity
  │   │   └─ Nếu KHÔNG: Create new CartItem
  │   └─ Return updated cart item
  ├─ Gọi loadCart() để reload từ database
  │   └─ Persist middleware tự động lưu vào localStorage (cache)
  └─ UI Update
```

### 3. Cập Nhật/Xóa Sản Phẩm

```
User Action (Update Quantity / Remove Item)
  ↓
updateCartItemQuantity() / removeItemFromCart()
  ├─ Kiểm tra: isAuthenticated() = true
  ├─ Tìm item.databaseId từ store
  ├─ Gọi API: PUT /api/cart hoặc DELETE /api/cart
  │   ├─ Verify token
  │   ├─ Verify ownership (userId)
  │   └─ Update/Delete trong database
  ├─ Gọi loadCart() để reload từ database
  │   └─ Persist middleware tự động lưu vào localStorage (cache)
  └─ UI Update
```

### 4. Reload Trang (F5)

```
Page Reload
  ↓
Zustand Persist Middleware Rehydrate
  ├─ Load từ localStorage (key: "cart_cache")
  ├─ Hiển thị items ngay lập tức (không flicker)
  └─ Set isInitialized = true
  ↓
CartLoader useEffect Trigger
  └─ Gọi loadCart()
  ↓
loadCart() trong cart-store
  ├─ Kiểm tra: isAuthenticated() = true
  ├─ Gọi API: GET /api/cart
  │   └─ Load từ database (source of truth)
  ├─ Update Zustand Store
  │   └─ Persist middleware tự động lưu vào localStorage (cache)
  └─ UI Update
```

---

## 🔄 LUỒNG KHI ĐĂNG NHẬP (Login Flow)

### Khi User Đăng Nhập

```
User Login Success
  ↓
CartMerger Component Detect Login
  ├─ useAuth() → isAuthenticated = true
  ├─ Kiểm tra: hasMerged.current = false
  └─ Gọi mergeGuestCart()
  ↓
mergeGuestCart() trong cart-store
  ├─ Kiểm tra: isAuthenticated() = true
  ├─ Load Guest Cart Metadata
  │   └─ Load từ localStorage (key: "guest_cart")
  ├─ Kiểm tra: guestItems.length > 0?
  │   ├─ Nếu KHÔNG: Return (không có gì để merge)
  │   └─ Nếu CÓ: Tiếp tục
  ├─ Gọi API: POST /api/cart/merge
  │   ├─ Verify token
  │   ├─ Loop qua từng guest item:
  │   │   ├─ Kiểm tra: Item đã tồn tại trong database?
  │   │   │   ├─ Nếu CÓ: Update quantity (merge)
  │   │   │   └─ Nếu KHÔNG: Create new CartItem
  │   │   └─ Return merged items
  │   └─ Return success
  ├─ Clear Guest Cart Metadata
  │   └─ Xóa localStorage (key: "guest_cart")
  ├─ Gọi loadCart() để reload từ database
  │   └─ Persist middleware tự động lưu vào localStorage (cache)
  └─ UI Update với items từ database
```

**Lưu ý:**
- ✅ Guest cart được merge vào database cart
- ✅ Nếu item trùng (cùng productId + productVariantId): quantity được cộng dồn
- ✅ Guest cart metadata bị xóa sau khi merge thành công
- ✅ Cart cache được cập nhật với data từ database

---

## 🗄️ Cấu Trúc Dữ Liệu

### 1. Guest Cart Metadata (localStorage: "guest_cart")
```typescript
[
  {
    productId: "prod_123",
    productVariantId: "var_456" | null,
    quantity: 2,
    selectedOptions: { color: "Red", storage: "64GB" }
  }
]
```

**Mục đích:** Lưu metadata để merge khi user đăng nhập

### 2. Cart Cache (localStorage: "cart_cache")
```typescript
{
  items: [
    {
      id: "prod_123",
      cartItemId: "prod_123_Red_64GB",
      databaseId: "cart_item_789", // Chỉ có khi logged in
      title: "iPhone 14",
      price: 999,
      discountedPrice: 899,
      quantity: 2,
      productVariantId: "var_456",
      imgs: { thumbnails: [...], previews: [...] },
      selectedOptions: { color: "Red", storage: "64GB" }
    }
  ],
  selectedItems: ["prod_123_Red_64GB"],
  isInitialized: true
}
```

**Mục đích:** Cache để hiển thị ngay lập tức khi reload (không flicker)

### 3. Database Cart (PostgreSQL: CartItem table)
```sql
CartItem {
  id: "cart_item_789",
  userId: "user_123",
  productId: "prod_123",
  productVariantId: "var_456",
  quantity: 2,
  selectedOptions: { color: "Red", storage: "64GB" }
}
```

**Mục đích:** Source of truth cho logged-in users

---

## 🔑 Các Component Quan Trọng

### 1. CartLoader (`src/components/Cart/CartLoader.tsx`)
- **Chức năng:** Tự động load cart khi app khởi động
- **Khi nào chạy:** Sau khi persist middleware rehydrate xong
- **Làm gì:** Gọi `loadCart()` để sync với database (nếu logged in) hoặc enrich guest items

### 2. CartMerger (`src/components/Cart/CartMerger.tsx`)
- **Chức năng:** Tự động merge guest cart vào database khi user đăng nhập
- **Khi nào chạy:** Khi `isAuthenticated` chuyển từ `false` → `true`
- **Làm gì:** Gọi `mergeGuestCart()` để merge và xóa guest cart metadata

### 3. cart-store (`src/stores/cart-store.ts`)
- **Chức năng:** Centralized state management cho cart
- **Features:**
  - Zustand Persist Middleware (auto-save to localStorage)
  - Hybrid approach (localStorage + Database)
  - Item selection management
  - Price calculation

---

## 📊 Sơ Đồ Luồng Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                    APP START                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Persist Rehydrate    │
            │  (Load from cache)    │
            └──────────┬─────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   CartLoader Run      │
            └──────────┬─────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐           ┌─────────────────┐
│  Guest User   │           │  Logged-in User  │
└───────┬───────┘           └────────┬──────────┘
        │                             │
        ▼                             ▼
┌──────────────────┐         ┌──────────────────┐
│ Load from        │         │ Load from         │
│ guest_cart       │         │ Database          │
│ + Enrich         │         │ (GET /api/cart)   │
└──────────────────┘         └──────────────────┘
        │                             │
        └──────────────┬───────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │  Update Zustand      │
            │  + Persist to cache  │
            └──────────────────────┘
```

---

## 🎯 Tóm Tắt

### Guest User (Chưa đăng nhập)
- ✅ Cart lưu trong **localStorage** (cả cache và metadata)
- ✅ Giá được fetch từ API khi render (tránh hack)
- ✅ Không cần đăng nhập để mua hàng
- ✅ Cart được merge vào database khi đăng nhập

### Logged-in User (Đã đăng nhập)
- ✅ Cart lưu trong **Database** (source of truth)
- ✅ Cart cache trong localStorage (để hiển thị nhanh)
- ✅ Đồng bộ giữa các thiết bị
- ✅ Cart được load từ database mỗi khi reload

### Khi Đăng Nhập
- ✅ Guest cart tự động merge vào database cart
- ✅ Quantity được cộng dồn nếu item trùng
- ✅ Guest cart metadata bị xóa sau merge
- ✅ Cart được reload từ database

---

## 🔧 API Endpoints

### GET `/api/cart`
- **Mục đích:** Lấy cart items từ database
- **Auth:** Required (Bearer token)
- **Response:** Array of cart items với product details

### POST `/api/cart`
- **Mục đích:** Thêm item vào cart
- **Auth:** Required (Bearer token)
- **Body:** `{ productId, productVariantId, quantity, selectedOptions }`

### PUT `/api/cart`
- **Mục đích:** Cập nhật quantity
- **Auth:** Required (Bearer token)
- **Body:** `{ cartItemId, quantity }`

### DELETE `/api/cart`
- **Mục đích:** Xóa item hoặc clear all
- **Auth:** Required (Bearer token)
- **Query:** `?id=xxx` (single) hoặc `?clearAll=true` (all)

### POST `/api/cart/merge`
- **Mục đích:** Merge guest cart vào database
- **Auth:** Required (Bearer token)
- **Body:** `{ items: GuestCartItem[] }`

---

## 💡 Best Practices

1. **Không lưu giá vào guest cart metadata** - Chỉ lưu productId, quantity, options
2. **Fetch giá từ API khi render** - Tránh hack giá từ localStorage
3. **Sử dụng persist middleware** - Hiển thị cart ngay lập tức (không flicker)
4. **Database là source of truth** - Cho logged-in users
5. **Auto-merge khi login** - Seamless user experience

