-- CreateEnum
CREATE TYPE "TodoPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueOn" DATE,
    "priority" "TodoPriority" NOT NULL DEFAULT 'NORMAL',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteBanner" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'lifeNote',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteBanner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodMonthBudget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "budgetAmount" INTEGER NOT NULL,

    CONSTRAINT "FoodMonthBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodDaySpend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "memo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodDaySpend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Todo_userId_createdAt_id_idx" ON "Todo"("userId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Todo_userId_dueOn_idx" ON "Todo"("userId", "dueOn");

-- CreateIndex
CREATE INDEX "QuoteBanner_active_priority_idx" ON "QuoteBanner"("active", "priority" DESC);

-- CreateIndex
CREATE INDEX "FoodDaySpend_userId_date_idx" ON "FoodDaySpend"("userId", "date");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodMonthBudget" ADD CONSTRAINT "FoodMonthBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodDaySpend" ADD CONSTRAINT "FoodDaySpend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "FoodMonthBudget_userId_yearMonth_key" ON "FoodMonthBudget"("userId", "yearMonth");

-- CreateIndex
CREATE UNIQUE INDEX "FoodDaySpend_userId_date_key" ON "FoodDaySpend"("userId", "date");
