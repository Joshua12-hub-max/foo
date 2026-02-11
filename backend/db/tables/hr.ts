import { mysqlTable, varchar, int, timestamp, decimal, text, mysqlEnum, foreignKey, primaryKey, index, unique } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const departments = mysqlTable("departments", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	headOfDepartment: varchar("head_of_department", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	budget: decimal({ precision: 15, scale: 2 }).default('0.00'),
	parentDepartmentId: int("parent_department_id"),
	location: varchar({ length: 255 }),
},
(table) => [
	foreignKey({
			columns: [table.parentDepartmentId],
			foreignColumns: [table.id],
			name: "fk_parent_dept"
		}).onDelete("set null"),
	primaryKey({ columns: [table.id], name: "departments_id"}),
	unique("name").on(table.name),
]);

export const budgetAllocation = mysqlTable("budget_allocation", {
	id: int().autoincrement().notNull(),
	year: int().notNull(),
	department: varchar({ length: 255 }).notNull(),
	totalBudget: decimal("total_budget", { precision: 15, scale: 2 }).notNull(),
	utilizedBudget: decimal("utilized_budget", { precision: 15, scale: 2 }).default('0.00'),
	remainingBudget: decimal("remaining_budget", { precision: 15, scale: 2 }).generatedAlwaysAs(sql`(\`total_budget\` - \`utilized_budget\`)`, { mode: "stored" }),
	utilizationRate: decimal("utilization_rate", { precision: 5, scale: 2 }).generatedAlwaysAs(sql`((\`utilized_budget\` / \`total_budget\`) * 100)`, { mode: "stored" }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("idx_year").on(table.year),
	index("idx_department").on(table.department),
	primaryKey({ columns: [table.id], name: "budget_allocation_id"}),
	unique("unique_year_dept").on(table.year, table.department),
]);

export const nepotismRelationships = mysqlTable("nepotism_relationships", {
	id: int().autoincrement().notNull(),
	employeeId1: int("employee_id_1").notNull(),
	employeeId2: int("employee_id_2").notNull(),
	relationshipType: mysqlEnum("relationship_type", ['Parent','Child','Sibling','Spouse','Uncle/Aunt','Nephew/Niece','Cousin','Grandparent','Grandchild','In-Law']).notNull(),
	degree: int().notNull(),
	verifiedBy: int("verified_by"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => [
	index("idx_employee_1").on(table.employeeId1),
	index("idx_employee_2").on(table.employeeId2),
	index("idx_degree").on(table.degree),
	index("verified_by").on(table.verifiedBy),
	primaryKey({ columns: [table.id], name: "nepotism_relationships_id"}),
]);


