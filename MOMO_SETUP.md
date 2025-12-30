# Hướng dẫn tích hợp MoMo

## Tổng quan

MoMo (M_Service) là cổng thanh toán phổ biến tại Việt Nam, cho phép người dùng thanh toán qua ứng dụng MoMo hoặc QR code.

## Đăng ký tài khoản MoMo Merchant

### Cho môi trường DEV/Đồ án (Khuyến nghị):

1. Truy cập [MoMo Test Payment](https://test-payment.momo.vn/)
2. Đăng ký tài khoản test (miễn phí, không cần xác thực)
3. Nhận các thông tin sau từ MoMo Test Portal:
   - **Partner Code**: Mã đối tác test
   - **Access Key**: Key truy cập API test
   - **Secret Key**: Key bí mật test

**Lưu ý**: Chỉ cần test environment cho đồ án, không cần production!

### Cho môi trường Production:

1. Truy cập [MoMo Payment Platform](https://payment.momo.vn/)
2. Đăng ký tài khoản doanh nghiệp
3. Hoàn tất xác thực và ký hợp đồng với MoMo
4. Nhận credentials production từ MoMo

## Cấu hình môi trường

Thêm các biến môi trường sau vào file `.env.local`:

```env
# MoMo Configuration (Test/Sandbox cho đồ án)
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key

# MoMo Endpoint (Sandbox - mặc định cho test)
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

# Base URL cho IPN callback
# Cho dev: http://localhost:3000 (hoặc dùng ngrok nếu cần test IPN)
# Cho production: https://yourdomain.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Lưu ý cho đồ án:**

- ✅ Chỉ cần test environment - không cần production
- ✅ Lấy credentials từ [MoMo Test Payment](https://test-payment.momo.vn/)
- ✅ IPN có thể bỏ qua nếu chỉ demo (tự động cập nhật khi redirect)
- ✅ Xem chi tiết trong `MOMO_DEV_SETUP.md`

**Lưu ý:**

- `MOMO_ENDPOINT` mặc định là sandbox: `https://test-payment.momo.vn/v2/gateway/api/create`
- Production endpoint: `https://payment.momo.vn/v2/gateway/api/create`
- `NEXT_PUBLIC_BASE_URL` phải là URL công khai để MoMo có thể gọi IPN

## Cấu hình IPN URL

1. Trong MoMo Merchant Portal, cấu hình IPN URL:

   ```
   https://yourdomain.com/api/momo/ipn
   ```

2. MoMo sẽ gọi URL này sau khi thanh toán hoàn tất (Instant Payment Notification)

## Luồng thanh toán

### 1. User chọn MoMo

- User chọn phương thức thanh toán MoMo trong checkout
- Click "Đặt hàng"

### 2. Tạo đơn hàng

- Hệ thống tạo đơn hàng với `status: PENDING`, `paymentStatus: PENDING`
- `paymentMethod: "momo"`

### 3. Tạo MoMo Payment Request

- Frontend gọi `/api/momo/create-payment`
- Backend tạo payment request với MoMo API
- MoMo trả về `payUrl` (URL thanh toán)

### 4. Redirect đến MoMo

- Frontend redirect user đến `payUrl`
- User thanh toán trên MoMo (app hoặc web)

### 5. MoMo IPN Callback

- Sau khi thanh toán, MoMo gọi `/api/momo/ipn`
- Backend verify signature và cập nhật trạng thái đơn hàng:
  - `resultCode = 0` → `paymentStatus: PAID`, `status: PROCESSING`
  - `resultCode != 0` → `paymentStatus: FAILED`

### 6. Redirect về trang success

- MoMo redirect user về `redirectUrl` (trang success)
- User thấy thông báo đơn hàng thành công

## API Routes

### 1. `/api/momo/create-payment`

Tạo payment request với MoMo

**Method**: POST
**Body**:

```json
{
  "amount": 100000,
  "orderId": "ORD-1234567890-ABC",
  "userId": "user-id",
  "description": "Thanh toán đơn hàng ORD-1234567890-ABC",
  "returnUrl": "https://yourdomain.com/checkout/success?orderId=ORD-1234567890-ABC"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "payUrl": "https://payment.momo.vn/...",
    "requestId": "REQ-1234567890-ABC",
    "orderId": "ORD-1234567890-ABC"
  }
}
```

### 2. `/api/momo/ipn`

Xử lý IPN (Instant Payment Notification) từ MoMo

**Method**: POST
**Body** (từ MoMo):

```json
{
  "partnerCode": "...",
  "orderId": "...",
  "requestId": "...",
  "amount": 100000,
  "orderInfo": "...",
  "orderType": "...",
  "transId": "...",
  "resultCode": 0,
  "message": "Success",
  "payType": "...",
  "responseTime": 1234567890,
  "extraData": "...",
  "signature": "..."
}
```

**Response**:

```json
{
  "resultCode": 0,
  "message": "Success"
}
```

## Bảo mật

### Signature Verification

MoMo sử dụng HMAC-SHA256 để ký dữ liệu:

1. **Khi gửi request đến MoMo**:
   - Tạo signature từ dữ liệu + Secret Key
   - Format: `partnerCode=...&accessKey=...&requestId=...&amount=...&orderId=...&orderInfo=...&returnUrl=...&notifyUrl=...&extraData=...`
   - Gửi kèm trong request

2. **Khi nhận IPN từ MoMo**:
   - Verify signature bằng Secret Key
   - Format: `partnerCode=...&orderId=...&requestId=...&amount=...&orderInfo=...&orderType=...&transId=...&resultCode=...&message=...&payType=...&responseTime=...&extraData=...`
   - Chỉ xử lý nếu signature hợp lệ

### Best Practices

1. **Luôn verify signature** trước khi xử lý IPN
2. **Lưu trữ Secret Key an toàn** (không commit vào git)
3. **Sử dụng HTTPS** cho IPN URL
4. **Idempotency**: Kiểm tra trạng thái đơn hàng trước khi cập nhật

## Test với MoMo Sandbox

### Test Flow

1. Sử dụng sandbox endpoint: `https://test-payment.momo.vn/v2/gateway/api/create`
2. Đăng nhập vào MoMo Merchant Portal (sandbox)
3. Lấy Partner Code, Access Key, Secret Key từ sandbox
4. Test thanh toán với tài khoản test

## Xử lý lỗi

### Lỗi thường gặp

1. **Signature verification failed**
   - Kiểm tra Secret Key có đúng không
   - Kiểm tra format dữ liệu khi tạo signature
   - Đảm bảo thứ tự các tham số đúng

2. **Order not found**
   - Kiểm tra orderId trong extraData
   - Đảm bảo đơn hàng đã được tạo trước khi gọi MoMo

3. **IPN không được gọi**
   - Kiểm tra IPN URL có accessible từ internet không
   - Kiểm tra firewall/security groups
   - Kiểm tra IPN URL trong MoMo Merchant Portal

4. **Payment failed**
   - Kiểm tra số dư tài khoản test
   - Kiểm tra thông tin thanh toán
   - Xem logs trong MoMo Merchant Portal

## Monitoring

### Xem logs trong MoMo Merchant Portal

1. Đăng nhập vào MoMo Merchant Portal
2. Vào phần **Giao dịch** hoặc **Lịch sử**
3. Xem chi tiết các giao dịch

### Xem logs trong server

IPN sẽ log các thông tin:

- ✅ `MoMo payment succeeded for order: {orderId}`
- ❌ `MoMo payment failed for order: {orderId}, message: {message}`

## So sánh với Stripe và ZaloPay

| Tính năng   | MoMo            | ZaloPay         | Stripe              |
| ----------- | --------------- | --------------- | ------------------- |
| Phương thức | QR Code, App    | QR Code, App    | Card, Bank Transfer |
| Phạm vi     | Việt Nam        | Việt Nam        | Toàn cầu            |
| Phí         | Theo thỏa thuận | Theo thỏa thuận | 3.4% + phí cố định  |
| Callback    | IPN             | Webhook         | Webhook             |
| Signature   | HMAC-SHA256     | HMAC-SHA256     | HMAC-SHA256         |

## Tài liệu tham khảo

- [MoMo Payment Platform](https://payment.momo.vn/)
- [MoMo Developer Documentation](https://developers.momo.vn/)
- [MoMo API Reference](https://developers.momo.vn/docs/api/)
