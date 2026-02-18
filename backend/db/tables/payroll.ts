import { mysqlTable, varchar, int, date, timestamp, decimal, text, mysqlEnum, tinyint, primaryKey, index, unique } from 'drizzle-orm/mysql-core';
import { authentication } from './auth.js';

export const salarySchedule = mysqlTable("salary_schedule", {
	id: int().autoincrement().notNull(),
	salaryGrade: int("salary_grade").notNull(),
	step: int().notNull(),
	monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }).notNull(),
	tranche: int().default(2).notNull(),
},
(table) => [
	index("idx_grade").on(table.salaryGrade),
	index("idx_salary_schedule_tranche").on(table.tranche),
	primaryKey({ columns: [table.id], name: "salary_schedule_id"}),
	unique("unique_grade_step_tranche").on(table.salaryGrade, table.step, table.tranche),
]);

export const salaryTranches = mysqlTable("salary_tranches", {
	id: int().autoincrement().notNull(),
	trancheNumber: int("tranche_number").notNull(),
	name: varchar({ length: 100 }).notNull(),
	circularNumber: varchar("circular_number", { length: 100 }),
	effectiveDate: date("effective_date", { mode: 'string' }),
	dateIssued: date("date_issued", { mode: 'string' }),
	applicableTo: varchar("applicable_to", { length: 255 }),
	isActive: tinyint("is_active").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "salary_tranches_id"}),
	unique("tranche_number").on(table.trancheNumber),
]);

export const stepIncrementTracker = mysqlTable("step_increment_tracker", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	positionId: int("position_id").notNull(),
	currentStep: int("current_step").notNull(),
	previousStep: int("previous_step"),
	eligibleDate: date("eligible_date", { mode: 'string' }).notNull(),
	status: mysqlEnum(['Pending','Approved','Denied','Processed']).default('Pending'),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	processedBy: int("processed_by").references(() => authentication.id, { onDelete: "set null" } ),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	index("idx_status").on(table.status),
	index("idx_eligible_date").on(table.eligibleDate),
	index("processed_by").on(table.processedBy),
	primaryKey({ columns: [table.id], name: "step_increment_tracker_id"}),
]);


