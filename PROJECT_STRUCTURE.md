# 📁 Project Structure & Architecture

This document provides a high-level overview of the BillSoft SaaS repository and how the components interact.

---

## 🏗️ 1. Global Structure

```text
.
├── backend/            # Fastify API (Node.js + TypeScript)
├── frontend/           # React SPA (Material UI + TypeScript)
├── docker-compose.yml  # Main production orchestration
├── README.md           # Getting started guide
└── DEPLOYMENT_GUIDE.md # VPS & Production maintenance (New)
```

---

## 🖥️ 2. Frontend (`/frontend`)

- **Core**: React 18, React Router 6.
- **UI Framework**: Material UI (MUI) with a custom premium design system (`src/theme/theme.ts`).
- **Data Flow**:
  - `src/services/api.ts`: Centralized Axios instances for communication with the backend.
  - `src/contexts/AuthContext.tsx`: Manages user sessions and permissions.
- **Key Modules**:
  - `src/pages/`: Main views (Bills, Customers, Dashboard, etc.).
  - `src/modules/billing-templates/`: Logical engine for rendering different bill formats (A4, Retail, etc.).
- **Validation**: Uses `zod` for frontend form validation (`src/utils/validation.ts`).

---

## ⚙️ 3. Backend (`/backend`)

- **Core**: Fastify with TypeScript.
- **Database**: SQLite (managed via Prisma).
- **Architecture**:
  - `src/routes/`: API endpoint definitions organized by resource (bills, auth, customers).
  - `src/plugins/`: Fastify plugins for security (Helmet, JWT), CORS, and more.
  - `src/lib/`: Common utilities (Auth logic, database client).
- **Prisma**:
  - `prisma/schema.prisma`: The single source of truth for the database structure.
  - `npx prisma studio`: Recommended for browsing data locally.

---

## 🛠️ 4. Common Developer Workflows

### **Adding a New Page**
1. Create a component in `frontend/src/pages/`.
2. Register the route in `frontend/src/App.tsx`.
3. Add the navigation item in `frontend/src/components/common/Sidebar.tsx`.

### **Adding a New Database Field**
1. Modify `backend/prisma/schema.prisma`.
2. Run `npx prisma migrate dev` in the `backend` folder.
3. Update the Zod schemas in `frontend/src/utils/validation.ts` to match.

---

## 🔒 5. Security Principles

- **Permissions**: Every sensitive action is protected by a Role-Based Access Control (RBAC) check on both the backend and frontend.
- **Secure Actions**: Critical actions (like deleting bills or changing security settings) require a **Security PIN** check via the `SecureActionDialog`.
