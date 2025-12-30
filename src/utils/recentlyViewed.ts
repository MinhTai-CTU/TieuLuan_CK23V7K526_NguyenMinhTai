import { Product } from "@/types/product";

const STORAGE_KEY = "recentlyViewedProducts";
const MAX_ITEMS = 50; // Giới hạn số lượng sản phẩm lưu trữ

export interface RecentlyViewedProduct {
  id: string;
  title: string;
  price: number;
  discountedPrice?: number | null;
  image: string;
  viewedAt: number; // Timestamp
}

/**
 * Lấy danh sách sản phẩm đã xem từ localStorage
 */
export const getRecentlyViewed = (): RecentlyViewedProduct[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const products = JSON.parse(stored) as RecentlyViewedProduct[];
    // Sắp xếp theo thời gian xem gần nhất
    return products.sort((a, b) => b.viewedAt - a.viewedAt);
  } catch (error) {
    console.error("Error reading recently viewed products:", error);
    return [];
  }
};

/**
 * Thêm sản phẩm vào lịch sử xem
 */
export const addToRecentlyViewed = (product: Product): void => {
  if (typeof window === "undefined") return;

  try {
    const currentList = getRecentlyViewed();

    // Loại bỏ sản phẩm trùng lặp (nếu đã tồn tại)
    const filteredList = currentList.filter((item) => item.id !== product.id);

    // Xử lý giá cho sản phẩm có variants
    let finalPrice = product.price;
    let finalDiscountedPrice = product.discountedPrice;

    if (product.hasVariants && product.variants && product.variants.length > 0) {
      // Lấy giá từ variant đầu tiên hoặc variant có giá thấp nhất
      const sortedVariants = [...product.variants].sort((a, b) => {
        const priceA = a.discountedPrice ?? a.price ?? 0;
        const priceB = b.discountedPrice ?? b.price ?? 0;
        return priceA - priceB;
      });

      const firstVariant = sortedVariants[0];
      if (firstVariant) {
        finalPrice = firstVariant.price ?? 0;
        finalDiscountedPrice = firstVariant.discountedPrice ?? null;
      }
    }

    // Tạo object mới với thông tin cần thiết
    const newItem: RecentlyViewedProduct = {
      id: product.id,
      title: product.title,
      price: finalPrice,
      discountedPrice: finalDiscountedPrice,
      image:
        product.imgs?.previews?.[0] ??
        product.imgs?.thumbnails?.[0] ??
        "/images/products/product-1-bg-1.png",
      viewedAt: Date.now(),
    };

    // Thêm vào đầu danh sách
    const updatedList = [newItem, ...filteredList];

    // Giới hạn số lượng
    const limitedList = updatedList.slice(0, MAX_ITEMS);

    // Lưu vào localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedList));
  } catch (error) {
    console.error("Error adding to recently viewed:", error);
  }
};

/**
 * Xóa một sản phẩm khỏi lịch sử xem
 */
export const removeFromRecentlyViewed = (productId: string): void => {
  if (typeof window === "undefined") return;

  try {
    const currentList = getRecentlyViewed();
    const filteredList = currentList.filter((item) => item.id !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredList));
  } catch (error) {
    console.error("Error removing from recently viewed:", error);
  }
};

/**
 * Xóa toàn bộ lịch sử xem
 */
export const clearRecentlyViewed = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Lấy số lượng sản phẩm đã xem
 */
export const getRecentlyViewedCount = (): number => {
  return getRecentlyViewed().length;
};

