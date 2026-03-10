import { mysqlTable, varchar, int, timestamp, text, mysqlEnum, primaryKey, index, unique } from 'drizzle-orm/mysql-core';

export const policyViolations = mysqlTable("policy_violations", {
    id: int("id").autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    type: mysqlEnum('type', ['habitual_tardiness', 'habitual_undertime', 'consecutive_lateness', 'loafing', 'absence', 'misconduct', 'others']).notNull(),
    violationSubtype: varchar("violation_subtype", { length: 50 }),
    offenseLevel: int("offense_level").default(1), // Legacy tracking, but keeping it
    offenseNumber: int("offense_number").default(1).notNull(),
    triggeredMonths: text("triggered_months"), // JSON array of YYYY-MM
    fingerprint: varchar("fingerprint", { length: 255 }), // Hash to prevent duplicate penalties
    details: text("details").notNull(), // JSON with dates, counts, or remarks
    memoId: int("memo_id"), // Link to employee_memos.id
    status: mysqlEnum('status', ['pending', 'notified', 'resolved', 'cancelled']).default('pending'),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
    primaryKey({ columns: [table.id], name: "policy_violations_id"}),
    index("idx_employee_violation").on(table.employeeId, table.type, table.memoId),
    unique("unique_fingerprint_violation").on(table.fingerprint),
]);
