-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "blogs_status_createdAt_idx" ON "blogs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_status_createdAt_idx" ON "bookings"("status", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_pickupLocationId_idx" ON "bookings"("pickupLocationId");

-- CreateIndex
CREATE INDEX "bookings_dropLocationId_idx" ON "bookings"("dropLocationId");

-- CreateIndex
CREATE INDEX "bookings_driverId_idx" ON "bookings"("driverId");

-- CreateIndex
CREATE INDEX "bookings_carId_pickupDateTime_dropDateTime_idx" ON "bookings"("carId", "pickupDateTime", "dropDateTime");

-- CreateIndex
CREATE INDEX "car_images_carId_isFeatured_sortOrder_idx" ON "car_images"("carId", "isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "cars_status_isFeatured_createdAt_idx" ON "cars"("status", "isFeatured", "createdAt");

-- CreateIndex
CREATE INDEX "cars_createdAt_idx" ON "cars"("createdAt");

-- CreateIndex
CREATE INDEX "chauffeur_services_status_sortOrder_idx" ON "chauffeur_services"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "coupons_status_idx" ON "coupons"("status");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_createdAt_idx" ON "customers"("createdAt");

-- CreateIndex
CREATE INDEX "gallery_images_status_sortOrder_idx" ON "gallery_images"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "locations_status_idx" ON "locations"("status");

-- CreateIndex
CREATE INDEX "locations_city_idx" ON "locations"("city");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_providerPaymentId_idx" ON "payments"("providerPaymentId");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- CreateIndex
CREATE INDEX "testimonials_status_sortOrder_createdAt_idx" ON "testimonials"("status", "sortOrder", "createdAt");

-- CreateIndex
CREATE INDEX "tours_status_sortOrder_idx" ON "tours"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");
