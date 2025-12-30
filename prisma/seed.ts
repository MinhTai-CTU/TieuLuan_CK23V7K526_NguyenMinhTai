import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

// Tỷ giá quy đổi: 1 USD = 25,000 VND
const EXCHANGE_RATE = 25000;

// Hàm tạo slug xử lý tiếng Việt
const slugify = (value: string) =>
  value
    .normalize("NFD") // Tách dấu ra khỏi ký tự
    .replace(/[\u0300-\u036f]/g, "") // Xóa các dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// Mapping màu sắc với hex codes
const colorHexMap: Record<string, string> = {
  đen: "#000000",
  trắng: "#FFFFFF",
  "xanh dương": "#3B82F6",
  "xanh lá": "#10B981",
  hồng: "#EC4899",
  vàng: "#FBBF24",
  cam: "#F97316",
  tím: "#A855F7",
  đỏ: "#EF4444",
  bạc: "#9CA3AF",
  xám: "#6B7280",
  "xám không gian": "#374151",
  "xám nhạt": "#D1D5DB",
  "đen midnight": "#1F2937",
  "trắng starlight": "#F9FAFB",
};

// Helper function để tạo color object với id, label, hex
const createColor = (
  label: string
): { id: string; label: string; hex: string } => {
  const id = slugify(label);
  const hex = colorHexMap[label] || "#808080"; // Default gray if not found
  return { id, label, hex };
};

// Helper function để tạo mảng colors từ mảng labels
const createColors = (
  labels: string[]
): Array<{ id: string; label: string; hex: string }> => {
  return labels.map(createColor);
};

const categorySeed = [
  { title: "Tivi", img: "/images/categories/categories-01.png" },
  { title: "Laptop & PC", img: "/images/categories/categories-02.png" },
  { title: "Điện thoại & Tablet", img: "/images/categories/categories-03.png" },
  { title: "Game & Video", img: "/images/categories/categories-04.png" },
  { title: "Thiết bị gia dụng", img: "/images/categories/categories-05.png" },
  { title: "Sức khỏe & Thể thao", img: "/images/categories/categories-06.png" },
  { title: "Đồng hồ", img: "/images/categories/categories-07.png" },
];

