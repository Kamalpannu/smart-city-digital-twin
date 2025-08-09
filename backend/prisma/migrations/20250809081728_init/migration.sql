-- CreateTable
CREATE TABLE "public"."automation_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT,
    "traffic_threshold" DOUBLE PRECISION,
    "enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."latest_state" (
    "zone" TEXT NOT NULL,
    "traffic" DOUBLE PRECISION,
    "pollution" DOUBLE PRECISION,
    "timestamp" TIMESTAMPTZ(6),
    "predicted_traffic" DOUBLE PRECISION,
    "reroute_suggested" BOOLEAN,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "latest_state_pkey" PRIMARY KEY ("zone")
);

-- CreateTable
CREATE TABLE "public"."sensor_readings" (
    "id" SERIAL NOT NULL,
    "zone" TEXT NOT NULL,
    "traffic" DOUBLE PRECISION NOT NULL,
    "pollution" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sensor_readings_timestamp_idx" ON "public"."sensor_readings"("timestamp" DESC);
