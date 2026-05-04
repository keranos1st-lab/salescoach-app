-- Legacy init used TEXT role default 'user'; schema expects PostgreSQL enum "Role".
-- 1) Normalize known legacy value (no data deletion).
UPDATE "User" SET role = 'OWNER' WHERE role = 'user';

-- 2) Align column type with Prisma enum Role (enum "Role" must already exist).
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OWNER'::"Role";
