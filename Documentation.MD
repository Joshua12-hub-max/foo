# CHRMO Mey - City Human Resource Management Office
Official Recruitment & Employee Management Portal
 documentation for the NEBR project. It details the architecture, active modules, and strict development rules for the system.

## 1. Project Overview
NEBR is a City Performance Management and Government Resource planning system for the City Government of Meycauayan.
- **HR & Employee Management**: 201 File, Service Records, Plantilla.
- **Attendance**: Real-time biometric logging via a custom C# Hardware Middleware.
- **Recruitment**: Applicant tracking, job posting, and dynamic document generation.

## 2. Technology Stack & Core Philosophy
**100% Type-Safe Architecture** - The project forbids the use of `any` or `as any`.
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Zustand (State), React Query, Zod (Forms).
- **Backend**: Node.js (Express), TypeScript, Drizzle ORM, MySQL (`chrmo_db`).
- **Hardware Middleware**: .NET 8 (Windows Forms C#), Fleck (WebSocket).

## 3. Biometric Middleware Integration
The fingerprint scanner integrates with the web app via a custom local broadcast server.

### 3.1 Architecture Data Flow
1.  **Hardware**: The Arduino/Scanner sends raw bytes over Serial `COM3`.
2.  **C# Middleware (`BioMiddleware.exe`)**: Reads the serial port, parses `MATCH` or `ENROLL` commands.
3.  **Real-Time Database**: The C# app connects directly to MySQL and instantly inserts the scan into `attendance_logs`.
4.  **Hardware Anti-Spam**: The C# app enforces a **60-second hardware cooldown** (`MATCH_COOLDOWN_SEC = 60`) to completely block duplicate spam scans.
5.  **WebSocket Broadcast**: The C# App broadcasts to `ws://localhost:4649`.
6.  **Node.js Polling**: The backend `pollingService.ts` detects the new `attendance_logs` and triggers the DTR (Daily Time Record) processor to calculate Late/Undertime.

### 3.2 Running the Biometrics
Execute the bat script in the root directory:
```powershell
.\run-bio.bat
```
*(This automatically builds the C# app and runs it hidden in the System Tray).*

## 4. Strict Development Rules

To maintain the system's "Pure Typesafe" requirement:

### 4.1 Zero "Any" Tolerance
- **Strictly No `any` type / No `as any` casting**: Variables, parameters, database schemas, and API responses must have explicit interfaces or Zod schemas.

### 4.2 Database (Drizzle & MySQL)
- **Single Source of Truth**: The schema is strictly defined in `backend/db/schema.ts`.
- **Constraints First**: Use Foreign Keys and `onDelete: 'cascade'` where appropriate.
- **Relational Parity**: Ensure TypeScript `number` matches MySQL `int`, and `string` matches `varchar`.

### 4.3 Validation & Networking
- **Backend**: All incoming request body/params must be parsed via Zod.
- **Frontend**: All HTTP requests must use `Axios` (not raw fetch) to utilize interceptors.

### 4.4 Git Workflow
Development occurs on personal branches, merged into master.
```bash
git add -A
git commit -m "feat: updated biometrics"
git push origin Joshua
git checkout master
git pull origin master
git merge Joshua
git push origin master
git checkout Joshua
```

## 5. Scripts & Utilities
Located in `backend/scripts/`:

| Script | Command | Purpose |
|--------|---------|---------|
| **Hard Reset** | `npx tsx scripts/hard_reset.ts` | **DANGER**: Completely wipes the database attendance logs and sends a `RESET_DEVICE` WebSocket command to erase the physical scanner's memory. |
| **Check Logs** | `npx tsx scripts/check_logs.ts` | Prints the most recent database `attendance_logs` array. |
| **Clear Data** | `npx tsx scripts/clear_data.ts` | Clears all fake test data. |
| **Seed Admin** | `npx tsx scripts/seed_admin.ts` | Seeds an admin account into the database. |
