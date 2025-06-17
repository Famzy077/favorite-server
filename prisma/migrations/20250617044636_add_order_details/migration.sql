/*
  Warnings:

  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserDetails" DROP CONSTRAINT "UserDetails_userId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerName" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
