"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressRefBarangays = exports.employeeDirectory = exports.systemSettings = exports.syncedEvents = exports.notifications = exports.memoSequences = exports.holidays = exports.events = exports.announcements = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
var drizzle_orm_1 = require("drizzle-orm");
exports.announcements = (0, mysql_core_1.mysqlTable)("announcements", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    content: (0, mysql_core_1.text)("content").notNull(),
    priority: (0, mysql_core_1.mysqlEnum)("priority", ['normal', 'high', 'urgent']).default('normal'),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }),
    startTime: (0, mysql_core_2.time)("start_time"),
    endTime: (0, mysql_core_2.time)("end_time"),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "announcements_id" }),
]; });
exports.events = (0, mysql_core_1.mysqlTable)("events", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    date: (0, mysql_core_1.date)("date", { mode: 'string' }).notNull(),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }),
    department: (0, mysql_core_1.varchar)("department", { length: 100 }),
    time: (0, mysql_core_1.int)("time").default(9),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    recurringPattern: (0, mysql_core_1.varchar)("recurring_pattern", { length: 50 }).default('none'),
    recurringEndDate: (0, mysql_core_1.date)("recurring_end_date", { mode: 'string' }),
    description: (0, mysql_core_1.text)("description"),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "events_id" }),
]; });
exports.holidays = (0, mysql_core_1.mysqlTable)("holidays", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    date: (0, mysql_core_1.date)("date", { mode: 'string' }).notNull(),
    type: (0, mysql_core_1.mysqlEnum)("type", ['Regular', 'Special Non-Working', 'Special Working']).notNull(),
    year: (0, mysql_core_1.int)("year").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "holidays_id" }),
    (0, mysql_core_1.unique)("unique_holiday").on(table.date),
]; });
exports.memoSequences = (0, mysql_core_1.mysqlTable)("memo_sequences", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    year: (0, mysql_core_1.int)("year").notNull(),
    lastNumber: (0, mysql_core_1.int)("last_number").default(0).notNull(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "memo_sequences_id" }),
    (0, mysql_core_1.unique)("unique_year").on(table.year),
]; });
exports.notifications = (0, mysql_core_1.mysqlTable)("notifications", {
    notificationId: (0, mysql_core_1.int)("notification_id").autoincrement().notNull(),
    recipientId: (0, mysql_core_1.varchar)("recipient_id", { length: 50 }).notNull(),
    senderId: (0, mysql_core_1.varchar)("sender_id", { length: 50 }),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }),
    message: (0, mysql_core_1.text)("message"),
    type: (0, mysql_core_1.varchar)("type", { length: 50 }),
    referenceId: (0, mysql_core_1.int)("reference_id"),
    status: (0, mysql_core_1.mysqlEnum)("status", ['read', 'unread']).default('unread'),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.notificationId], name: "notifications_notification_id" }),
]; });
exports.syncedEvents = (0, mysql_core_1.mysqlTable)("synced_events", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    localEventId: (0, mysql_core_1.int)("local_event_id").notNull().references(function () { return exports.events.id; }, { onDelete: "cascade" }),
    googleEventId: (0, mysql_core_1.varchar)("google_event_id", { length: 255 }).notNull(),
    lastSynced: (0, mysql_core_1.datetime)("last_synced", { mode: 'string' }).default((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["(CURRENT_TIMESTAMP)"], ["(CURRENT_TIMESTAMP)"])))),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "synced_events_id" }),
    (0, mysql_core_1.unique)("local_event_id").on(table.localEventId),
]; });
exports.systemSettings = (0, mysql_core_1.mysqlTable)("system_settings", {
    settingKey: (0, mysql_core_1.varchar)("setting_key", { length: 255 }).notNull(),
    settingValue: (0, mysql_core_1.text)("setting_value"),
    description: (0, mysql_core_1.varchar)("description", { length: 255 }),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.settingKey], name: "system_settings_setting_key" }),
]; });
exports.employeeDirectory = (0, mysql_core_1.mysqlView)("employee_directory", {
    id: (0, mysql_core_1.int)("id").default(0).notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    rfidCardUid: (0, mysql_core_1.varchar)("rfid_card_uid", { length: 50 }),
    firstName: (0, mysql_core_1.varchar)("first_name", { length: 100 }).notNull(),
    lastName: (0, mysql_core_1.varchar)("last_name", { length: 100 }).notNull(),
    fullName: (0, mysql_core_1.varchar)("full_name", { length: 201 }),
    email: (0, mysql_core_1.varchar)("email", { length: 255 }).notNull(),
    role: (0, mysql_core_1.varchar)("role", { length: 50 }).notNull(),
    jobTitle: (0, mysql_core_1.varchar)("job_title", { length: 100 }),
    employmentStatus: (0, mysql_core_1.mysqlEnum)("employment_status", ['Active', 'Probationary', 'Terminated', 'Resigned', 'On Leave', 'Suspended', 'Verbal Warning', 'Written Warning', 'Show Cause']).default('Active'),
    avatarUrl: (0, mysql_core_1.varchar)("avatar_url", { length: 500 }),
    departmentId: (0, mysql_core_1.int)("department_id").default(0),
    departmentName: (0, mysql_core_1.varchar)("department_name", { length: 100 }),
    departmentLocation: (0, mysql_core_1.varchar)("department_location", { length: 255 }),
    phoneNumber: (0, mysql_core_1.varchar)("phone_number", { length: 20 }),
    positionTitle: (0, mysql_core_1.varchar)("position_title", { length: 100 }),
}).algorithm("undefined").sqlSecurity("definer").as((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["select `a`.`id` AS `id`,`a`.`employee_id` AS `employee_id`,`a`.`rfid_card_uid` AS `rfid_card_uid`,`a`.`first_name` AS `first_name`,`a`.`last_name` AS `last_name`,concat(`a`.`first_name`,' ',`a`.`last_name`) AS `full_name`,`a`.`email` AS `email`,`a`.`role` AS `role`,`a`.`job_title` AS `job_title`,`a`.`employment_status` AS `employment_status`,`a`.`avatar_url` AS `avatar_url`,`d`.`id` AS `department_id`,`d`.`name` AS `department_name`,`d`.`location` AS `department_location`,`a`.`phone_number` AS `phone_number`,`a`.`position_title` AS `position_title` from (`chrmo_db`.`authentication` `a` left join `chrmo_db`.`departments` `d` on((`a`.`department_id` = `d`.`id`))) where (`a`.`employment_status` <> 'Terminated')"], ["select \\`a\\`.\\`id\\` AS \\`id\\`,\\`a\\`.\\`employee_id\\` AS \\`employee_id\\`,\\`a\\`.\\`rfid_card_uid\\` AS \\`rfid_card_uid\\`,\\`a\\`.\\`first_name\\` AS \\`first_name\\`,\\`a\\`.\\`last_name\\` AS \\`last_name\\`,concat(\\`a\\`.\\`first_name\\`,' ',\\`a\\`.\\`last_name\\`) AS \\`full_name\\`,\\`a\\`.\\`email\\` AS \\`email\\`,\\`a\\`.\\`role\\` AS \\`role\\`,\\`a\\`.\\`job_title\\` AS \\`job_title\\`,\\`a\\`.\\`employment_status\\` AS \\`employment_status\\`,\\`a\\`.\\`avatar_url\\` AS \\`avatar_url\\`,\\`d\\`.\\`id\\` AS \\`department_id\\`,\\`d\\`.\\`name\\` AS \\`department_name\\`,\\`d\\`.\\`location\\` AS \\`department_location\\`,\\`a\\`.\\`phone_number\\` AS \\`phone_number\\`,\\`a\\`.\\`position_title\\` AS \\`position_title\\` from (\\`chrmo_db\\`.\\`authentication\\` \\`a\\` left join \\`chrmo_db\\`.\\`departments\\` \\`d\\` on((\\`a\\`.\\`department_id\\` = \\`d\\`.\\`id\\`))) where (\\`a\\`.\\`employment_status\\` <> 'Terminated')"]))));
exports.addressRefBarangays = (0, mysql_core_1.mysqlTable)("address_ref_barangays", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    zipCode: (0, mysql_core_1.varchar)("zip_code", { length: 10 }).notNull(),
}, function (table) { return [
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "address_ref_barangays_id" }),
    (0, mysql_core_1.unique)("unique_barangay_name").on(table.name),
]; });
var mysql_core_2 = require("drizzle-orm/mysql-core");
var templateObject_1, templateObject_2;
