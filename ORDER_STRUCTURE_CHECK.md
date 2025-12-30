# Kiểm tra cấu trúc đơn hàng

## So sánh dữ liệu đầu vào vs Schema

### 1. Order Model

| Field trong Schema | Dữ liệu từ TotalAmount | API nhận | Status |
|-------------------|------------------------|----------|--------|
| `orderId` | ❌ Không gửi (tự generate) | ✅ Tự generate | ✅ OK |
| `userId` | ✅ `user?.id \|\| null` | ✅ `userId` | ✅ OK |
| `status` | ❌ Không gửi | ✅ Default "PENDING" | ✅ OK |
| `total` | ✅ `total` | ✅ `total` | ✅ OK |
| `promotionCode` | ⚠️ Có `discountCode` nhưng không gửi | ❌ Không nhận | ❌ **THIẾU** |
| `discountAmount` | ⚠️ Có `discountAmount` nhưng không gửi | ❌ Không nhận | ❌ **THIẾU** |
| `paymentMethod` | ✅ `selectedPaymentMethod` | ✅ `paymentMethod` | ✅ OK |
| `paymentStatus` | ❌ Không gửi | ✅ Default "PENDING" | ✅ OK |
| `stripePaymentIntentId` | ❌ Không gửi (set sau) | ❌ Không nhận | ✅ OK (set sau) |

### 2. OrderItem Model

| Field trong Schema | Dữ liệu từ TotalAmount | API nhận | Status |
|-------------------|------------------------|----------|--------|
| `productId` | ✅ `item.id` | ✅ `item.productId` | ✅ OK |
| `productVariantId` | ✅ `item.productVariantId \|\| null` | ✅ `item.productVariantId \|\| null` | ✅ OK |
| `quantity` | ✅ `item.quantity` | ✅ `item.quantity` | ✅ OK |
| `price` | ✅ `item.price` | ✅ `item.price` | ✅ OK |
| `discountedPrice` | ✅ `item.discountedPrice` | ✅ `item.discountedPrice` | ✅ OK |
| `selectedOptions` | ✅ `item.selectedOptions \|\| null` | ✅ `item.selectedOptions \|\| null` | ✅ OK |

### 3. Shipping Model

| Field trong Schema | Dữ liệu từ TotalAmount | API nhận | Status |
|-------------------|------------------------|----------|--------|
| `fullName` | ✅ `shippingAddress.fullName` | ✅ `shipping.fullName` | ✅ OK |
| `email` | ⚠️ `user?.email \|\| ""` | ✅ `shipping.email` | ⚠️ **CÓ THỂ RỖNG** |
| `phone` | ✅ `shippingAddress.phone \|\| ""` | ✅ `shipping.phone \|\| null` | ✅ OK |
| `address` | ✅ Full address string | ✅ `shipping.address` | ✅ OK |
| `city` | ✅ `shippingAddress.city` | ✅ `shipping.city` | ✅ OK |
| `postalCode` | ✅ `shippingAddress.postalCode \|\| null` | ✅ `shipping.postalCode \|\| null` | ✅ OK |
| `country` | ✅ `shippingAddress.country` | ✅ `shipping.country` | ✅ OK |
| `method` | ✅ Shipping method string | ✅ `shipping.method \|\| null` | ✅ OK |

## Vấn đề phát hiện

### ❌ Vấn đề 1: Thiếu promotionCode và discountAmount

**Vấn đề:**
- TotalAmount có `discountCode` và `discountAmount` nhưng không gửi lên API
- Schema Order có `promotionCode` và `discountAmount` nhưng không được lưu

**Giải pháp:**
- Cần gửi `promotionCode` và `discountAmount` trong request body
- API cần nhận và lưu vào database

### ⚠️ Vấn đề 2: Email có thể rỗng

**Vấn đề:**
- TotalAmount gửi `email: user?.email || ""` - có thể là empty string
- Schema Shipping yêu cầu `email: String` (không nullable)
- Nếu user không có email, sẽ lưu empty string - không lý tưởng

**Giải pháp:**
- Nên validate email trước khi tạo order
- Hoặc lấy email từ user profile nếu có

## Mapping dữ liệu

### TotalAmount → API Request

```typescript
// Hiện tại
{
  userId: user?.id || null,
  items: orderItems,  // ✅ OK
  shipping: shippingInfo,  // ⚠️ email có thể rỗng
  total: total,  // ✅ OK
  paymentMethod: selectedPaymentMethod,  // ✅ OK
  // ❌ Thiếu: promotionCode, discountAmount
}
```

### API Request → Database

```typescript
// Hiện tại
{
  orderId: generated,
  userId: userId || null,  // ✅ OK
  total: parseFloat(total),  // ✅ OK
  status: "PENDING",  // ✅ OK
  paymentMethod: paymentMethod || null,  // ✅ OK
  paymentStatus: "PENDING",  // ✅ OK
  // ❌ Thiếu: promotionCode, discountAmount
  items: { create: [...] },  // ✅ OK
  shipping: { create: {...} }  // ⚠️ email có thể rỗng
}
```

## Khuyến nghị sửa lỗi

1. **Thêm promotionCode và discountAmount vào request**
2. **Validate email trước khi tạo order**
3. **Có thể thêm validation cho các trường bắt buộc**

