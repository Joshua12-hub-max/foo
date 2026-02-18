# NEBR - New Era Biometrics & Recruitment

This document provides a high-level overview of the NEBR project and recent technical improvements made to the system.

## Project Overview
NEBR is a comprehensive City Performance Management and Government Resource planning system for the City Government of Meycauayan. It integrates HR management, automated attendance via biometrics, and recruitment modules.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide React, React Hook Form, Zod.
- **Backend**: Node.js (Express), Drizzle ORM, MySQL (chrmo_db).
- **Architecture**: REST API with custom controller-based logic.

## Core Modules
1.  **Attendance & Biometrics**: Automated logging of employee attendance using biometric devices (integrated via Arduino/Serial).
2.  **Performance Management**: Strategic Performance Management System (SPMS) integration.
3.  **Recruitment**: Job posting, application management, and announcement generation.

## Recent Refinements (Feb 2026)

### Recruitment Module Optimization
I have performed a systematic refinement of the Recruitment module to improve usability and data accuracy:

- **Schema Stabilization**: Added the missing `posted_at` column to `recruitment_jobs` and standardized date formatting to `YYYY-MM-DD HH:mm:ss` for MySQL `DATETIME` compatibility.
- **UI Simplification**: Successfully removed the "Salary Range" field from the entire stack (Database, Backend Schemas, Frontend Forms, Tables, and Modals) as per organizational requirements.
- **Application Email Fixes**:
  - Fixed the missing application email in the Admin Job Details view.
  - Replaced the hardcoded email placeholder in the Public Careers page with the dynamic database field, ensuring applicants send inquiries to the correct department.
- **Document Generation**: Updated the `JobVacancyAnnouncement` component and Word document generator to reflect the new simplified structure (removed Salary row).

## Current Status
- **Backend API**: Running on port 5000.
- **Frontend**: Running on port 5173.
- **Core Stability**: Resolved 500 errors in job creation and ensured type safety across recruitment schemas.

## 🚨 Strict Type Safety & Quality Assurance Policy
To ensure 100% precision, eliminate bugs, and maintain a robust codebase, the following rules are MANDATORY:

### 1. Zero "Any" Tolerance
- **Strictly No `any` type**: Using the `any` type is considered a failure in architecture. Every variable, parameter, and return value must have a concrete type or interface.
- **Strictly No `as any` casting**: Forcing types with `as any` is prohibited. If a type mismatch occurs, it must be resolved via proper type guards, casting to unknown first (if absolutely necessary and justified), or structural refinement.

### 2. Robust Implementation Standards
- **Standardized Error Handling**: Every function, especially API controllers and database interactions, must be wrapped in `try-catch` blocks with standardized error reporting.
- **Zod Validation Everywhere**: All data entering the system (Request Body, Query Parameters) must be validated against a Zod schema at the edge (Controller layer).
- **Custom REST & Functions**: Always use custom-built REST endpoints and specialized functions tailored to specific business logic, avoiding generic "one-size-fits-all" implementations that introduce complexity.
- **Axios for Networking**: Standardize on Axios for all HTTP requests to leverage its robust interceptor and type-handling capabilities.

### 3. Verification & Triple-Check Protocol
- **Document All Changes**: Every modification must be logged in the respective module's documentation.
- **Triple-Check Logic**: Before deployment/completion, logic must be verified for edge cases (e.g., null values, date formatting, boundary conditions).
- **Data Integrity**: Database interactions must prioritize ACID properties and maintain relational integrity without loopholes.

### 4. Database Interaction Rules
- **No Direct Updates**: Never use `update()` or `set()` on a Drizzle table object directly.
- **Mandatory Query Builder**: All database modifications must be performed using the `db.update(table).set({ ... }).where(...)` syntax.
- **Strict Type Checking**: Ensure the types of values being set match the column types defined in the Drizzle schema.

### 5. Frontend Development Rules
- **No Inline Styles**: Avoid using the `style` prop for styling. Use Tailwind CSS classes or define styles in the `className` prop.
- **No `as any` Casting**: Forcing types with `as any` is prohibited. If a type mismatch occurs, it must be resolved via proper type guards, casting to unknown first (if absolutely necessary and justified), or structural refinement.

### 6. Component Architecture Rules
- **Smart Components**: Components should be "smart" and handle their own data fetching and state management using hooks.
- **No Prop Drilling**: Avoid passing props through multiple layers of components. Use Context API or Redux for global state management.
- **Reusable Components**: Components should be designed to be reusable and modular.

### 7. State Management Rules
- **No Inline State**: Avoid using the `useState` hook for state management. Use Context API or Redux for global state management.
- **No `as any` Casting**: Forcing types with `as any` is prohibited. If a type mismatch occurs, it must be resolved via proper type guards, casting to unknown first (if absolutely necessary and justified), or structural refinement.

### 8. Naming Conventions (Case Standardization)
- **`snake_case` for Data**: Use for all database columns, API responses, and Drizzle table property names. This guarantees that internal data structures match the persistent layer and external API contracts.
- **`camelCase` for Logic**: Use for TypeScript variables, function names, and internal logic that does not directly map to a database field or API response key.

### 9. Component Architecture Rules
- **Smart Components**: Components should be "smart" and handle their own data fetching and state management using hooks.
- **No Prop Drilling**: Avoid passing props through multiple layers of components. Use Context API or Redux for global state management.
- **Reusable Components**: Components should be designed to be reusable and modular.

### 10. Always use Zod for validation for backend and frontend, Zustand for state management, Axios for API integration, Tailwind for styling, React Query for data fetching, and React Hook Form for form handling.

### 11. Always use Drizzle ORM for database interactions, with MySQL as the database. Always Permanently fix the error and make sure it will never happen again.

---
*Documentation generated by Antigravity AI Assistant.*
