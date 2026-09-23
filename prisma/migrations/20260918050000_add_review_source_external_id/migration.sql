-- AlterTable: add source and externalId to testimonials
ALTER TABLE "testimonials" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "testimonials" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "testimonials_externalId_key" ON "testimonials"("externalId");
CREATE INDEX "testimonials_source_idx" ON "testimonials"("source");
