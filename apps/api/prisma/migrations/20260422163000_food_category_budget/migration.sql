-- CreateTable
CREATE TABLE "FoodCategoryBudget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "budgetAmount" INTEGER NOT NULL,

    CONSTRAINT "FoodCategoryBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodCategoryBudget_userId_yearMonth_category_key"
ON "FoodCategoryBudget"("userId", "yearMonth", "category");

-- CreateIndex
CREATE INDEX "FoodCategoryBudget_userId_yearMonth_idx"
ON "FoodCategoryBudget"("userId", "yearMonth");

-- AddForeignKey
ALTER TABLE "FoodCategoryBudget"
ADD CONSTRAINT "FoodCategoryBudget_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
