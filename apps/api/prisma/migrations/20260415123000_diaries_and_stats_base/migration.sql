-- CreateTable
CREATE TABLE "DiaryTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "templateId" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diary_userId_date_key" ON "Diary"("userId", "date");

-- CreateIndex
CREATE INDEX "Diary_userId_date_idx" ON "Diary"("userId", "date");

-- AddForeignKey
ALTER TABLE "Diary" ADD CONSTRAINT "Diary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
