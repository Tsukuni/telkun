-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facilityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "area" REAL NOT NULL,
    "rentPrice" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "features" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Section_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Section" ("area", "category", "createdAt", "facilityId", "features", "floor", "id", "name", "rentPrice", "status", "updatedAt") SELECT "area", "category", "createdAt", "facilityId", "features", "floor", "id", "name", "rentPrice", "status", "updatedAt" FROM "Section";
DROP TABLE "Section";
ALTER TABLE "new_Section" RENAME TO "Section";
CREATE INDEX "Section_facilityId_idx" ON "Section"("facilityId");
CREATE INDEX "Section_category_idx" ON "Section"("category");
CREATE INDEX "Section_status_idx" ON "Section"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
