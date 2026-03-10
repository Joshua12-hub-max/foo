"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalPolicies = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
exports.internalPolicies = (0, mysql_core_1.mysqlTable)("internal_policies", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    category: (0, mysql_core_1.mysqlEnum)('category', ['hours', 'tardiness', 'penalties', 'csc', 'leave', 'plantilla']).notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    content: (0, mysql_core_1.text)("content").notNull(), // JSON content
    versionLabel: (0, mysql_core_1.varchar)("version_label", { length: 50 }),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "internal_policies_id" }),
]; });
