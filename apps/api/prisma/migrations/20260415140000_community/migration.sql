-- CreateEnum
CREATE TYPE "CommunityReportTarget" AS ENUM ('POST', 'COMMENT');

-- CreateTable
CREATE TABLE "CommunityPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "CommunityReportTarget" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityComment_postId_createdAt_idx" ON "CommunityComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "CommunityReport_targetType_targetId_idx" ON "CommunityReport"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityReport_reporterId_targetType_targetId_key" ON "CommunityReport"("reporterId", "targetType", "targetId");

-- AddForeignKey
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
