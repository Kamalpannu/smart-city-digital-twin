-- AlterTable
ALTER TABLE "public"."sensor_readings" ADD COLUMN     "source" TEXT DEFAULT 'simulated',
ADD COLUMN     "status" TEXT;
