-- AlterTable
ALTER TABLE "settings" ADD COLUMN "autoGenerateInvoiceNumbers" BOOLEAN DEFAULT true;
ALTER TABLE "settings" ADD COLUMN "customColumns" TEXT DEFAULT '["Product Name", "Quantity", "Price", "Total"]';
ALTER TABLE "settings" ADD COLUMN "includeTaxBreakdown" BOOLEAN DEFAULT true;
ALTER TABLE "settings" ADD COLUMN "primaryColor" TEXT DEFAULT '#3b82f6';
ALTER TABLE "settings" ADD COLUMN "requireApproval" BOOLEAN DEFAULT false;
ALTER TABLE "settings" ADD COLUMN "sendEmailNotifications" BOOLEAN DEFAULT false;
ALTER TABLE "settings" ADD COLUMN "showLogo" BOOLEAN DEFAULT true;
ALTER TABLE "settings" ADD COLUMN "showPaymentTerms" BOOLEAN DEFAULT true;

-- CreateTable
CREATE TABLE "service_tickets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "service_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "service_tickets_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "service_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custom_columns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "entity" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "custom_columns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_products" INTEGER NOT NULL DEFAULT 0,
    "processed_products" INTEGER NOT NULL DEFAULT 0,
    "failed_products" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "error_log" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "po_number" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "order_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_amount" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "purchase_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "item_name" TEXT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "price" REAL NOT NULL,
    "total" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bill_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bill_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT NOT NULL,
    "quantity" BIGINT NOT NULL,
    "price" REAL NOT NULL,
    "total" REAL NOT NULL,
    "tax_id" TEXT,
    "tax_rate" REAL DEFAULT 0,
    "tax_amount" REAL DEFAULT 0,
    "is_service" BOOLEAN NOT NULL DEFAULT false,
    "service_id" TEXT,
    "custom_fields" TEXT,
    CONSTRAINT "bill_items_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bill_items_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bill_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bill_items_bill_id_fkey" FOREIGN KEY ("bill_id") REFERENCES "bills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_bill_items" ("bill_id", "id", "is_service", "price", "product_id", "product_name", "quantity", "service_id", "tax_amount", "tax_id", "tax_rate", "total") SELECT "bill_id", "id", "is_service", "price", "product_id", "product_name", "quantity", "service_id", "tax_amount", "tax_id", "tax_rate", "total" FROM "bill_items";
DROP TABLE "bill_items";
ALTER TABLE "new_bill_items" RENAME TO "bill_items";
CREATE TABLE "new_bills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT,
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
    "columns_snapshot" TEXT,
    "branch_id" TEXT,
    "supplier_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bills_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bills_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bills_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bills" ("bill_number", "branch_id", "created_at", "customer_email", "customer_id", "customer_name", "due_amount", "due_date", "id", "is_notification_read", "is_whatsapp_sent", "notes", "paid_amount", "payment_status", "qr_code_url", "status", "subtotal", "supplier_id", "tax_amount", "template_id", "total_amount", "updated_at", "user_id") SELECT "bill_number", "branch_id", "created_at", "customer_email", "customer_id", "customer_name", "due_amount", "due_date", "id", "is_notification_read", "is_whatsapp_sent", "notes", "paid_amount", "payment_status", "qr_code_url", "status", "subtotal", "supplier_id", "tax_amount", "template_id", "total_amount", "updated_at", "user_id" FROM "bills";
DROP TABLE "bills";
ALTER TABLE "new_bills" RENAME TO "bills";
CREATE UNIQUE INDEX "bills_bill_number_key" ON "bills"("bill_number");
CREATE INDEX "bills_user_id_created_at_idx" ON "bills"("user_id", "created_at");
CREATE INDEX "bills_user_id_customer_name_idx" ON "bills"("user_id", "customer_name");
CREATE INDEX "bills_customer_id_idx" ON "bills"("customer_id");
CREATE INDEX "bills_status_idx" ON "bills"("status");
CREATE TABLE "new_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gst_number" TEXT,
    "dob" DATETIME,
    "anniversary_date" DATETIME,
    "loyalty_points" REAL NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_marked_red" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT,
    "pincode" TEXT,
    "state" TEXT,
    CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_customers" ("address", "anniversary_date", "city", "created_at", "dob", "email", "gst_number", "id", "loyalty_points", "name", "phone", "pincode", "state", "updated_at", "user_id") SELECT "address", "anniversary_date", "city", "created_at", "dob", "email", "gst_number", "id", "loyalty_points", "name", "phone", "pincode", "state", "updated_at", "user_id" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");
