"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lwopSummary = exports.leaveRequests = exports.leaveMonetizationRequests = exports.leaveLedger = exports.leaveCredits = exports.leaveBalances = exports.leaveApplications = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
exports.leaveApplications = (0, mysql_core_1.mysqlTable)("leave_applications", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    leaveType: (0, mysql_core_1.mysqlEnum)("leave_type", ['Vacation Leave', 'Sick Leave', 'Special Privilege Leave', 'Forced Leave', 'Maternity Leave', 'Paternity Leave', 'Solo Parent Leave', 'Study Leave', 'Special Emergency Leave', 'VAWC Leave', 'Rehabilitation Leave', 'Special Leave Benefits for Women', 'Wellness Leave', 'Adoption Leave']).notNull(),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }).notNull(),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }).notNull(),
    workingDays: (0, mysql_core_1.decimal)("working_days", { precision: 10, scale: 3 }).notNull(),
    isWithPay: (0, mysql_core_1.boolean)("is_with_pay").default(true).notNull(),
    actualPaymentStatus: (0, mysql_core_1.mysqlEnum)("actual_payment_status", ['WITH_PAY', 'WITHOUT_PAY', 'PARTIAL']).default('WITH_PAY').notNull(),
    daysWithPay: (0, mysql_core_1.decimal)("days_with_pay", { precision: 10, scale: 3 }).default('0.000'),
    daysWithoutPay: (0, mysql_core_1.decimal)("days_without_pay", { precision: 10, scale: 3 }).default('0.000'),
    crossChargedFrom: (0, mysql_core_1.varchar)("cross_charged_from", { length: 50 }),
    reason: (0, mysql_core_1.text)("reason").notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Pending', 'Processing', 'Finalizing', 'Approved', 'Rejected', 'Cancelled']).default('Pending'),
    rejectionReason: (0, mysql_core_1.text)("rejection_reason"),
    approvedBy: (0, mysql_core_1.varchar)("approved_by", { length: 50 }),
    approvedAt: (0, mysql_core_1.timestamp)("approved_at", { mode: 'string' }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_employee_status").on(table.employeeId, table.status),
    (0, mysql_core_1.index)("idx_dates").on(table.startDate, table.endDate),
    (0, mysql_core_1.index)("idx_leave_type").on(table.leaveType),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "leave_applications_id" }),
]; });
exports.leaveBalances = (0, mysql_core_1.mysqlTable)("leave_balances", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    creditType: (0, mysql_core_1.mysqlEnum)("credit_type", ['Vacation Leave', 'Sick Leave', 'Special Privilege Leave', 'Forced Leave', 'Maternity Leave', 'Paternity Leave', 'Solo Parent Leave', 'Study Leave', 'Adoption Leave']).notNull(),
    balance: (0, mysql_core_1.decimal)("balance", { precision: 10, scale: 3 }).default('0.000').notNull(),
    year: (0, mysql_core_1.int)("year").notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_employee").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "leave_balances_id" }),
    (0, mysql_core_1.unique)("unique_balance").on(table.employeeId, table.creditType, table.year),
]; });
exports.leaveCredits = (0, mysql_core_1.mysqlTable)("leave_credits", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 255 }).notNull(),
    creditType: (0, mysql_core_1.varchar)("credit_type", { length: 50 }).notNull(),
    balance: (0, mysql_core_1.decimal)("balance", { precision: 10, scale: 2 }).default('0.00'),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "leave_credits_id" }),
    (0, mysql_core_1.unique)("unique_credit").on(table.employeeId, table.creditType),
]; });
exports.leaveLedger = (0, mysql_core_1.mysqlTable)("leave_ledger", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    creditType: (0, mysql_core_1.mysqlEnum)("credit_type", ['Vacation Leave', 'Sick Leave', 'Special Privilege Leave', 'Forced Leave', 'Maternity Leave', 'Paternity Leave', 'Solo Parent Leave', 'Study Leave', 'Adoption Leave']).notNull(),
    transactionType: (0, mysql_core_1.mysqlEnum)("transaction_type", ['ACCRUAL', 'DEDUCTION', 'ADJUSTMENT', 'MONETIZATION', 'FORFEITURE', 'UNDERTIME_DEDUCTION', 'TARDINESS_DEDUCTION']).notNull(),
    amount: (0, mysql_core_1.decimal)("amount", { precision: 10, scale: 3 }).notNull(),
    balanceAfter: (0, mysql_core_1.decimal)("balance_after", { precision: 10, scale: 3 }).notNull(),
    referenceId: (0, mysql_core_1.int)("reference_id"),
    referenceType: (0, mysql_core_1.mysqlEnum)("reference_type", ['leave_application', 'monetization', 'dtr', 'manual']),
    remarks: (0, mysql_core_1.text)("remarks"),
    createdBy: (0, mysql_core_1.varchar)("created_by", { length: 50 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_employee_credit").on(table.employeeId, table.creditType),
    (0, mysql_core_1.index)("idx_created").on(table.createdAt),
    (0, mysql_core_1.index)("idx_reference").on(table.referenceId, table.referenceType),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "leave_ledger_id" }),
]; });
exports.leaveMonetizationRequests = (0, mysql_core_1.mysqlTable)("leave_monetization_requests", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    creditType: (0, mysql_core_1.mysqlEnum)("credit_type", ['Vacation Leave', 'Sick Leave']).notNull(),
    requestedDays: (0, mysql_core_1.decimal)("requested_days", { precision: 10, scale: 3 }).notNull(),
    dailyRate: (0, mysql_core_1.decimal)("daily_rate", { precision: 12, scale: 2 }).notNull(),
    totalAmount: (0, mysql_core_1.decimal)("total_amount", { precision: 12, scale: 2 }).notNull(),
    purpose: (0, mysql_core_1.mysqlEnum)("purpose", ['Health', 'Medical', 'Financial Emergency']).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Pending', 'Approved', 'Rejected']).default('Pending'),
    approvedBy: (0, mysql_core_1.varchar)("approved_by", { length: 50 }),
    remarks: (0, mysql_core_1.text)("remarks"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_employee").on(table.employeeId),
    (0, mysql_core_1.index)("idx_status").on(table.status),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "leave_monetization_requests_id" }),
]; });
exports.leaveRequests = (0, mysql_core_1.mysqlTable)("leave_requests", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    leaveType: (0, mysql_core_1.varchar)("leave_type", { length: 50 }).notNull(),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }).notNull(),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }).notNull(),
    reason: (0, mysql_core_1.text)("reason"),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Pending', 'Processing', 'Finalizing', 'Approved', 'Rejected']).default('Pending'),
    rejectionReason: (0, mysql_core_1.text)("rejection_reason"),
    approvedBy: (0, mysql_core_1.varchar)("approved_by", { length: 50 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
    withPay: (0, mysql_core_1.boolean)("with_pay").default(false),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "leave_requests_id" }),
]; });
exports.lwopSummary = (0, mysql_core_1.mysqlTable)("lwop_summary", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    year: (0, mysql_core_1.int)("year").notNull(),
    totalLwopDays: (0, mysql_core_1.decimal)("total_lwop_days", { precision: 10, scale: 3 }).default('0.000'),
    salaryDeduction: (0, mysql_core_1.decimal)("salary_deduction", { precision: 12, scale: 2 }).default('0.00'),
    cumulativeLwopDays: (0, mysql_core_1.decimal)("cumulative_lwop_days", { precision: 10, scale: 3 }).default('0.000'),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_employee").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "lwop_summary_id" }),
    (0, mysql_core_1.unique)("unique_lwop").on(table.employeeId, table.year),
]; });
