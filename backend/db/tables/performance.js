"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceTemplates = exports.performanceReviewItems = exports.performanceImprovementPlans = exports.performanceGoals = exports.performanceAuditLog = exports.performanceReviews = exports.performanceReviewCycles = exports.performanceCriteria = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
var auth_js_1 = require("./auth.js");
exports.performanceCriteria = (0, mysql_core_1.mysqlTable)("performance_criteria", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    category: (0, mysql_core_1.varchar)("category", { length: 100 }).default('General'),
    criteriaType: (0, mysql_core_1.mysqlEnum)("criteria_type", ['core_function', 'support_function', 'core_competency', 'organizational_competency']).default('core_function'),
    weight: (0, mysql_core_1.decimal)("weight", { precision: 5, scale: 2 }).default('1.00'),
    maxScore: (0, mysql_core_1.int)("max_score").default(5),
    // Rating Matrix Definitions
    ratingDefinition5: (0, mysql_core_1.text)("rating_definition_5"),
    ratingDefinition4: (0, mysql_core_1.text)("rating_definition_4"),
    ratingDefinition3: (0, mysql_core_1.text)("rating_definition_3"),
    ratingDefinition2: (0, mysql_core_1.text)("rating_definition_2"),
    ratingDefinition1: (0, mysql_core_1.text)("rating_definition_1"),
    // Evidence Support
    evidenceRequirements: (0, mysql_core_1.text)("evidence_requirements"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    isActive: (0, mysql_core_1.boolean)("is_active").default(true),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "performance_criteria_id" }),
]; });
exports.performanceReviewCycles = (0, mysql_core_1.mysqlTable)("performance_review_cycles", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }).notNull(),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Draft', 'Active', 'Completed', 'Archived']).default('Draft'),
    createdBy: (0, mysql_core_1.int)("created_by").references(function () { return auth_js_1.authentication.id; }, { onDelete: "set null" }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    ratingPeriod: (0, mysql_core_1.mysqlEnum)("rating_period", ['1st_sem', '2nd_sem', 'annual']).default('annual'),
    isActive: (0, mysql_core_1.boolean)("is_active").default(true),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("created_by").on(table.createdBy),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "performance_review_cycles_id" }),
]; });
exports.performanceReviews = (0, mysql_core_1.mysqlTable)("performance_reviews", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }),
    reviewerId: (0, mysql_core_1.int)("reviewer_id").notNull().references(function () { return auth_js_1.authentication.id; }),
    reviewPeriodStart: (0, mysql_core_1.date)("review_period_start", { mode: 'string' }).notNull(),
    reviewPeriodEnd: (0, mysql_core_1.date)("review_period_end", { mode: 'string' }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Draft', 'Self-Rated', 'Submitted', 'Acknowledged', 'Approved', 'Finalized']).default('Draft'),
    totalScore: (0, mysql_core_1.decimal)("total_score", { precision: 5, scale: 2 }),
    selfRatingScore: (0, mysql_core_1.decimal)("self_rating_score", { precision: 3, scale: 2 }),
    reviewerRatingScore: (0, mysql_core_1.decimal)("reviewer_rating_score", { precision: 3, scale: 2 }),
    finalRatingScore: (0, mysql_core_1.decimal)("final_rating_score", { precision: 3, scale: 2 }),
    selfRatingStatus: (0, mysql_core_1.mysqlEnum)("self_rating_status", ['pending', 'submitted']).default('pending'),
    overallFeedback: (0, mysql_core_1.text)("overall_feedback"),
    reviewerRemarks: (0, mysql_core_1.text)("reviewer_remarks"),
    employeeRemarks: (0, mysql_core_1.text)("employee_remarks"),
    headRemarks: (0, mysql_core_1.text)("head_remarks"),
    disagreeRemarks: (0, mysql_core_1.text)("disagree_remarks"),
    approvedBy: (0, mysql_core_1.int)("approved_by"),
    approvedAt: (0, mysql_core_1.timestamp)("approved_at", { mode: 'string' }),
    disagreed: (0, mysql_core_1.boolean)("disagreed").default(false),
    ratingPeriod: (0, mysql_core_1.mysqlEnum)("rating_period", ['1st_sem', '2nd_sem', 'annual']).default('annual'),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
    reviewCycleId: (0, mysql_core_1.int)("review_cycle_id"),
    isSelfAssessment: (0, mysql_core_1.boolean)("is_self_assessment").default(false),
    cycleId: (0, mysql_core_1.int)("cycle_id"),
    evaluationMode: (0, mysql_core_1.mysqlEnum)("evaluation_mode", ['CSC', 'IPCR', 'Senior']).default('CSC'),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.index)("reviewer_id").on(table.reviewerId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "performance_reviews_id" }),
]; });
exports.performanceAuditLog = (0, mysql_core_1.mysqlTable)("performance_audit_log", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    reviewId: (0, mysql_core_1.int)("review_id").notNull().references(function () { return exports.performanceReviews.id; }, { onDelete: "cascade" }),
    action: (0, mysql_core_1.varchar)("action", { length: 50 }).notNull(),
    actorId: (0, mysql_core_1.int)("actor_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    details: (0, mysql_core_1.text)("details"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("review_id").on(table.reviewId),
    (0, mysql_core_1.index)("actor_id").on(table.actorId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "performance_audit_log_id" }),
]; });
exports.performanceGoals = (0, mysql_core_1.mysqlTable)("performance_goals", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    reviewCycleId: (0, mysql_core_1.int)("review_cycle_id"),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    metric: (0, mysql_core_1.varchar)("metric", { length: 255 }),
    targetValue: (0, mysql_core_1.decimal)("target_value", { precision: 10, scale: 2 }),
    currentValue: (0, mysql_core_1.decimal)("current_value", { precision: 10, scale: 2 }).default('0.00'),
    weight: (0, mysql_core_1.decimal)("weight", { precision: 5, scale: 2 }).default('1.00'),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }),
    dueDate: (0, mysql_core_1.date)("due_date", { mode: 'string' }),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Not Started', 'In Progress', 'Completed', 'Cancelled']).default('Not Started'),
    progress: (0, mysql_core_1.int)("progress").default(0),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.index)("review_cycle_id").on(table.reviewCycleId),
    (0, mysql_core_1.foreignKey)({
        columns: [table.reviewCycleId],
        foreignColumns: [exports.performanceReviewCycles.id],
        name: "fk_pg_rc"
    }).onDelete("set null"),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "performance_goals_id" }),
]; });
exports.performanceImprovementPlans = (0, mysql_core_1.mysqlTable)("performance_improvement_plans", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    reviewerId: (0, mysql_core_1.int)("reviewer_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }).notNull(),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }).notNull(),
    areasOfConcern: (0, mysql_core_1.text)("areas_of_concern").notNull(),
    actionPlan: (0, mysql_core_1.text)("action_plan").notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Active', 'Completed', 'Failed', 'Terminated']).default('Active'),
    outcomeNotes: (0, mysql_core_1.text)("outcome_notes"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.index)("reviewer_id").on(table.reviewerId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "performance_improvement_plans_id" }),
]; });
exports.performanceReviewItems = (0, mysql_core_1.mysqlTable)("performance_review_items", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    reviewId: (0, mysql_core_1.int)("review_id").notNull().references(function () { return exports.performanceReviews.id; }, { onDelete: "cascade" }),
    criteriaId: (0, mysql_core_1.int)("criteria_id").references(function () { return exports.performanceCriteria.id; }, { onDelete: "set null" }),
    score: (0, mysql_core_1.decimal)("score", { precision: 5, scale: 2 }),
    selfScore: (0, mysql_core_1.decimal)("self_score", { precision: 3, scale: 2 }),
    actualAccomplishments: (0, mysql_core_1.text)("actual_accomplishments"),
    comment: (0, mysql_core_1.text)("comment"),
    qScore: (0, mysql_core_1.decimal)("q_score", { precision: 5, scale: 2 }),
    eScore: (0, mysql_core_1.decimal)("e_score", { precision: 5, scale: 2 }),
    tScore: (0, mysql_core_1.decimal)("t_score", { precision: 5, scale: 2 }),
    criteriaTitle: (0, mysql_core_1.varchar)("criteria_title", { length: 255 }),
    criteriaDescription: (0, mysql_core_1.text)("criteria_description"),
    weight: (0, mysql_core_1.decimal)("weight", { precision: 5, scale: 2 }).default('0.00'),
    maxScore: (0, mysql_core_1.int)("max_score").default(5),
    category: (0, mysql_core_1.varchar)("category", { length: 100 }).default('General'),
    // Evidence / MOV
    evidenceFilePath: (0, mysql_core_1.text)("evidence_file_path"), // JSON string or comma-separated paths
    evidenceDescription: (0, mysql_core_1.text)("evidence_description"),
}, function (table) { return [
    (0, mysql_core_1.index)("review_id").on(table.reviewId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "performance_review_items_id" }),
]; });
exports.performanceTemplates = (0, mysql_core_1.mysqlTable)("performance_templates", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    sections: (0, mysql_core_1.json)("sections"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "performance_templates_id" }),
]; });
