import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const categorySeed = [
  { title: "Televisions", img: "/images/categories/categories-01.png" },
  { title: "Laptop & PC", img: "/images/categories/categories-02.png" },
  { title: "Mobile & Tablets", img: "/images/categories/categories-03.png" },
  { title: "Games & Videos", img: "/images/categories/categories-04.png" },
  { title: "Home Appliances", img: "/images/categories/categories-05.png" },
  { title: "Health & Sports", img: "/images/categories/categories-06.png" },
  { title: "Watches", img: "/images/categories/categories-07.png" },
];

const productSeed = [
  {
    title: "Havit HV-G69 USB Gamepad",
    price: 59,
    discountedPrice: 29,
    reviews: 15,
    stock: 50,
    categorySlug: "games-videos",
    description:
      "The Havit HV-G69 USB Gamepad is a professional gaming controller designed for PC gaming enthusiasts. With its ergonomic design and responsive buttons, it provides an excellent gaming experience for action, racing, and sports games. The gamepad features dual analog sticks, vibration feedback, and programmable buttons for customizable gameplay.",
    additionalInfo: {
      Brand: "Havit",
      Model: "HV-G69",
      Connectivity: "USB 2.0",
      Compatibility: "Windows 7/8/10/11, Android",
      Buttons: "12 buttons + 2 analog sticks",
      Vibration: "Dual vibration motors",
      Cable: "1.5m USB cable",
      Weight: "220g",
    },
    attributes: {
      colors: ["black", "white", "blue"],
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
    title: "iPhone 14 Plus , 6/128GB",
    price: 899,
    discountedPrice: 99,
    reviews: 5,
    stock: 30,
    categorySlug: "mobile-tablets",
    description:
      "The iPhone 14 Plus features a stunning 6.7-inch Super Retina XDR display, powered by the advanced A15 Bionic chip. With its dual-camera system, all-day battery life, and 5G connectivity, it delivers exceptional performance for photography, gaming, and everyday use. The device includes advanced safety features like Crash Detection and Emergency SOS via satellite.",
    additionalInfo: {
      Brand: "Apple",
      Model: "iPhone 14 Plus",
      "Display Size": "6.7 inches",
      "Display Type":
        "Super Retina XDR OLED, HDR10, Dolby Vision, 800 nits (HBM), 1200 nits (peak)",
      "Display Resolution": "1284 x 2778 pixels, 19.5:9 ratio",
      Chipset: "Apple A15 Bionic (5 nm)",
      Memory: "128GB 6GB RAM | 256GB 6GB RAM | 512GB 6GB RAM",
      "Main Camera": "12MP + 12MP | 4K@24/25/30/60fps, stereo sound rec.",
      "Selfie Camera":
        "12 MP | 4K@24/25/30/60fps, 1080p@25/30/60/120fps, gyro-EIS",
      "Battery Info":
        "Li-Ion 4323 mAh, non-removable | 15W wireless (MagSafe), 7.5W wireless (Qi)",
      OS: "iOS 16, upgradable to iOS 17",
      "Network Technology": "5G, 4G LTE",
    },
    attributes: {
      colors: ["blue", "purple", "red", "yellow", "midnight", "starlight"],
      storage: [
        { id: "gb128", title: "128 GB", price: 0 }, // Base price
        { id: "gb256", title: "256 GB", price: 100 }, // +$100
        { id: "gb512", title: "512 GB", price: 200 }, // +$200
      ],
      type: [
        { id: "active", title: "Active", price: 0 },
        { id: "inactive", title: "Inactive", price: 0 },
      ],
      sim: [
        { id: "dual", title: "Dual Sim", price: 0 },
        { id: "e-sim", title: "E Sim", price: 0 },
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
    price: 1299,
    discountedPrice: 1099,
    reviews: 5,
    stock: 20,
    categorySlug: "laptop-pc",
    description:
      "The Apple iMac M1 24-inch features a stunning 4.5K Retina display with True Tone technology, powered by the revolutionary M1 chip. This all-in-one desktop delivers incredible performance, stunning visuals, and a sleek design. With its 1080p FaceTime HD camera, studio-quality microphones, and six-speaker sound system, it's perfect for creative professionals and everyday users.",
    additionalInfo: {
      Brand: "Apple",
      Model: "iMac 24-inch M1",
      "Display Size": "24 inches",
      "Display Type": "4.5K Retina display with True Tone",
      "Display Resolution": "4480 x 2520 pixels",
      Processor: "Apple M1 chip (8-core CPU, 7-core or 8-core GPU)",
      Memory: "8GB unified memory (configurable to 16GB)",
      Storage: "256GB, 512GB, or 1TB SSD",
      Camera: "1080p FaceTime HD camera",
      Audio: "Six-speaker sound system with Spatial Audio",
      Ports:
        "Two Thunderbolt / USB 4 ports, Two USB 3 ports, 3.5mm headphone jack",
      OS: "macOS Monterey",
    },
    attributes: {
      colors: ["blue", "green", "pink", "yellow", "orange", "purple"],
      storage: [
        { id: "gb256", title: "256 GB", price: 0 }, // Base price
        { id: "gb512", title: "512 GB", price: 200 }, // +$200
        { id: "gb1tb", title: "1 TB", price: 400 }, // +$400
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
    title: "MacBook Air M1 chip, 8/256GB",
    price: 1199,
    discountedPrice: 999,
    reviews: 6,
    stock: 25,
    categorySlug: "laptop-pc",
    description:
      "The MacBook Air with M1 chip delivers exceptional performance in an incredibly thin and light design. With up to 18 hours of battery life, a stunning Retina display, and silent fanless design, it's the perfect laptop for work, creativity, and entertainment. The M1 chip provides blazing-fast performance for everything from video editing to gaming.",
    additionalInfo: {
      Brand: "Apple",
      Model: "MacBook Air M1",
      "Display Size": "13.3 inches",
      "Display Type": "Retina display with True Tone",
      "Display Resolution": "2560 x 1600 pixels",
      Processor: "Apple M1 chip (8-core CPU, 7-core GPU)",
      Memory: "8GB unified memory (configurable to 16GB)",
      Storage: "256GB, 512GB, 1TB, or 2TB SSD",
      "Battery Life": "Up to 18 hours",
      Keyboard: "Backlit Magic Keyboard",
      Trackpad: "Force Touch trackpad",
      Ports: "Two Thunderbolt / USB 4 ports, 3.5mm headphone jack",
      OS: "macOS Monterey",
      Weight: "1.29 kg (2.8 pounds)",
    },
    attributes: {
      colors: ["silver", "space-gray", "gold"],
      storage: [
        { id: "gb256", title: "256 GB", price: 0 }, // Base price
        { id: "gb512", title: "512 GB", price: 200 }, // +$200
        { id: "gb1tb", title: "1 TB", price: 400 }, // +$400
        { id: "gb2tb", title: "2 TB", price: 800 }, // +$800
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
    title: "Apple Watch Ultra",
    price: 799,
    discountedPrice: 699,
    reviews: 3,
    stock: 40,
    categorySlug: "watches",
    description:
      "The Apple Watch Ultra is the most rugged and capable Apple Watch ever. Built for extreme adventures, it features a titanium case, a larger 49mm display, and up to 60 hours of battery life in Low Power Mode. With advanced fitness tracking, dive computer capabilities, and precision dual-frequency GPS, it's the ultimate watch for athletes and adventurers.",
    additionalInfo: {
      Brand: "Apple",
      Model: "Watch Ultra",
      "Case Material": "Titanium",
      "Display Size": "49mm",
      "Display Type": "Always-On Retina LTPO OLED",
      "Battery Life":
        "Up to 36 hours (normal use), up to 60 hours (Low Power Mode)",
      "Water Resistance": "100 meters (WR100), EN13319 dive computer",
      GPS: "Dual-frequency GPS (L1 and L5)",
      Sensors: "Heart rate, Blood oxygen, Temperature, Compass, Altimeter",
      Connectivity: "Wi-Fi, Bluetooth 5.3, Cellular (optional)",
      OS: "watchOS 9",
      "Workout Modes":
        "100+ workout types including diving, hiking, and triathlon",
    },
    attributes: {
      colors: ["orange", "blue", "yellow"],
      type: [
        { id: "45mm", title: "45mm", price: 0 }, // Base price
        { id: "49mm", title: "49mm", price: 50 }, // +$50 for larger size
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
    title: "Logitech MX Master 3 Mouse",
    price: 129,
    discountedPrice: 99,
    reviews: 15,
    stock: 60,
    categorySlug: "laptop-pc",
    description:
      "The Logitech MX Master 3 is an advanced wireless mouse designed for productivity and precision. With its ergonomic design, MagSpeed scrolling, and Darkfield high-precision sensor, it works on virtually any surface. The mouse features customizable buttons, multi-device connectivity, and up to 70 days of battery life on a single charge.",
    additionalInfo: {
      Brand: "Logitech",
      Model: "MX Master 3",
      Connectivity: "Bluetooth or USB receiver (Logi Bolt)",
      "Sensor Type": "Darkfield high-precision sensor",
      DPI: "400 to 4000 DPI",
      "Battery Life": "Up to 70 days on full charge",
      "Charging Time": "3 minutes charge = full day of use",
      "Multi-Device": "Connect up to 3 devices",
      Buttons: "7 buttons (customizable)",
      Scrolling: "MagSpeed electromagnetic scrolling",
      Compatibility: "Windows, macOS, Linux, iPadOS",
      Weight: "141g",
    },
    attributes: {
      colors: ["black", "gray", "pink", "pale-gray"],
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
    title: "Apple iPad Air 5th Gen - 64GB",
    price: 699,
    discountedPrice: 599,
    reviews: 15,
    stock: 35,
    categorySlug: "mobile-tablets",
    description:
      "The Apple iPad Air 5th Gen features the powerful M1 chip, bringing desktop-class performance to a thin and light tablet. With its stunning 10.9-inch Liquid Retina display, 12MP Ultra Wide front camera with Center Stage, and support for Apple Pencil and Magic Keyboard, it's perfect for creativity, productivity, and entertainment.",
    additionalInfo: {
      Brand: "Apple",
      Model: "iPad Air (5th generation)",
      "Display Size": "10.9 inches",
      "Display Type": "Liquid Retina display with True Tone",
      "Display Resolution": "2360 x 1640 pixels",
      Processor: "Apple M1 chip",
      Memory: "8GB RAM",
      Storage: "64GB or 256GB",
      "Front Camera": "12MP Ultra Wide with Center Stage",
      "Rear Camera": "12MP Wide",
      "Battery Life": "Up to 10 hours of web browsing or video",
      Connectivity: "Wi-Fi, Wi-Fi + Cellular (5G)",
      "Apple Pencil": "Compatible with Apple Pencil (2nd generation)",
      OS: "iPadOS 15",
      Weight: "461g (Wi-Fi), 462g (Cellular)",
    },
    attributes: {
      colors: ["blue", "purple", "pink", "starlight", "space-gray"],
      storage: [
        { id: "gb64", title: "64 GB", price: 0 }, // Base price
        { id: "gb256", title: "256 GB", price: 150 }, // +$150
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
    title: "Asus RT Dual Band Router",
    price: 159,
    discountedPrice: 129,
    reviews: 15,
    stock: 45,
    categorySlug: "home-appliances",
    description:
      "The Asus RT Dual Band Router delivers high-speed wireless connectivity for your home or office. With dual-band technology (2.4GHz and 5GHz), it provides fast and reliable internet access for multiple devices simultaneously. Featuring advanced security features, easy setup, and parental controls, it's the perfect solution for modern networking needs.",
    additionalInfo: {
      Brand: "Asus",
      Model: "RT-AC Series",
      "Wi-Fi Standard": "802.11ac (Wi-Fi 5)",
      "Frequency Bands": "Dual-band: 2.4GHz and 5GHz",
      "Wireless Speed":
        "Up to 1200 Mbps (300 Mbps on 2.4GHz + 867 Mbps on 5GHz)",
      "Ethernet Ports": "4 x Gigabit LAN, 1 x Gigabit WAN",
      "USB Ports": "1 x USB 2.0, 1 x USB 3.0",
      "Coverage Area": "Up to 3000 sq ft",
      "Max Devices": "Up to 30+ devices",
      Security: "WPA3, VPN support, Firewall",
      "Parental Controls": "Yes",
      "Guest Network": "Yes",
      "MU-MIMO": "Yes",
      Beamforming: "Yes",
    },
    // Router không có attributes (colors, storage, etc.)
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
    title: "Ergonomic Office Chair",
    price: 500,
    discountedPrice: 450,
    reviews: 25,
    stock: 100,
    categorySlug: "home-appliances",
    description:
      "A comfortable ergonomic office chair designed for long hours of work. Features adjustable height, lumbar support, and 360-degree swivel. Perfect for home offices and professional workspaces.",
    additionalInfo: {
      Brand: "ComfortSeat",
      Model: "CS-500",
      Material: "Mesh back, PU leather seat",
      "Weight Capacity": "150kg",
      "Adjustable Height": "Yes",
      "Lumbar Support": "Yes",
      Armrests: "Adjustable",
      Warranty: "5 years",
    },
    // Sản phẩm đơn giản, không có variants (dùng cho promotion case 2)
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

const blogSeed = [
  {
    title: "How to Start a Successful E-commerce Business",
    img: "/images/blog/blog-01.jpg",
    views: 300000,
  },
  {
    title: "The Benefits of Regular Exercise for a Healthy Lifestyle",
    img: "/images/blog/blog-02.jpg",
    views: 250000,
  },
  {
    title: "Exploring the Wonders of Modern Art: A Gallery Tour",
    img: "/images/blog/blog-03.jpg",
    views: 180000,
  },
  {
    title: "The Ultimate Guide to Traveling on a Budget",
    img: "/images/blog/blog-04.jpg",
    views: 50000,
  },
  {
    title: "Cooking Masterclass: Creating Delicious Italian Pasta",
    img: "/images/blog/blog-05.jpg",
    views: 120000,
  },
  {
    title: "Tech Trends 2022: What's Changing in the Digital World",
    img: "/images/blog/blog-06.jpg",
    views: 75000,
  },
  {
    title: "A Guide to Sustainable Living: Reduce, Reuse, Recycle",
    img: "/images/blog/blog-07.jpg",
    views: 90000,
  },
  {
    title: "The Psychology of Happiness: Finding Joy in Everyday Life",
    img: "/images/blog/blog-08.jpg",
    views: 150000,
  },
  {
    title: "Exploring National Parks: Natural Beauty and Adventure",
    img: "/images/blog/blog-09.jpg",
    views: 60000,
  },
];

const testimonialSeed = [
  {
    authorName: "Davis Dorwart",
    authorRole: "Serial Entrepreneur",
    authorImg: "/images/users/user-01.jpg",
    review:
      "Lorem ipsum dolor sit amet, adipiscing elit. Donec malesuada justo vitae augue suscipit vehicula.",
  },
  {
    authorName: "Wilson Dias",
    authorRole: "Backend Developer",
    authorImg: "/images/users/user-02.jpg",
    review:
      "Lorem ipsum dolor sit amet, adipiscing elit. Donec malesuada justo vitae augue suscipit vehicula.",
  },
  {
    authorName: "Miracle Exterm",
    authorRole: "Serial Entrepreneur",
    authorImg: "/images/users/user-03.jpg",
    review:
      "Lorem ipsum dolor sit amet, adipiscing elit. Donec malesuada justo vitae augue suscipit vehicula.",
  },
  {
    authorName: "Thomas Frank",
    authorRole: "Entrepreneur",
    authorImg: "/images/users/user-01.jpg",
    review:
      "Lorem ipsum dolor sit amet, adipiscing elit. Donec malesuada justo vitae augue suscipit vehicula.",
  },
  {
    authorName: "Dave Smith",
    authorRole: "Serial Entrepreneur",
    authorImg: "/images/users/user-02.jpg",
    review:
      "Lorem ipsum dolor sit amet, adipiscing elit. Donec malesuada justo vitae augue suscipit vehicula.",
  },
  {
    authorName: "Davis Dorwart",
    authorRole: "Serial Entrepreneur",
    authorImg: "/images/users/user-03.jpg",
    review:
      "Lorem ipsum dolor sit amet, adipiscing elit. Donec malesuada justo vitae augue suscipit vehicula.",
  },
];

const orderSeed = [
  {
    orderId: "234c56",
    createdAt: new Date("2022-05-18T10:00:00Z"),
    status: "DELIVERED" as const,
    total: 100,
    title: "Sunglasses",
  },
  {
    orderId: "234c57",
    createdAt: new Date("2022-05-18T11:30:00Z"),
    status: "PROCESSING" as const,
    total: 250,
    title: "Watch",
  },
  {
    orderId: "234c58",
    createdAt: new Date("2022-05-18T12:00:00Z"),
    status: "CANCELLED" as const,
    total: 180,
    title: "Headphones",
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create Roles
  console.log("📋 Creating roles...");
  const customerRole = await prisma.role.upsert({
    where: { name: "CUSTOMER" },
    update: {},
    create: {
      name: "CUSTOMER",
      description: "Regular customer with basic shopping permissions",
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: "STAFF" },
    update: {},
    create: {
      name: "STAFF",
      description: "Staff member with product and order management permissions",
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: {
      name: "ADMIN",
      description: "Administrator with full system access",
    },
  });

  console.log("✅ Roles created");

  // Create Permissions
  console.log("🔐 Creating permissions...");
  const permissions = [
    // Customer permissions
    {
      name: "products.view",
      resource: "products",
      action: "view",
      description: "View products",
    },
    {
      name: "products.search",
      resource: "products",
      action: "search",
      description: "Search products",
    },
    {
      name: "orders.create",
      resource: "orders",
      action: "create",
      description: "Create orders",
    },
    {
      name: "orders.view.own",
      resource: "orders",
      action: "view.own",
      description: "View own orders",
    },
    {
      name: "wishlist.manage",
      resource: "wishlist",
      action: "manage",
      description: "Manage wishlist",
    },
    {
      name: "reviews.create",
      resource: "reviews",
      action: "create",
      description: "Create reviews",
    },
    {
      name: "profile.manage",
      resource: "profile",
      action: "manage",
      description: "Manage own profile",
    },

    // Staff permissions (includes all customer permissions +)
    {
      name: "products.create",
      resource: "products",
      action: "create",
      description: "Create products",
    },
    {
      name: "products.update",
      resource: "products",
      action: "update",
      description: "Update products",
    },
    {
      name: "products.delete",
      resource: "products",
      action: "delete",
      description: "Delete products",
    },
    {
      name: "categories.manage",
      resource: "categories",
      action: "manage",
      description: "Manage categories",
    },
    {
      name: "orders.view.all",
      resource: "orders",
      action: "view.all",
      description: "View all orders",
    },
    {
      name: "orders.update",
      resource: "orders",
      action: "update",
      description: "Update order status",
    },
    {
      name: "testimonials.manage",
      resource: "testimonials",
      action: "manage",
      description: "Manage testimonials",
    },
    {
      name: "reports.view",
      resource: "reports",
      action: "view",
      description: "View basic reports",
    },

    // Admin permissions (includes all staff permissions +)
    {
      name: "users.manage",
      resource: "users",
      action: "manage",
      description: "Manage users",
    },
    {
      name: "roles.manage",
      resource: "roles",
      action: "manage",
      description: "Manage roles",
    },
    {
      name: "permissions.manage",
      resource: "permissions",
      action: "manage",
      description: "Manage permissions",
    },
    {
      name: "system.settings",
      resource: "system",
      action: "settings",
      description: "Manage system settings",
    },
    {
      name: "blogs.manage",
      resource: "blogs",
      action: "manage",
      description: "Manage blog posts",
    },
    {
      name: "reports.view.all",
      resource: "reports",
      action: "view.all",
      description: "View all reports",
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

  console.log("✅ Permissions created");

  // Assign permissions to roles
  console.log("🔗 Assigning permissions to roles...");

  // Customer permissions
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

  // Staff permissions (customer + staff specific)
  const staffPermissions = createdPermissions.filter((p) =>
    [
      "products.view",
      "products.search",
      "products.create",
      "products.update",
      "products.delete",
      "categories.manage",
      "orders.view.all",
      "orders.update",
      "testimonials.manage",
      "reports.view",
      "wishlist.manage",
      "reviews.create",
      "profile.manage",
    ].includes(p.name)
  );

  await Promise.all(
    staffPermissions.map((perm) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: staffRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: staffRole.id,
          permissionId: perm.id,
        },
      })
    )
  );

  // Admin permissions (all permissions)
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

  console.log("✅ Permissions assigned to roles");

  // Create Users
  console.log("👤 Creating users...");

  // Hash passwords
  const customerPassword = await hashPassword("customer123");
  const staffPassword = await hashPassword("staff123");
  const adminPassword = await hashPassword("admin123");

  const [demoUser, staffUser, adminUser] = await Promise.all([
    // Customer
    prisma.user.upsert({
      where: { email: "demo@nextmerce.com" },
      update: {
        password: customerPassword, // Update password if user exists
      },
      create: {
        email: "demo@nextmerce.com",
        name: "Demo Customer",
        password: customerPassword,
        userRoles: {
          create: {
            roleId: customerRole.id,
          },
        },
      },
    }),
    // Staff
    prisma.user.upsert({
      where: { email: "staff@nextmerce.com" },
      update: {
        password: staffPassword,
      },
      create: {
        email: "staff@nextmerce.com",
        name: "Staff Member",
        password: staffPassword,
        userRoles: {
          create: {
            roleId: staffRole.id,
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
        name: "Admin User",
        password: adminPassword,
        userRoles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    }),
  ]);

  console.log("✅ Users created");

  // Continue with categories and products...
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
          description: `${category.title} products curated from the static UI dataset.`,
        },
      })
    )
  );

  const categoryMap = categories.reduce<Record<string, string>>((acc, cat) => {
    acc[cat.slug] = cat.id;
    return acc;
  }, {});

  console.log("✅ Categories created");

  // Helper function to check if product has variants
  const hasVariants = (attributes: any): boolean => {
    if (!attributes) return false;
    // Check if has storage, type, or sim options (not just colors)
    return !!(
      (Array.isArray(attributes.storage) && attributes.storage.length > 0) ||
      (Array.isArray(attributes.type) && attributes.type.length > 0) ||
      (Array.isArray(attributes.sim) && attributes.sim.length > 0)
    );
  };

  // Helper function to generate variants from attributes
  const generateVariants = (
    product: any,
    basePrice: number,
    baseDiscountedPrice: number | null
  ): any[] => {
    if (!hasVariants(product.attributes)) return [];

    const attributes = product.attributes;
    const variants: any[] = [];

    // Get all option arrays including colors
    const colors = attributes.colors || [];
    const storages = attributes.storage || [];
    const types = attributes.type || [];
    const sims = attributes.sim || [];

    // Normalize colors - handle both string array and object array
    const colorList =
      colors.length > 0
        ? colors.map((c: any) =>
            typeof c === "string" ? c : c.title || c.id || c
          )
        : [null];

    // Generate combinations (include colors in the loop)
    const storageList = storages.length > 0 ? storages : [null];
    const typeList = types.length > 0 ? types : [null];
    const simList = sims.length > 0 ? sims : [null];

    // Calculate total number of variants first
    const totalVariants =
      colorList.length * storageList.length * typeList.length * simList.length;

    // Calculate stock per variant (distribute evenly, minimum 10)
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

            // Add color to options
            if (color) {
              options.color = color;
              skuParts.push(color);
            }

            if (storage) {
              options.storage = storage.id || storage.title || storage;
              additionalPrice += storage.price || 0;
              skuParts.push(storage.id || storage.title);
            }
            if (type) {
              options.type = type.id || type.title || type;
              additionalPrice += type.price || 0;
              skuParts.push(type.id || type.title);
            }
            if (sim) {
              options.sim = sim.id || sim.title || sim;
              additionalPrice += sim.price || 0;
              skuParts.push(sim.id || sim.title);
            }

            const variantPrice = basePrice + additionalPrice;
            const variantDiscountedPrice = baseDiscountedPrice
              ? baseDiscountedPrice + additionalPrice
              : null;

            // Generate image URL for variant based on color
            let variantImage: string | null = null;
            if (color) {
              // Use first preview image as base, or create color-specific path
              const baseImage =
                product.images?.previews?.[0] ||
                product.images?.thumbnails?.[0];
              if (baseImage) {
                // Create color-specific image path
                // Pattern: /images/products/product-{id}-{color}.png
                const imagePath = baseImage.replace(
                  /product-(\d+)/,
                  `product-$1-${color}`
                );
                variantImage = imagePath;
              }
            }

            variants.push({
              price: variantPrice,
              discountedPrice: variantDiscountedPrice,
              stock: stockPerVariant, // Distribute stock evenly
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
            product.description ||
            `${product.title} imported from the static shop data.`,
          price: productHasVariants ? 0 : product.price, // Set to 0 if has variants
          discountedPrice: productHasVariants ? null : product.discountedPrice,
          reviews: product.reviews,
          stock: productHasVariants ? 0 : product.stock, // Set to 0 if has variants
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
            product.description ||
            `${product.title} imported from the static shop data.`,
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

  console.log("✅ Products created");

  // Create Product Variants for products that need them
  console.log("📦 Creating product variants...");
  // Variants are already created in the product upsert above
  console.log("✅ Product variants created");

  await Promise.all(
    blogSeed.map((blog) =>
      prisma.blog.upsert({
        where: { slug: slugify(blog.title) },
        update: {
          title: blog.title,
          img: blog.img,
          views: blog.views,
          content: `${blog.title} article content seeded from static blog data.`,
          excerpt:
            "Static blog excerpt generated from the original demo content.",
          published: true,
        },
        create: {
          title: blog.title,
          slug: slugify(blog.title),
          img: blog.img,
          views: blog.views,
          content: `${blog.title} article content seeded from static blog data.`,
          excerpt:
            "Static blog excerpt generated from the original demo content.",
          published: true,
        },
      })
    )
  );

  console.log("✅ Blogs created");

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

  console.log("✅ Testimonials created");

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
                discountedPrice: order.total / 2 - 10,
              },
            ],
          },
          shipping: {
            upsert: {
              update: {
                fullName: "Demo Customer",
                email: "demo@nextmerce.com",
                address: "123 Demo Street",
                city: "Demo City",
                country: "Demo Country",
                postalCode: "70000",
                method: "Standard",
              },
              create: {
                fullName: "Demo Customer",
                email: "demo@nextmerce.com",
                address: "123 Demo Street",
                city: "Demo City",
                country: "Demo Country",
                postalCode: "70000",
                method: "Standard",
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
                discountedPrice: order.total / 2 - 10,
              },
            ],
          },
          shipping: {
            create: {
              fullName: "Demo Customer",
              email: "demo@nextmerce.com",
              address: "123 Demo Street",
              city: "Demo City",
              country: "Demo Country",
              postalCode: "70000",
              method: "Standard",
            },
          },
        },
      })
    )
  );

  console.log("✅ Orders created");

  // === CREATE PROMOTIONS ===
  console.log("🎟️ Creating promotions...");

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  // Case 1: Global Order Discount - 30% off, max 500k
  const promotion1 = await prisma.promotion.upsert({
    where: { code: "HELLO30" },
    update: {},
    create: {
      code: "HELLO30",
      name: "Welcome 30% Off",
      description: "Giảm 30% tổng đơn hàng, tối đa 500,000 VNĐ",
      scope: "GLOBAL_ORDER",
      type: "PERCENTAGE",
      value: 30,
      maxDiscount: 500000,
      startDate: now,
      endDate: nextYear,
      usageLimit: null, // Unlimited
      perUserLimit: 1, // Mỗi user chỉ dùng 1 lần
      minOrderValue: 100000, // Đơn hàng tối thiểu 100k
      isActive: true,
    },
  });

  console.log("✅ Promotion 1 created: HELLO30");

  // Case 2: Specific Product Discount - "Cái ghế" (Ergonomic Office Chair)
  const chairProduct = products.find((p) =>
    p.title.toLowerCase().includes("chair")
  );

  if (chairProduct) {
    const promotion2 = await prisma.promotion.upsert({
      where: { code: "GHE100" },
      update: {},
      create: {
        code: "GHE100",
        name: "Chair Special Discount",
        description: "Giảm 20% cho sản phẩm Ergonomic Office Chair",
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

  // Case 3: Specific Variant Discount - iPhone variants
  const iphoneProduct = products.find((p) =>
    p.title.toLowerCase().includes("iphone")
  );

  if (iphoneProduct) {
    // Get variants for iPhone
    const iphoneVariants = await prisma.productVariant.findMany({
      where: { productId: iphoneProduct.id },
    });

    // Find 64GB and 256GB variants
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
        where: { code: "APPLEFAN" },
        update: {},
        create: {
          code: "APPLEFAN",
          name: "Apple Fan Discount",
          description: "iPhone 128GB giảm 5%, iPhone 256GB giảm 10%",
          scope: "SPECIFIC_ITEMS",
          type: "PERCENTAGE",
          value: 0, // Mặc định 0, lấy theo target
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
                specificValue: 5, // 5% for 128GB
              },
              {
                variantId: variant256GB.id,
                productId: null,
                specificValue: 10, // 10% for 256GB
              },
            ],
          },
        },
      });

      console.log("✅ Promotion 3 created: APPLEFAN");
    }
  }

  console.log("✅ Promotions created");
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
