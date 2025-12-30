# Quy trình Xử lý Đơn hàng - Tài liệu Triển khai

## Tổng quan

Hệ thống đã được triển khai với quy trình xử lý đơn hàng hoàn chỉnh, tách biệt giữa **Order Status** (trạng thái đơn hàng) và **Payment Status** (trạng thái thanh toán).

## Cấu trúc Dữ liệu

### Order Status (Trạng thái Đơn hàng)
- `PENDING`: Chờ xác nhận/xử lý
- `PROCESSING`: Đang chuẩn bị hàng
- `SHIPPED`: Đang giao hàng
- `DELIVERED`: Đã giao hàng
- `CANCELLED`: Đã hủy

### Payment Status (Trạng thái Thanh toán)
- `PENDING`: Chưa thanh toán
- `PAID`: Đã thanh toán
- `FAILED`: Thanh toán thất bại
- `REFUNDED`: Đã hoàn tiền

## Quy trình COD (Thanh toán khi nhận hàng)

### 1. Đặt hàng
- Khách tạo đơn với `paymentMethod = "cod"`
- **Order Status**: `PENDING`
- **Payment Status**: `PENDING`

### 2. Duyệt đơn (Admin)
- Admin xác nhận đơn hợp lệ
- **Order Status**: `PENDING` → `PROCESSING`
- **Payment Status**: Vẫn `PENDING` (chưa thu tiền)

### 3. Giao hàng (Admin)
- Shop bàn giao cho bưu tá
- **Order Status**: `PROCESSING` → `SHIPPED`
- **Payment Status**: Vẫn `PENDING`

### 4. Hoàn tất
- Khách nhận hàng và trả tiền
- **Order Status**: `SHIPPED` → `DELIVERED`
- **Payment Status**: `PENDING` → `PAID` (tự động cập nhật khi status = DELIVERED)

## Quy trình Trả trước (Thẻ/Ví điện tử/QR)

### 1. Khởi tạo
- Khách bấm đặt hàng và chuyển sang cổng thanh toán
- **Order Status**: `PENDING`
- **Payment Status**: `PENDING`

### 2. Thanh toán thành công
- Cổng thanh toán báo về (Callback)
- **Payment Status**: `PENDING` → `PAID`
- **Order Status**: Vẫn `PENDING` (chờ admin duyệt)
- **Lưu ý**: Đơn đã thanh toán sẽ được ưu tiên hiển thị đầu danh sách

### 3. Duyệt & Chuẩn bị (Admin)
- Admin xác nhận đơn hợp lệ
- **Order Status**: `PENDING` → `PROCESSING`
- **Payment Status**: Vẫn `PAID`

### 4. Giao hàng (Admin)
- Shop bàn giao cho bưu tá
- **Order Status**: `PROCESSING` → `SHIPPED`
- **Payment Status**: Vẫn `PAID`
- **Lưu ý**: Phiếu in vận đơn phải hiển thị "Thu hộ (COD): 0đ"

### 5. Hoàn tất
- Khách nhận hàng
- **Order Status**: `SHIPPED` → `DELIVERED`
- **Payment Status**: Vẫn `PAID`

## Logic Tự động Hủy Đơn

### Điều kiện
- Đơn hàng có `status = PENDING`
- Đơn hàng có `paymentStatus = PENDING`
- Đơn hàng **KHÔNG** phải COD (`paymentMethod !== "cod"`)
- Đơn hàng được tạo quá 15 phút (mặc định, có thể cấu hình)

### API Endpoint
- `POST /api/orders/auto-cancel?timeout=15` - Thực hiện hủy đơn
- `GET /api/orders/auto-cancel?timeout=15` - Kiểm tra số đơn sẽ bị hủy (dry run)

### Cách sử dụng
Có thể gọi API này từ:
- Cron job (khuyến nghị: mỗi 5-10 phút)
- Scheduled task
- Background job

## Logic Duyệt Đơn (Approve)

### Điều kiện duyệt
1. Order Status phải là `PENDING`
2. Payment Status:
   - **COD**: `PENDING` (chưa thanh toán) - OK để duyệt
   - **Trả trước**: `PAID` (đã thanh toán) - OK để duyệt
   - **Không duyệt** nếu `FAILED`

