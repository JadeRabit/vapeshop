-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN "isPreOrder" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "isPreOrder" BOOLEAN NOT NULL DEFAULT false;
