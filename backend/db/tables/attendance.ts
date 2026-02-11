import { mysqlTable, varchar, int, date, timestamp, decimal, mysqlEnum, datetime, unique, longtext, primaryKey, text, tinyint } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const attendanceLogs = mysqlTable("attendance_logs", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	scanTime: datetime("scan_time", { mode: 'string'}).notNull(),
	type: mysqlEnum(['IN','OUT']).notNull(),
	source: varchar({ length: 50 }).default('WEB'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "attendance_logs_id"}),
]);

export const dailyTimeRecords = mysqlTable("daily_time_records", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	date: date({ mode: 'string' }).notNull(),
	timeIn: datetime("time_in", { mode: 'string'}),
	timeOut: datetime("time_out", { mode: 'string'}),
	lateMinutes: int("late_minutes").default(0),
	undertimeMinutes: int("undertime_minutes").default(0),
	overtimeMinutes: int("overtime_minutes").default(0),
	status: varchar({ length: 50 }).default('Present'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "daily_time_records_id"}),
	unique("unique_dtr").on(table.employeeId, table.date),
]);

export const dtrCorrections = mysqlTable("dtr_corrections", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	dateTime: date("date_time", { mode: 'string' }).notNull(),
	originalTimeIn: datetime("original_time_in", { mode: 'string'}),
	originalTimeOut: datetime("original_time_out", { mode: 'string'}),
	correctedTimeIn: datetime("corrected_time_in", { mode: 'string'}),
	correctedTimeOut: datetime("corrected_time_out", { mode: 'string'}),
	reason: text(),
	status: mysqlEnum(['Pending','Approved','Rejected']).default('Pending'),
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
	template: longtext(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.fingerprintId], name: "fingerprints_fingerprint_id"}),
	unique("employee_id").on(table.employeeId),
]);

export const schedules = mysqlTable("schedules", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	scheduleTitle: varchar("schedule_title", { length: 255 }).default('Regular Schedule'),
	startDate: date("start_date", { mode: 'string' }),
	endDate: date("end_date", { mode: 'string' }),
	dayOfWeek: varchar("day_of_week", { length: 20 }).notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	repeatPattern: varchar("repeat_pattern", { length: 50 }).default('Weekly'),
	isRestDay: tinyint("is_rest_day").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "schedules_id"}),
	unique("unique_schedule").on(table.employeeId, table.dayOfWeek),
]);

export const tardinessSummary = mysqlTable("tardiness_summary", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	year: int().notNull(),
	month: int().notNull(),
	totalLateMinutes: int("total_late_minutes").default(0),
	totalUndertimeMinutes: int("total_undertime_minutes").default(0),
	totalMinutes: int("total_minutes").generatedAlwaysAs(sql`(\`total_late_minutes\` + \`total_undertime_minutes\`)`, { mode: "stored" }),
	daysEquivalent: decimal("days_equivalent", { precision: 5, scale: 3 }).generatedAlwaysAs(sql`((\`total_late_minutes\` + \`total_undertime_minutes\`) / 480)`, { mode: "stored" }),
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

import { index, time } from 'drizzle-orm/mysql-core';