const productSeed = [
  {
    title: "Tay cầm chơi game Havit HV-G69 USB",
    price: 59 * EXCHANGE_RATE,
    discountedPrice: 29 * EXCHANGE_RATE,
    reviews: 15,
    stock: 50,
    categorySlug: "game-video",
    description:
      "Tay cầm chơi game USB Havit HV-G69 là bộ điều khiển chuyên nghiệp được thiết kế cho các game thủ PC. Với thiết kế công thái học và các nút bấm nhạy, nó mang lại trải nghiệm chơi game tuyệt vời cho các thể loại hành động, đua xe và thể thao. Tay cầm có cần analog kép, phản hồi rung và các nút có thể lập trình để tùy chỉnh lối chơi.",
    additionalInfo: {
      "Thương hiệu": "Havit",
      Model: "HV-G69",
      "Kết nối": "USB 2.0",
      "Tương thích": "Windows 7/8/10/11, Android",
      "Nút bấm": "12 nút + 2 cần analog",
      Rung: "Mô tơ rung kép",
      "Dây cáp": "Cáp USB 1.5m",
      "Trọng lượng": "220g",
    },
    attributes: {
      colors: createColors(["đen", "trắng", "xanh dương"]),
    },
    images: {
      thumbnails: [
        "/images/products/product-1-sm-1.png",
        "/images/products/product-1-sm-2.png",
      ],
      previews: [
        "/images/products/product-1-bg-1.png",
        "/images/products/product-1-bg-2.png",
      ],
    },
  },
  {
    title: "iPhone 14 Plus, 6/128GB",
    price: 899 * EXCHANGE_RATE,
    discountedPrice: 799 * EXCHANGE_RATE, // Đã sửa lại giá khuyến mãi cho hợp lý hơn
    reviews: 5,
    stock: 30,
    categorySlug: "dien-thoai-tablet",
    description:
      "iPhone 14 Plus sở hữu màn hình Super Retina XDR 6.7 inch tuyệt đẹp, được trang bị chip A15 Bionic tiên tiến. Với hệ thống camera kép, thời lượng pin cả ngày và kết nối 5G, máy mang lại hiệu suất vượt trội cho nhiếp ảnh, chơi game và sử dụng hàng ngày. Thiết bị bao gồm các tính năng an toàn tiên tiến như Phát hiện va chạm và SOS khẩn cấp qua vệ tinh.",
    additionalInfo: {
      "Thương hiệu": "Apple",
      Model: "iPhone 14 Plus",
      "Kích thước màn hình": "6.7 inch",
      "Loại màn hình":
        "Super Retina XDR OLED, HDR10, Dolby Vision, 800 nits (HBM), 1200 nits (tối đa)",
      "Độ phân giải": "1284 x 2778 pixels, tỷ lệ 19.5:9",
      "Vi xử lý": "Apple A15 Bionic (5 nm)",
      "Bộ nhớ": "128GB 6GB RAM | 256GB 6GB RAM | 512GB 6GB RAM",
      "Camera chính": "12MP + 12MP | 4K@24/25/30/60fps, quay âm thanh stereo",
      "Camera selfie":
        "12 MP | 4K@24/25/30/60fps, 1080p@25/30/60/120fps, gyro-EIS",
      Pin: "Li-Ion 4323 mAh, liền máy | Sạc không dây 15W (MagSafe), 7.5W (Qi)",
      "Hệ điều hành": "iOS 16, có thể nâng cấp lên iOS 17",
      "Công nghệ mạng": "5G, 4G LTE",
    },
    attributes: {
      colors: createColors([
        "xanh dương",
        "tím",
        "đỏ",
        "vàng",
        "đen midnight",
        "trắng starlight",
      ]),
      storage: [
        { id: "gb128", title: "128 GB", price: 0 }, // Giá gốc
        { id: "gb256", title: "256 GB", price: 100 * EXCHANGE_RATE }, // +2.500.000
        { id: "gb512", title: "512 GB", price: 200 * EXCHANGE_RATE }, // +5.000.000
      ],
      type: [
        { id: "active", title: "Đã kích hoạt", price: 0 },
        { id: "inactive", title: "Chưa kích hoạt", price: 0 },
      ],
      sim: [
        { id: "dual", title: "2 SIM Vật lý", price: 0 },
        { id: "e-sim", title: "VN/A (1 eSIM, 1 Vật lý)", price: 0 },
      ],
    },
    images: {
      thumbnails: [
        "/images/products/product-2-sm-1.png",
        "/images/products/product-2-sm-2.png",
      ],
      previews: [
        "/images/products/product-2-bg-1.png",
        "/images/products/product-2-bg-2.png",
      ],
    },
  },
  {
    title: "Apple iMac M1 24-inch 2021",
    price: 1299 * EXCHANGE_RATE,
    discountedPrice: 1099 * EXCHANGE_RATE,
    reviews: 5,
    stock: 20,
    categorySlug: "laptop-pc",
    description:
      "Apple iMac M1 24-inch sở hữu màn hình Retina 4.5K tuyệt đẹp với công nghệ True Tone, được trang bị chip M1 mang tính cách mạng. Máy tính để bàn all-in-one này mang lại hiệu suất đáng kinh ngạc, hình ảnh sống động và thiết kế mỏng nhẹ. Với camera FaceTime HD 1080p, micro chất lượng phòng thu và hệ thống âm thanh 6 loa, đây là lựa chọn hoàn hảo cho các chuyên gia sáng tạo.",
    additionalInfo: {
      "Thương hiệu": "Apple",
      Model: "iMac 24-inch M1",
      "Kích thước màn hình": "24 inch",
      "Loại màn hình": "Màn hình Retina 4.5K với True Tone",
      "Độ phân giải": "4480 x 2520 pixels",
      "Vi xử lý": "Apple M1 chip (8-core CPU, 7-core hoặc 8-core GPU)",
      "Bộ nhớ (RAM)": "8GB bộ nhớ thống nhất (có thể cấu hình lên 16GB)",
      "Lưu trữ": "256GB, 512GB, hoặc 1TB SSD",
      Camera: "Camera FaceTime HD 1080p",
      "Âm thanh": "Hệ thống 6 loa với Spatial Audio",
      "Cổng kết nối":
        "Hai cổng Thunderbolt / USB 4, Hai cổng USB 3, Jack tai nghe 3.5mm",
      "Hệ điều hành": "macOS Monterey",
    },
    attributes: {
      colors: createColors([
        "xanh dương",
        "xanh lá",
        "hồng",
        "vàng",
        "cam",
        "tím",
      ]),
      storage: [
        { id: "gb256", title: "256 GB", price: 0 }, // Giá gốc
        { id: "gb512", title: "512 GB", price: 200 * EXCHANGE_RATE }, // +$200
        { id: "gb1tb", title: "1 TB", price: 400 * EXCHANGE_RATE }, // +$400
      ],
    },
    images: {
      thumbnails: [
        "/images/products/product-3-sm-1.png",
        "/images/products/product-3-sm-2.png",
      ],
      previews: [
        "/images/products/product-3-bg-1.png",
        "/images/products/product-3-bg-2.png",
      ],
    },
  },
  {
    title: "MacBook Air M1, 8/256GB",
    price: 1199 * EXCHANGE_RATE,
    discountedPrice: 999 * EXCHANGE_RATE,
    reviews: 6,
    stock: 25,
    categorySlug: "laptop-pc",
    description:
      "MacBook Air với chip M1 mang lại hiệu suất vượt trội trong một thiết kế mỏng nhẹ đáng kinh ngạc. Với thời lượng pin lên đến 18 giờ, màn hình Retina tuyệt đẹp và thiết kế không quạt yên tĩnh, đây là chiếc laptop hoàn hảo cho công việc, sáng tạo và giải trí. Chip M1 cung cấp hiệu suất nhanh chóng cho mọi tác vụ từ chỉnh sửa video đến chơi game.",
    additionalInfo: {
      "Thương hiệu": "Apple",
      Model: "MacBook Air M1",
      "Kích thước màn hình": "13.3 inch",
      "Loại màn hình": "Màn hình Retina với True Tone",
      "Độ phân giải": "2560 x 1600 pixels",
      "Vi xử lý": "Apple M1 chip (8-core CPU, 7-core GPU)",
      "Bộ nhớ (RAM)": "8GB bộ nhớ thống nhất (có thể cấu hình lên 16GB)",
      "Lưu trữ": "256GB, 512GB, 1TB, hoặc 2TB SSD",
      "Thời lượng pin": "Lên đến 18 giờ",
      "Bàn phím": "Bàn phím Magic Keyboard có đèn nền",
      Trackpad: "Force Touch trackpad",
      "Cổng kết nối": "Hai cổng Thunderbolt / USB 4, Jack tai nghe 3.5mm",
      "Hệ điều hành": "macOS Monterey",
      "Trọng lượng": "1.29 kg",
    },
    attributes: {
      colors: createColors(["bạc", "xám không gian", "vàng"]),
      storage: [
        { id: "gb256", title: "256 GB", price: 0 }, // Giá gốc
        { id: "gb512", title: "512 GB", price: 200 * EXCHANGE_RATE }, // +$200
        { id: "gb1tb", title: "1 TB", price: 400 * EXCHANGE_RATE }, // +$400
        { id: "gb2tb", title: "2 TB", price: 800 * EXCHANGE_RATE }, // +$800
      ],
    },
    images: {
      thumbnails: [
        "/images/products/product-4-sm-1.png",
        "/images/products/product-4-sm-2.png",
      ],
      previews: [
        "/images/products/product-4-bg-1.png",
        "/images/products/product-4-bg-2.png",
      ],
    },
  },
  {
    title: "Đồng hồ Apple Watch Ultra",
    price: 799 * EXCHANGE_RATE,
    discountedPrice: 699 * EXCHANGE_RATE,
    reviews: 3,
    stock: 40,
    categorySlug: "dong-ho",
    description:
      "Apple Watch Ultra là chiếc Apple Watch bền bỉ và mạnh mẽ nhất từ trước đến nay. Được chế tạo cho các cuộc phiêu lưu khắc nghiệt, nó có vỏ titan, màn hình lớn 49mm và thời lượng pin lên đến 60 giờ ở Chế độ Tiết kiệm Pin. Với khả năng theo dõi thể thao nâng cao, máy tính lặn và GPS tần số kép chính xác, đây là chiếc đồng hồ tối thượng cho các vận động viên và nhà thám hiểm.",
    additionalInfo: {
      "Thương hiệu": "Apple",
      Model: "Watch Ultra",
      "Chất liệu vỏ": "Titanium",
      "Kích thước màn hình": "49mm",
      "Loại màn hình": "Always-On Retina LTPO OLED",
      "Thời lượng pin":
        "Lên đến 36 giờ (sử dụng thường), lên đến 60 giờ (Chế độ tiết kiệm pin)",
      "Chống nước": "100 mét (WR100), máy tính lặn EN13319",
      GPS: "GPS tần số kép (L1 và L5)",
      "Cảm biến": "Nhịp tim, Oxy trong máu, Nhiệt độ, La bàn, Độ cao",
      "Kết nối": "Wi-Fi, Bluetooth 5.3, Cellular (tùy chọn)",
      "Hệ điều hành": "watchOS 9",
      "Chế độ tập luyện":
        "Hơn 100 loại bài tập bao gồm lặn, leo núi và ba môn phối hợp",
    },
    attributes: {
      colors: createColors(["cam", "xanh dương", "vàng"]),
      type: [
        { id: "45mm", title: "45mm", price: 0 }, // Giá gốc
        { id: "49mm", title: "49mm", price: 50 * EXCHANGE_RATE }, // +$50
      ],
    },
    images: {
      thumbnails: [
        "/images/products/product-5-sm-1.png",
        "/images/products/product-5-sm-2.png",
      ],
      previews: [
        "/images/products/product-5-bg-1.png",
        "/images/products/product-5-bg-2.png",
      ],
    },
  },
  {
    title: "Chuột Logitech MX Master 3",
    price: 129 * EXCHANGE_RATE,
    discountedPrice: 99 * EXCHANGE_RATE,
    reviews: 15,
    stock: 60,
    categorySlug: "laptop-pc",
    description:
      "Logitech MX Master 3 là chuột không dây tiên tiến được thiết kế cho năng suất và độ chính xác. Với thiết kế công thái học, cuộn MagSpeed và cảm biến độ chính xác cao Darkfield, nó hoạt động trên hầu hết mọi bề mặt. Chuột có các nút tùy chỉnh, kết nối đa thiết bị và thời lượng pin lên đến 70 ngày chỉ với một lần sạc.",
    additionalInfo: {
      "Thương hiệu": "Logitech",
      Model: "MX Master 3",
      "Kết nối": "Bluetooth hoặc đầu thu USB (Logi Bolt)",
      "Loại cảm biến": "Cảm biến Darkfield độ chính xác cao",
      DPI: "400 đến 4000 DPI",
      "Thời lượng pin": "Lên đến 70 ngày khi sạc đầy",
      "Thời gian sạc": "Sạc 3 phút = sử dụng cả ngày",
      "Đa thiết bị": "Kết nối tối đa 3 thiết bị",
      "Nút bấm": "7 nút (có thể tùy chỉnh)",
      "Cuộn trang": "Cuộn điện từ MagSpeed",
      "Tương thích": "Windows, macOS, Linux, iPadOS",
      "Trọng lượng": "141g",
    },
    attributes: {
      colors: createColors(["đen", "xám", "hồng", "xám nhạt"]),
    },
    images: {
      thumbnails: [
        "/images/products/product-6-sm-1.png",
        "/images/products/product-6-sm-2.png",
      ],
      previews: [
        "/images/products/product-6-bg-1.png",
        "/images/products/product-6-bg-2.png",
      ],
    },
  },
  {
    title: "iPad Air 5th Gen - 64GB",
    price: 699 * EXCHANGE_RATE,
    discountedPrice: 599 * EXCHANGE_RATE,
    reviews: 15,
    stock: 35,
    categorySlug: "dien-thoai-tablet",
    description:
      "Apple iPad Air thế hệ 5 sở hữu chip M1 mạnh mẽ, mang lại hiệu suất đẳng cấp máy tính để bàn cho một chiếc máy tính bảng mỏng nhẹ. Với màn hình Liquid Retina 10.9 inch tuyệt đẹp, camera trước Ultra Wide 12MP với Center Stage, và hỗ trợ Apple Pencil cùng Magic Keyboard, đây là thiết bị hoàn hảo cho sự sáng tạo, năng suất và giải trí.",
    additionalInfo: {
      "Thương hiệu": "Apple",
      Model: "iPad Air (thế hệ 5)",
      "Kích thước màn hình": "10.9 inch",
      "Loại màn hình": "Màn hình Liquid Retina với True Tone",
      "Độ phân giải": "2360 x 1640 pixels",
      "Vi xử lý": "Apple M1 chip",
      "Bộ nhớ (RAM)": "8GB RAM",
      "Lưu trữ": "64GB hoặc 256GB",
      "Camera trước": "12MP Ultra Wide với Center Stage",
      "Camera sau": "12MP Wide",
      "Thời lượng pin": "Lên đến 10 giờ lướt web hoặc xem video",
      "Kết nối": "Wi-Fi, Wi-Fi + Cellular (5G)",
      "Apple Pencil": "Tương thích với Apple Pencil (thế hệ 2)",
      "Hệ điều hành": "iPadOS 15",
      "Trọng lượng": "461g (Wi-Fi), 462g (Cellular)",
    },
    attributes: {
      colors: createColors([
        "xanh dương",
        "tím",
        "hồng",
        "trắng starlight",
        "xám không gian",
      ]),
      storage: [
        { id: "gb64", title: "64 GB", price: 0 }, // Giá gốc
        { id: "gb256", title: "256 GB", price: 150 * EXCHANGE_RATE }, // +$150
      ],
    },
    images: {
      thumbnails: [
        "/images/products/product-7-sm-1.png",
        "/images/products/product-7-sm-2.png",
      ],
      previews: [
        "/images/products/product-7-bg-1.png",
        "/images/products/product-7-bg-2.png",
      ],
    },
  },
  {
    title: "Router Wifi Asus RT Dual Band",
    price: 159 * EXCHANGE_RATE,
    discountedPrice: 129 * EXCHANGE_RATE,
    reviews: 15,
    stock: 45,
    categorySlug: "thiet-bi-gia-dung",
    description:
      "Router Asus RT Dual Band mang lại kết nối không dây tốc độ cao cho gia đình hoặc văn phòng của bạn. Với công nghệ băng tần kép (2.4GHz và 5GHz), nó cung cấp truy cập internet nhanh và ổn định cho nhiều thiết bị cùng lúc. Với các tính năng bảo mật tiên tiến, thiết lập dễ dàng và kiểm soát của phụ huynh, đây là giải pháp hoàn hảo cho nhu cầu mạng hiện đại.",
    additionalInfo: {
      "Thương hiệu": "Asus",
      Model: "RT-AC Series",
      "Chuẩn Wi-Fi": "802.11ac (Wi-Fi 5)",
      "Băng tần": "Băng tần kép: 2.4GHz và 5GHz",
      "Tốc độ không dây":
        "Lên đến 1200 Mbps (300 Mbps trên 2.4GHz + 867 Mbps trên 5GHz)",
      "Cổng Ethernet": "4 x Gigabit LAN, 1 x Gigabit WAN",
      "Cổng USB": "1 x USB 2.0, 1 x USB 3.0",
      "Vùng phủ sóng": "Lên đến 3000 sq ft (khoảng 280m2)",
      "Thiết bị tối đa": "Hơn 30 thiết bị",
      "Bảo mật": "WPA3, Hỗ trợ VPN, Tường lửa",
      "Kiểm soát phụ huynh": "Có",
      "Mạng khách": "Có",
      "MU-MIMO": "Có",
      Beamforming: "Có",
    },
    attributes: null,
    images: {
      thumbnails: [
        "/images/products/product-8-sm-1.png",
        "/images/products/product-8-sm-2.png",
      ],
      previews: [
        "/images/products/product-8-bg-1.png",
        "/images/products/product-8-bg-2.png",
      ],
    },
  },
  {
    title: "Ghế văn phòng công thái học",
    price: 500 * EXCHANGE_RATE,
    discountedPrice: 450 * EXCHANGE_RATE,
    reviews: 25,
    stock: 100,
    categorySlug: "thiet-bi-gia-dung",
    description:
      "Một chiếc ghế văn phòng công thái học thoải mái được thiết kế cho những giờ làm việc dài. Có tính năng điều chỉnh chiều cao, hỗ trợ thắt lưng và xoay 360 độ. Hoàn hảo cho văn phòng tại nhà và không gian làm việc chuyên nghiệp.",
    additionalInfo: {
      "Thương hiệu": "ComfortSeat",
      Model: "CS-500",
      "Chất liệu": "Lưng lưới, đệm da PU",
      "Tải trọng": "150kg",
      "Điều chỉnh chiều cao": "Có",
      "Hỗ trợ thắt lưng": "Có",
      "Tay vịn": "Điều chỉnh được",
      "Bảo hành": "5 năm",
    },
    attributes: null,
    images: {
      thumbnails: [
        "/images/products/product-1-sm-1.png",
        "/images/products/product-1-sm-2.png",
      ],
      previews: [
        "/images/products/product-1-bg-1.png",
        "/images/products/product-1-bg-2.png",
      ],
    },
  },
];

