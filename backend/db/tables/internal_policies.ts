import { mysqlTable, varchar, int, timestamp, text, mysqlEnum, primaryKey } from 'drizzle-orm/mysql-core';

export const internalPolicies = mysqlTable("internal_policies", {
    id: int("id").autoincrement().notNull(),
    category: mysqlEnum('category', ['hours', 'tardiness', 'penalties', 'csc', 'leave', 'plantilla']).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(), // JSON content
    versionLabel: varchar("version_label", { length: 50 }),
    updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
    primaryKey({ columns: [table.id], name: "internal_policies_id"}),
]);
