/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productName` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productSku` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderNumber` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "productSku" TEXT NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "orderNumber" TEXT NOT NULL,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
