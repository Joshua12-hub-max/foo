import { mysqlTable, varchar, int, date, timestamp, decimal, mysqlEnum, boolean, primaryKey, json, unique, text, foreignKey, index } from 'drizzle-orm/mysql-core';
import { departments } from './hr.js';

export const qualificationStandards = mysqlTable("qualification_standards", {
	id: int("id").autoincrement().notNull(),
	positionTitle: varchar("position_title", { length: 255 }).notNull(),
	salaryGrade: int("salary_grade").notNull(),
	educationRequirement: text("education_requirement").notNull(),
	experienceYears: int("experience_years").default(0),
	trainingHours: int("training_hours").default(0),
	eligibilityRequired: varchar("eligibility_required", { length: 255 }).notNull(),
	competencyRequirements: text("competency_requirements"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_position_title").on(table.positionTitle),
	index("idx_salary_grade").on(table.salaryGrade),
	primaryKey({ columns: [table.id], name: "qualification_standards_id"}),
	unique("unique_position_sg").on(table.positionTitle, table.salaryGrade),
]);

export const plantillaPositions = mysqlTable("plantilla_positions", {
	id: int("id").autoincrement().notNull(),
	itemNumber: varchar("item_number", { length: 50 }).notNull(),
	positionTitle: varchar("position_title", { length: 100 }).notNull(),
	salaryGrade: int("salary_grade").notNull(),
	stepIncrement: int("step_increment").default(1),
	department: varchar("department", { length: 100 }),
	departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" } ),
	isVacant: boolean("is_vacant").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	incumbentId: int("incumbent_id"),
	monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }),
	filledDate: date("filled_date", { mode: 'string' }),
	vacatedDate: date("vacated_date", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	ordinanceNumber: varchar("ordinance_number", { length: 100 }),
	ordinanceDate: date("ordinance_date", { mode: 'string' }),
	abolishmentOrdinance: varchar("abolishment_ordinance", { length: 100 }),
	abolishmentDate: date("abolishment_date", { mode: 'string' }),
	qualificationStandardsId: int("qualification_standards_id"),
	budgetSource: varchar("budget_source", { length: 100 }).default('Regular'),
	isCoterminous: boolean("is_coterminous").default(false),
	status: mysqlEnum("status", ['Active','Abolished','Frozen']).default('Active'),
	areaCode: varchar("area_code", { length: 50 }),
	areaType: mysqlEnum("area_type", ['R','P','D','M','F','B']),
	areaLevel: mysqlEnum("area_level", ['K','T','S','A']),
	lastPromotionDate: date("last_promotion_date", { mode: 'string' }),
},
(table) => [
	foreignKey({
			columns: [table.qualificationStandardsId],
			foreignColumns: [qualificationStandards.id],
			name: "fk_pp_qs"
		}).onDelete("set null"),
	primaryKey({ columns: [table.id], name: "plantilla_positions_id"}),
	unique("item_number").on(table.itemNumber),
]);

export const plantillaAuditLog = mysqlTable("plantilla_audit_log", {
	id: int("id").autoincrement().notNull(),
	positionId: int("position_id").notNull(),
	action: varchar("action", { length: 50 }).notNull(),
	actorId: int("actor_id").notNull(),
	oldValues: json("old_values"),
	newValues: json("new_values"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("idx_position_id").on(table.positionId),
	index("idx_actor_id").on(table.actorId),
	index("idx_action").on(table.action),
	primaryKey({ columns: [table.id], name: "plantilla_audit_log_id"}),
]);

export const plantillaPositionHistory = mysqlTable("plantilla_position_history", {
	id: int("id").autoincrement().notNull(),
	positionId: int("position_id").notNull(),
	employeeId: int("employee_id").notNull(),
	employeeName: varchar("employee_name", { length: 255 }),
	positionTitle: varchar("position_title", { length: 100 }),
	startDate: date("start_date", { mode: 'string' }).notNull(),
	endDate: date("end_date", { mode: 'string' }),
	reason: varchar("reason", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("idx_position_id").on(table.positionId),
	index("idx_employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "plantilla_position_history_id"}),
]);

export const positionPublications = mysqlTable("position_publications", {
	id: int("id").autoincrement().notNull(),
	positionId: int("position_id").notNull(),
	publicationDate: date("publication_date", { mode: 'string' }).notNull(),
	closingDate: date("closing_date", { mode: 'string' }).notNull(),
	publicationMedium: varchar("publication_medium", { length: 255 }).default('CSC Bulletin, LGU Website'),
	form9Path: varchar("form_9_path", { length: 500 }),
	status: mysqlEnum("status", ['Draft','Published','Closed','Filled']).default('Draft'),
	applicantsCount: int("applicants_count").default(0),
	notes: text("notes"),
	createdBy: int("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_position").on(table.positionId),
	index("idx_status").on(table.status),
	index("idx_publication_date").on(table.publicationDate),
	index("created_by").on(table.createdBy),
	primaryKey({ columns: [table.id], name: "position_publications_id"}),
]);

