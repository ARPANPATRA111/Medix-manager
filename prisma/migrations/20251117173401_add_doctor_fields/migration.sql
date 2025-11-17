/*
  Warnings:

  - Added the required column `department` to the `doctors` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_doctors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "experience" INTEGER NOT NULL,
    "consultationFee" REAL NOT NULL,
    "availableFrom" TEXT NOT NULL,
    "availableTo" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "maxPatientsPerDay" INTEGER NOT NULL DEFAULT 20,
    "phone" TEXT,
    "email" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_doctors" ("availableFrom", "availableTo", "consultationFee", "createdAt", "experience", "id", "isAvailable", "licenseNumber", "maxPatientsPerDay", "qualification", "specialization", "updatedAt", "userId") SELECT "availableFrom", "availableTo", "consultationFee", "createdAt", "experience", "id", "isAvailable", "licenseNumber", "maxPatientsPerDay", "qualification", "specialization", "updatedAt", "userId" FROM "doctors";
DROP TABLE "doctors";
ALTER TABLE "new_doctors" RENAME TO "doctors";
CREATE UNIQUE INDEX "doctors_userId_key" ON "doctors"("userId");
CREATE UNIQUE INDEX "doctors_licenseNumber_key" ON "doctors"("licenseNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
