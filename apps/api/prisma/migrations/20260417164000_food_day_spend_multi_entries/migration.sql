-- AlterTable
ALTER TABLE "FoodDaySpend" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropIndex
DROP INDEX "FoodDaySpend_userId_date_key";

-- CreateIndex
CREATE INDEX "FoodDaySpend_userId_date_createdAt_id_idx" ON "FoodDaySpend"("userId", "date" DESC, "createdAt" DESC, "id" DESC);
