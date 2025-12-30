import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// --- CẤU HÌNH MoMo TEST (Dữ liệu cứng để test) ---
// Dùng credentials mẫu đã test thành công từ code mẫu
const MOMO_CONFIG = {
  partnerCode: "MOMO",
  accessKey: "F8BBA842ECF85",
  secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint: "https://test-payment.momo.vn/v2/gateway/api/create",
};

export async function POST(request: NextRequest) {
  try {
    // Dữ liệu cứng để test (không cần tạo đơn hàng)
    const amount = "50000"; // 50,000 VND
    const requestId = MOMO_CONFIG.partnerCode + new Date().getTime();
    const orderId = requestId; // Dùng requestId làm orderId như code mẫu
    const orderInfo = "pay with MoMo";
    const redirectUrl =
      "http://localhost:3000/checkout/success?orderId=" + orderId;
    const ipnUrl = "http://localhost:3000/api/momo/ipn";
    const extraData = "";
    const requestType = "captureWallet";

    // Tạo chuỗi Raw Signature (theo alphabetical order)
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    // Debug: In ra console để kiểm tra
    console.log("------------------------------------------------");
    console.log("🧪 MOMO TEST PAYMENT (Hardcoded Data)");
    console.log("👉 PartnerCode:", MOMO_CONFIG.partnerCode);
    console.log("👉 AccessKey:", MOMO_CONFIG.accessKey);
    console.log("👉 OrderID:", orderId);
    console.log("👉 RequestID:", requestId);
    console.log("👉 Amount:", amount);
    console.log("👉 OrderInfo:", orderInfo);
    console.log("👉 RedirectUrl:", redirectUrl);
    console.log("👉 IpnUrl:", ipnUrl);
    console.log("👉 Raw Signature:", rawSignature);
    console.log("👉 Secret Key:", MOMO_CONFIG.secretKey);
    console.log("------------------------------------------------");

    // Tạo chữ ký (HMAC-SHA256)
    const signature = crypto
      .createHmac("sha256", MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest("hex");

    console.log("👉 Generated Signature:", signature);

    // Request body (giống hệt code mẫu)
    const requestBody = {
      partnerCode: MOMO_CONFIG.partnerCode,
      accessKey: MOMO_CONFIG.accessKey,
      requestId: requestId,
      amount: amount, // String như code mẫu
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      extraData: extraData,
      requestType: requestType,
      signature: signature,
      lang: "en",
    };

    console.log("👉 Request Body:", JSON.stringify(requestBody, null, 2));

    // Gọi API MoMo
    const response = await fetch(MOMO_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    console.log("👉 MoMo Response:", JSON.stringify(result, null, 2));

    // Kiểm tra kết quả
    if (result.resultCode !== 0) {
      console.error("❌ MoMo API Error:", result);
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          details: result,
          debug: {
            rawSignature,
            signature,
            requestBody,
          },
        },
        { status: 400 }
      );
    }

    console.log("✅ Tạo link thanh toán thành công:", result.payUrl);

    return NextResponse.json(
      {
        success: true,
        data: {
          payUrl: result.payUrl,
          orderId: orderId,
          requestId: requestId,
        },
        debug: {
          rawSignature,
          signature,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Server Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
