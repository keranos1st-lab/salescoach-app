-- Exclude calls from stats/reports without deleting (limits still count them)
ALTER TABLE "Call" ADD COLUMN "excluded" BOOLEAN NOT NULL DEFAULT false;
