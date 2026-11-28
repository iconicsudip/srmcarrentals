-- Roles become free-form so new ones can be created in the admin
ALTER TABLE "roles" ALTER COLUMN "name" TYPE TEXT USING "name"::text;
DROP TYPE "RoleName";

-- Built-in vs custom permissions
ALTER TABLE "permissions" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT true;

-- Staff can be limited to the locations they manage
ALTER TABLE "users" ADD COLUMN "restrictToLocations" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "user_locations" (
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    CONSTRAINT "user_locations_pkey" PRIMARY KEY ("userId","locationId")
);

CREATE INDEX "user_locations_locationId_idx" ON "user_locations"("locationId");

ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
