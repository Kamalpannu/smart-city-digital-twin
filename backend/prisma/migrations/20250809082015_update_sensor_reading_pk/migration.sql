/*
  Warnings:

  - The primary key for the `sensor_readings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `sensor_readings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."sensor_readings" DROP CONSTRAINT "sensor_readings_pkey",
DROP COLUMN "created_at",
ADD CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id", "timestamp");
