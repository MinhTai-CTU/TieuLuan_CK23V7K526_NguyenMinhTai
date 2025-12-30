"use client";

import { useEffect, useState } from "react";
import ProductForm from "@/components/Admin/Products/ProductForm";

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
  images: { url: string; type: string }[];
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState<string>("");

  useEffect(() => {
    params.then((p) => {
      setProductId(p.id);
      fetchProduct(p.id);
    });
  }, [params]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy sản phẩm</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductForm product={product} />
    </div>
  );
}
