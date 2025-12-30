/**
 * Utility functions for building product variants
 */

/**
 * Generate Cartesian product from attributes
 * Example: { "Màu": ["Đỏ", "Xanh"], "Size": ["S", "M"] }
 * Result: [
 *   { "Màu": "Đỏ", "Size": "S" },
 *   { "Màu": "Đỏ", "Size": "M" },
 *   { "Màu": "Xanh", "Size": "S" },
 *   { "Màu": "Xanh", "Size": "M" }
 * ]
 */
export function generateCartesianProduct(
  attributes: Record<string, string[]>
): Record<string, string>[] {
  const keys = Object.keys(attributes);
  const values = keys.map((key) => attributes[key]);

  if (keys.length === 0) {
    return [];
  }

  if (keys.length === 1) {
    return values[0].map((value) => ({ [keys[0]]: value }));
  }

  // Recursive function to generate combinations
  function cartesian(
    arrays: string[][],
    index: number = 0
  ): Record<string, string>[] {
    if (index === arrays.length) {
      return [{}];
    }

    const result: Record<string, string>[] = [];
    const rest = cartesian(arrays, index + 1);

    for (const value of arrays[index]) {
      for (const combination of rest) {
        result.push({ [keys[index]]: value, ...combination });
      }
    }

    return result;
  }

  return cartesian(values);
}

/**
 * Generate SKU from product title and options
 */
export function generateSKU(
  productTitle: string,
  options: Record<string, string>
): string {
  const titlePrefix = productTitle
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .substring(0, 6);

  const optionSuffix = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_, value]) =>
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 3)
    )
    .join("-");

  return `${titlePrefix}-${optionSuffix}`;
}

/**
 * Format options for display
 */
export function formatOptionsForDisplay(
  options: Record<string, string>
): string {
  return Object.entries(options)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
}
