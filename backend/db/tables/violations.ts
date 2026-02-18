import { mysqlTable, varchar, int, timestamp, text, mysqlEnum, primaryKey, index } from 'drizzle-orm/mysql-core';

export const policyViolations = mysqlTable("policy_violations", {
    id: int().autoincrement().notNull(),
    employeeId: varchar("employee_id", { length: 50 }).notNull(),
    type: mysqlEnum('type', ['habitual_tardiness', 'habitual_undertime', 'consecutive_lateness', 'loafing', 'absence', 'misconduct', 'others']).notNull(),
    offenseLevel: int("offense_level").default(1), // 1st, 2nd, 3rd
    details: text().notNull(), // JSON with dates, counts, or remarks
    memoId: int("memoId"), // Link to employee_memos.id
    status: mysqlEnum('status', ['pending', 'notified', 'resolved', 'cancelled']).default('pending'),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
    primaryKey({ columns: [table.id], name: "policy_violations_id"}),
    index("idx_employee_violation").on(table.employeeId, table.type, table.memoId),
]);
