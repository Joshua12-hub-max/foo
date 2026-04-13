import { mysqlTable, varchar, int, date, timestamp, decimal, text, mysqlEnum, boolean, primaryKey, index, unique } from 'drizzle-orm/mysql-core';


export const leaveApplications = mysqlTable("leave_applications", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	leaveType: varchar("leave_type", { length: 100 }).notNull(),
	startDate: date("start_date", { mode: 'string' }).notNull(),
	endDate: date("end_date", { mode: 'string' }).notNull(),
	workingDays: decimal("working_days", { precision: 10, scale: 3 }).notNull(),
	isWithPay: boolean("is_with_pay").default(true).notNull(),
	isHalfDay: boolean("is_half_day").default(false).notNull(),
	actualPaymentStatus: mysqlEnum("actual_payment_status", ['WITH_PAY','WITHOUT_PAY','PARTIAL']).default('WITH_PAY').notNull(),
	daysWithPay: decimal("days_with_pay", { precision: 10, scale: 3 }).default('0.000'),
	daysWithoutPay: decimal("days_without_pay", { precision: 10, scale: 3 }).default('0.000'),
	crossChargedFrom: varchar("cross_charged_from", { length: 50 }),
	reason: text("reason").notNull(),
	status: mysqlEnum("status", ['Pending','Processing','Finalizing','Approved','Rejected','Cancelled']).default('Pending'),
	rejectionReason: text("rejection_reason"),
    rejectedBy: varchar("rejected_by", { length: 50 }),
    rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	approvedBy: varchar("approved_by", { length: 50 }),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	adminFormPath: varchar("admin_form_path", { length: 500 }),
	finalAttachmentPath: varchar("final_attachment_path", { length: 500 }),
	attachmentPath: varchar("attachment_path", { length: 500 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_employee_status").on(table.employeeId, table.status),
	index("idx_dates").on(table.startDate, table.endDate),
	index("idx_leave_type").on(table.leaveType),
	primaryKey({ columns: [table.id], name: "leave_applications_id"}),
]);

export const leaveBalances = mysqlTable("leave_balances", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	creditType: varchar("credit_type", { length: 100 }).notNull(),
	balance: decimal("balance", { precision: 10, scale: 3 }).default('0.000').notNull(),
	year: int("year").notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "leave_balances_id"}),
	unique("unique_balance").on(table.employeeId, table.creditType, table.year),
]);

export const leaveCredits = mysqlTable("leave_credits", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 255 }).notNull(),
	creditType: varchar("credit_type", { length: 50 }).notNull(),
	balance: decimal("balance", { precision: 10, scale: 2 }).default('0.00'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "leave_credits_id"}),
	unique("unique_credit").on(table.employeeId, table.creditType),
]);

export const leaveLedger = mysqlTable("leave_ledger", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	creditType: varchar("credit_type", { length: 100 }).notNull(),
	transactionType: mysqlEnum("transaction_type", ['ACCRUAL','DEDUCTION','ADJUSTMENT','MONETIZATION','FORFEITURE','UNDERTIME_DEDUCTION','TARDINESS_DEDUCTION']).notNull(),
	amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
	balanceAfter: decimal("balance_after", { precision: 10, scale: 3 }).notNull(),
	referenceId: int("reference_id"),
	referenceType: mysqlEnum("reference_type", ['leave_application','monetization','dtr','manual']),
	remarks: text("remarks"),
	createdBy: varchar("created_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("idx_employee_credit").on(table.employeeId, table.creditType),
	index("idx_created").on(table.createdAt),
	index("idx_reference").on(table.referenceId, table.referenceType),
	primaryKey({ columns: [table.id], name: "leave_ledger_id"}),
]);

export const accrualRules = mysqlTable("accrual_rules", {
	id: int("id").autoincrement().notNull(),
	daysPresent: decimal("days_present", { precision: 10, scale: 3 }).notNull(),
	earnedCredits: decimal("earned_credits", { precision: 10, scale: 3 }).notNull(),
	ruleType: varchar("rule_type", { length: 50 }).default('CSC_STANDARD'),
},
(table) => [
	primaryKey({ columns: [table.id], name: "accrual_rules_id"}),
	unique("unique_rule").on(table.daysPresent, table.ruleType),
]);

export const leaveMonetizationRequests = mysqlTable("leave_monetization_requests", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	creditType: varchar("credit_type", { length: 100 }).notNull(),
	requestedDays: decimal("requested_days", { precision: 10, scale: 3 }).notNull(),
	dailyRate: decimal("daily_rate", { precision: 12, scale: 2 }).notNull(),
	totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
	purpose: mysqlEnum("purpose", ['Health','Medical','Financial Emergency']).notNull(),
	status: mysqlEnum("status", ['Pending','Approved','Rejected']).default('Pending'),
	approvedBy: varchar("approved_by", { length: 50 }),
	remarks: text("remarks"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	index("idx_status").on(table.status),
	primaryKey({ columns: [table.id], name: "leave_monetization_requests_id"}),
]);

export const lwopSummary = mysqlTable("lwop_summary", {
	id: int("id").autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	year: int("year").notNull(),
	totalLwopDays: decimal("total_lwop_days", { precision: 10, scale: 3 }).default('0.000'),
	salaryDeduction: decimal("salary_deduction", { precision: 12, scale: 2 }).default('0.00'),
	cumulativeLwopDays: decimal("cumulative_lwop_days", { precision: 10, scale: 3 }).default('0.000'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "lwop_summary_id"}),
	unique("unique_lwop").on(table.employeeId, table.year),
]);


