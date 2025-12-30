"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/Common/ImageUpload";
import Image from "next/image";
import { getToken } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import {
  generateCartesianProduct,
  generateSKU,
  formatOptionsForDisplay,
} from "@/utils/variantBuilder";

interface Category {
  id: string;
  title: string;
}

interface AttributeValue {
  id: string;
  title: string;
  price: number; // Giá cộng thêm
  hex?: string; // Hex color code (chỉ cho colors)
}

interface ProductVariant {
  id?: string;
  options: Record<string, string>;
  price: number;
  discountedPrice?: number | null;
  stock: number;
  sku?: string | null;
  image?: string | null;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  discountedPrice: number | null;
  stock: number;
  isActive: boolean;
  categoryId: string | null;
  hasVariants?: boolean;
  attributes?: Record<string, any> | null; // Can be string[] or AttributeValue[]
  images: { url: string; type: string }[];
  variants?: ProductVariant[];
}

interface ProductFormProps {
  product?: Product | null;
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState<string>("");
  const [images, setImages] = useState<Array<{ url: string; type: string }>>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Variant-related states
  const [hasVariants, setHasVariants] = useState(false);
  const [basePrice, setBasePrice] = useState(""); // Base price for variant products
  const [baseDiscountedPrice, setBaseDiscountedPrice] = useState(""); // Base discounted price
  const [attributes, setAttributes] = useState<
    Record<string, AttributeValue[]>
  >({});
  const [attributeKeys, setAttributeKeys] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(
    new Set()
  ); // For checkbox selection
  const [bulkEditPrice, setBulkEditPrice] = useState("");
  const [bulkEditStock, setBulkEditStock] = useState("");

  // Additional info state (key-value pairs)
  const [additionalInfo, setAdditionalInfo] = useState<
    Array<{ key: string; value: string }>
  >([]);

