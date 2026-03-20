import { mysqlTable, varchar, int, bigint, date, timestamp, decimal, mysqlEnum, datetime, unique, longtext, primaryKey, text, index, time, boolean } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const attendanceLogs = mysqlTable("attendance_logs", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	scanTime: datetime("scan_time", { mode: 'string'}).notNull(),
	type: mysqlEnum("type", ['IN','OUT']).notNull(),
	source: varchar("source", { length: 50 }).default('BIOMETRIC'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "attendance_logs_id"}),
]);

export const dailyTimeRecords = mysqlTable("daily_time_records", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	date: date("date", { mode: 'string' }).notNull(),
	timeIn: datetime("time_in", { mode: 'string'}),
	timeOut: datetime("time_out", { mode: 'string'}),
	lateMinutes: int("late_minutes").default(0),
	undertimeMinutes: int("undertime_minutes").default(0),
	overtimeMinutes: int("overtime_minutes").default(0),
	status: varchar("status", { length: 50 }).default('Present'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "daily_time_records_id"}),
	unique("unique_dtr").on(table.employeeId, table.date),
]);

export const dtrCorrections = mysqlTable("dtr_corrections", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	dateTime: date("date_time", { mode: 'string' }).notNull(),
	originalTimeIn: datetime("original_time_in", { mode: 'string'}),
	originalTimeOut: datetime("original_time_out", { mode: 'string'}),
	correctedTimeIn: datetime("corrected_time_in", { mode: 'string'}),
	correctedTimeOut: datetime("corrected_time_out", { mode: 'string'}),
	reason: text("reason"),
	status: mysqlEnum("status", ['Pending','Approved','Rejected']).default('Pending'),
	rejectionReason: text("rejection_reason"),
	approvedBy: varchar("approved_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "dtr_corrections_id"}),
]);

export const fingerprints = mysqlTable("fingerprints", {
	fingerprintId: int("fingerprint_id").notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	template: longtext("template"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.fingerprintId], name: "fingerprints_fingerprint_id"}),
	unique("employee_id").on(table.employeeId),
]);

export const schedules = mysqlTable("schedules", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	scheduleTitle: varchar("schedule_title", { length: 255 }).default('Regular Schedule'),
	startDate: date("start_date", { mode: 'string' }),
	endDate: date("end_date", { mode: 'string' }),
	dayOfWeek: varchar("day_of_week", { length: 20 }).notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	repeatPattern: varchar("repeat_pattern", { length: 50 }).default('Weekly'),
	isRestDay: boolean("is_rest_day").default(false),
	isSpecial: boolean("is_special").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "schedules_id"}),
	index("idx_employee_day").on(table.employeeId, table.dayOfWeek),
]);

export const tardinessSummary = mysqlTable("tardiness_summary", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	year: int("year").notNull(),
	month: int("month").notNull(),
	totalLateMinutes: int("total_late_minutes").default(0),
	totalUndertimeMinutes: int("total_undertime_minutes").default(0),
	totalLateCount: int("total_late_count").default(0),
	totalUndertimeCount: int("total_undertime_count").default(0),
	totalAbsenceCount: int("total_absence_count").default(0),
	totalMinutes: int("total_minutes").generatedAlwaysAs(sql`(\`total_late_minutes\` + \`total_undertime_minutes\`)`, { mode: "stored" }),
	daysEquivalent: decimal("days_equivalent", { precision: 5, scale: 3 }).default('0.000'),
	deductedFromVl: decimal("deducted_from_vl", { precision: 5, scale: 3 }).default('0.000'),
	chargedAsLwop: decimal("charged_as_lwop", { precision: 5, scale: 3 }).default('0.000'),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	processedBy: varchar("processed_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "tardiness_summary_id"}),
	unique("unique_tardiness").on(table.employeeId, table.year, table.month),
]);

export const shiftTemplates = mysqlTable("shift_templates", {
	id: int("id").autoincrement().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	description: text("description"),
	departmentId: int("department_id"),
	isDefault: boolean("is_default").default(false),
	workingDays: text("working_days"), // Comma-separated: "Monday,Tuesday,Wednesday,Thursday,Friday"
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "shift_templates_id"}),
]);

// =============================================================================
// C# Biometric Middleware Tables (READ-ONLY from Node.js side)
// These tables are managed by the external C# biometric enrollment program.
// Node.js only READS from these tables to sync into attendance_logs.
// =============================================================================

export const bioEnrolledUsers = mysqlTable("bio_enrolled_users", {
	employeeId: varchar("employee_id", { length: 50 }).primaryKey().notNull(),
	fullName: varchar("full_name", { length: 150 }).notNull(),
	department: varchar("department", { length: 100 }),
	userStatus: mysqlEnum("user_status", ['active', 'inactive']).notNull().default('active'),
	enrolledAt: datetime("enrolled_at", { mode: 'string' }).default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: datetime("updated_at", { mode: 'string' }).default(sql`(CURRENT_TIMESTAMP)`),
});

export const bioAttendanceLogs = mysqlTable("bio_attendance_logs", {
	id: bigint({ mode: 'number' }).primaryKey().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	cardType: mysqlEnum("card_type", ['IN', 'OUT']).notNull(),
	logDate: date("log_date", { mode: 'string' }).notNull(),
	logTime: time("log_time").notNull(),
	createdAt: datetime("created_at", { mode: 'string' }).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	index("idx_emp_date").on(table.employeeId, table.logDate),
	index("idx_date_time").on(table.logDate, table.logTime),
]);
