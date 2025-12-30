export type ProductImages = {
  thumbnails: string[];
  previews: string[];
};

export type ProductAttributeOption = {
  id: string;
  title: string;
  price?: number; // Additional price for this option (optional)
};

export type ProductColor = {
  id: string;
  label: string;
  hex: string;
  price?: number; // Optional additional price for this color
};

export type ProductAttributes = {
  colors?: Array<ProductColor | string>; // Can be ProductColor object or legacy string (for backward compatibility)
  storage?: Array<ProductAttributeOption>;
  type?: Array<ProductAttributeOption>;
  sim?: Array<ProductAttributeOption>;
  [key: string]: any; // Allow any additional attributes
};

export type ProductAdditionalInfo = {
  [key: string]: string | number | undefined; // Key-value pairs for additional information
};

export type ProductVariant = {
  id: string;
  productId: string;
  price: number;
  discountedPrice?: number | null;
  stock: number;
  sku?: string | null;
  options: Record<string, any>;
  image?: string | null;
};

export type Product = {
  id: string;
  title: string;
  slug?: string;
  description?: string | null;
  reviews: number;
  price: number;
  discountedPrice?: number | null;
  stock?: number;
  hasVariants?: boolean; // Indicates if product has variants
  categoryId?: string | null;
  attributes?: ProductAttributes | null;
  additionalInfo?: ProductAdditionalInfo | null;
  imgs: ProductImages;
  variants?: ProductVariant[]; // Variants for products with options
};
