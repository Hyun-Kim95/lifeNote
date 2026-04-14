-- CreateEnum
CREATE TYPE "PlanPeriod" AS ENUM ('MORNING', 'FORENOON', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "WeekPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeekPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSlot" (
    "id" TEXT NOT NULL,
    "weekPlanId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "period" "PlanPeriod" NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlanSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "status" "NoticeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeekPlan_userId_weekStart_key" ON "WeekPlan"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "PlanSlot_weekPlanId_dayOfWeek_sortOrder_idx" ON "PlanSlot"("weekPlanId", "dayOfWeek", "sortOrder");

-- CreateIndex
CREATE INDEX "Notice_status_pinned_publishedAt_idx" ON "Notice"("status", "pinned" DESC, "publishedAt" DESC);

-- AddForeignKey
ALTER TABLE "WeekPlan" ADD CONSTRAINT "WeekPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSlot" ADD CONSTRAINT "PlanSlot_weekPlanId_fkey" FOREIGN KEY ("weekPlanId") REFERENCES "WeekPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
