"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.positionPublications = exports.plantillaPositionHistory = exports.plantillaAuditLog = exports.plantillaPositions = exports.qualificationStandards = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
var hr_js_1 = require("./hr.js");
exports.qualificationStandards = (0, mysql_core_1.mysqlTable)("qualification_standards", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    positionTitle: (0, mysql_core_1.varchar)("position_title", { length: 255 }).notNull(),
    salaryGrade: (0, mysql_core_1.int)("salary_grade").notNull(),
    educationRequirement: (0, mysql_core_1.text)("education_requirement").notNull(),
    experienceYears: (0, mysql_core_1.int)("experience_years").default(0),
    trainingHours: (0, mysql_core_1.int)("training_hours").default(0),
    eligibilityRequired: (0, mysql_core_1.varchar)("eligibility_required", { length: 255 }).notNull(),
    competencyRequirements: (0, mysql_core_1.text)("competency_requirements"),
    isActive: (0, mysql_core_1.boolean)("is_active").default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_position_title").on(table.positionTitle),
    (0, mysql_core_1.index)("idx_salary_grade").on(table.salaryGrade),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "qualification_standards_id" }),
    (0, mysql_core_1.unique)("unique_position_sg").on(table.positionTitle, table.salaryGrade),
]; });
exports.plantillaPositions = (0, mysql_core_1.mysqlTable)("plantilla_positions", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    itemNumber: (0, mysql_core_1.varchar)("item_number", { length: 50 }).notNull(),
    positionTitle: (0, mysql_core_1.varchar)("position_title", { length: 100 }).notNull(),
    salaryGrade: (0, mysql_core_1.int)("salary_grade").notNull(),
    stepIncrement: (0, mysql_core_1.int)("step_increment").default(1),
    department: (0, mysql_core_1.varchar)("department", { length: 100 }),
    departmentId: (0, mysql_core_1.int)("department_id").references(function () { return hr_js_1.departments.id; }, { onDelete: "set null" }),
    isVacant: (0, mysql_core_1.boolean)("is_vacant").default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    incumbentId: (0, mysql_core_1.int)("incumbent_id"),
    monthlySalary: (0, mysql_core_1.decimal)("monthly_salary", { precision: 12, scale: 2 }),
    filledDate: (0, mysql_core_1.date)("filled_date", { mode: 'string' }),
    vacatedDate: (0, mysql_core_1.date)("vacated_date", { mode: 'string' }),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
    ordinanceNumber: (0, mysql_core_1.varchar)("ordinance_number", { length: 100 }),
    ordinanceDate: (0, mysql_core_1.date)("ordinance_date", { mode: 'string' }),
    abolishmentOrdinance: (0, mysql_core_1.varchar)("abolishment_ordinance", { length: 100 }),
    abolishmentDate: (0, mysql_core_1.date)("abolishment_date", { mode: 'string' }),
    qualificationStandardsId: (0, mysql_core_1.int)("qualification_standards_id"),
    budgetSource: (0, mysql_core_1.varchar)("budget_source", { length: 100 }).default('Regular'),
    isCoterminous: (0, mysql_core_1.boolean)("is_coterminous").default(false),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Active', 'Abolished', 'Frozen']).default('Active'),
    areaCode: (0, mysql_core_1.varchar)("area_code", { length: 50 }),
    areaType: (0, mysql_core_1.mysqlEnum)("area_type", ['R', 'P', 'D', 'M', 'F', 'B']),
    areaLevel: (0, mysql_core_1.mysqlEnum)("area_level", ['K', 'T', 'S', 'A']),
    lastPromotionDate: (0, mysql_core_1.date)("last_promotion_date", { mode: 'string' }),
}, function (table) { return [
    (0, mysql_core_1.foreignKey)({
        columns: [table.qualificationStandardsId],
        foreignColumns: [exports.qualificationStandards.id],
        name: "fk_pp_qs"
    }).onDelete("set null"),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "plantilla_positions_id" }),
    (0, mysql_core_1.unique)("item_number").on(table.itemNumber),
]; });
exports.plantillaAuditLog = (0, mysql_core_1.mysqlTable)("plantilla_audit_log", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    positionId: (0, mysql_core_1.int)("position_id").notNull(),
    action: (0, mysql_core_1.varchar)("action", { length: 50 }).notNull(),
    actorId: (0, mysql_core_1.int)("actor_id").notNull(),
    oldValues: (0, mysql_core_1.json)("old_values"),
    newValues: (0, mysql_core_1.json)("new_values"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_position_id").on(table.positionId),
    (0, mysql_core_1.index)("idx_actor_id").on(table.actorId),
    (0, mysql_core_1.index)("idx_action").on(table.action),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "plantilla_audit_log_id" }),
]; });
exports.plantillaPositionHistory = (0, mysql_core_1.mysqlTable)("plantilla_position_history", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    positionId: (0, mysql_core_1.int)("position_id").notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull(),
    employeeName: (0, mysql_core_1.varchar)("employee_name", { length: 255 }),
    positionTitle: (0, mysql_core_1.varchar)("position_title", { length: 100 }),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }).notNull(),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }),
    reason: (0, mysql_core_1.varchar)("reason", { length: 100 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_position_id").on(table.positionId),
    (0, mysql_core_1.index)("idx_employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "plantilla_position_history_id" }),
]; });
exports.positionPublications = (0, mysql_core_1.mysqlTable)("position_publications", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    positionId: (0, mysql_core_1.int)("position_id").notNull(),
    publicationDate: (0, mysql_core_1.date)("publication_date", { mode: 'string' }).notNull(),
    closingDate: (0, mysql_core_1.date)("closing_date", { mode: 'string' }).notNull(),
    publicationMedium: (0, mysql_core_1.varchar)("publication_medium", { length: 255 }).default('CSC Bulletin, LGU Website'),
    form9Path: (0, mysql_core_1.varchar)("form_9_path", { length: 500 }),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Draft', 'Published', 'Closed', 'Filled']).default('Draft'),
    applicantsCount: (0, mysql_core_1.int)("applicants_count").default(0),
    notes: (0, mysql_core_1.text)("notes"),
    createdBy: (0, mysql_core_1.int)("created_by"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_position").on(table.positionId),
    (0, mysql_core_1.index)("idx_status").on(table.status),
    (0, mysql_core_1.index)("idx_publication_date").on(table.publicationDate),
    (0, mysql_core_1.index)("created_by").on(table.createdBy),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "position_publications_id" }),
]; });
