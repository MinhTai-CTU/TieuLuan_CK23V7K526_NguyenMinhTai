# Hướng dẫn lấy thông tin MoMo cho môi trường DEV (Đồ án)

## Tổng quan

Để nộp đồ án, bạn chỉ cần sử dụng **MoMo Sandbox/Test Environment** - không cần đăng ký tài khoản thật hay public website.

## Cách 1: Sử dụng MoMo Test Environment (Khuyến nghị)

### Bước 1: Truy cập MoMo Test Payment

1. Truy cập: [MoMo Test Payment](https://test-payment.momo.vn/)
2. Đăng ký tài khoản test (miễn phí, không cần xác thực doanh nghiệp)
3. Hoặc sử dụng tài khoản test có sẵn nếu MoMo cung cấp

### Bước 2: Lấy thông tin API

Sau khi đăng nhập vào MoMo Test Portal:

1. Vào phần **Cài đặt** hoặc **API Settings**
2. Tìm các thông tin sau:
   - **Partner Code**: Mã đối tác (ví dụ: `MOMO`)
   - **Access Key**: Key truy cập (ví dụ: `F8BBA842ECF85`)
   - **Secret Key**: Key bí mật (ví dụ: `K951B6PE1waDMi640xX08PD3vg6EkVlz`)

**Lưu ý**: Theo tài liệu MoMo, có thể sử dụng test credentials mẫu:

- Partner Code: `MOMO`
- Access Key: `F8BBA842ECF85`
- Secret Key: `K951B6PE1waDMi640xX08PD3vg6EkVlz`

Tuy nhiên, nên lấy credentials từ tài khoản test của bạn để đảm bảo an toàn.

### Bước 3: Cấu hình trong `.env.local`

```env
# MoMo Configuration (Sandbox/Test)
# Lấy từ MoMo Test Portal hoặc dùng test credentials mẫu
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz

# MoMo Endpoint (Sandbox - mặc định)
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

# Base URL cho IPN callback (localhost cho dev)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Lưu ý**:

- Test credentials trên là từ tài liệu MoMo, có thể dùng để test
- Nên thay bằng credentials từ tài khoản test của bạn
- Không commit credentials vào git (đã có trong .gitignore)

## Cách 2: Sử dụng Mock/Test Credentials (Cho demo)

Nếu không thể đăng ký MoMo test account, bạn có thể:

### Option A: Sử dụng test credentials mẫu

MoMo thường cung cấp test credentials trong tài liệu. Ví dụ:

```env
# Test credentials (ví dụ - cần thay bằng credentials thật từ MoMo)
MOMO_PARTNER_CODE=MOMOXKXX
MOMO_ACCESS_KEY=xxxxxxxxxxxxx
MOMO_SECRET_KEY=xxxxxxxxxxxxx
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Option B: Mock API cho demo (Nếu không có credentials)

Nếu không có credentials thật, có thể tạo mock API để demo flow:

1. Tạo mock response trong `/api/momo/create-payment`
2. Trả về mock `payUrl` để demo UI
3. Bỏ qua IPN thực tế, tự động cập nhật trạng thái sau khi "thanh toán"

## Cách 3: Sử dụng ngrok cho IPN (Nếu cần test IPN thật)

Nếu muốn test IPN callback thật:

1. **Cài đặt ngrok**: [https://ngrok.com/](https://ngrok.com/)

2. **Chạy ngrok để expose localhost**:

   ```bash
   ngrok http 3000
   ```

3. **Lấy URL từ ngrok** (ví dụ: `https://abc123.ngrok.io`)

4. **Cập nhật `.env.local`**:

   ```env
   NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
   ```

5. **Cấu hình IPN URL trong MoMo Portal**:
   ```
   https://abc123.ngrok.io/api/momo/ipn
   ```

## Hướng dẫn chi tiết từng bước

### Bước 1: Đăng ký MoMo Test Account

1. Truy cập: [https://test-payment.momo.vn/](https://test-payment.momo.vn/)
2. Click **Đăng ký** hoặc **Sign Up**
3. Điền thông tin:
   - Email
   - Mật khẩu
   - Tên doanh nghiệp (có thể dùng tên test)
4. Xác nhận email (nếu cần)

### Bước 2: Lấy API Credentials

Sau khi đăng nhập:

1. Vào **Dashboard** hoặc **Merchant Portal**
2. Tìm phần **API Settings** hoặc **Cài đặt API**
3. Copy các thông tin:
   - **Partner Code**
   - **Access Key**
   - **Secret Key**

### Bước 3: Cấu hình IPN URL (Nếu test IPN)

1. Trong MoMo Portal, tìm phần **IPN Settings** hoặc **Webhook Settings**
2. Nhập IPN URL:
   - Nếu dùng ngrok: `https://your-ngrok-url.ngrok.io/api/momo/ipn`
   - Nếu chỉ demo: Có thể bỏ qua, tự động cập nhật sau khi redirect

### Bước 4: Test Payment

1. Sử dụng test credentials
2. Test với số tiền nhỏ (ví dụ: 10,000 VND)
3. Kiểm tra flow hoạt động đúng

## Lưu ý cho đồ án

### ✅ Những gì cần có:

1. **Code tích hợp MoMo** - Đã có ✅
2. **API routes** - Đã có ✅
3. **UI/UX** - Đã có ✅
4. **Test credentials** - Cần lấy từ MoMo test portal
5. **Documentation** - Đã có ✅

### ⚠️ Những gì KHÔNG cần:

1. ❌ Tài khoản production
2. ❌ Website public
3. ❌ Ký hợp đồng thật
4. ❌ Xác thực doanh nghiệp

### 📝 Cho bài nộp:

1. **Screenshot** MoMo test portal với credentials (ẩn một phần nếu nhạy cảm)
2. **Video demo** flow thanh toán
3. **Giải thích** trong báo cáo:
   - Đã tích hợp MoMo payment gateway
   - Sử dụng MoMo sandbox environment
   - Flow hoạt động: Create payment → Redirect → IPN callback → Update order

## Tài liệu tham khảo

- [MoMo Test Payment](https://test-payment.momo.vn/)
- [MoMo Developer Docs](https://developers.momo.vn/) (nếu có)
- [MoMo API Documentation](https://developers.momo.vn/docs/) (nếu có)

## Troubleshooting

### Không tìm thấy API Settings trong portal

- Kiểm tra xem đã đăng nhập đúng tài khoản test chưa
- Liên hệ support MoMo để được hướng dẫn
- Sử dụng mock API cho demo nếu cần

### IPN không được gọi

- Nếu chỉ demo, có thể bỏ qua IPN
- Tự động cập nhật trạng thái khi user quay lại từ MoMo
- Hoặc thêm nút "Xác nhận thanh toán" để demo

### Không có tài khoản test

- Liên hệ MoMo support để xin test account
- Hoặc sử dụng mock API để demo flow
- Giải thích trong báo cáo rằng đã tích hợp nhưng chưa có credentials để test thật
