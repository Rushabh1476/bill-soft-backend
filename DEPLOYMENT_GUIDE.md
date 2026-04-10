# 🚀 BillSoft SaaS: Deployment & Maintenance Guide (VPS)

This guide provides the necessary steps to deploy, update, and maintain the BillSoft SaaS platform on your VPS, incorporating the recent frontend build fixes.

---

## 🏗️ 1. System Architecture Overview

- **Frontend**: React (SPA) served via Nginx in Docker. Port **3002** (Host) ↔ **80** (Container).
- **Backend**: Fastify (Node.js) with Prisma ORM. Port **5055** (Host) ↔ **5001** (Container).
- **Database**: SQLite (Stored in a persistent Docker volume `sqlite_data`).
- **Domain**: `billsoft.agbitsolutions.com`

---

## 🛠️ 2. Deployment Workflow (GitHub Actions)

The production deployment is automated using GitHub Actions.

### **Key Branches:**
- `rushbh`: Active development branch (with the latest lint/build fixes).
- `ready-for-vps`: **Production Deployment Branch**. Pushing to this branch triggers the VPS update.

### **Manual Sync & Deploy via Local Machine:**
If you want to push your local changes (`rushbh`) directly to the production VPS:
```powershell
git push origin rushbh:ready-for-vps
```

---

## 🛡️ 3. Critical Fixes (Implemented)

The following fixes were recently implemented to ensure the production build succeeds on the VPS:

| Category | Fixes Applied |
| :--- | :--- |
| **Linting** | Removed unused imports and variables in 15+ files (e.g., `EmployeeManagement`, `CustomerForm`, `TaxSettings`). |
| **Regex** | Fixed "unnecessary escape character" errors in `Signup.tsx`, `validation.ts`, and `validatePassword.ts`. |
| **Hooks** | Corrected `NotificationCenter.tsx` by wrapping `fetchAlerts` in `useCallback`. |
| **CI/CD** | The `deploy.yml` workflow now correctly triggers on push to `ready-for-vps`. |

---

## 🖥️ 4. Manual VPS Commands (SSH)

If you need to perform actions directly on the VPS:

### **Update Containers Manually:**
```bash
cd /home/agbdevops/billsoft/billsoft_saas
git pull origin ready-for-vps
docker compose down
docker compose build --no-cache
docker compose up -d
```

### **Database Management:**
To run new Prisma migrations manually inside the running backend container:
```bash
docker exec billsoft-backend npx prisma migrate deploy
```

### **Maintenance Mode:**
To put the site in a "System Upgrade" mode while working on a major change:
```bash
# Start maintenance page
docker compose -f docker-compose.maintenance.yml up -d

# ... after work is done, resume live site
docker compose -f docker-compose.maintenance.yml down
docker compose up -d
```

---

## ✅ 5. Post-Deployment Verification

After every deployment, check these locations:
1.  **Site Status**: [billsoft.agbitsolutions.com](https://billsoft.agbitsolutions.com)
2.  **Auth Health**: Try logging in to ensure the backend ↔ database connection is active.
3.  **Logs**: If there's an error, check container logs:
    ```bash
    docker logs -f billsoft-backend
    docker logs -f billsoft-frontend
    ```

---

> [!IMPORTANT]
> **Database Backups:** Always run `cp backend/data/billsoft.db backend/data/billsoft.db.bak` before manual changes to ensure you have a fallback.
