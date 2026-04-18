-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "planSlotId" TEXT;

-- CreateIndex
CREATE INDEX "Todo_planSlotId_idx" ON "Todo"("planSlotId");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_planSlotId_fkey" FOREIGN KEY ("planSlotId") REFERENCES "PlanSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
