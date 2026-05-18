-- Drop legacy tables from old prototype (data confirmed expendable)
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS managers CASCADE;
DROP TABLE IF EXISTS company_profile CASCADE;
DROP TABLE IF EXISTS "PasswordResetToken" CASCADE;

-- Drop legacy columns from User if they exist
ALTER TABLE "User" DROP COLUMN IF EXISTS password;
ALTER TABLE "User" DROP COLUMN IF EXISTS plan;
