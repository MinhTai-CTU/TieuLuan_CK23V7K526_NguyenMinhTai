# Hướng dẫn cấu hình Stripe Webhook

## Tổng quan

Webhook là phương thức chính để xử lý thanh toán Stripe trong hệ thống này. Webhook đảm bảo:

- ✅ Xử lý thanh toán ngay cả khi người dùng đóng trình duyệt
- ✅ Xử lý các trường hợp bất đồng bộ (3D Secure)
- ✅ An toàn hơn (Stripe gửi từ server của họ)
- ✅ Idempotency - tránh duplicate processing

## Cấu hình Webhook trong Stripe Dashboard

### Bước 1: Tạo Webhook Endpoint

1. Đăng nhập vào [Stripe Dashboard](https://dashboard.stripe.com/)
2. Vào **Developers** > **Webhooks**
3. Click **Add endpoint**
4. Nhập URL webhook:

   ```
   https://yourdomain.com/api/stripe/webhook
   ```

   - **Lưu ý**: Thay `yourdomain.com` bằng domain thực tế của bạn
   - Đối với development, có thể dùng [Stripe CLI](https://stripe.com/docs/stripe-cli) để forward webhook đến localhost

### Bước 2: Chọn Events

Chọn các events sau:

- ✅ `payment_intent.succeeded` - Thanh toán thành công
- ✅ `payment_intent.payment_failed` - Thanh toán thất bại
- ✅ `payment_intent.canceled` - Thanh toán bị hủy

### Bước 3: Lấy Webhook Secret

1. Sau khi tạo endpoint, click vào endpoint đó
2. Tìm **Signing secret**
3. Click **Reveal** để hiển thị secret
4. Copy secret và thêm vào `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Cấu hình cho Development (Local)

### Sử dụng Stripe CLI

1. Cài đặt [Stripe CLI](https://stripe.com/docs/stripe-cli)

2. Login vào Stripe:

```bash
stripe login
```

3. Forward webhook đến local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Stripe CLI sẽ hiển thị webhook secret cho local development:

```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

5. Thêm secret này vào `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## Kiểm tra Webhook hoạt động

### Test trong Stripe Dashboard

1. Vào **Developers** > **Webhooks** > Chọn endpoint của bạn
2. Click **Send test webhook**
3. Chọn event: `payment_intent.succeeded`
4. Click **Send test webhook**
5. Kiểm tra logs trong server để xem webhook có được xử lý không

### Test với Stripe CLI

```bash
# Trigger test event
stripe trigger payment_intent.succeeded
```

## Luồng xử lý

### Khi thanh toán thành công:

1. **User thanh toán** → Stripe xử lý
2. **Stripe gửi webhook** → `/api/stripe/webhook`
3. **Webhook verify signature** → Đảm bảo request từ Stripe
4. **Webhook cập nhật database** → `paymentStatus: "PAID"`, `status: "PROCESSING"`
5. **User được redirect** → Trang success

### Idempotency

Webhook có cơ chế idempotency để tránh duplicate processing:

- Kiểm tra `paymentStatus` trước khi update
- Nếu đã `PAID`, không update lại
- Đảm bảo mỗi payment chỉ được xử lý một lần

## Xử lý lỗi

### Webhook không nhận được

**Nguyên nhân có thể:**

- URL webhook không đúng
- Server không accessible từ internet (development)
- Firewall chặn request

**Giải pháp:**

- Sử dụng Stripe CLI cho development
- Kiểm tra logs trong Stripe Dashboard
- Đảm bảo endpoint trả về 200 status

### Signature verification failed

**Nguyên nhân:**

- `STRIPE_WEBHOOK_SECRET` không đúng
- Request không phải từ Stripe

**Giải pháp:**

- Kiểm tra webhook secret trong `.env.local`
- Đảm bảo secret đúng với endpoint trong Stripe Dashboard

### Order không được cập nhật

**Nguyên nhân:**

- `orderId` không có trong metadata
- Order không tồn tại trong database
- Database connection issue

**Giải pháp:**

- Kiểm tra logs trong server
- Đảm bảo `orderId` được lưu trong payment intent metadata
- Kiểm tra database connection

## Monitoring

### Xem webhook logs trong Stripe Dashboard

1. Vào **Developers** > **Webhooks**
2. Click vào endpoint của bạn
3. Xem tab **Logs** để xem tất cả webhook events
4. Kiểm tra status code và response

### Xem logs trong server

Webhook sẽ log các thông tin sau:

- ✅ `Payment succeeded for order: {orderId} (via webhook)`
- ❌ `Payment failed for order: {orderId} (via webhook)`
- ⚠️ `Payment canceled for order: {orderId} (via webhook)`

## Best Practices

1. **Luôn verify signature** - Đảm bảo request từ Stripe
2. **Idempotency** - Xử lý duplicate events an toàn
3. **Error handling** - Log và xử lý lỗi đúng cách
4. **Monitoring** - Theo dõi webhook logs thường xuyên
5. **Testing** - Test kỹ với test cards và test events

## Troubleshooting

### Webhook không hoạt động trong production

1. Kiểm tra URL webhook có đúng không
2. Kiểm tra server có accessible từ internet không
3. Kiểm tra SSL certificate (Stripe yêu cầu HTTPS)
4. Kiểm tra firewall/security groups

### Webhook delay

- Webhook thường được gửi ngay lập tức
- Nếu delay, kiểm tra network và server performance
- Stripe sẽ retry nếu webhook fail (tối đa 3 lần)

## Tài liệu tham khảo

- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Security](https://stripe.com/docs/webhooks/signatures)