  useEffect(() => {
    fetchCategories();
    if (product) {
      setTitle(product.title);
      setSlug(product.slug);
      setDescription(product.description || "");
      setPrice(product.price.toString());
      setDiscountedPrice(product.discountedPrice?.toString() || "");
      setStock(product.stock.toString());
      setIsActive(product.isActive);
      setCategoryId(product.categoryId || "");
      setImages(product.images || []);
      setHasVariants(product.hasVariants || false);

      // Load additionalInfo
      if ((product as any).additionalInfo) {
        const info = (product as any).additionalInfo as Record<string, any>;
        const infoArray = Object.entries(info).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setAdditionalInfo(infoArray);
      }

      // Load attributes and variants if product has variants
      if (product.hasVariants && product.attributes) {
        const attrs = product.attributes as any;
        const parsedAttributes: Record<string, AttributeValue[]> = {};
        const parsedKeys: string[] = [];

        // Parse attributes from objects to AttributeValue[]
        Object.keys(attrs).forEach((key) => {
          const values = attrs[key];
          if (Array.isArray(values) && values.length > 0) {
            // Convert to AttributeValue format
            const attributeValues: AttributeValue[] = values.map(
              (v: any, idx: number) => {
                if (typeof v === "string") {
                  // Simple string, create AttributeValue
                  const slugify = (text: string) =>
                    text
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "");
                  return {
                    id: slugify(v),
                    title: v,
                    price: 0,
                  };
                } else if (typeof v === "object" && v !== null) {
                  // Object with id, title, price (and hex for colors)
                  return {
                    id: v.id || `val-${idx}`,
                    title: v.title || v.label || String(v),
                    price:
                      typeof v.price === "number"
                        ? v.price
                        : typeof v.price === "string"
                          ? parseFloat(v.price) || 0
                          : 0,
                    ...(key === "colors" && v.hex ? { hex: v.hex } : {}),
                  };
                }
                return {
                  id: `val-${idx}`,
                  title: String(v),
                  price: 0,
                };
              }
            );
            parsedAttributes[key] = attributeValues;
            parsedKeys.push(key);
          }
        });

        setAttributes(parsedAttributes);
        setAttributeKeys(parsedKeys);

        // Set base price from product price (for variant products, this is the base)
        // If product.price is 0, try to get from first variant's price minus additional prices
        let calculatedBasePrice = product.price;
        if (
          calculatedBasePrice === 0 &&
          product.variants &&
          product.variants.length > 0
        ) {
          const firstVariant = product.variants[0];
          if (firstVariant.price) {
            // Calculate additional price from first variant's options
            let additionalPrice = 0;
            if (firstVariant.options) {
              Object.keys(firstVariant.options).forEach((attrKey) => {
                const attrValueId = firstVariant.options[attrKey];
                const attrValues = parsedAttributes[attrKey] || [];
                const attrValue = attrValues.find((v) => v.id === attrValueId);
                if (attrValue) {
                  additionalPrice += attrValue.price || 0;
                }
              });
            }
            calculatedBasePrice = firstVariant.price - additionalPrice;
          }
        }
        setBasePrice(
          calculatedBasePrice > 0 ? calculatedBasePrice.toString() : ""
        );
        setBaseDiscountedPrice(product.discountedPrice?.toString() || "");

        if (product.variants) {
          setVariants(product.variants);
        }
      }
    }
  }, [product]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Auto-generate slug if slug is empty or matches the old product's slug
    if (!product || slug === generateSlug(product.title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleImageUpload = (url: string | null) => {
    if (url) {
      setImages([...images, { url, type: "PREVIEW" }]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Helper function to format number with thousand separator
  const formatNumber = (value: string | number): string => {
    if (value === "" || value === null || value === undefined) return "";
    const numStr = String(value).replace(/\./g, ""); // Remove existing dots
    if (numStr === "" || numStr === "0") return "";
    // Remove leading zeros (but keep if it's just "0")
    const cleaned = numStr === "0" ? "0" : numStr.replace(/^0+/, "");
    if (cleaned === "") return "";
    // Add thousand separators
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Helper function to parse formatted number back to number
  const parseFormattedNumber = (value: string): number => {
    if (!value || value.trim() === "") return 0;
    // Remove all dots (thousand separators) and non-digit characters
    const cleaned = value.replace(/[^\d]/g, "");
    if (cleaned === "" || cleaned === "0") return 0;
    // Remove leading zeros
    const numStr = cleaned.replace(/^0+/, "") || "0";
    return parseFloat(numStr) || 0;
  };

  // Attribute type mapping - maps display name to database key
  const attributeTypeOptions = [
    {
      key: "colors",
      label: "Màu sắc",
      description: "Hiển thị dạng color swatches",
    },
    {
      key: "storage",
      label: "Bộ nhớ",
      description: "Hiển thị dạng checkbox với giá cộng thêm",
    },
    {
      key: "type",
      label: "Loại",
      description: "Hiển thị dạng checkbox (VD: Đã kích hoạt/Chưa kích hoạt)",
    },
    {
      key: "sim",
      label: "Số sim",
      description: "Hiển thị dạng checkbox (VD: 2 SIM Vật lý/eSIM)",
    },
  ];

  // Variant builder functions
  const addAttributeKey = () => {
    // Default to first available type that's not already used
    const usedKeys = new Set(attributeKeys);
    const availableType = attributeTypeOptions.find(
      (opt) => !usedKeys.has(opt.key)
    );
    const newKey = availableType ? availableType.key : `attr-${Date.now()}`;
    setAttributeKeys([...attributeKeys, newKey]);
    setAttributes({ ...attributes, [newKey]: [] });
  };

  const removeAttributeKey = (key: string) => {
    const newKeys = attributeKeys.filter((k) => k !== key);
    const newAttributes = { ...attributes };
    delete newAttributes[key];
    setAttributeKeys(newKeys);
    setAttributes(newAttributes);
    // Clear variants when removing attribute - user needs to regenerate
    setVariants([]);
  };

  const updateAttributeKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const newKeys = attributeKeys.map((k) => (k === oldKey ? newKey : k));
    const newAttributes: Record<string, AttributeValue[]> = {};
    Object.keys(attributes).forEach((k) => {
      if (k === oldKey) {
        newAttributes[newKey] = attributes[k];
      } else {
        newAttributes[k] = attributes[k];
      }
    });
    setAttributeKeys(newKeys);
    setAttributes(newAttributes);
    // Clear variants when renaming attribute - user needs to regenerate
    setVariants([]);
  };

  const addAttributeValue = (key: string) => {
    const newValue: AttributeValue = {
      id: `val-${Date.now()}`,
      title: "",
      price: 0,
      ...(key === "colors" ? { hex: "#808080" } : {}), // Default hex for colors
    };
    setAttributes({
      ...attributes,
      [key]: [...(attributes[key] || []), newValue],
    });
  };

  const updateAttributeValue = (
    key: string,
    index: number,
    field: keyof AttributeValue,
    value: string | number
  ) => {
    const newValues = [...(attributes[key] || [])];
    newValues[index] = { ...newValues[index], [field]: value };
    setAttributes({ ...attributes, [key]: newValues });
  };

  const removeAttributeValue = (key: string, index: number) => {
    const newValues = (attributes[key] || []).filter((_, i) => i !== index);
    setAttributes({ ...attributes, [key]: newValues });
  };

  // Helper function to slugify
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const generateVariantsFromAttributes = useCallback(() => {
    // Filter out empty attributes
    const validAttrs: Record<string, AttributeValue[]> = {};
    Object.keys(attributes).forEach((key) => {
      const values = attributes[key];
      if (Array.isArray(values) && values.length > 0) {
        const validValues = values.filter(
          (v) => v && v.title && v.title.trim().length > 0
        );
        if (validValues.length > 0) {
          validAttrs[key] = validValues;
        }
      }
    });

    // Only generate if we have valid attributes
    if (Object.keys(validAttrs).length === 0) {
      setVariants([]);
      return;
    }

    // Get base prices
    const basePriceNum = parseFloat(basePrice) || 0;
    const baseDiscountedPriceNum = baseDiscountedPrice
      ? parseFloat(baseDiscountedPrice)
      : null;

    // Generate Cartesian product of attribute values (titles)
    const attrTitles: Record<string, string[]> = {};
    Object.keys(validAttrs).forEach((key) => {
      attrTitles[key] = validAttrs[key].map((v) => v.title);
    });
    const combinations = generateCartesianProduct(attrTitles);

    setVariants((prevVariants) => {
      const newVariants: ProductVariant[] = combinations.map((options) => {
        // Calculate additional price from selected attributes
        let additionalPrice = 0;
        const optionIds: Record<string, string> = {};
        const skuParts: string[] = [];

        Object.keys(options).forEach((attrKey) => {
          const selectedTitle = options[attrKey];
          const attrValue = validAttrs[attrKey].find(
            (v) => v.title === selectedTitle
          );
          if (attrValue) {
            additionalPrice += attrValue.price || 0;
            optionIds[attrKey] = attrValue.id; // Use id for options (like seed.ts)
            skuParts.push(slugify(attrValue.id || attrValue.title));
          }
        });

        // Calculate final prices
        const variantPrice = basePriceNum + additionalPrice;
        const variantDiscountedPrice =
          baseDiscountedPriceNum !== null
            ? baseDiscountedPriceNum + additionalPrice
            : null;

        // Try to find existing variant with same options
        const existing = prevVariants.find((v) => {
          const vKeys = Object.keys(v.options).sort();
          const oKeys = Object.keys(optionIds).sort();
          if (vKeys.length !== oKeys.length) return false;
          return vKeys.every((k) => {
            const vValue = String(v.options[k] || "").trim();
            const oValue = String(optionIds[k] || "").trim();
            return vValue === oValue;
          });
        });

        if (existing) {
          // Keep existing stock if user has edited, but update price
          return {
            ...existing,
            price: variantPrice,
            discountedPrice: variantDiscountedPrice,
          };
        }

        return {
          options: optionIds, // Use ids like seed.ts
          price: variantPrice,
          discountedPrice: variantDiscountedPrice,
          stock: 0,
          sku: `${slugify(title || "PROD").toUpperCase()}-${skuParts.join("-")}`,
        };
      });
      return newVariants;
    });
  }, [attributes, basePrice, baseDiscountedPrice, title]);

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const toggleVariantSelection = (index: number) => {
    const newSelected = new Set(selectedVariants);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedVariants(newSelected);
  };

  const selectAllVariants = () => {
    if (selectedVariants.size === variants.length) {
      setSelectedVariants(new Set());
    } else {
      setSelectedVariants(new Set(variants.map((_, i) => i)));
    }
  };

  const bulkUpdateVariants = (
    field: "price" | "stock" | "discountedPrice",
    value: string
  ) => {
    if (!value && field !== "discountedPrice") return;
    // Parse formatted number (remove dots and parse)
    const cleanedValue = value.replace(/[^\d]/g, "");
    if (!cleanedValue && field !== "discountedPrice") return;

    const numValue =
      field === "stock"
        ? parseInt(cleanedValue) || 0
        : field === "discountedPrice"
          ? cleanedValue === ""
            ? null
            : parseFloat(cleanedValue) || 0
          : parseFloat(cleanedValue) || 0;
    if (isNaN(numValue as number) && numValue !== null) return;

    const newVariants = variants.map((v, idx) => {
      // Only update selected variants, or all if none selected
      if (selectedVariants.size > 0 && !selectedVariants.has(idx)) {
        return v;
      }
      return {
        ...v,
        [field]: numValue,
      };
    });
    setVariants(newVariants);
    if (field === "price") setBulkEditPrice("");
    if (field === "stock") setBulkEditStock("");
    // Clear selection after bulk update
    setSelectedVariants(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Validate for non-variant products
    if (!hasVariants) {
      if (!price) {
        toast.error("Vui lòng nhập giá sản phẩm");
        return;
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        toast.error("Giá sản phẩm phải là số dương");
        return;
      }
    }

    // Validate for variant products
    if (hasVariants) {
      if (!basePrice) {
        toast.error("Vui lòng nhập giá cơ bản");
        return;
      }
      const basePriceNum = parseFloat(basePrice);
      if (isNaN(basePriceNum) || basePriceNum <= 0) {
        toast.error("Giá cơ bản phải là số dương");
        return;
      }
      if (variants.length === 0) {
        toast.error("Vui lòng tạo ít nhất một biến thể");
        return;
      }
      for (const variant of variants) {
        if (!variant.price || variant.price <= 0) {
          toast.error("Tất cả biến thể phải có giá hợp lệ");
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const token = getToken();
      if (!token) {
        toast.error("Vui lòng đăng nhập lại");
        return;
      }

      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PATCH" : "POST";

      // Format additionalInfo from array to object
      const formattedAdditionalInfo: Record<string, string> = {};
      additionalInfo.forEach((item) => {
        if (item.key.trim() && item.value.trim()) {
          formattedAdditionalInfo[item.key.trim()] = item.value.trim();
        }
      });

      const body: any = {
        title,
        slug,
        description: description || null,
        isActive,
        categoryId: categoryId || null,
        hasVariants,
        additionalInfo:
          Object.keys(formattedAdditionalInfo).length > 0
            ? formattedAdditionalInfo
            : null,
      };

      if (!hasVariants) {
        body.price = parseFloat(price);
        body.discountedPrice = discountedPrice
          ? parseFloat(discountedPrice)
          : null;
        body.stock = stock ? parseInt(stock) : 0;
      } else {
        body.price = 0; // Placeholder for variant products
        body.stock = 0;
        body.discountedPrice = null;

        // Format attributes like seed.ts: objects with id, title, price (or label for colors)
        const formattedAttributes: Record<string, any> = {};
        Object.keys(attributes).forEach((key) => {
          const values = attributes[key];
          if (key === "colors") {
            // Colors format: {id, label, hex} - no price for colors
            formattedAttributes[key] = values.map((v) => ({
              id: v.id,
              label: v.title,
              hex: v.hex || "#808080", // Use hex from input, default to gray
            }));
          } else {
            // Other attributes format: {id, title, price}
            formattedAttributes[key] = values.map((v) => ({
              id: v.id,
              title: v.title,
              price: v.price || 0,
            }));
          }
        });
        body.attributes = formattedAttributes;

        body.variants = variants.map((v) => ({
          options: v.options,
          price: v.price,
          discountedPrice: v.discountedPrice || null,
          stock: v.stock || 0,
          sku: v.sku || null,
          image: v.image || null,
        }));
      }

      // Include images for both new and existing products
      if (images.length > 0) {
        body.images = images.map((img, idx) => ({
          url: img.url,
          type: idx === 0 ? "THUMBNAIL" : "PREVIEW", // First image is thumbnail
        }));
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.error || `Lỗi: ${response.status} ${response.statusText}`
        );
        return;
      }

      if (data.success) {
        toast.success(
          product ? "Cập nhật sản phẩm thành công" : "Tạo sản phẩm thành công"
        );
        router.push(`/admin/products`);
      } else {
        toast.error(data.error || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {product ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
                </h2>
                <p className="text-sm text-orange mt-0.5">
                  {product
                    ? "Cập nhật thông tin sản phẩm"
                    : "Tạo sản phẩm mới cho cửa hàng"}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/admin/products`)}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors duration-150"
              title="Đóng"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Thông tin cơ bản */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                Thông tin cơ bản
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="Ví dụ: iPhone 15 Pro Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue transition-all outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="iphone-15-pro-max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue transition-all outline-none font-mono text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Nhập mô tả chi tiết về sản phẩm..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue transition-all outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Danh mục
                    </label>
                    {isLoading ? (
                      <div className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500 text-sm">
                        Đang tải...
                      </div>
                    ) : (
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue transition-all outline-none"
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Trạng thái
                    </label>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
                        />
                        <span className="text-sm text-gray-700">
                          {isActive ? "Hoạt động" : "Tạm ẩn"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hình ảnh sản phẩm
                  </label>
                  <div className="space-y-4">
                    {/* Image Upload Component */}
                    <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      <ImageUpload
                        value={null}
                        onChange={handleImageUpload}
                        uploadEndpoint="/api/products/upload-image"
                        fieldName="image"
                        className="w-full"
                        showPreview={false}
                        defaultImage="/images/placeholder-product.png"
                        autoUpload={true}
                      />
                    </div>

                    {/* Display uploaded images */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group border border-gray-200 rounded-lg overflow-hidden"
                          >
                            <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                              <Image
                                src={img.url}
                                alt={`Product image ${idx + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            {idx === 0 && (
                              <div className="absolute top-2 left-2 bg-blue text-white text-xs px-2 py-1 rounded">
                                Thumbnail
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa hình ảnh"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Cấu hình giá và kho */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                Cấu hình giá và kho
              </h3>

              {/* Toggle hasVariants */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      Sản phẩm có biến thể?
                    </label>
                    <p className="text-xs text-gray-600">
                      Bật để tạo sản phẩm với nhiều biến thể (màu sắc, kích
                      thước, v.v.)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={(e) => {
                        setHasVariants(e.target.checked);
                        if (!e.target.checked) {
                          setAttributes({});
                          setAttributeKeys([]);
                          setVariants([]);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue"></div>
                  </label>
                </div>
              </div>

              {/* Price/Stock inputs - only show when hasVariants is false */}
              {!hasVariants && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-green-800">
                      Sản phẩm đơn giản (không có biến thể)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Giá gốc (₫) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue transition-all outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Giá khuyến mãi (₫)
                      </label>
                      <input
                        type="number"
                        value={discountedPrice}
                        onChange={(e) => setDiscountedPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue transition-all outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Số lượng tồn kho
                      </label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Thông tin bổ sung (Additional Info) */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                Thông tin bổ sung
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Thêm thông tin kỹ thuật, thông số sản phẩm (VD: Thương hiệu,
                Model, Kích thước màn hình, v.v.)
              </p>
              <div className="space-y-2">
                {additionalInfo.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.key}
                      onChange={(e) => {
                        const newInfo = [...additionalInfo];
                        newInfo[idx].key = e.target.value;
                        setAdditionalInfo(newInfo);
                      }}
                      placeholder="Tên thuộc tính (VD: Thương hiệu, Model)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue outline-none text-sm"
                    />
                    <span className="text-gray-500">:</span>
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => {
                        const newInfo = [...additionalInfo];
                        newInfo[idx].value = e.target.value;
                        setAdditionalInfo(newInfo);
                      }}
                      placeholder="Giá trị (VD: Apple, iPhone 14 Plus)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newInfo = additionalInfo.filter(
                          (_, i) => i !== idx
                        );
                        setAdditionalInfo(newInfo);
                      }}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setAdditionalInfo([
                      ...additionalInfo,
                      { key: "", value: "" },
                    ]);
                  }}
                  className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue hover:text-blue hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  + Thêm thông tin
                </button>
              </div>
            </div>

            {/* Section 4: Variant Builder - only show when hasVariants is true */}
            {hasVariants && (
              <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-blue-800">
                      Tạo biến thể sản phẩm
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Định nghĩa các thuộc tính với giá cộng thêm và hệ thống sẽ
                    tự động tạo tất cả các tổ hợp biến thể.
                  </p>
                </div>

                {/* Base Price Input */}
                <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    Giá cơ bản (Base Price){" "}
                    <span className="text-xs text-gray-500 font-normal">
                      - Bắt buộc cho sản phẩm có biến thể
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Giá gốc (₫) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        placeholder="20000000"
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Giá khuyến mãi (₫)
                      </label>
                      <input
                        type="number"
                        value={baseDiscountedPrice}
                        onChange={(e) => setBaseDiscountedPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1000"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue outline-none text-sm"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Giá cơ bản sẽ được cộng thêm với giá của từng thuộc tính để
                    tính giá cuối cùng cho mỗi biến thể.
                  </p>
                </div>

                {/* Attribute Builder */}
                <div className="space-y-4 mb-6">
                  {attributeKeys.map((key, idx) => {
                    const attributeType = attributeTypeOptions.find(
                      (opt) => opt.key === key
                    );
                    return (
                      <div
                        key={idx}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <select
                            value={key}
                            onChange={(e) => {
                              const newKey = e.target.value;
                              // If key changed, update it
                              if (newKey !== key) {
                                updateAttributeKey(key, newKey);
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue outline-none text-sm font-medium"
                          >
                            {attributeTypeOptions.map((opt) => {
                              // Check if this type is already used by another attribute
                              const isUsed =
                                attributeKeys.includes(opt.key) &&
                                opt.key !== key;
                              return (
                                <option
                                  key={opt.key}
                                  value={opt.key}
                                  disabled={isUsed}
                                >
                                  {opt.label} {isUsed ? "(Đã sử dụng)" : ""}
                                </option>
                              );
                            })}
                          </select>
                          {attributeType && (
                            <span className="text-xs text-gray-500 px-2">
                              {attributeType.description}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeAttributeKey(key)}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                          >
                            Xóa
                          </button>
                        </div>

                        {/* Attribute Values Table */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-700">
                              Giá trị và giá cộng thêm
                            </label>
                            <button
                              type="button"
                              onClick={() => addAttributeValue(key)}
                              className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              + Thêm giá trị
                            </button>
                          </div>
                          <div className="space-y-2">
                            {(attributes[key] || []).map((value, valueIdx) => (
                              <div
                                key={valueIdx}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="text"
                                  value={value.title}
                                  onChange={(e) =>
                                    updateAttributeValue(
                                      key,
                                      valueIdx,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Tên giá trị (VD: Đỏ, 128GB)"
                                  className={`${
                                    key === "colors" ? "w-32" : "flex-1"
                                  } px-2 py-1.5 bg-white border border-gray-300 rounded text-xs`}
                                />
                                {key === "colors" && (
                                  <input
                                    type="color"
                                    value={value.hex || "#808080"}
                                    onChange={(e) =>
                                      updateAttributeValue(
                                        key,
                                        valueIdx,
                                        "hex",
                                        e.target.value
                                      )
                                    }
                                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                                    title="Chọn màu"
                                  />
                                )}
                                {key !== "colors" && (
                                  <>
                                    <input
                                      type="text"
                                      value={
                                        value.price === 0
                                          ? ""
                                          : formatNumber(value.price)
                                      }
                                      onChange={(e) => {
                                        const inputValue = e.target.value;
                                        // Allow empty input
                                        if (inputValue === "") {
                                          updateAttributeValue(
                                            key,
                                            valueIdx,
                                            "price",
                                            0
                                          );
                                          return;
                                        }
                                        // Remove all non-digit characters (including dots for now)
                                        let cleaned = inputValue.replace(
                                          /[^\d]/g,
                                          ""
                                        );
                                        // Remove leading zeros (but allow "0" as single digit)
                                        if (
                                          cleaned.length > 1 &&
                                          cleaned.startsWith("0")
                                        ) {
                                          cleaned = cleaned.replace(/^0+/, "");
                                        }
                                        if (cleaned === "" || cleaned === "0") {
                                          updateAttributeValue(
                                            key,
                                            valueIdx,
                                            "price",
                                            cleaned === "0" ? 0 : 0
                                          );
                                          return;
                                        }
                                        // Parse and update (this will trigger re-render with formatted value)
                                        const numValue =
                                          parseFloat(cleaned) || 0;
                                        updateAttributeValue(
                                          key,
                                          valueIdx,
                                          "price",
                                          numValue
                                        );
                                      }}
                                      placeholder="Giá cộng thêm"
                                      className="w-32 px-2 py-1.5 bg-white border border-gray-300 rounded text-xs"
                                    />
                                    <span className="text-xs text-gray-500 w-8">
                                      ₫
                                    </span>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeAttributeValue(key, valueIdx)
                                  }
                                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          {(!attributes[key] ||
                            attributes[key].length === 0) && (
                            <p className="text-xs text-gray-400 italic">
                              Chưa có giá trị nào
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addAttributeKey}
                    className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue hover:text-blue hover:bg-blue-50 transition-colors text-sm font-medium"
                  >
                    + Thêm thuộc tính
                  </button>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={generateVariantsFromAttributes}
                      className="w-full py-3 bg-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                    >
                      Tạo biến thể
                    </button>
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Nhấn để tạo tất cả các tổ hợp biến thể từ các thuộc tính
                      đã nhập
                    </p>
                  </div>
                </div>

                {/* Variants Table */}
                {variants.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-800">
                          Danh sách biến thể{" "}
                          <span className="text-blue font-normal">
                            ({variants.length} biến thể)
                          </span>
                          {selectedVariants.size > 0 && (
                            <span className="ml-2 text-sm text-gray-600">
                              ({selectedVariants.size} đã chọn)
                            </span>
                          )}
                        </h4>
                        <button
                          type="button"
                          onClick={selectAllVariants}
                          className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium"
                        >
                          {selectedVariants.size === variants.length
                            ? "Bỏ chọn tất cả"
                            : "Chọn tất cả"}
                        </button>
                      </div>

                      {/* Bulk Edit Controls */}
                      <div className="flex items-center gap-2 flex-wrap p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs font-medium text-gray-700">
                          Sửa hàng loạt:
                        </span>
                        <input
                          type="text"
                          value={
                            bulkEditPrice === "" || bulkEditPrice === "0"
                              ? ""
                              : formatNumber(bulkEditPrice)
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            if (inputValue === "") {
                              setBulkEditPrice("");
                              return;
                            }
                            let cleaned = inputValue.replace(/[^\d]/g, "");
                            if (cleaned.length > 1 && cleaned.startsWith("0")) {
                              cleaned = cleaned.replace(/^0+/, "");
                            }
                            if (cleaned === "" || cleaned === "0") {
                              setBulkEditPrice("");
                              return;
                            }
                            setBulkEditPrice(cleaned);
                          }}
                          placeholder="Giá (₫)"
                          className="w-28 px-2 py-1.5 bg-white border border-gray-300 rounded text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            bulkUpdateVariants("price", bulkEditPrice)
                          }
                          className="px-3 py-1.5 bg-blue text-white rounded text-xs hover:bg-blue-600 font-medium"
                          disabled={selectedVariants.size === 0}
                        >
                          Áp dụng giá
                        </button>
                        <input
                          type="number"
                          value={bulkEditStock}
                          onChange={(e) => setBulkEditStock(e.target.value)}
                          placeholder="Kho"
                          className="w-28 px-2 py-1.5 bg-white border border-gray-300 rounded text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            bulkUpdateVariants("stock", bulkEditStock)
                          }
                          className="px-3 py-1.5 bg-blue text-white rounded text-xs hover:bg-blue-600 font-medium"
                          disabled={selectedVariants.size === 0}
                        >
                          Áp dụng kho
                        </button>
                        {selectedVariants.size > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedVariants(new Set())}
                            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded"
                          >
                            Bỏ chọn
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs border-b border-gray-200 w-10">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedVariants.size === variants.length &&
                                    variants.length > 0
                                  }
                                  onChange={selectAllVariants}
                                  className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
                                />
                              </th>
                              <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs border-b border-gray-200">
                                Biến thể
                              </th>
                              <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs border-b border-gray-200">
                                Giá (₫)
                              </th>
                              <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs border-b border-gray-200">
                                Giá KM (₫)
                              </th>
                              <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs border-b border-gray-200">
                                Kho
                              </th>
                              <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs border-b border-gray-200">
                                SKU
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {variants.map((variant, idx) => (
                              <tr
                                key={idx}
                                className={`hover:bg-gray-50 ${selectedVariants.has(idx) ? "bg-blue-50" : ""}`}
                              >
                                <td className="py-2 px-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedVariants.has(idx)}
                                    onChange={() => toggleVariantSelection(idx)}
                                    className="w-4 h-4 text-blue border-gray-300 rounded focus:ring-blue"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <div className="text-gray-800 font-medium text-xs">
                                    {formatOptionsForDisplay(variant.options)}
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={
                                      variant.price === 0
                                        ? ""
                                        : formatNumber(variant.price)
                                    }
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      if (inputValue === "") {
                                        updateVariant(idx, "price", 0);
                                        return;
                                      }
                                      let cleaned = inputValue.replace(
                                        /[^\d]/g,
                                        ""
                                      );
                                      if (
                                        cleaned.length > 1 &&
                                        cleaned.startsWith("0")
                                      ) {
                                        cleaned = cleaned.replace(/^0+/, "");
                                      }
                                      if (cleaned === "" || cleaned === "0") {
                                        updateVariant(idx, "price", 0);
                                        return;
                                      }
                                      const numValue = parseFloat(cleaned) || 0;
                                      updateVariant(idx, "price", numValue);
                                    }}
                                    placeholder="0"
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue focus:border-blue outline-none text-xs"
                                    required
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={
                                      !variant.discountedPrice ||
                                      variant.discountedPrice === 0
                                        ? ""
                                        : formatNumber(variant.discountedPrice)
                                    }
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      if (inputValue === "") {
                                        updateVariant(
                                          idx,
                                          "discountedPrice",
                                          null
                                        );
                                        return;
                                      }
                                      let cleaned = inputValue.replace(
                                        /[^\d]/g,
                                        ""
                                      );
                                      if (
                                        cleaned.length > 1 &&
                                        cleaned.startsWith("0")
                                      ) {
                                        cleaned = cleaned.replace(/^0+/, "");
                                      }
                                      if (cleaned === "" || cleaned === "0") {
                                        updateVariant(
                                          idx,
                                          "discountedPrice",
                                          null
                                        );
                                        return;
                                      }
                                      const numValue = parseFloat(cleaned) || 0;
                                      updateVariant(
                                        idx,
                                        "discountedPrice",
                                        numValue
                                      );
                                    }}
                                    placeholder="0"
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue focus:border-blue outline-none text-xs"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    value={variant.stock}
                                    onChange={(e) =>
                                      updateVariant(
                                        idx,
                                        "stock",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    min="0"
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue focus:border-blue outline-none text-xs"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={variant.sku || ""}
                                    onChange={(e) =>
                                      updateVariant(idx, "sku", e.target.value)
                                    }
                                    placeholder="Auto"
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue focus:border-blue outline-none text-xs font-mono"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/admin/products`)}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue text-white rounded-xl hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : product ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Cập nhật
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Tạo mới
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
