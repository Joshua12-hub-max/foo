"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bioAttendanceLogs = exports.bioEnrolledUsers = exports.tardinessSummary = exports.schedules = exports.fingerprints = exports.dtrCorrections = exports.dailyTimeRecords = exports.attendanceLogs = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
var drizzle_orm_1 = require("drizzle-orm");
exports.attendanceLogs = (0, mysql_core_1.mysqlTable)("attendance_logs", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    scanTime: (0, mysql_core_1.datetime)("scan_time", { mode: 'string' }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)("type", ['IN', 'OUT']).notNull(),
    source: (0, mysql_core_1.varchar)("source", { length: 50 }).default('BIOMETRIC'),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "attendance_logs_id" }),
]; });
exports.dailyTimeRecords = (0, mysql_core_1.mysqlTable)("daily_time_records", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    date: (0, mysql_core_1.date)("date", { mode: 'string' }).notNull(),
    timeIn: (0, mysql_core_1.datetime)("time_in", { mode: 'string' }),
    timeOut: (0, mysql_core_1.datetime)("time_out", { mode: 'string' }),
    lateMinutes: (0, mysql_core_1.int)("late_minutes").default(0),
    undertimeMinutes: (0, mysql_core_1.int)("undertime_minutes").default(0),
    overtimeMinutes: (0, mysql_core_1.int)("overtime_minutes").default(0),
    status: (0, mysql_core_1.varchar)("status", { length: 50 }).default('Present'),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "daily_time_records_id" }),
    (0, mysql_core_1.unique)("unique_dtr").on(table.employeeId, table.date),
]; });
exports.dtrCorrections = (0, mysql_core_1.mysqlTable)("dtr_corrections", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    dateTime: (0, mysql_core_1.date)("date_time", { mode: 'string' }).notNull(),
    originalTimeIn: (0, mysql_core_1.datetime)("original_time_in", { mode: 'string' }),
    originalTimeOut: (0, mysql_core_1.datetime)("original_time_out", { mode: 'string' }),
    correctedTimeIn: (0, mysql_core_1.datetime)("corrected_time_in", { mode: 'string' }),
    correctedTimeOut: (0, mysql_core_1.datetime)("corrected_time_out", { mode: 'string' }),
    reason: (0, mysql_core_1.text)("reason"),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Pending', 'Approved', 'Rejected']).default('Pending'),
    rejectionReason: (0, mysql_core_1.text)("rejection_reason"),
    approvedBy: (0, mysql_core_1.varchar)("approved_by", { length: 50 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "dtr_corrections_id" }),
]; });
exports.fingerprints = (0, mysql_core_1.mysqlTable)("fingerprints", {
    fingerprintId: (0, mysql_core_1.int)("fingerprint_id").notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    template: (0, mysql_core_1.longtext)("template"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.fingerprintId], name: "fingerprints_fingerprint_id" }),
    (0, mysql_core_1.unique)("employee_id").on(table.employeeId),
]; });
exports.schedules = (0, mysql_core_1.mysqlTable)("schedules", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    scheduleTitle: (0, mysql_core_1.varchar)("schedule_title", { length: 255 }).default('Regular Schedule'),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }),
    dayOfWeek: (0, mysql_core_1.varchar)("day_of_week", { length: 20 }).notNull(),
    startTime: (0, mysql_core_1.time)("start_time").notNull(),
    endTime: (0, mysql_core_1.time)("end_time").notNull(),
    repeatPattern: (0, mysql_core_1.varchar)("repeat_pattern", { length: 50 }).default('Weekly'),
    isRestDay: (0, mysql_core_1.boolean)("is_rest_day").default(false),
    isSpecial: (0, mysql_core_1.boolean)("is_special").default(false),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "schedules_id" }),
    (0, mysql_core_1.index)("idx_employee_day").on(table.employeeId, table.dayOfWeek),
]; });
exports.tardinessSummary = (0, mysql_core_1.mysqlTable)("tardiness_summary", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    year: (0, mysql_core_1.int)("year").notNull(),
    month: (0, mysql_core_1.int)("month").notNull(),
    totalLateMinutes: (0, mysql_core_1.int)("total_late_minutes").default(0),
    totalUndertimeMinutes: (0, mysql_core_1.int)("total_undertime_minutes").default(0),
    totalLateCount: (0, mysql_core_1.int)("total_late_count").default(0),
    totalUndertimeCount: (0, mysql_core_1.int)("total_undertime_count").default(0),
    totalAbsenceCount: (0, mysql_core_1.int)("total_absence_count").default(0),
    totalMinutes: (0, mysql_core_1.int)("total_minutes").generatedAlwaysAs((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["(`total_late_minutes` + `total_undertime_minutes`)"], ["(\\`total_late_minutes\\` + \\`total_undertime_minutes\\`)"]))), { mode: "stored" }),
    daysEquivalent: (0, mysql_core_1.decimal)("days_equivalent", { precision: 5, scale: 3 }).default('0.000'),
    deductedFromVl: (0, mysql_core_1.decimal)("deducted_from_vl", { precision: 5, scale: 3 }).default('0.000'),
    chargedAsLwop: (0, mysql_core_1.decimal)("charged_as_lwop", { precision: 5, scale: 3 }).default('0.000'),
    processedAt: (0, mysql_core_1.timestamp)("processed_at", { mode: 'string' }),
    processedBy: (0, mysql_core_1.varchar)("processed_by", { length: 50 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_employee").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "tardiness_summary_id" }),
    (0, mysql_core_1.unique)("unique_tardiness").on(table.employeeId, table.year, table.month),
]; });
// =============================================================================
// C# Biometric Middleware Tables (READ-ONLY from Node.js side)
// These tables are managed by the external C# biometric enrollment program.
// Node.js only READS from these tables to sync into attendance_logs.
// =============================================================================
exports.bioEnrolledUsers = (0, mysql_core_1.mysqlTable)("bio_enrolled_users", {
    employeeId: (0, mysql_core_1.int)("employee_id").primaryKey().notNull(),
    fullName: (0, mysql_core_1.varchar)("full_name", { length: 150 }).notNull(),
    department: (0, mysql_core_1.varchar)("department", { length: 100 }),
    userStatus: (0, mysql_core_1.mysqlEnum)("user_status", ['active', 'inactive']).notNull().default('active'),
    enrolledAt: (0, mysql_core_1.datetime)("enrolled_at", { mode: 'string' }).default((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["(CURRENT_TIMESTAMP)"], ["(CURRENT_TIMESTAMP)"])))),
    updatedAt: (0, mysql_core_1.datetime)("updated_at", { mode: 'string' }).default((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["(CURRENT_TIMESTAMP)"], ["(CURRENT_TIMESTAMP)"])))),
});
exports.bioAttendanceLogs = (0, mysql_core_1.mysqlTable)("bio_attendance_logs", {
    id: (0, mysql_core_1.bigint)({ mode: 'number' }).primaryKey().autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull(),
    cardType: (0, mysql_core_1.mysqlEnum)("card_type", ['IN', 'OUT']).notNull(),
    logDate: (0, mysql_core_1.date)("log_date", { mode: 'string' }).notNull(),
    logTime: (0, mysql_core_1.time)("log_time").notNull(),
    createdAt: (0, mysql_core_1.datetime)("created_at", { mode: 'string' }).default((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["(CURRENT_TIMESTAMP)"], ["(CURRENT_TIMESTAMP)"])))),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_emp_date").on(table.employeeId, table.logDate),
    (0, mysql_core_1.index)("idx_date_time").on(table.logDate, table.logTime),
]; });
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
