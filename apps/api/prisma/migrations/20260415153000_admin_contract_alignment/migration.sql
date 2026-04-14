-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- AlterEnum
ALTER TYPE "NoticeStatus" RENAME VALUE 'ARCHIVED' TO 'ENDED';
ALTER TYPE "NoticeStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "QuoteBanner"
ADD COLUMN "startAt" TIMESTAMP(3),
ADD COLUMN "endAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notice"
RENAME COLUMN "publishedAt" TO "publishStartAt";

-- AlterTable
ALTER TABLE "Notice"
ADD COLUMN "publishEndAt" TIMESTAMP(3);

-- DropIndex
DROP INDEX IF EXISTS "Notice_status_pinned_publishedAt_idx";

-- CreateIndex
CREATE INDEX "Notice_status_pinned_publishStartAt_idx"
ON "Notice"("status", "pinned" DESC, "publishStartAt" DESC);
