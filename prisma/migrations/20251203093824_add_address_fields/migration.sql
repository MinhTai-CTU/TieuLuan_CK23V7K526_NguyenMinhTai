/*
  Warnings:

  - Added the required column `district` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ward` to the `addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "addressType" TEXT NOT NULL DEFAULT 'home',
ADD COLUMN     "cityId" TEXT,
ADD COLUMN     "district" TEXT NOT NULL,
ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "ward" TEXT NOT NULL,
ADD COLUMN     "wardId" TEXT,
ALTER COLUMN "country" SET DEFAULT 'Vietnam';
