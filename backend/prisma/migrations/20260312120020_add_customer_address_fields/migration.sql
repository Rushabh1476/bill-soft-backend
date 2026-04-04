-- AlterTable
ALTER TABLE "customers" ADD COLUMN "city" TEXT;
ALTER TABLE "customers" ADD COLUMN "pincode" TEXT;
ALTER TABLE "customers" ADD COLUMN "state" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_demo_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_demo_requests" ("company_name", "created_at", "email", "id", "name", "phone", "status", "updated_at") SELECT "company_name", "created_at", "email", "id", "name", "phone", "status", "updated_at" FROM "demo_requests";
DROP TABLE "demo_requests";
ALTER TABLE "new_demo_requests" RENAME TO "demo_requests";
CREATE TABLE "new_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_leads" ("created_at", "email", "id", "message", "name", "phone", "status", "updated_at") SELECT "created_at", "email", "id", "message", "name", "phone", "status", "updated_at" FROM "leads";
DROP TABLE "leads";
ALTER TABLE "new_leads" RENAME TO "leads";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
