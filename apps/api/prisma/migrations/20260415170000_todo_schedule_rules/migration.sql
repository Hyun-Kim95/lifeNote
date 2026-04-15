-- CreateEnum
CREATE TYPE "TodoScheduleType" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY', 'INTERVAL');

-- AlterTable
ALTER TABLE "Todo"
ADD COLUMN "scheduleType" "TodoScheduleType" NOT NULL DEFAULT 'ONCE',
ADD COLUMN "startDate" DATE,
ADD COLUMN "endDate" DATE,
ADD COLUMN "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "monthDay" INTEGER,
ADD COLUMN "intervalDays" INTEGER;