CREATE INDEX "customers_name_idx" ON "customers"("name");
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "tax_rate" REAL DEFAULT 0,
    "stock" BIGINT DEFAULT 0,
    "category" TEXT,
    "sku" TEXT,
    "min_stock_level" INTEGER DEFAULT 0,
    "expiry_date" DATETIME,
    "batch_number" TEXT,
    "supplier_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_marked_red" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "custom_fields" TEXT,
    CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_products" ("batch_number", "category", "created_at", "description", "expiry_date", "id", "image_url", "min_stock_level", "name", "price", "sku", "stock", "supplier_id", "tax_rate", "updated_at", "user_id") SELECT "batch_number", "category", "created_at", "description", "expiry_date", "id", "image_url", "min_stock_level", "name", "price", "sku", "stock", "supplier_id", "tax_rate", "updated_at", "user_id" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_user_id_idx" ON "products"("user_id");
CREATE INDEX "products_name_idx" ON "products"("name");
CREATE INDEX "products_stock_idx" ON "products"("stock");
CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_sku_idx" ON "products"("sku");
CREATE TABLE "new_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "tax_rate" REAL DEFAULT 0,
    "category" TEXT,
    "duration" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "services_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_services" ("category", "created_at", "description", "id", "name", "price", "tax_rate", "updated_at", "user_id") SELECT "category", "created_at", "description", "id", "name", "price", "tax_rate", "updated_at", "user_id" FROM "services";
DROP TABLE "services";
ALTER TABLE "new_services" RENAME TO "services";
CREATE INDEX "services_user_id_idx" ON "services"("user_id");
CREATE INDEX "services_name_idx" ON "services"("name");
CREATE TABLE "new_suppliers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "state" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "gst_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "balance" REAL NOT NULL DEFAULT 0,
    "branch_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "is_marked_red" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "suppliers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "suppliers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_suppliers" ("address", "balance", "branch_id", "contact", "created_at", "email", "id", "name", "phone", "updated_at", "user_id") SELECT "address", "balance", "branch_id", "contact", "created_at", "email", "id", "name", "phone", "updated_at", "user_id" FROM "suppliers";
DROP TABLE "suppliers";
ALTER TABLE "new_suppliers" RENAME TO "suppliers";
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
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
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
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
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
    "customColumns" TEXT DEFAULT '["Product Name", "Quantity", "Price", "Total"]',
    "is_employee" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "users_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("address", "avatar_url", "company_name", "created_at", "email", "failed_login_attempts", "google_id", "gst_number", "id", "invitation_expiry", "invitation_token", "is_active", "last_login_at", "locked_until", "logo_offset_x", "logo_offset_y", "logo_position", "logo_url", "logo_width", "name", "oauth_provider", "pan_number", "parent_id", "password", "password_changed_at", "password_expires_at", "password_set", "permissions", "phone", "planType", "plan_expires_at", "role_id", "two_factor_backup_codes", "two_factor_enabled", "two_factor_secret", "updated_at") SELECT "address", "avatar_url", "company_name", "created_at", "email", "failed_login_attempts", "google_id", "gst_number", "id", "invitation_expiry", "invitation_token", "is_active", "last_login_at", "locked_until", "logo_offset_x", "logo_offset_y", "logo_position", "logo_url", "logo_width", "name", "oauth_provider", "pan_number", "parent_id", "password", "password_changed_at", "password_expires_at", "password_set", "permissions", "phone", "planType", "plan_expires_at", "role_id", "two_factor_backup_codes", "two_factor_enabled", "two_factor_secret", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_invitation_token_key" ON "users"("invitation_token");
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "service_tickets_user_id_idx" ON "service_tickets"("user_id");

-- CreateIndex
CREATE INDEX "service_tickets_customer_id_idx" ON "service_tickets"("customer_id");

-- CreateIndex
CREATE INDEX "service_tickets_service_id_idx" ON "service_tickets"("service_id");

-- CreateIndex
CREATE INDEX "custom_columns_user_id_idx" ON "custom_columns"("user_id");

-- CreateIndex
CREATE INDEX "import_jobs_user_id_idx" ON "import_jobs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_po_number_key" ON "purchase_orders"("po_number");

-- CreateIndex
CREATE INDEX "purchase_orders_user_id_idx" ON "purchase_orders"("user_id");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

