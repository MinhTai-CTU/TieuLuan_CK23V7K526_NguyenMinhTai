import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// --- CẤU HÌNH MoMo ---
// Dùng credentials mẫu đã test thành công (giống endpoint test)
// Nếu có environment variables thì override, nhưng mặc định dùng credentials test
const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
  accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
  secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint:
    process.env.MOMO_ENDPOINT ||
    "https://test-payment.momo.vn/v2/gateway/api/create",
};

// Debug: Log config để kiểm tra
console.log("🔧 MoMo Config:", {
  partnerCode: MOMO_CONFIG.partnerCode,
  accessKey: MOMO_CONFIG.accessKey.substring(0, 5) + "***",
  secretKeyLength: MOMO_CONFIG.secretKey.length,
  hasEnvPartnerCode: !!process.env.MOMO_PARTNER_CODE,
  hasEnvAccessKey: !!process.env.MOMO_ACCESS_KEY,
  hasEnvSecretKey: !!process.env.MOMO_SECRET_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderId, description, returnUrl } = body;

    // 1. Chuẩn bị dữ liệu
    // MoMo yêu cầu số tiền là số nguyên (không có thập phân)
    const amountInt = Math.round(amount);
    const amountStr = amountInt.toString();

    // Format requestId giống code đang hoạt động: partnerCode + timestamp
    const requestId = MOMO_CONFIG.partnerCode + new Date().getTime();
    // orderId: Ưu tiên dùng orderId từ input (từ checkout), nếu không có thì dùng requestId
    const finalOrderId = orderId || requestId;
    // orderInfo: Dùng description từ input hoặc mặc định
    const orderInfo = description || `Thanh toán đơn hàng ${finalOrderId}`;

    // ĐỂ TRỐNG extraData ĐỂ TRÁNH LỖI FORMAT JSON
    const extraData = "";

    // IPN URL: MoMo Server sẽ gọi vào đây (cần public domain, localhost sẽ không nhận được nhưng không gây lỗi tạo link)
    const ipnUrl = "http://localhost:3000/api/momo/ipn";

    // Redirect URL: Sau khi thanh toán xong MoMo sẽ chuyển user về đây
    const redirectUrlValue =
      returnUrl ||
      `http://localhost:3000/checkout/success?orderId=${finalOrderId}`;

    const requestType = "captureWallet";

    // 2. Tạo chuỗi Raw Signature
    // QUAN TRỌNG: Thứ tự tham số phải đúng theo bảng chữ cái (alphabetical order)
    // Format: accessKey -> amount -> extraData -> ipnUrl -> orderId -> orderInfo -> partnerCode -> redirectUrl -> requestId -> requestType
    // LƯU Ý:
    // - KHÔNG được URL encode các giá trị trong raw signature, để nguyên giá trị gốc
    // - Dùng ipnUrl và redirectUrl trong signature (phải khớp với request body)
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amountStr}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${finalOrderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${redirectUrlValue}&requestId=${requestId}&requestType=${requestType}`;

    // Debug: In ra console để kiểm tra
    console.log("------------------------------------------------");
    console.log("🚀 MOMO PAYMENT REQUEST");
    console.log("👉 OrderID:", finalOrderId);
    console.log("👉 RequestID:", requestId);
    console.log("👉 Amount:", amountStr);
    console.log("👉 OrderInfo:", orderInfo);
    console.log("👉 RedirectUrl:", redirectUrlValue);
    console.log("👉 IpnUrl:", ipnUrl);
    console.log("👉 Raw Signature:", rawSignature);
    console.log("👉 Secret Key Length:", MOMO_CONFIG.secretKey.length);
    console.log("------------------------------------------------");

    // 3. Tạo chữ ký (HMAC-SHA256)
    const signature = crypto
      .createHmac("sha256", MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest("hex");

    console.log("👉 Generated Signature:", signature);

    // 4. Body gửi đi
    // Lưu ý: MoMo API v2 yêu cầu ipnUrl và redirectUrl trong request body
    // Format giống code mẫu đang hoạt động (đã test thành công)
    const requestBody = {
      partnerCode: MOMO_CONFIG.partnerCode,
      accessKey: MOMO_CONFIG.accessKey,
      requestId: requestId,
      amount: amountStr, // Dùng string như code mẫu
      orderId: finalOrderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrlValue,
      ipnUrl: ipnUrl,
      extraData: extraData,
      requestType: requestType,
      signature: signature,
      lang: "en", // Dùng "en" như code mẫu (đã test thành công)
    };

    // 5. Gọi API MoMo
    const response = await fetch(MOMO_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    // 6. Kiểm tra kết quả
    if (result.resultCode !== 0) {
      console.error("❌ MoMo API Error:", result);
      return NextResponse.json(
        { success: false, error: result.message, details: result },
        { status: 400 }
      );
    }

    console.log("✅ Tạo link thanh toán thành công:", result.payUrl);

    // 7. Cập nhật DB (Lưu requestId để đối soát sau này)
    // Chỉ cập nhật nếu orderId từ input khớp với orderId trong database
    if (orderId) {
      try {
        await prisma.order.update({
          where: { orderId },
          data: {
            paymentMethod: "momo",
            paymentStatus: "PENDING",
            stripePaymentIntentId: requestId, // Tạm lưu requestId vào trường này
          },
        });
      } catch (error) {
        // Nếu không tìm thấy order, không cần cập nhật (có thể là test không có order)
        console.warn("⚠️ Order not found for update:", orderId);
      }
    }

    return NextResponse.json(
      { success: true, data: { payUrl: result.payUrl } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Server Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
