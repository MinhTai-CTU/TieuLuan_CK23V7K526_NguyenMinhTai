# Quy trình xử lý đơn hàng cho Chủ Shop

## Trạng thái đơn hàng

### ✅ PROCESSING = Thanh toán thành công

- Khi đơn hàng có `status: PROCESSING` và `paymentStatus: PAID` → **Đơn hàng đã được thanh toán thành công**
- Đây là trạng thái bắt đầu quy trình xử lý của shop

## Quy trình xử lý đơn hàng (Order Fulfillment)

### 1. **Xác nhận đơn hàng (Order Confirmation)**

- **Mục đích**: Xác nhận đơn hàng hợp lệ trước khi xử lý
- **Hành động**:
  - Kiểm tra thông tin đơn hàng (sản phẩm, số lượng, địa chỉ)
  - Kiểm tra tồn kho (nếu có hệ thống quản lý kho)
  - Xác nhận thông tin khách hàng
- **Thời gian**: Ngay sau khi nhận đơn (tự động hoặc thủ công)
- **Kết quả**: Đơn hàng vẫn ở trạng thái `PROCESSING` hoặc chuyển sang trạng thái mới

### 2. **Chuẩn bị hàng (Order Preparation)**

- **Mục đích**: Chuẩn bị sản phẩm để giao hàng
- **Hành động**:
  - Lấy sản phẩm từ kho
  - Kiểm tra chất lượng sản phẩm
  - Đóng gói sản phẩm
  - In nhãn vận chuyển (nếu có)
- **Thời gian**: 1-2 ngày làm việc (tùy quy mô shop)
- **Kết quả**: Đơn hàng sẵn sàng để giao cho đơn vị vận chuyển

### 3. **Giao cho đơn vị vận chuyển (Shipping)**

- **Mục đích**: Chuyển hàng cho đơn vị vận chuyển
- **Hành động**:
  - Giao hàng cho đơn vị vận chuyển (Goship, GHTK, Viettel Post, etc.)
  - Lấy mã vận đơn (tracking number)
  - Cập nhật mã vận đơn vào hệ thống
- **Thời gian**: Ngay sau khi chuẩn bị xong
- **Kết quả**: Đơn hàng chuyển sang trạng thái `SHIPPED`
- **Dữ liệu cần lưu**:
  - Mã vận đơn (tracking number)
  - Tên đơn vị vận chuyển
  - Ngày giao hàng
  - Link tracking (nếu có)

### 4. **Theo dõi vận chuyển (Tracking)**

- **Mục đích**: Theo dõi hành trình đơn hàng
- **Hành động**:
  - Cập nhật trạng thái vận chuyển từ đơn vị vận chuyển
  - Thông báo cho khách hàng về tiến độ
  - Xử lý các vấn đề phát sinh (chậm trễ, thất lạc, etc.)
- **Thời gian**: Liên tục cho đến khi giao thành công
- **Kết quả**: Đơn hàng vẫn ở trạng thái `SHIPPED`

### 5. **Giao hàng thành công (Delivered)**

- **Mục đích**: Xác nhận khách hàng đã nhận hàng
- **Hành động**:
  - Xác nhận từ đơn vị vận chuyển
  - Xác nhận từ khách hàng (nếu có feedback)
  - Hoàn tất đơn hàng
- **Thời gian**: Sau khi đơn vị vận chuyển xác nhận giao thành công
- **Kết quả**: Đơn hàng chuyển sang trạng thái `DELIVERED`
- **Sau khi DELIVERED**:
  - Có thể yêu cầu đánh giá từ khách hàng
  - Cập nhật doanh thu
  - Lưu trữ đơn hàng

## Các trường hợp đặc biệt

### 1. **Đơn hàng bị hủy (Cancelled)**

- **Khi nào**:
  - Khách hàng yêu cầu hủy (trước khi giao hàng)
  - Hết hàng không thể giao
  - Thông tin đơn hàng không hợp lệ
- **Hành động**:
  - Hủy đơn hàng
  - Hoàn tiền (nếu đã thanh toán)
  - Cập nhật tồn kho (nếu đã trừ)
- **Kết quả**: Đơn hàng chuyển sang trạng thái `CANCELLED`

### 2. **Đơn hàng bị trả lại (Return/Refund)**

- **Khi nào**:
  - Khách hàng không nhận được hàng
  - Hàng bị hỏng, sai sản phẩm
  - Khách hàng không hài lòng
