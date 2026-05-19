-- Persist AI call analysis for history / reports
ALTER TABLE "Call" ADD COLUMN "positives" JSONB;
ALTER TABLE "Call" ADD COLUMN "negatives" JSONB;
ALTER TABLE "Call" ADD COLUMN "nextTask" TEXT;
ALTER TABLE "Call" ADD COLUMN "analysisJson" JSONB;
