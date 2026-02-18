import { mysqlTable, varchar, int, date, timestamp, decimal, text, mysqlEnum, tinyint, primaryKey, index, json, foreignKey } from 'drizzle-orm/mysql-core';
import { authentication } from './auth.js';

export const performanceCriteria = mysqlTable("performance_criteria", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).default('General'),
	criteriaType: mysqlEnum("criteria_type", ['core_function','support_function','core_competency','organizational_competency']).default('core_function'),
	weight: decimal({ precision: 5, scale: 2 }).default('1.00'),
	maxScore: int("max_score").default(5),
    // Rating Matrix Definitions
    ratingDefinition5: text("rating_definition_5"),
    ratingDefinition4: text("rating_definition_4"),
    ratingDefinition3: text("rating_definition_3"),
    ratingDefinition2: text("rating_definition_2"),
    ratingDefinition1: text("rating_definition_1"),
    // Evidence Support
    evidenceRequirements: text("evidence_requirements"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isActive: tinyint("is_active").default(1),
},
(table) => [
	primaryKey({ columns: [table.id], name: "performance_criteria_id"}),
]);

export const performanceReviewCycles = mysqlTable("performance_review_cycles", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	startDate: date("start_date", { mode: 'string' }).notNull(),
	endDate: date("end_date", { mode: 'string' }).notNull(),
	status: mysqlEnum(['Draft','Active','Completed','Archived']).default('Draft'),
	createdBy: int("created_by").references(() => authentication.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	ratingPeriod: mysqlEnum("rating_period", ['1st_sem','2nd_sem','annual']).default('annual'),
	isActive: tinyint("is_active").default(1),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("created_by").on(table.createdBy),
	primaryKey({ columns: [table.id], name: "performance_review_cycles_id"}),
]);

export const performanceReviews = mysqlTable("performance_reviews", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id),
	reviewerId: int("reviewer_id").notNull().references(() => authentication.id),
	reviewPeriodStart: date("review_period_start", { mode: 'string' }).notNull(),
	reviewPeriodEnd: date("review_period_end", { mode: 'string' }).notNull(),
	status: mysqlEnum(['Draft','Self-Rated','Submitted','Acknowledged','Approved','Finalized']).default('Draft'),
	totalScore: decimal("total_score", { precision: 5, scale: 2 }),
	selfRatingScore: decimal("self_rating_score", { precision: 3, scale: 2 }),
	supervisorRatingScore: decimal("supervisor_rating_score", { precision: 3, scale: 2 }),
	finalRatingScore: decimal("final_rating_score", { precision: 3, scale: 2 }),
	selfRatingStatus: mysqlEnum("self_rating_status", ['pending','submitted']).default('pending'),
	overallFeedback: text("overall_feedback"),
	supervisorRemarks: text("supervisor_remarks"),
	employeeRemarks: text("employee_remarks"),
	headRemarks: text("head_remarks"),
	disagreeRemarks: text("disagree_remarks"),
	approvedBy: int("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	disagreed: tinyint().default(0),
	ratingPeriod: mysqlEnum("rating_period", ['1st_sem','2nd_sem','annual']).default('annual'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	reviewCycleId: int("review_cycle_id").references(() => performanceReviewCycles.id, { onDelete: "set null" } ),
	isSelfAssessment: tinyint("is_self_assessment").default(0),
	cycleId: int("cycle_id"),
	evaluationMode: mysqlEnum("evaluation_mode", ['CSC','IPCR']).default('CSC'),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("reviewer_id").on(table.reviewerId),
	primaryKey({ columns: [table.id], name: "performance_reviews_id"}),
]);

export const performanceAuditLog = mysqlTable("performance_audit_log", {
	id: int().autoincrement().notNull(),
	reviewId: int("review_id").notNull().references(() => performanceReviews.id, { onDelete: "cascade" } ),
	action: varchar({ length: 50 }).notNull(),
	actorId: int("actor_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	details: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("review_id").on(table.reviewId),
	index("actor_id").on(table.actorId),
	primaryKey({ columns: [table.id], name: "performance_audit_log_id"}),
]);

export const performanceGoals = mysqlTable("performance_goals", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	reviewCycleId: int("review_cycle_id"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	metric: varchar({ length: 255 }),
	targetValue: decimal("target_value", { precision: 10, scale: 2 }),
	currentValue: decimal("current_value", { precision: 10, scale: 2 }).default('0.00'),
	weight: decimal({ precision: 5, scale: 2 }).default('1.00'),
	startDate: date("start_date", { mode: 'string' }),
	dueDate: date("due_date", { mode: 'string' }),
	status: mysqlEnum(['Not Started','In Progress','Completed','Cancelled']).default('Not Started'),
	progress: int().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("review_cycle_id").on(table.reviewCycleId),
	foreignKey({
			columns: [table.reviewCycleId],
			foreignColumns: [performanceReviewCycles.id],
			name: "fk_pg_rc"
		}).onDelete("set null"),
	primaryKey({ columns: [table.id], name: "performance_goals_id"}),
]);

export const performanceImprovementPlans = mysqlTable("performance_improvement_plans", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	supervisorId: int("supervisor_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	startDate: date("start_date", { mode: 'string' }).notNull(),
	endDate: date("end_date", { mode: 'string' }).notNull(),
	areasOfConcern: text("areas_of_concern").notNull(),
	actionPlan: text("action_plan").notNull(),
	status: mysqlEnum(['Active','Completed','Failed','Terminated']).default('Active'),
	outcomeNotes: text("outcome_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("supervisor_id").on(table.supervisorId),
	primaryKey({ columns: [table.id], name: "performance_improvement_plans_id"}),
]);

export const performanceReviewItems = mysqlTable("performance_review_items", {
	id: int().autoincrement().notNull(),
	reviewId: int("review_id").notNull().references(() => performanceReviews.id, { onDelete: "cascade" } ),
	criteriaId: int("criteria_id").references(() => performanceCriteria.id, { onDelete: "set null" } ),
	score: decimal({ precision: 5, scale: 2 }),
	selfScore: decimal("self_score", { precision: 3, scale: 2 }),
	actualAccomplishments: text("actual_accomplishments"),
	comment: text(),
	qScore: decimal("q_score", { precision: 5, scale: 2 }),
	eScore: decimal("e_score", { precision: 5, scale: 2 }),
	tScore: decimal("t_score", { precision: 5, scale: 2 }),
	criteriaTitle: varchar("criteria_title", { length: 255 }),
	criteriaDescription: text("criteria_description"),
	weight: decimal({ precision: 5, scale: 2 }).default('0.00'),
	maxScore: int("max_score").default(5),
	category: varchar({ length: 100 }).default('General'),
    // Evidence / MOV
    evidenceFilePath: text("evidence_file_path"), // JSON string or comma-separated paths
    evidenceDescription: text("evidence_description"),
},
(table) => [
	index("review_id").on(table.reviewId),
	primaryKey({ columns: [table.id], name: "performance_review_items_id"}),
]);

export const performanceTemplates = mysqlTable("performance_templates", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	sections: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "performance_templates_id"}),
]);


