"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stepIncrementTracker = exports.salaryTranches = exports.salarySchedule = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
var auth_js_1 = require("./auth.js");
exports.salarySchedule = (0, mysql_core_1.mysqlTable)("salary_schedule", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    salaryGrade: (0, mysql_core_1.int)("salary_grade").notNull(),
    step: (0, mysql_core_1.int)("step").notNull(),
    monthlySalary: (0, mysql_core_1.decimal)("monthly_salary", { precision: 12, scale: 2 }).notNull(),
    tranche: (0, mysql_core_1.int)("tranche").default(2).notNull(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_grade").on(table.salaryGrade),
    (0, mysql_core_1.index)("idx_salary_schedule_tranche").on(table.tranche),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "salary_schedule_id" }),
    (0, mysql_core_1.unique)("unique_grade_step_tranche").on(table.salaryGrade, table.step, table.tranche),
]; });
exports.salaryTranches = (0, mysql_core_1.mysqlTable)("salary_tranches", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    trancheNumber: (0, mysql_core_1.int)("tranche_number").notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    circularNumber: (0, mysql_core_1.varchar)("circular_number", { length: 100 }),
    effectiveDate: (0, mysql_core_1.date)("effective_date", { mode: 'string' }),
    dateIssued: (0, mysql_core_1.date)("date_issued", { mode: 'string' }),
    applicableTo: (0, mysql_core_1.varchar)("applicable_to", { length: 255 }),
    isActive: (0, mysql_core_1.boolean)("is_active").default(false),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "salary_tranches_id" }),
    (0, mysql_core_1.unique)("tranche_number").on(table.trancheNumber),
]; });
exports.stepIncrementTracker = (0, mysql_core_1.mysqlTable)("step_increment_tracker", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    positionId: (0, mysql_core_1.int)("position_id").notNull(),
    currentStep: (0, mysql_core_1.int)("current_step").notNull(),
    previousStep: (0, mysql_core_1.int)("previous_step"),
    eligibleDate: (0, mysql_core_1.date)("eligible_date", { mode: 'string' }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Pending', 'Approved', 'Denied', 'Processed']).default('Pending'),
    processedAt: (0, mysql_core_1.timestamp)("processed_at", { mode: 'string' }),
    processedBy: (0, mysql_core_1.int)("processed_by").references(function () { return auth_js_1.authentication.id; }, { onDelete: "set null" }),
    remarks: (0, mysql_core_1.text)("remarks"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_employee").on(table.employeeId),
    (0, mysql_core_1.index)("idx_status").on(table.status),
    (0, mysql_core_1.index)("idx_eligible_date").on(table.eligibleDate),
    (0, mysql_core_1.index)("processed_by").on(table.processedBy),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "step_increment_tracker_id" }),
]; });
