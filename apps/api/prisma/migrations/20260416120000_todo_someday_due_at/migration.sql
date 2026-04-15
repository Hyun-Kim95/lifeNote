-- AlterEnum
ALTER TYPE "TodoScheduleType" ADD VALUE 'SOMEDAY';

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "dueAt" TIMESTAMPTZ;

-- Backfill dueAt from date fields (UTC midnight for DATE columns)
UPDATE "Todo"
SET "dueAt" = (("dueOn"::text || ' 00:00:00')::timestamp AT TIME ZONE 'UTC')
WHERE "dueOn" IS NOT NULL AND "dueAt" IS NULL;

UPDATE "Todo"
SET "dueAt" = (("startDate"::text || ' 00:00:00')::timestamp AT TIME ZONE 'UTC')
WHERE "dueAt" IS NULL AND "startDate" IS NOT NULL;
