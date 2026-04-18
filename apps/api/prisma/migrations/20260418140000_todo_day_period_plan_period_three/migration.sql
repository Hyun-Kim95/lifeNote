-- Todo: 종일/오전/오후
CREATE TYPE "TodoDayPeriod" AS ENUM ('ALL_DAY', 'AM', 'PM');
ALTER TABLE "Todo" ADD COLUMN "dayPeriod" "TodoDayPeriod";

-- PlanSlot: 4분할 → 3분할 (텍스트로 전환 후 enum 재생성)
ALTER TABLE "PlanSlot" ALTER COLUMN "period" DROP DEFAULT;
ALTER TABLE "PlanSlot" ALTER COLUMN "period" TYPE TEXT USING (
  CASE "period"::text
    WHEN 'MORNING' THEN 'AM'
    WHEN 'FORENOON' THEN 'AM'
    WHEN 'AFTERNOON' THEN 'PM'
    WHEN 'EVENING' THEN 'PM'
    ELSE 'ALL_DAY'
  END
);

DROP TYPE "PlanPeriod";
CREATE TYPE "PlanPeriod" AS ENUM ('ALL_DAY', 'AM', 'PM');

ALTER TABLE "PlanSlot"
  ALTER COLUMN "period" TYPE "PlanPeriod" USING ("period"::"PlanPeriod");

ALTER TABLE "PlanSlot" ALTER COLUMN "period" SET DEFAULT 'ALL_DAY'::"PlanPeriod";
