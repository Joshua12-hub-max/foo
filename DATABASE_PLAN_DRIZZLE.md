# Database Centralization & Refactoring Plan (Drizzle ORM + MySQL)

## 1. Objective
To transition the existing database architecture to a centralized, type-safe, and accurate system using **Drizzle ORM** and **MySQL**, without losing existing data. This plan ensures data integrity and prepares the system for future scalability.

## 2. Technology Stack
- **ORM**: Drizzle ORM (Lightweight, SQL-like, Type-safe)
- **Database**: MySQL (Existing)
- **Driver**: `mysql2`
- **Tools**: `drizzle-kit` (For migrations and introspection)

## 3. Proposed Schema Architecture
The new schema will be defined in TypeScript, serving as the single source of truth.

### Core Modules

#### A. Human Resource (Core)
- **`departments`**: Hierarchical structure of the organization.
- **`positions`**: Standardized position titles and definitions (Salary Grades).
- **`employees`**: Centralized employee records.
  - *Improvement*: Merge `users` and `employees` concepts if currently separate.
  - *Improvement*: Extract heavy PDS (Personal Data Sheet) fields into related tables if necessary (`employee_pds_personal`, `employee_pds_education`, etc.) to improve performance and organization.
- **`employment_history`**: Tracking promotions, transfers, and status changes.

#### B. Plantilla Management
- **`plantilla_items`**: Specific budget items linked to Positions.
- **`qualification_standards`**: Requirements for each position.

#### C. Time & Attendance
- **`work_schedules`**: Shift definitions.
- **`attendance_logs`**: Raw biometric/clock-in data.
- **`daily_time_records`**: Processed daily summaries (Late, Undertime, Overtime calculations).

#### D. Leave Management
- **`leave_types`**: Configuration for VL, SL, etc.
- **`leave_credits`**: Current balances per employee.
- **`leave_ledger`**: History of credits added/used (Audit trail).
- **`leave_applications`**: Requests and approval workflows.

#### E. Recruitment
- **`job_vacancies`**: Openings linked to Plantilla Items.
- **`applicants`**: External profiles.
- **`job_applications`**: Link between Applicant and Vacancy.
- **`interviews`**: Scheduling and scoring.

## 4. Implementation Steps

### Phase 1: Installation & Setup
1.  Install dependencies:
    ```bash
    npm install drizzle-orm mysql2
    npm install -D drizzle-kit @types/node tsx
    ```
2.  Configure Drizzle (`drizzle.config.ts`) to point to the existing database.
3.  Initialize the Drizzle client (`backend/db/drizzle.ts`).

### Phase 2: Schema Definition (The "Accurate" Plan)
Create a centralized schema file `backend/db/schema.ts`.

*Example Structure:*

```typescript
// backend/db/schema.ts
import { mysqlTable, serial, varchar, int, boolean, date, timestamp, decimal, text } from 'drizzle-orm/mysql-core';

// Departments
export const departments = mysqlTable('departments', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  headId: int('head_id'), // Reference to employee
});

// Employees (Centralized)
export const employees = mysqlTable('employees', {
  id: serial('id').primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).unique(), // Agency ID
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  departmentId: int('department_id'),
  positionId: int('position_id'),
  status: varchar('status', { length: 50 }).default('Active'), // Active, Resigned, etc.
  employmentType: varchar('employment_type', { length: 50 }), // Regular, JO, COS
  // ... PDS Core Fields
  createdAt: timestamp('created_at').defaultNow(),
});

// ... Definitions for other tables
```

### Phase 3: Migration Strategy (Safety First)
Since we **cannot rewrite/lose** data:

1.  **Introspection (Optional)**: We can run `npx drizzle-kit introspect` to see the *current* raw state.
2.  **Migration Script**: We will write a script `scripts/migrate_to_drizzle.ts` that:
    -   Reads data from the *old* tables (using raw SQL).
    -   Transforms/Cleans the data (fixing types, standardizing enums).
    -   Inserts it into the *new* Drizzle schema tables.
    -   *Strategy*: We can create the new tables with a prefix (e.g., `v2_employees`) or verify the existing tables match the schema exactly.
    -   **Recommendation**: If the current structure is "messy", create new clean tables, migrate data, verify, and then rename.

### Phase 4: Codebase Refactoring
Gradually replace raw `mysql2` queries in Controllers with Drizzle queries.

*Old:*
```typescript
const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
```

*New:*
```typescript
const result = await db.select().from(employees).where(eq(employees.id, id));
```

## 5. Next Steps
1.  **Approve this plan.**
2.  **Execute Phase 1** (Install & Config).
3.  **Execute Phase 2** (Draft the Schema).
