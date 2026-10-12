-- CreateEnum
CREATE TYPE "LocationKind" AS ENUM ('CITY', 'POINT');

-- AlterTable
ALTER TABLE "locations" ADD COLUMN "kind" "LocationKind" NOT NULL DEFAULT 'POINT';

-- Existing city-level entries (named exactly like their city, with other locations in the same city) become CITY rows
UPDATE "locations" l
SET "kind" = 'CITY'
WHERE lower(trim(l."name")) = lower(trim(l."city"))
  AND EXISTS (
    SELECT 1 FROM "locations" o
    WHERE o."id" <> l."id" AND lower(trim(o."city")) = lower(trim(l."city"))
  );

-- CreateIndex
CREATE INDEX "locations_kind_idx" ON "locations"("kind");
