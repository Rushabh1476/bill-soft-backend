const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma/dev.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Add is_marked_red to products if it doesn't exist
    db.run("ALTER TABLE products ADD COLUMN is_marked_red BOOLEAN NOT NULL DEFAULT 0", (err) => {
        if (err) {
            console.log("Products column might already exist or error:", err.message);
        } else {
            console.log("Successfully added is_marked_red to products");
        }
    });

    // Add is_marked_red to customers if it doesn't exist
    db.run("ALTER TABLE customers ADD COLUMN is_marked_red BOOLEAN NOT NULL DEFAULT 0", (err) => {
        if (err) {
            console.log("Customers column might already exist or error:", err.message);
        } else {
            console.log("Successfully added is_marked_red to customers");
        }
    });
    
    // Add is_marked_red to suppliers if it doesn't exist (schema has it too)
    db.run("ALTER TABLE suppliers ADD COLUMN is_marked_red BOOLEAN NOT NULL DEFAULT 0", (err) => {
        if (err) {
            console.log("Suppliers column might already exist or error:", err.message);
        } else {
            console.log("Successfully added is_marked_red to suppliers");
        }
    });
});

db.close();
