-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "sub_user_id" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "user_name" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "image_url" TEXT;

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "tax_rate" REAL DEFAULT 0,
    "category" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "demo_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bill_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bill_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "total" REAL NOT NULL,
    "tax_id" TEXT,
    "tax_rate" REAL DEFAULT 0,
    "tax_amount" REAL DEFAULT 0,
    "is_service" BOOLEAN NOT NULL DEFAULT false,
    "service_id" TEXT,
    CONSTRAINT "bill_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bill_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bill_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bill_items_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bill_items" ("bill_id", "id", "price", "product_id", "product_name", "quantity", "tax_amount", "tax_id", "tax_rate", "total") SELECT "bill_id", "id", "price", "product_id", "product_name", "quantity", "tax_amount", "tax_id", "tax_rate", "total" FROM "bill_items";
DROP TABLE "bill_items";
ALTER TABLE "new_bill_items" RENAME TO "bill_items";
CREATE TABLE "new_bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" REAL NOT NULL,
    "tax_amount" REAL NOT NULL DEFAULT 0,
    "total_amount" REAL NOT NULL,
    "due_date" DATETIME,
    "notes" TEXT,
    "template_id" TEXT DEFAULT 'standard',
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_amount" REAL NOT NULL DEFAULT 0,
    "due_amount" REAL,
    "qr_code_url" TEXT,
    "is_whatsapp_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_notification_read" BOOLEAN NOT NULL DEFAULT false,
    "branch_id" TEXT,
    "supplier_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bills_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bills_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bills_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bills" ("bill_number", "branch_id", "created_at", "customer_email", "customer_id", "customer_name", "due_amount", "due_date", "id", "is_whatsapp_sent", "notes", "paid_amount", "payment_status", "qr_code_url", "status", "subtotal", "tax_amount", "template_id", "total_amount", "updated_at", "user_id") SELECT "bill_number", "branch_id", "created_at", "customer_email", "customer_id", "customer_name", "due_amount", "due_date", "id", "is_whatsapp_sent", "notes", "paid_amount", "payment_status", "qr_code_url", "status", "subtotal", "tax_amount", "template_id", "total_amount", "updated_at", "user_id" FROM "bills";
DROP TABLE "bills";
ALTER TABLE "new_bills" RENAME TO "bills";
CREATE UNIQUE INDEX "bills_bill_number_key" ON "bills"("bill_number");
CREATE INDEX "bills_user_id_created_at_idx" ON "bills"("user_id", "created_at");
CREATE INDEX "bills_user_id_customer_name_idx" ON "bills"("user_id", "customer_name");
CREATE INDEX "bills_customer_id_idx" ON "bills"("customer_id");
CREATE INDEX "bills_status_idx" ON "bills"("status");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "company_name" TEXT,
    "logo_url" TEXT,
    "logo_position" TEXT DEFAULT 'left',
    "logo_width" INTEGER DEFAULT 100,
    "logo_offset_x" INTEGER DEFAULT 0,
    "logo_offset_y" INTEGER DEFAULT 0,
    "avatar_url" TEXT,
    "address" TEXT,
    "gst_number" TEXT,
    "pan_number" TEXT,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "two_factor_backup_codes" TEXT,
    "permissions" TEXT DEFAULT '[]',
    "invitation_token" TEXT,
    "invitation_expiry" DATETIME,
    "password_set" BOOLEAN NOT NULL DEFAULT true,
    "role_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" DATETIME,
    "password_changed_at" DATETIME,
    "password_expires_at" DATETIME,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" DATETIME,
    "google_id" TEXT,
    "oauth_provider" TEXT,
    "planType" TEXT NOT NULL DEFAULT 'FREE',
    "plan_expires_at" DATETIME,
    "parent_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("company_name", "created_at", "email", "failed_login_attempts", "google_id", "id", "is_active", "last_login_at", "locked_until", "logo_url", "name", "oauth_provider", "password", "password_changed_at", "password_expires_at", "phone", "planType", "plan_expires_at", "role_id", "two_factor_backup_codes", "two_factor_enabled", "two_factor_secret", "updated_at") SELECT "company_name", "created_at", "email", "failed_login_attempts", "google_id", "id", "is_active", "last_login_at", "locked_until", "logo_url", "name", "oauth_provider", "password", "password_changed_at", "password_expires_at", "phone", "planType", "plan_expires_at", "role_id", "two_factor_backup_codes", "two_factor_enabled", "two_factor_secret", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_invitation_token_key" ON "users"("invitation_token");
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "services_user_id_idx" ON "services"("user_id");

-- CreateIndex
CREATE INDEX "services_name_idx" ON "services"("name");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_sub_user_id_idx" ON "audit_logs"("sub_user_id");

-- CreateIndex
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "products_user_id_idx" ON "products"("user_id");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_stock_idx" ON "products"("stock");