const testimonialSeed = [
  {
    authorName: "Nguyễn Văn An",
    authorRole: "Doanh nhân",
    authorImg: "/images/users/user-01.jpg",
    review:
      "Sản phẩm rất tuyệt vời, giao hàng nhanh chóng và đóng gói cẩn thận. Tôi rất hài lòng với trải nghiệm mua sắm tại đây.",
  },
  {
    authorName: "Trần Minh Tuấn",
    authorRole: "Lập trình viên Backend",
    authorImg: "/images/users/user-02.jpg",
    review:
      "Dịch vụ chăm sóc khách hàng rất tốt, nhân viên nhiệt tình hỗ trợ giải đáp thắc mắc. Sẽ tiếp tục ủng hộ shop trong tương lai.",
  },
  {
    authorName: "Lê Thị Mai",
    authorRole: "Quản lý kinh doanh",
    authorImg: "/images/users/user-03.jpg",
    review:
      "Chất lượng sản phẩm vượt ngoài mong đợi. Giá cả hợp lý so với thị trường. Rất đáng tiền!",
  },
  {
    authorName: "Phạm Đức Thắng",
    authorRole: "Khởi nghiệp",
    authorImg: "/images/users/user-01.jpg",
    review:
      "Giao diện website dễ sử dụng, tìm kiếm sản phẩm nhanh. Quy trình thanh toán mượt mà.",
  },
  {
    authorName: "Hoàng Quốc Bảo",
    authorRole: "Nhà đầu tư",
    authorImg: "/images/users/user-02.jpg",
    review:
      "Đã mua hàng nhiều lần và chưa bao giờ thất vọng. Uy tín và chất lượng luôn được đặt lên hàng đầu.",
  },
  {
    authorName: "Vũ Thị Lan",
    authorRole: "Thiết kế đồ họa",
    authorImg: "/images/users/user-03.jpg",
    review:
      "Mẫu mã đa dạng, hình ảnh sản phẩm chân thực. Nhận hàng y như hình quảng cáo.",
  },
];

