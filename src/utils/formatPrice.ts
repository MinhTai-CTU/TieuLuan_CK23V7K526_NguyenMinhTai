/**
 * Format price in VND (Vietnamese Dong)
 * @param price - Price in VND (number)
 * @param showCurrency - Whether to show currency symbol (default: true)
 * @returns Formatted price string (e.g., "1.475.000 đ" or "1.475.000 VNĐ")
 */
export const formatPrice = (
  price: number | null | undefined,
  showCurrency: boolean = true
): string => {
  if (price === null || price === undefined || isNaN(price)) {
    return showCurrency ? "0 đ" : "0";
  }

  // Convert to integer to remove decimals
  const priceInt = Math.round(price);

  // Format with thousand separators
  const formatted = priceInt.toLocaleString("vi-VN");

  return showCurrency ? `${formatted} đ` : formatted;
};

/**
 * Format price with discount (shows original price crossed out and discounted price)
 * @param originalPrice - Original price in VND
 * @param discountedPrice - Discounted price in VND
 * @returns Object with formatted prices
 */
export const formatPriceWithDiscount = (
  originalPrice: number | null | undefined,
  discountedPrice: number | null | undefined
) => {
  const original = formatPrice(originalPrice, true);
  const discounted = formatPrice(discountedPrice, true);

  return {
    original,
    discounted,
  };
};
