-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "magentoId" TEXT,
    "sourceWebsite" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "magentoOrderId" TEXT,
    "sourceWebsite" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerId" TEXT NOT NULL,
    "selectedRateId" TEXT,
    "trackingNumber" TEXT,
    "carrierBooked" TEXT,
    "estimatedDelivery" DATETIME,
    "actualDelivery" DATETIME,
    "totalAmount" REAL,
    "shippingCost" REAL,
    "notes" TEXT,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_selectedRateId_fkey" FOREIGN KEY ("selectedRateId") REFERENCES "RateQuote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShipmentDetails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "originZip" TEXT NOT NULL,
    "destinationZip" TEXT NOT NULL,
    "destinationCity" TEXT,
    "destinationState" TEXT,
    "cabinetCount" INTEGER NOT NULL,
    "cabinetType" TEXT NOT NULL,
    "hasLazySusan" BOOLEAN NOT NULL DEFAULT false,
    "lazySusanQty" INTEGER,
    "hasVentHood" BOOLEAN NOT NULL DEFAULT false,
    "ventHoodQty" INTEGER,
    "hasDrawers" BOOLEAN NOT NULL DEFAULT false,
    "drawerQty" INTEGER,
    "deliveryLocationType" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL,
    "appointmentRequired" BOOLEAN NOT NULL DEFAULT false,
    "estimatedWeight" REAL NOT NULL,
    "freightClass" TEXT,
    "estimatedPallets" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShipmentDetails_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "serviceLevel" TEXT NOT NULL,
    "totalCost" REAL NOT NULL,
    "transitDays" INTEGER NOT NULL,
    "estimatedDelivery" DATETIME NOT NULL,
    "rawResponse" TEXT NOT NULL,
    "quotedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RateQuote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "performedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_sourceWebsite_idx" ON "Customer"("sourceWebsite");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_magentoOrderId_key" ON "Order"("magentoOrderId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_sourceWebsite_idx" ON "Order"("sourceWebsite");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentDetails_orderId_key" ON "ShipmentDetails"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "AuditLog_orderId_idx" ON "AuditLog"("orderId");