### API Endpoint
- `POST /api/orders/[id]/approve` - Duyệt đơn hàng

### Hành động khi duyệt
1. Kiểm tra tồn kho
2. Trừ tồn kho (nếu đủ)
3. Cập nhật Order Status: `PENDING` → `PROCESSING`

## Logic Từ chối Đơn (Reject)

### Điều kiện từ chối
- Order Status phải là `PENDING`

### API Endpoint
- `POST /api/orders/[id]/reject` - Từ chối đơn hàng

### Hành động khi từ chối
1. Cập nhật Order Status: `PENDING` → `CANCELLED`
2. Nếu đã thanh toán (`paymentStatus = PAID`):
   - Cập nhật Payment Status: `PAID` → `REFUNDED`
3. Lưu lý do từ chối

## Cập nhật Payment Callbacks

Tất cả payment callbacks đã được cập nhật để:
- Sau khi thanh toán thành công → chuyển về `PENDING` (chờ admin duyệt)
- **KHÔNG** tự động chuyển sang `PROCESSING`

### Các Callback đã cập nhật:
1. `/api/stripe/webhook` - Stripe webhook
2. `/api/stripe/confirm-payment` - Stripe confirm payment
3. `/api/momo/ipn` - MoMo IPN
4. `/api/momo/confirm-payment` - MoMo confirm payment

## UI Updates

### Admin Panel (`/admin/orders`)
- Hiển thị cả Order Status và Payment Status
- Nút "Duyệt" và "Từ chối" cho đơn `PENDING`
- Card-based layout với màu sắc theo trạng thái
- Confirmation modal khi thay đổi trạng thái

### Customer Panel (`/my-account`)
- Hiển thị cả Order Status và Payment Status
- Badge màu sắc cho từng trạng thái
- Hiển thị rõ ràng phương thức thanh toán (COD vs Trả trước)

## Files Đã Cập nhật

### API Routes
- `src/app/api/orders/route.ts` - Tạo đơn hàng
- `src/app/api/orders/[id]/route.ts` - Cập nhật đơn hàng (tự động cập nhật payment khi DELIVERED)
- `src/app/api/orders/[id]/approve/route.ts` - Duyệt đơn
- `src/app/api/orders/[id]/reject/route.ts` - Từ chối đơn
- `src/app/api/orders/auto-cancel/route.ts` - Tự động hủy đơn (mới)
- `src/app/api/stripe/webhook/route.ts` - Stripe webhook
- `src/app/api/stripe/confirm-payment/route.ts` - Stripe confirm
- `src/app/api/momo/ipn/route.ts` - MoMo IPN
- `src/app/api/momo/confirm-payment/route.ts` - MoMo confirm

### UI Components
- `src/components/Admin/Orders/OrdersList.tsx` - Admin order list
- `src/components/Orders/index.tsx` - Customer order list
- `src/components/Orders/SingleOrder.tsx` - Single order display (có payment status)

## Testing Checklist

- [ ] Tạo đơn COD → Kiểm tra status ban đầu
- [ ] Duyệt đơn COD → Kiểm tra chuyển sang PROCESSING
- [ ] Tạo đơn trả trước → Kiểm tra status ban đầu
- [ ] Thanh toán đơn trả trước → Kiểm tra payment status = PAID, order status = PENDING
- [ ] Duyệt đơn trả trước → Kiểm tra chuyển sang PROCESSING
- [ ] Chuyển đơn sang SHIPPED → Kiểm tra status
- [ ] Chuyển đơn COD sang DELIVERED → Kiểm tra payment tự động = PAID
- [ ] Tự động hủy đơn quá thời gian → Kiểm tra API auto-cancel
- [ ] Từ chối đơn đã thanh toán → Kiểm tra refund logic

## Notes

- Tất cả payment callbacks đều chuyển về `PENDING` sau khi thanh toán thành công để admin duyệt
- Đơn đã thanh toán sẽ được ưu tiên hiển thị đầu danh sách (sắp xếp theo paymentStatus = PAID trước)
- Logic tự động hủy đơn chỉ áp dụng cho đơn trả trước, không áp dụng cho COD
- Khi đơn COD chuyển sang DELIVERED, payment status tự động chuyển sang PAID

