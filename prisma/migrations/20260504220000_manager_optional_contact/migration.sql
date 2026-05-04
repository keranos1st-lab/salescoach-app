-- Менеджер без логина: email/password не обязательны; телефон и должность — опционально.
ALTER TABLE "Manager" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Manager" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "Manager" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Manager" ADD COLUMN IF NOT EXISTS "title" TEXT;
