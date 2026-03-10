"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nepotismRelationships = exports.budgetAllocation = exports.departments = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
var drizzle_orm_1 = require("drizzle-orm");
exports.departments = (0, mysql_core_1.mysqlTable)("departments", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    description: (0, mysql_core_1.text)("description"),
    headOfDepartment: (0, mysql_core_1.varchar)("head_of_department", { length: 100 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
    budget: (0, mysql_core_1.decimal)("budget", { precision: 15, scale: 2 }).default('0.00'),
    parentDepartmentId: (0, mysql_core_1.int)("parent_department_id"),
    location: (0, mysql_core_1.varchar)("location", { length: 255 }),
}, function (table) { return [
    (0, mysql_core_1.foreignKey)({
        columns: [table.parentDepartmentId],
        foreignColumns: [table.id],
        name: "fk_parent_dept"
    }).onDelete("set null"),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "departments_id" }),
    (0, mysql_core_1.unique)("name").on(table.name),
]; });
exports.budgetAllocation = (0, mysql_core_1.mysqlTable)("budget_allocation", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    year: (0, mysql_core_1.int)("year").notNull(),
    department: (0, mysql_core_1.varchar)("department", { length: 255 }).notNull(),
    totalBudget: (0, mysql_core_1.decimal)("total_budget", { precision: 15, scale: 2 }).notNull(),
    utilizedBudget: (0, mysql_core_1.decimal)("utilized_budget", { precision: 15, scale: 2 }).default('0.00'),
    remainingBudget: (0, mysql_core_1.decimal)("remaining_budget", { precision: 15, scale: 2 }).generatedAlwaysAs((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["total_budget - utilized_budget"], ["total_budget - utilized_budget"]))), { mode: "stored" }),
    utilizationRate: (0, mysql_core_1.decimal)("utilization_rate", { precision: 5, scale: 2 }).generatedAlwaysAs((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["(utilized_budget / NULLIF(total_budget, 0)) * 100"], ["(utilized_budget / NULLIF(total_budget, 0)) * 100"]))), { mode: "stored" }),
    notes: (0, mysql_core_1.text)("notes"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_year").on(table.year),
    (0, mysql_core_1.index)("idx_department").on(table.department),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "budget_allocation_id" }),
    (0, mysql_core_1.unique)("unique_year_dept").on(table.year, table.department),
]; });
exports.nepotismRelationships = (0, mysql_core_1.mysqlTable)("nepotism_relationships", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId1: (0, mysql_core_1.int)("employee_id_1").notNull(),
    employeeId2: (0, mysql_core_1.int)("employee_id_2").notNull(),
    relationshipType: (0, mysql_core_1.mysqlEnum)("relationship_type", ['Parent', 'Child', 'Sibling', 'Spouse', 'Uncle/Aunt', 'Nephew/Niece', 'Cousin', 'Grandparent', 'Grandchild', 'In-Law']).notNull(),
    degree: (0, mysql_core_1.int)("degree").notNull(),
    verifiedBy: (0, mysql_core_1.int)("verified_by"),
    verifiedAt: (0, mysql_core_1.timestamp)("verified_at", { mode: 'string' }),
    notes: (0, mysql_core_1.text)("notes"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_employee_1").on(table.employeeId1),
    (0, mysql_core_1.index)("idx_employee_2").on(table.employeeId2),
    (0, mysql_core_1.index)("idx_degree").on(table.degree),
    (0, mysql_core_1.index)("verified_by").on(table.verifiedBy),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "nepotism_relationships_id" }),
]; });
var templateObject_1, templateObject_2;
