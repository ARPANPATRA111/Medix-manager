-- CreateTable
CREATE TABLE "pharmacy_dispenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "drugId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "dispensedBy" TEXT NOT NULL,
    "dispensedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pharmacy_dispenses_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "drugs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pharmacy_dispenses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_admissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "admissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDischargeDate" DATETIME,
    "dischargeDate" DATETIME,
    "reason" TEXT NOT NULL,
    "admittingDoctorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ADMITTED',
    "notes" TEXT,
    "totalBedCharges" REAL NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "admissions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "admissions_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "beds" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_admissions" ("admissionDate", "admittingDoctorId", "bedId", "createdAt", "dischargeDate", "id", "notes", "patientId", "reason", "status", "updatedAt") SELECT "admissionDate", "admittingDoctorId", "bedId", "createdAt", "dischargeDate", "id", "notes", "patientId", "reason", "status", "updatedAt" FROM "admissions";
DROP TABLE "admissions";
ALTER TABLE "new_admissions" RENAME TO "admissions";
CREATE TABLE "new_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentDate" DATETIME NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "fee" REAL NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_appointments" ("appointmentDate", "appointmentTime", "createdAt", "doctorId", "duration", "id", "notes", "patientId", "reason", "status", "updatedAt") SELECT "appointmentDate", "appointmentTime", "createdAt", "doctorId", "duration", "id", "notes", "patientId", "reason", "status", "updatedAt" FROM "appointments";
DROP TABLE "appointments";
ALTER TABLE "new_appointments" RENAME TO "appointments";
CREATE UNIQUE INDEX "appointments_doctorId_appointmentDate_appointmentTime_key" ON "appointments"("doctorId", "appointmentDate", "appointmentTime");
CREATE TABLE "new_beds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wardId" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "bedType" TEXT NOT NULL,
    "pricePerDay" REAL NOT NULL DEFAULT 0,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "beds_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "wards" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_beds" ("bedNumber", "bedType", "createdAt", "id", "isActive", "isOccupied", "updatedAt", "wardId") SELECT "bedNumber", "bedType", "createdAt", "id", "isActive", "isOccupied", "updatedAt", "wardId" FROM "beds";
DROP TABLE "beds";
ALTER TABLE "new_beds" RENAME TO "beds";
CREATE UNIQUE INDEX "beds_wardId_bedNumber_key" ON "beds"("wardId", "bedNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
