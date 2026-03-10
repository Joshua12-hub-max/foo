"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyViolations = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
exports.policyViolations = (0, mysql_core_1.mysqlTable)("policy_violations", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)('type', ['habitual_tardiness', 'habitual_undertime', 'consecutive_lateness', 'loafing', 'absence', 'misconduct', 'others']).notNull(),
    violationSubtype: (0, mysql_core_1.varchar)("violation_subtype", { length: 50 }),
    offenseLevel: (0, mysql_core_1.int)("offense_level").default(1), // Legacy tracking, but keeping it
    offenseNumber: (0, mysql_core_1.int)("offense_number").default(1).notNull(),
    triggeredMonths: (0, mysql_core_1.text)("triggered_months"), // JSON array of YYYY-MM
    fingerprint: (0, mysql_core_1.varchar)("fingerprint", { length: 255 }), // Hash to prevent duplicate penalties
    details: (0, mysql_core_1.text)("details").notNull(), // JSON with dates, counts, or remarks
    memoId: (0, mysql_core_1.int)("memo_id"), // Link to employee_memos.id
    status: (0, mysql_core_1.mysqlEnum)('status', ['pending', 'notified', 'resolved', 'cancelled']).default('pending'),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "policy_violations_id" }),
    (0, mysql_core_1.index)("idx_employee_violation").on(table.employeeId, table.type, table.memoId),
    (0, mysql_core_1.unique)("unique_fingerprint_violation").on(table.fingerprint),
]; });