- **Hành động**:
  - Xử lý yêu cầu trả hàng
  - Hoàn tiền (nếu cần)
  - Nhận lại hàng
  - Cập nhật tồn kho
- **Kết quả**: Có thể tạo đơn hoàn tiền riêng

## Dashboard cho Chủ Shop

### 1. **Trang quản lý đơn hàng (Orders Management)**

- Danh sách đơn hàng theo trạng thái
- Lọc theo: Trạng thái, Ngày, Khách hàng, Phương thức thanh toán
- Tìm kiếm theo mã đơn hàng, tên khách hàng
- Thống kê: Tổng đơn, Đơn mới, Đơn đang xử lý, Đơn đã giao

### 2. **Chi tiết đơn hàng (Order Details)**

- Thông tin đơn hàng: Mã đơn, Ngày đặt, Tổng tiền
- Thông tin khách hàng: Tên, Email, SĐT
- Danh sách sản phẩm: Tên, Số lượng, Giá
- Địa chỉ giao hàng
- Trạng thái thanh toán
- Mã vận đơn (nếu đã giao)
- Lịch sử cập nhật trạng thái

### 3. **Các hành động có thể thực hiện**

- **Xác nhận đơn hàng**: Chuyển từ PENDING → PROCESSING (nếu chưa tự động)
- **Cập nhật trạng thái**: PROCESSING → SHIPPED → DELIVERED
- **Thêm mã vận đơn**: Khi giao cho đơn vị vận chuyển
- **Hủy đơn hàng**: Chuyển sang CANCELLED
- **In hóa đơn**: In hóa đơn/phiếu giao hàng
- **Gửi email thông báo**: Thông báo cho khách hàng về trạng thái đơn

## Tự động hóa (Automation Ideas)

### 1. **Tự động xác nhận đơn hàng**

- Khi thanh toán thành công → Tự động chuyển sang PROCESSING
- Gửi email xác nhận đơn hàng cho khách hàng

### 2. **Tự động kiểm tra tồn kho**

- Kiểm tra tồn kho khi đơn hàng được tạo
- Cảnh báo nếu hết hàng
- Tự động cập nhật tồn kho khi đơn hàng được xác nhận

### 3. **Tích hợp với đơn vị vận chuyển**

- Tự động tạo đơn vận chuyển khi chuyển sang SHIPPED
- Tự động lấy mã vận đơn
- Tự động cập nhật trạng thái từ webhook của đơn vị vận chuyển

### 4. **Thông báo tự động**

- Email/SMS cho khách hàng khi:
  - Đơn hàng được xác nhận
  - Đơn hàng đã được giao cho đơn vị vận chuyển
  - Đơn hàng đang trên đường giao
  - Đơn hàng đã giao thành công

## Báo cáo và Thống kê

### 1. **Báo cáo doanh thu**

- Doanh thu theo ngày/tuần/tháng
- Số lượng đơn hàng
- Giá trị đơn hàng trung bình
- Top sản phẩm bán chạy

### 2. **Báo cáo trạng thái đơn hàng**

- Số đơn đang xử lý
- Số đơn đã giao
- Số đơn bị hủy
- Tỷ lệ hoàn thành đơn hàng

### 3. **Báo cáo khách hàng**

- Khách hàng mới
- Khách hàng quay lại
- Top khách hàng

## Ưu tiên phát triển

### Phase 1: Cơ bản (Must Have)

1. ✅ Trang quản lý đơn hàng (danh sách + chi tiết)
2. ✅ Cập nhật trạng thái đơn hàng thủ công
3. ✅ Thêm mã vận đơn
4. ✅ Hủy đơn hàng

### Phase 2: Nâng cao (Should Have)

1. Tự động gửi email thông báo
2. Tích hợp với đơn vị vận chuyển (tự động tạo đơn)
3. In hóa đơn/phiếu giao hàng
4. Lọc và tìm kiếm nâng cao

### Phase 3: Tối ưu (Nice to Have)

1. Dashboard thống kê
2. Tự động cập nhật trạng thái từ webhook vận chuyển
3. Quản lý tồn kho tích hợp
4. Báo cáo chi tiết

## Lưu ý quan trọng

1. **Trạng thái PROCESSING = Đã thanh toán thành công** ✅
2. **Luôn lưu mã vận đơn** khi giao cho đơn vị vận chuyển
3. **Thông báo khách hàng** về mọi thay đổi trạng thái
4. **Xử lý nhanh** các đơn hàng đã thanh toán để tăng trải nghiệm khách hàng
5. **Theo dõi đơn hàng** để đảm bảo giao đúng hạn
