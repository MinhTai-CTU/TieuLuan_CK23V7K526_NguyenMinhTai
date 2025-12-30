-- Drop existing unique constraint
ALTER TABLE "wishlist_items" DROP CONSTRAINT IF EXISTS "wishlist_items_userId_productId_key";

-- Add new columns
ALTER TABLE "wishlist_items" ADD COLUMN IF NOT EXISTS "productVariantId" TEXT;
ALTER TABLE "wishlist_items" ADD COLUMN IF NOT EXISTS "selectedOptions" JSONB;

-- Add foreign key for productVariantId
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productVariantId_fkey" 
  FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_items_userId_productId_productVariantId_key" 
  ON "wishlist_items"("userId", "productId", "productVariantId");

