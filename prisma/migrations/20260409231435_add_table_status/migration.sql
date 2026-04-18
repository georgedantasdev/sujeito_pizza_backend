-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('FREE', 'OCCUPIED');

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "openedAt" TIMESTAMP(3),
ADD COLUMN     "openedById" TEXT,
ADD COLUMN     "status" "TableStatus" NOT NULL DEFAULT 'FREE';