const orderSeed = [
  {
    orderId: "234c56",
    createdAt: new Date("2022-05-18T10:00:00Z"),
    status: "DELIVERED" as const,
    total: 100 * EXCHANGE_RATE,
    title: "Kính mát",
  },
  {
    orderId: "234c57",
    createdAt: new Date("2022-05-18T11:30:00Z"),
    status: "PROCESSING" as const,
    total: 250 * EXCHANGE_RATE,
    title: "Đồng hồ",
  },
  {
    orderId: "234c58",
    createdAt: new Date("2022-05-18T12:00:00Z"),
    status: "CANCELLED" as const,
    total: 180 * EXCHANGE_RATE,
    title: "Tai nghe",
  },
];

async function main() {
  console.log("🌱 Đang khởi tạo dữ liệu mẫu...");

  // Tạo Roles
  console.log("📋 Đang tạo vai trò...");
  const customerRole = await prisma.role.upsert({
    where: { name: "CUSTOMER" },
    update: {},
    create: {
      name: "CUSTOMER",
      description: "Khách hàng thường với quyền mua sắm cơ bản",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Quản trị viên với toàn quyền hệ thống",
    },
  });

  console.log("✅ Đã tạo Roles");

  // Tạo Permissions
  console.log("🔐 Đang tạo quyền hạn...");
  const permissions = [
    // Quyền Khách hàng
    {
      name: "products.view",
      resource: "products",
      action: "view",
      description: "Xem sản phẩm",
    },
    {
      name: "products.search",
      resource: "products",
      action: "search",
      description: "Tìm kiếm sản phẩm",
    },
    {
      name: "orders.create",
      resource: "orders",
      action: "create",
      description: "Tạo đơn hàng",
    },
    {
      name: "orders.view.own",
      resource: "orders",
      action: "view.own",
      description: "Xem đơn hàng của mình",
    },
    {
      name: "wishlist.manage",
      resource: "wishlist",
      action: "manage",
      description: "Quản lý danh sách yêu thích",
    },
    {
      name: "reviews.create",
      resource: "reviews",
      action: "create",
      description: "Viết đánh giá",
    },
    {
      name: "profile.manage",
      resource: "profile",
      action: "manage",
      description: "Quản lý hồ sơ cá nhân",
    },

    // Quyền Admin (bao gồm quyền khách hàng +)
    {
      name: "products.create",
      resource: "products",
      action: "create",
      description: "Tạo sản phẩm mới",
    },
    {
      name: "products.update",
      resource: "products",
      action: "update",
      description: "Cập nhật sản phẩm",
    },
    {
      name: "products.delete",
      resource: "products",
      action: "delete",
      description: "Xóa sản phẩm",
    },
    {
      name: "categories.manage",
      resource: "categories",
      action: "manage",
      description: "Quản lý danh mục",
    },
    {
      name: "orders.view.all",
      resource: "orders",
      action: "view.all",
      description: "Xem tất cả đơn hàng",
    },
    {
      name: "orders.update",
      resource: "orders",
      action: "update",
      description: "Cập nhật trạng thái đơn hàng",
    },
    {
      name: "testimonials.manage",
      resource: "testimonials",
      action: "manage",
      description: "Quản lý đánh giá khách hàng",
    },
    {
      name: "reports.view",
      resource: "reports",
      action: "view",
      description: "Xem báo cáo cơ bản",
    },

    // Quyền Admin (bao gồm tất cả quyền)
    {
      name: "users.manage",
      resource: "users",
      action: "manage",
      description: "Quản lý người dùng",
    },
    {
      name: "roles.manage",
      resource: "roles",
      action: "manage",
      description: "Quản lý vai trò",
    },
    {
      name: "permissions.manage",
      resource: "permissions",
      action: "manage",
      description: "Quản lý quyền hạn",
    },
    {
      name: "system.settings",
      resource: "system",
      action: "settings",
      description: "Cài đặt hệ thống",
    },
    {
      name: "blogs.manage",
      resource: "blogs",
      action: "manage",
      description: "Quản lý bài viết blog",
    },
    {
      name: "reports.view.all",
      resource: "reports",
      action: "view.all",
      description: "Xem tất cả báo cáo",
    },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((perm) =>
      prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      })
    )
  );

  console.log("✅ Đã tạo Permissions");

  // Gán quyền cho vai trò
  console.log("🔗 Đang gán quyền cho vai trò...");

  // Quyền Khách hàng
  const customerPermissions = createdPermissions.filter((p) =>
    [
      "products.view",
      "products.search",
      "orders.create",
      "orders.view.own",
      "wishlist.manage",
      "reviews.create",
      "profile.manage",
    ].includes(p.name)
  );

  await Promise.all(
    customerPermissions.map((perm) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: customerRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: customerRole.id,
          permissionId: perm.id,
        },
      })
    )
  );

  // Quyền Admin (tất cả quyền)
  await Promise.all(
    createdPermissions.map((perm) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      })
    )
  );

  console.log("✅ Đã gán quyền thành công");

  // Tạo Users
  console.log("👤 Đang tạo người dùng...");

  // Hash passwords
  const customerPassword = await hashPassword("customer123");
  const adminPassword = await hashPassword("admin123");

  const [demoUser, adminUser] = await Promise.all([
    // Customer
    prisma.user.upsert({
      where: { email: "demo@nextmerce.com" },
      update: {
        password: customerPassword,
      },
      create: {
        email: "demo@nextmerce.com",
        name: "Khách hàng Demo",
        password: customerPassword,
        userRoles: {
          create: {
            roleId: customerRole.id,
          },
        },
      },
    }),
    // Admin
    prisma.user.upsert({
      where: { email: "admin@nextmerce.com" },
      update: {
        password: adminPassword,
      },
      create: {
        email: "admin@nextmerce.com",
        name: "Quản trị viên",
        password: adminPassword,
        userRoles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    }),
  ]);

  // Minh Tai - vừa ADMIN vừa CUSTOMER
  const minhTaiUser = await prisma.user.upsert({
    where: { email: "minhtai2019cb2@gmail.com" },
    update: {
      password: adminPassword,
      name: "Minh Tại",
    },
    create: {
      email: "minhtai2019cb2@gmail.com",
      name: "Minh Tại",
      password: adminPassword,
    },
  });

  // Xóa các role cũ của minhTaiUser (nếu có)
  await prisma.userRole.deleteMany({
    where: { userId: minhTaiUser.id },
  });

  // Tạo lại với cả 2 role: CUSTOMER và ADMIN
  await prisma.userRole.createMany({
    data: [
      {
        userId: minhTaiUser.id,
        roleId: customerRole.id,
      },
      {
        userId: minhTaiUser.id,
        roleId: adminRole.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log(
    `✅ Đã tạo user ${minhTaiUser.email} với cả ADMIN và CUSTOMER role`
  );

  console.log("✅ Đã tạo Users");

  // Tiếp tục với danh mục và sản phẩm...
  const categories = await Promise.all(
    categorySeed.map((category) =>
      prisma.category.upsert({
        where: { slug: slugify(category.title) },
        update: {
          title: category.title,
          img: category.img,
        },
        create: {
          title: category.title,
          slug: slugify(category.title),
          img: category.img,
          description: `Sản phẩm thuộc danh mục ${category.title} được tổng hợp từ dữ liệu mẫu.`,
        },
      })
    )
  );

  const categoryMap = categories.reduce<Record<string, string>>((acc, cat) => {
    acc[cat.slug] = cat.id;
    return acc;
  }, {});

  console.log("✅ Đã tạo Categories");

  // Hàm kiểm tra variants
  const hasVariants = (attributes: any): boolean => {
    if (!attributes) return false;
    return !!(
      (Array.isArray(attributes.storage) && attributes.storage.length > 0) ||
      (Array.isArray(attributes.type) && attributes.type.length > 0) ||
      (Array.isArray(attributes.sim) && attributes.sim.length > 0)
    );
  };

  // Hàm tạo variants
  const generateVariants = (
    product: any,
    basePrice: number,
    baseDiscountedPrice: number | null
  ): any[] => {
    if (!hasVariants(product.attributes)) return [];

    const attributes = product.attributes;
    const variants: any[] = [];

    const colors = attributes.colors || [];
    const storages = attributes.storage || [];
    const types = attributes.type || [];
    const sims = attributes.sim || [];

    const colorList =
      colors.length > 0
        ? colors.map((c: any) =>
            typeof c === "string" ? c : c.title || c.id || c
          )
        : [null];

    const storageList = storages.length > 0 ? storages : [null];
    const typeList = types.length > 0 ? types : [null];
    const simList = sims.length > 0 ? sims : [null];

    const totalVariants =
      colorList.length * storageList.length * typeList.length * simList.length;

    const stockPerVariant = Math.max(
      Math.floor(product.stock / totalVariants),
      10
    );

    for (const color of colorList) {
      for (const storage of storageList) {
        for (const type of typeList) {
          for (const sim of simList) {
            const options: any = {};
            let additionalPrice = 0;
            let skuParts: string[] = [];

            if (color) {
              options.color = color;
              skuParts.push(slugify(color));
            }

            if (storage) {
              options.storage = storage.id || storage.title || storage;
              additionalPrice += storage.price || 0;
              skuParts.push(storage.id || slugify(storage.title));
            }
            if (type) {
              options.type = type.id || type.title || type;
              additionalPrice += type.price || 0;
              skuParts.push(type.id || slugify(type.title));
            }
            if (sim) {
              options.sim = sim.id || sim.title || sim;
              additionalPrice += sim.price || 0;
              skuParts.push(sim.id || slugify(sim.title));
            }

            const variantPrice = basePrice + additionalPrice;
            const variantDiscountedPrice = baseDiscountedPrice
              ? baseDiscountedPrice + additionalPrice
              : null;

            let variantImage: string | null = null;
            if (color) {
              // Sử dụng logic đơn giản hóa cho tên file ảnh vì tên file gốc là tiếng Anh/số
              // Giả định màu tiếng Việt được map sang tiếng Anh hoặc giữ nguyên file gốc
              // Ở đây ta giữ nguyên logic cũ nhưng lưu ý tên file ảnh trên server chưa đổi
              const baseImage =
                product.images?.previews?.[0] ||
                product.images?.thumbnails?.[0];
              if (baseImage) {
                // Chỉ là ví dụ, thực tế cần file ảnh tương ứng
                // Do tên màu đã Việt hóa (xanh, đỏ...), logic replace này có thể không khớp với tên file ảnh gốc
                // Nên ta sẽ giữ nguyên ảnh gốc cho variant
                variantImage = baseImage;
              }
            }

            variants.push({
              price: variantPrice,
              discountedPrice: variantDiscountedPrice,
              stock: stockPerVariant,
              sku: `${slugify(product.title).toUpperCase()}-${skuParts.join("-")}`,
              options: options as Prisma.InputJsonValue,
              image: variantImage,
            });
          }
        }
      }
    }

    return variants;
  };

  const products = await Promise.all(
    productSeed.map(async (product) => {
      const slug = slugify(product.title);
      const categoryId = categoryMap[product.categorySlug];
      const productHasVariants = hasVariants(product.attributes);
      const variants = productHasVariants
        ? generateVariants(product, product.price, product.discountedPrice)
        : [];

      const createdProduct = await prisma.product.upsert({
        where: { slug },
        update: {
          title: product.title,
          description:
            product.description || `${product.title} được nhập từ dữ liệu mẫu.`,
          price: productHasVariants ? 0 : product.price,
          discountedPrice: productHasVariants ? null : product.discountedPrice,
          reviews: product.reviews,
          stock: productHasVariants ? 0 : product.stock,
          hasVariants: productHasVariants,
          categoryId,
          isActive: true,
          attributes: product.attributes as Prisma.InputJsonValue | undefined,
          additionalInfo: product.additionalInfo as
            | Prisma.InputJsonValue
            | undefined,
          images: {
            deleteMany: {},
            create: [
              ...product.images.thumbnails.map((url) => ({
                url,
                type: "THUMBNAIL" as const,
              })),
              ...product.images.previews.map((url) => ({
                url,
                type: "PREVIEW" as const,
              })),
            ],
          },
          variants: productHasVariants
            ? {
                deleteMany: {},
                create: variants,
              }
            : undefined,
        },
        create: {
          title: product.title,
          slug,
          description:
            product.description || `${product.title} được nhập từ dữ liệu mẫu.`,
          price: productHasVariants ? 0 : product.price,
          discountedPrice: productHasVariants ? null : product.discountedPrice,
          reviews: product.reviews,
          stock: productHasVariants ? 0 : product.stock,
          hasVariants: productHasVariants,
          categoryId,
          attributes: product.attributes as Prisma.InputJsonValue | undefined,
          additionalInfo: product.additionalInfo as
            | Prisma.InputJsonValue
            | undefined,
          images: {
            create: [
              ...product.images.thumbnails.map((url) => ({
                url,
                type: "THUMBNAIL" as const,
              })),
              ...product.images.previews.map((url) => ({
                url,
                type: "PREVIEW" as const,
              })),
            ],
          },
          variants: productHasVariants
            ? {
                create: variants,
              }
            : undefined,
        },
      });

      return createdProduct;
    })
  );

  console.log("✅ Đã tạo Products");

  // Xóa tất cả banners đã seed trước đó
  console.log("🗑️ Đang xóa dữ liệu banner đã seed...");
  await prisma.banner.deleteMany({});
  console.log("✅ Đã xóa tất cả banners");

  // Tạo banners
  console.log("🎨 Đang tạo banners...");
  const bannerData = [
    {
      title: "True Wireless Noise Cancelling Headphone",
      subtitle: "30% Sale Off",
      description:
        "Trải nghiệm âm thanh tuyệt vời với công nghệ chống ồn tiên tiến",
      image: "/images/hero/hero-01.png",
      link: "/shop-with-sidebar",
      buttonText: "Mua ngay",
      bgGradient: "from-blue-500 via-blue-600 to-purple-600",
      order: 1,
      isActive: true,
    },
    {
      title: "iPhone 16 Series",
      subtitle: "Mới ra mắt",
      description: "Công nghệ mới nhất, hiệu năng vượt trội",
      image: "/images/hero/hero_iphone01.png",
      link: "/shop-with-sidebar",
      buttonText: "Khám phá",
      bgGradient: "from-blue-950 via-indigo-600 to-indigo-300",
      order: 2,
      isActive: true,
    },
    {
      title: "Samsung Galaxy S24 FE 5G",
      subtitle: "Siêu mỏng nhẹ",
      description: "Hiệu năng mạnh mẽ, pin lâu dài",
      image: "/images/hero/hero_samsung-galaxy-s24-fe.png",
      link: "/blogs/blog-details?slug=in-thoi-samsung-galaxy-s24-fe-5g-8gb256gb",
      buttonText: "Tìm hiểu",
      bgGradient: "from-indigo-600 via-purple-600 to-pink-600",
      order: 3,
      isActive: true,
    },
  ];

  for (const banner of bannerData) {
    await prisma.banner.create({
      data: banner,
    });
  }
  console.log("✅ Đã tạo banners");

  // Xóa tất cả blogs đã seed trước đó
  console.log("🗑️ Đang xóa dữ liệu blog đã seed...");
  await prisma.blog.deleteMany({});
  console.log("✅ Đã xóa tất cả blogs");

  // Tạo blog mặc định
  console.log("📝 Đang tạo blog mặc định...");
  const blogData = {
    title: "Điện thoại Samsung Galaxy S24 FE 5G 8GB/256GB",
    slug: slugify("in-thoi-samsung-galaxy-s24-fe-5g-8gb256gb"), // Tự động tạo slug từ title
    content: `
    "<h2><strong>Thông số kỹ thuật</strong></h2><h2><strong>Thông tin sản phẩm</strong></h2><h3><a target="_blank" rel="" href="https://www.thegioididong.com/dtdd/samsung-galaxy-s24-fe-8gb-256gb"><strong>Samsung Galaxy S24 FE 256GB</strong></a><strong> mang đến sự nâng cấp vượt trội về hiệu suất và trải nghiệm người dùng. Với vi xử lý Exynos 2400e, máy không chỉ hoạt động mạnh mẽ mà còn tối ưu tốt cho các ứng dụng AI. Bên cạnh đó, màn hình rộng và camera chất lượng cao là những điểm nổi bật khiến Galaxy S24 FE trở nên hấp dẫn.</strong></h3><h3><strong>Sắc màu đa dạng, bền bỉ và chắc chắn</strong></h3><p>Galaxy S24 FE 256GB sở hữu thiết kế vuông vắn, sắc nét, toát lên vẻ thanh lịch và hiện đại. Không dừng lại ở đó, hãng còn khéo léo bo cong nhẹ các cạnh viền, giúp trải nghiệm cầm nắm trở nên thoải mái và dễ chịu hơn, không gây cảm giác cấn tay khi sử dụng lâu dài.</p><p>Gam màu trẻ trung, nổi bật trên mặt lưng chính là điểm nhấn quen thuộc của dòng Galaxy, và S24 FE cũng không ngoại lệ. Với sự lựa chọn giữa các màu sắc đen, xám, xanh lá và xanh dương, thiết bị này kết hợp hoàn hảo nét thanh lịch tinh tế với sự hiện đại đầy năng động.</p><p></p><img class="max-w-full h-auto max-h-[500px] object-cover rounded-lg" src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329785/samsung-galaxy-s24-fe-8gb-256gb-111024-023753-372.jpg" alt="Samsung Galaxy S24 FE 5G 8GB/256GB - Màu sắc" title="Samsung Galaxy S24 FE 5G 8GB/256GB - Màu sắc"><p>Galaxy S24 FE sở hữu khả năng bảo vệ mạnh mẽ, được tạo nên từ khung kim loại vững vàng và kính cường lực Gorilla Glass Victus+. Chuẩn kháng nước và bụi IP68 mang đến cho sản phẩm sức chịu đựng ưu việt, giúp thiết bị hoạt động ổn định dù có va đập, rơi rớt hay tiếp xúc với điều kiện môi trường khắc nghiệt.</p><p></p><img class="max-w-full h-auto max-h-[500px] object-cover rounded-lg" src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329785/samsung-galaxy-s24-fe-8gb-256gb-111024-023750-598.jpg" alt="Samsung Galaxy S24 FE 5G 8GB/256GB - Chuẩn IP68" title="Samsung Galaxy S24 FE 5G 8GB/256GB - Chuẩn IP68"><h3><strong>Camera siêu nét, AI hỗ trợ tối ưu</strong></h3><p>Galaxy S24 FE 256GB có bộ camera sau được nâng cấp vượt trội. Cảm biến chính 50 MP giúp chụp ảnh sắc nét, sống động ngay cả khi ánh sáng yếu. Ống kính siêu rộng 12 MP ghi lại toàn cảnh thiên nhiên, còn ống kính tele 8 MP với zoom quang học giúp chụp rõ các chi tiết ở xa. Đây là công cụ tuyệt vời cho những ai yêu thích sáng tạo.</p><p></p><img class="max-w-full h-auto max-h-[500px] object-cover rounded-lg" src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329785/samsung-galaxy-s24-fe-8gb-256gb-111024-023748-731.jpg" alt="Samsung Galaxy S24 FE 5G 8GB/256GB - Hệ thống camera" title="Samsung Galaxy S24 FE 5G 8GB/256GB - Hệ thống camera"><p>Nhờ sự hỗ trợ mạnh mẽ từ AI, hệ thống camera trên thiết bị tự động mang lại cho người dùng những bức ảnh với ánh sáng hài hòa, làn da mượt mà cùng khả năng tùy chỉnh dễ dàng. Công nghệ AI này không chỉ nhận diện và phân tích cảnh vật một cách thông minh mà còn điều chỉnh thông số một cách tự động, giúp việc chụp và chỉnh sửa ảnh trở nên nhanh gọn và dễ dàng.</p><p></p><img class="max-w-full h-auto max-h-[500px] object-cover rounded-lg" src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329785/samsung-galaxy-s24-fe-8gb-256gb-111024-023744-460.jpg" alt="Samsung Galaxy S24 FE 5G 8GB/256GB - Ảnh chụp trên camera" title="Samsung Galaxy S24 FE 5G 8GB/256GB - Ảnh chụp trên camera"><p>ProVisual Engine trên Galaxy S24 FE 256GB giúp hình ảnh ban đêm trở nên rõ ràng và sống động hơn. Dù ánh sáng yếu, công nghệ này vẫn giữ cho ảnh sắc nét và chi tiết, giúp bạn dễ dàng chụp những khoảnh khắc đẹp vào ban đêm mà không cần chỉnh sửa phức tạp.</p><p>Camera trước 10 MP cho ảnh selfie rõ nét và khi kết hợp với tính năng xóa phông và làm đẹp, bạn có thể chỉnh độ sáng, làm mịn da và tập trung vào chủ thể mà không lo bị mờ khi có người khác trong ảnh.</p><h3><strong>Màn hình Dynamic AMOLED 2X hiển thị sống động</strong></h3><p>Samsung Galaxy S24 FE 256GB có màn hình Dynamic AMOLED 2X rộng 6.7 inch, giúp bạn có trải nghiệm xem sống động. Hơn nữa, độ phân giải Full HD+ cùng với tấm nền chất lượng giúp hình ảnh rõ nét, ngay cả các chi tiết nhỏ.</p><p></p><img class="max-w-full h-auto max-h-[500px] object-cover rounded-lg" src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329785/samsung-galaxy-s24-fe-8gb-256gb-111024-023751-508.jpg" alt="Samsung Galaxy S24 FE 5G 8GB/256GB - Màn hình" title="Samsung Galaxy S24 FE 5G 8GB/256GB - Màn hình"><p>Bên cạnh đó, tần số quét 120 Hz giúp các chuyển động trở nên mượt mà hơn, không bị giật lag, đặc biệt tốt khi chơi game hoặc xem video, đem lại trải nghiệm giải trí trọn vẹn hơn.</p><p>Samsung Galaxy S24 FE 256GB, với độ sáng lên tới 1900 nits, mang lại trải nghiệm hình ảnh rực rỡ và sắc nét ngay cả dưới ánh nắng gay gắt. Độ sáng cao giúp màu sắc hiển thị chuẩn xác và sống động, cho dù bạn đang xem video, chơi game hay làm việc với các ứng dụng đồ họa.</p><p></p><img class="max-w-full h-auto max-h-[500px] object-cover rounded-lg" src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329785/samsung-galaxy-s24-fe-8gb-256gb-111024-023749-717.jpg" alt="Samsung Galaxy S24 FE 5G 8GB/256GB - Độ sáng cao" title="Samsung Galaxy S24 FE 5G 8GB/256GB - Độ sáng cao"><h3><strong>Hiệu năng tối ưu kết hợp với trí tuệ AI thông minh</strong></h3><p>Hệ điều hành Android 14 trên chiếc <a target="_blank" rel="" href="https://www.thegioididong.com/dtdd-samsung">điện thoại Samsung</a> này mang lại những cải tiến quan trọng về bảo mật, giúp bảo vệ dữ liệu cá nhân của người dùng một cách an toàn hơn. Không chỉ vậy, hệ điều hành này còn tích hợp những tính năng thông minh như trợ lý ảo nâng cấp, giúp người dùng thực hiện các công việc hằng ngày dễ dàng và nhanh chóng hơn.</p><p>Samsung Galaxy S24 FE 256GB được trang bị vi xử lý Exynos 2400e 8 nhân, dựa trên kiến trúc 4 nm giúp tối ưu hóa cả hiệu suất lẫn pin. Với chip này, mọi tác vụ, từ đơn giản đến phức tạp, đều được xử lý mượt mà. Thiết bị hỗ trợ tốt cho việc chơi game, làm việc đa nhiệm và xử lý đồ họa một cách ổn định và tiết kiệm năng lượng.</p><p></p><img class="max-w-full h-auto max-h-[500px] object-cover rounded-lg" src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329785/samsung-galaxy-s24-fe-8gb-256gb-111024-023754-339.jpg" alt="Samsung Galaxy S24 FE 5G 8GB/256GB - Tính năng AI" title="Samsung Galaxy S24 FE 5G 8GB/256GB - Tính năng AI"><p>Những tính năng AI ưu việt như tìm kiếm thông qua hình ảnh, dịch trực tiếp và trợ lý ghi chú giúp người dùng làm việc một cách dễ dàng và hiệu quả hơn. Không những thế, tính năng chat thông minh mang lại khả năng tương tác tự nhiên, giúp giải quyết các vấn đề một cách hiệu quả và nhanh chóng.</p><h3><strong>Khả năng sạc linh hoạt, viên pin kéo dài cả ngày</strong></h3><p>Samsung Galaxy S24 FE 256GB sở hữu viên pin 4700 mAh mạnh mẽ, dễ dàng đáp ứng mọi hoạt động trong ngày, từ lướt web, xem video mà không phải lo lắng về pin hết. Hơn thế nữa, với sạc nhanh 25W, bạn có thể nhanh chóng nạp đầy năng lượng, mang lại sự tiện lợi tối đa khi cần dùng <a target="_blank" rel="" href="https://www.thegioididong.com/dtdd">điện thoại</a> ngay lập tức.</p><p></p><img class="max-w-full h-auto max-h-[500px] object-cover rounded-lg" src="https://cdnv2.tgdd.vn/mwg-static/tgdd/Products/Images/42/329785/samsung-galaxy-s24-fe-8gb-256gb-111024-023752-425.jpg" alt="Samsung Galaxy S24 FE 5G 8GB/256GB - Pin" title="Samsung Galaxy S24 FE 5G 8GB/256GB - Pin"><p>Chiếc <a target="_blank" rel="" href="https://www.thegioididong.com/dtdd?g=android">điện thoại Android</a> này còn mang đến sự đa dạng trong khả năng sạc, bao gồm sạc nhanh, sạc có dây qua cổng Type-C và cả sạc không dây. Đặc biệt, tính năng sạc ngược không dây biến chiếc điện thoại thành một cục sạc dự phòng tiện lợi, sẵn sàng nạp năng lượng cho tai nghe, đồng hồ thông minh hay thậm chí là các điện thoại khác.</p>"
    `,
    excerpt:
      "Galaxy S24 FE 256GB sở hữu thiết kế vuông vắn, sắc nét, toát lên vẻ thanh lịch và hiện đại. Không dừng lại ở đó, hãng còn khéo léo bo cong nhẹ các cạnh viền, giúp trải nghiệm cầm nắm trở nên thoải mái và dễ chịu hơn, không gây cảm giác cấn tay khi sử dụng lâu dài.",
    img: "/uploads/blogs/blog-1767068490271-97f9lmzflzn.webp",
    published: true,
    authorId: minhTaiUser.id,
  };

  await prisma.blog.create({
    data: blogData,
  });
  console.log("✅ Đã tạo blog mặc định");

  await Promise.all(
    testimonialSeed.map((testimonial, index) =>
      prisma.testimonial.upsert({
        where: { id: `${slugify(testimonial.authorName)}-${index}` },
        update: {
          review: testimonial.review,
          authorName: testimonial.authorName,
          authorRole: testimonial.authorRole,
          authorImg: testimonial.authorImg,
          isActive: true,
        },
        create: {
          id: `${slugify(testimonial.authorName)}-${index}`,
          review: testimonial.review,
          authorName: testimonial.authorName,
          authorRole: testimonial.authorRole,
          authorImg: testimonial.authorImg,
          isActive: true,
        },
      })
    )
  );

  console.log("✅ Đã tạo Testimonials");

  const productMap = products.reduce<Record<string, string>>((acc, product) => {
    acc[product.slug] = product.id;
    return acc;
  }, {});

  await Promise.all(
    orderSeed.map((order, index) =>
      prisma.order.upsert({
        where: { orderId: order.orderId },
        update: {
          status: order.status,
          total: order.total,
          items: {
            deleteMany: {},
            create: [
              {
                productId:
                  productMap[
                    Object.keys(productMap)[
                      index % Object.keys(productMap).length
                    ]
                  ],
                quantity: 1 + (index % 2),
                price: order.total / 2,
                discountedPrice: order.total / 2 - 200000,
              },
            ],
          },
          shipping: {
            upsert: {
              update: {
                fullName: "Khách hàng Demo",
                email: "demo@nextmerce.com",
                address: "123 Đường Demo",
                city: "Thành phố Demo",
                country: "Việt Nam",
                postalCode: "70000",
                method: "Tiêu chuẩn",
              },
              create: {
                fullName: "Khách hàng Demo",
                email: "demo@nextmerce.com",
                address: "123 Đường Demo",
                city: "Thành phố Demo",
                country: "Việt Nam",
                postalCode: "70000",
                method: "Tiêu chuẩn",
              },
            },
          },
        },
        create: {
          orderId: order.orderId,
          createdAt: order.createdAt,
          status: order.status,
          total: order.total,
          userId: demoUser.id,
          items: {
            create: [
              {
                productId:
                  productMap[
                    Object.keys(productMap)[
                      index % Object.keys(productMap).length
                    ]
                  ],
                quantity: 1 + (index % 2),
                price: order.total / 2,
                discountedPrice: order.total / 2 - 200000,
              },
            ],
          },
          shipping: {
            create: {
              fullName: "Khách hàng Demo",
              email: "demo@nextmerce.com",
              address: "123 Đường Demo",
              city: "Thành phố Demo",
              country: "Việt Nam",
              postalCode: "70000",
              method: "Tiêu chuẩn",
            },
          },
        },
      })
    )
  );

  console.log("✅ Đã tạo Orders");

  // === TẠO KHUYẾN MÃI ===
  console.log("🎟️ Đang tạo khuyến mãi...");

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  // Case 1: Giảm giá toàn bộ đơn hàng - 30%, tối đa 500k
  const promotion1 = await prisma.promotion.upsert({
    where: { code: "XINCHAO30" },
    update: {},
    create: {
      code: "XINCHAO30",
      name: "Chào mừng giảm 30%",
      description: "Giảm 30% tổng đơn hàng, tối đa 500,000 VNĐ",
      scope: "GLOBAL_ORDER",
      type: "PERCENTAGE",
      value: 30,
      maxDiscount: 500000,
      startDate: now,
      endDate: nextYear,
      usageLimit: null,
      perUserLimit: 1,
      minOrderValue: 100000,
      isActive: true,
    },
  });

  console.log("✅ Promotion 1 created: XINCHAO30");

  // Case 2: Giảm giá sản phẩm cụ thể - "Ghế" (Ergonomic Office Chair)
  const chairProduct = products.find((p) =>
    p.title.toLowerCase().includes("ghế")
  );

  if (chairProduct) {
    const promotion2 = await prisma.promotion.upsert({
      where: { code: "GHE100" },
      update: {},
      create: {
        code: "GHE100",
        name: "Ưu đãi ghế văn phòng",
        description: "Giảm 20% cho sản phẩm Ghế văn phòng công thái học",
        scope: "SPECIFIC_ITEMS",
        type: "PERCENTAGE",
        value: 20,
        maxDiscount: null,
        startDate: now,
        endDate: nextYear,
        usageLimit: null,
        perUserLimit: null,
        minOrderValue: null,
        isActive: true,
        targets: {
          create: {
            productId: chairProduct.id,
            variantId: null,
            specificValue: null, // Dùng chung 20% của Promotion
          },
        },
      },
    });

    console.log("✅ Promotion 2 created: GHE100");
  }

  // Case 3: Giảm giá variant cụ thể - iPhone variants
  const iphoneProduct = products.find((p) =>
    p.title.toLowerCase().includes("iphone")
  );

  if (iphoneProduct) {
    const iphoneVariants = await prisma.productVariant.findMany({
      where: { productId: iphoneProduct.id },
    });

    const variant64GB = iphoneVariants.find((v) => {
      const options = v.options as any;
      return options.storage === "gb128" || options.storage?.includes("128");
    });

    const variant256GB = iphoneVariants.find((v) => {
      const options = v.options as any;
      return options.storage === "gb256" || options.storage?.includes("256");
    });

    if (variant64GB && variant256GB) {
      const promotion3 = await prisma.promotion.upsert({
        where: { code: "TAOKHUYET" },
        update: {},
        create: {
          code: "TAOKHUYET",
          name: "Ưu đãi Apple Fan",
          description: "iPhone 128GB giảm 5%, iPhone 256GB giảm 10%",
          scope: "SPECIFIC_ITEMS",
          type: "PERCENTAGE",
          value: 0,
          maxDiscount: null,
          startDate: now,
          endDate: nextYear,
          usageLimit: null,
          perUserLimit: null,
          minOrderValue: null,
          isActive: true,
          targets: {
            create: [
              {
                variantId: variant64GB.id,
                productId: null,
                specificValue: 5,
              },
              {
                variantId: variant256GB.id,
                productId: null,
                specificValue: 10,
              },
            ],
          },
        },
      });

      console.log("✅ Promotion 3 created: TAOKHUYET");
    }
  }

  console.log("✅ Đã tạo các chương trình khuyến mãi");
  console.log("🎉 Khởi tạo dữ liệu hoàn tất!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi khởi tạo dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
