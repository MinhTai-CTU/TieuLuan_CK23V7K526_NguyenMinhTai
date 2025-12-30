# Hướng dẫn tích hợp Stripe

## Cài đặt

1. Cài đặt các package cần thiết (đã được cài đặt):

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

## Cấu hình môi trường

Thêm các biến môi trường sau vào file `.env.local`:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Lấy Stripe Keys:

1. Đăng ký tài khoản tại [Stripe Dashboard](https://dashboard.stripe.com/)
2. Vào **Developers** > **API keys**
3. Copy **Publishable key** và **Secret key** (test mode)
4. Để lấy Webhook Secret:
   - Vào **Developers** > **Webhooks**
   - Tạo endpoint mới: `https://yourdomain.com/api/stripe/webhook`
   - Copy **Signing secret**

## Chạy Migration

Chạy migration để cập nhật database schema:

```bash
npm run db:migrate
```

Hoặc nếu muốn push trực tiếp (không tạo migration file):

```bash
npm run db:push
```

## Cấu hình Webhook

1. Trong Stripe Dashboard, tạo webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to send:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`

2. Copy **Signing secret** và thêm vào `.env.local` như `STRIPE_WEBHOOK_SECRET`

## Test với Stripe Test Cards

Sử dụng các thẻ test sau trong môi trường test:

- **Thẻ thành công**: `4242 4242 4242 4242`
- **Thẻ cần 3D Secure**: `4000 0025 0000 3155`
- **Thẻ thất bại**: `4000 0000 0000 0002`

Các thông tin khác:

- **Expiry**: Bất kỳ ngày trong tương lai (ví dụ: 12/25)
- **CVC**: Bất kỳ 3 chữ số (ví dụ: 123)
- **ZIP**: Bất kỳ 5 chữ số (ví dụ: 12345)

## Cấu trúc API Routes

### 1. `/api/stripe/create-payment-intent`

Tạo Payment Intent cho đơn hàng

**Method**: POST
**Body**:

```json
{
  "amount": 100000,
  "currency": "vnd",
  "orderId": "ORD-1234567890-ABC",
  "metadata": {
    "userId": "user-id"
  }
}
```

### 2. `/api/stripe/webhook`

Xử lý webhook từ Stripe

**Method**: POST
**Headers**: Stripe sẽ tự động thêm `stripe-signature`

### 3. `/api/stripe/confirm-payment`

Xác nhận thanh toán sau khi hoàn tất

**Method**: POST
**Body**:

```json
{
  "orderId": "ORD-1234567890-ABC",
  "paymentIntentId": "pi_xxx"
}
```

## Luồng thanh toán

1. Người dùng chọn phương thức thanh toán Stripe
2. Click "Đặt hàng"
3. Hệ thống tạo đơn hàng với status `PENDING`
4. Tạo Stripe Payment Intent
5. Hiển thị form thanh toán Stripe
6. Người dùng nhập thông tin thẻ
7. Stripe xử lý thanh toán
8. Webhook cập nhật trạng thái đơn hàng
9. Redirect đến trang success

## Lưu ý

- Stripe hỗ trợ VND nhưng cần cấu hình trong Stripe Dashboard
- Trong môi trường production, sử dụng live keys
- Luôn kiểm tra webhook signature để đảm bảo an toàn
- Test kỹ với các trường hợp: thành công, thất bại, hủy
