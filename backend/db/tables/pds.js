"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRecords = exports.employeeSkills = exports.employeeNotes = exports.employeeMemos = exports.employeeEmploymentHistory = exports.employeeEmergencyContacts = exports.employeeEducation = exports.employeeDocuments = exports.employeeCustomFields = exports.pdsWorkExperience = exports.pdsVoluntaryWork = exports.pdsReferences = exports.pdsOtherInfo = exports.pdsLearningDevelopment = exports.pdsFamily = exports.pdsEligibility = exports.pdsEducation = void 0;
var mysql_core_1 = require("drizzle-orm/mysql-core");
var auth_js_1 = require("./auth.js");
exports.pdsEducation = (0, mysql_core_1.mysqlTable)("pds_education", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    level: (0, mysql_core_1.mysqlEnum)("level", ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies']).notNull(),
    schoolName: (0, mysql_core_1.varchar)("school_name", { length: 255 }).notNull(),
    degreeCourse: (0, mysql_core_1.varchar)("degree_course", { length: 255 }),
    yearGraduated: (0, mysql_core_1.int)("year_graduated"),
    unitsEarned: (0, mysql_core_1.varchar)("units_earned", { length: 50 }),
    dateFrom: (0, mysql_core_1.int)("date_from"),
    dateTo: (0, mysql_core_1.int)("date_to"),
    honors: (0, mysql_core_1.varchar)("honors", { length: 255 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "pds_education_id" }),
]; });
exports.pdsEligibility = (0, mysql_core_1.mysqlTable)("pds_eligibility", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    eligibilityName: (0, mysql_core_1.varchar)("eligibility_name", { length: 255 }).notNull(),
    rating: (0, mysql_core_1.decimal)("rating", { precision: 5, scale: 2 }),
    examDate: (0, mysql_core_1.date)("exam_date", { mode: 'string' }),
    examPlace: (0, mysql_core_1.varchar)("exam_place", { length: 255 }),
    licenseNumber: (0, mysql_core_1.varchar)("license_number", { length: 50 }),
    validityDate: (0, mysql_core_1.date)("validity_date", { mode: 'string' }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "pds_eligibility_id" }),
]; });
exports.pdsFamily = (0, mysql_core_1.mysqlTable)("pds_family", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    relationType: (0, mysql_core_1.mysqlEnum)("relation_type", ['Spouse', 'Father', 'Mother', 'Child']).notNull(),
    lastName: (0, mysql_core_1.varchar)("last_name", { length: 100 }),
    firstName: (0, mysql_core_1.varchar)("first_name", { length: 100 }),
    middleName: (0, mysql_core_1.varchar)("middle_name", { length: 100 }),
    nameExtension: (0, mysql_core_1.varchar)("name_extension", { length: 10 }),
    occupation: (0, mysql_core_1.varchar)("occupation", { length: 100 }),
    employer: (0, mysql_core_1.varchar)("employer", { length: 100 }),
    businessAddress: (0, mysql_core_1.varchar)("business_address", { length: 255 }),
    telephoneNo: (0, mysql_core_1.varchar)("telephone_no", { length: 50 }),
    dateOfBirth: (0, mysql_core_1.date)("date_of_birth", { mode: 'string' }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_emp").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "pds_family_id" }),
]; });
exports.pdsLearningDevelopment = (0, mysql_core_1.mysqlTable)("pds_learning_development", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    title: (0, mysql_core_1.varchar)("title", { length: 255 }).notNull(),
    dateFrom: (0, mysql_core_1.date)("date_from", { mode: 'string' }),
    dateTo: (0, mysql_core_1.date)("date_to", { mode: 'string' }),
    hoursNumber: (0, mysql_core_1.int)("hours_number"),
    typeOfLd: (0, mysql_core_1.varchar)("type_of_ld", { length: 50 }),
    conductedBy: (0, mysql_core_1.varchar)("conducted_by", { length: 255 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "pds_learning_development_id" }),
]; });
exports.pdsOtherInfo = (0, mysql_core_1.mysqlTable)("pds_other_info", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    type: (0, mysql_core_1.mysqlEnum)("type", ['Skill', 'Recognition', 'Membership']).notNull(),
    description: (0, mysql_core_1.varchar)("description", { length: 255 }).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "pds_other_info_id" }),
]; });
exports.pdsReferences = (0, mysql_core_1.mysqlTable)("pds_references", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    address: (0, mysql_core_1.varchar)("address", { length: 255 }),
    telNo: (0, mysql_core_1.varchar)("tel_no", { length: 50 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "pds_references_id" }),
]; });
exports.pdsVoluntaryWork = (0, mysql_core_1.mysqlTable)("pds_voluntary_work", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    organizationName: (0, mysql_core_1.varchar)("organization_name", { length: 255 }).notNull(),
    address: (0, mysql_core_1.varchar)("address", { length: 255 }),
    dateFrom: (0, mysql_core_1.date)("date_from", { mode: 'string' }),
    dateTo: (0, mysql_core_1.date)("date_to", { mode: 'string' }),
    hoursNumber: (0, mysql_core_1.int)("hours_number"),
    position: (0, mysql_core_1.varchar)("position", { length: 100 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "pds_voluntary_work_id" }),
]; });
exports.pdsWorkExperience = (0, mysql_core_1.mysqlTable)("pds_work_experience", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    dateFrom: (0, mysql_core_1.date)("date_from", { mode: 'string' }).notNull(),
    dateTo: (0, mysql_core_1.date)("date_to", { mode: 'string' }),
    positionTitle: (0, mysql_core_1.varchar)("position_title", { length: 255 }).notNull(),
    companyName: (0, mysql_core_1.varchar)("company_name", { length: 255 }).notNull(),
    monthlySalary: (0, mysql_core_1.decimal)("monthly_salary", { precision: 12, scale: 2 }),
    salaryGrade: (0, mysql_core_1.varchar)("salary_grade", { length: 20 }),
    appointmentStatus: (0, mysql_core_1.varchar)("appointment_status", { length: 50 }),
    isGovernment: (0, mysql_core_1.boolean)("is_government").default(false),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "pds_work_experience_id" }),
]; });
exports.employeeCustomFields = (0, mysql_core_1.mysqlTable)("employee_custom_fields", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    section: (0, mysql_core_1.varchar)("section", { length: 255 }).notNull(),
    fieldName: (0, mysql_core_1.varchar)("field_name", { length: 255 }).notNull(),
    fieldValue: (0, mysql_core_1.text)("field_value"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "employee_custom_fields_id" }),
]; });
exports.employeeDocuments = (0, mysql_core_1.mysqlTable)("employee_documents", {
    id: (0, mysql_core_1.int)().autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    documentName: (0, mysql_core_1.varchar)("document_name", { length: 255 }).notNull(),
    documentType: (0, mysql_core_1.varchar)("document_type", { length: 50 }),
    filePath: (0, mysql_core_1.varchar)("file_path", { length: 255 }).notNull(),
    fileSize: (0, mysql_core_1.int)("file_size"),
    mimeType: (0, mysql_core_1.varchar)("mime_type", { length: 100 }),
    uploadedBy: (0, mysql_core_1.int)("uploaded_by").references(function () { return auth_js_1.authentication.id; }, { onDelete: "set null" }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.index)("uploaded_by").on(table.uploadedBy),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "employee_documents_id" }),
]; });
exports.employeeEducation = (0, mysql_core_1.mysqlTable)("employee_education", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    institution: (0, mysql_core_1.varchar)("institution", { length: 255 }).notNull(),
    degree: (0, mysql_core_1.varchar)("degree", { length: 255 }),
    fieldOfStudy: (0, mysql_core_1.varchar)("field_of_study", { length: 255 }),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }),
    isCurrent: (0, mysql_core_1.boolean)("is_current").default(false),
    description: (0, mysql_core_1.text)("description"),
    type: (0, mysql_core_1.mysqlEnum)("type", ['Education', 'Certification', 'Training']).default('Education'),
    expiryDate: (0, mysql_core_1.date)("expiry_date", { mode: 'string' }),
    credentialUrl: (0, mysql_core_1.varchar)("credential_url", { length: 255 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "employee_education_id" }),
]; });
exports.employeeEmergencyContacts = (0, mysql_core_1.mysqlTable)("employee_emergency_contacts", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    name: (0, mysql_core_1.varchar)("name", { length: 100 }).notNull(),
    relationship: (0, mysql_core_1.varchar)("relationship", { length: 50 }).notNull(),
    phoneNumber: (0, mysql_core_1.varchar)("phone_number", { length: 20 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 100 }),
    address: (0, mysql_core_1.text)("address"),
    isPrimary: (0, mysql_core_1.boolean)("is_primary").default(false),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "employee_emergency_contacts_id" }),
]; });
exports.employeeEmploymentHistory = (0, mysql_core_1.mysqlTable)("employee_employment_history", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    companyName: (0, mysql_core_1.varchar)("company_name", { length: 255 }).notNull(),
    jobTitle: (0, mysql_core_1.varchar)("job_title", { length: 100 }).notNull(),
    startDate: (0, mysql_core_1.date)("start_date", { mode: 'string' }).notNull(),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }),
    isCurrent: (0, mysql_core_1.boolean)("is_current").default(false),
    description: (0, mysql_core_1.text)("description"),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "employee_employment_history_id" }),
]; });
exports.employeeMemos = (0, mysql_core_1.mysqlTable)("employee_memos", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    memoNumber: (0, mysql_core_1.varchar)("memo_number", { length: 50 }).notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    authorId: (0, mysql_core_1.int)("author_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    memoType: (0, mysql_core_1.mysqlEnum)("memo_type", ['Verbal Warning', 'Written Warning', 'Reprimand', 'Suspension Notice', 'Termination Notice', 'Show Cause']).default('Written Warning').notNull(),
    subject: (0, mysql_core_1.varchar)("subject", { length: 255 }).notNull(),
    content: (0, mysql_core_1.text)("content").notNull(),
    priority: (0, mysql_core_1.mysqlEnum)("priority", ['Low', 'Normal', 'High', 'Urgent']).default('Normal').notNull(),
    severity: (0, mysql_core_1.mysqlEnum)("severity", ['minor', 'moderate', 'major', 'grave', 'terminal']).default('minor').notNull(),
    effectiveDate: (0, mysql_core_1.date)("effective_date", { mode: 'string' }),
    acknowledgmentRequired: (0, mysql_core_1.boolean)("acknowledgment_required").default(false),
    acknowledgedAt: (0, mysql_core_1.datetime)("acknowledged_at", { mode: 'string' }),
    status: (0, mysql_core_1.mysqlEnum)("status", ['Draft', 'Sent', 'Acknowledged', 'Archived']).default('Draft').notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("author_id").on(table.authorId),
    (0, mysql_core_1.index)("idx_memo_employee").on(table.employeeId),
    (0, mysql_core_1.index)("idx_memo_type").on(table.memoType),
    (0, mysql_core_1.index)("idx_memo_status").on(table.status),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "employee_memos_id" }),
    (0, mysql_core_1.unique)("memo_number").on(table.memoNumber),
]; });
exports.employeeNotes = (0, mysql_core_1.mysqlTable)("employee_notes", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    authorId: (0, mysql_core_1.int)("author_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    noteContent: (0, mysql_core_1.text)("note_content").notNull(),
    category: (0, mysql_core_1.varchar)("category", { length: 50 }).default('General'),
    isPrivate: (0, mysql_core_1.boolean)("is_private").default(true),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.index)("author_id").on(table.authorId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "employee_notes_id" }),
]; });
exports.employeeSkills = (0, mysql_core_1.mysqlTable)("employee_skills", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.int)("employee_id").notNull().references(function () { return auth_js_1.authentication.id; }, { onDelete: "cascade" }),
    skillName: (0, mysql_core_1.varchar)("skill_name", { length: 100 }).notNull(),
    category: (0, mysql_core_1.varchar)("category", { length: 50 }).default('Technical'),
    proficiencyLevel: (0, mysql_core_1.mysqlEnum)("proficiency_level", ['Beginner', 'Intermediate', 'Advanced', 'Expert']).default('Intermediate'),
    yearsExperience: (0, mysql_core_1.decimal)("years_experience", { precision: 4, scale: 1 }),
    endorsements: (0, mysql_core_1.int)("endorsements").default(0),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("employee_id").on(table.employeeId),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "employee_skills_id" }),
]; });
exports.serviceRecords = (0, mysql_core_1.mysqlTable)("service_records", {
    id: (0, mysql_core_1.int)("id").autoincrement().notNull(),
    employeeId: (0, mysql_core_1.varchar)("employee_id", { length: 50 }).notNull(),
    eventType: (0, mysql_core_1.mysqlEnum)("event_type", ['Appointment', 'Promotion', 'Leave', 'LWOP', 'Return from Leave', 'Transfer', 'Suspension', 'Resignation', 'Retirement', 'Other']).notNull(),
    eventDate: (0, mysql_core_1.date)("event_date", { mode: 'string' }).notNull(),
    endDate: (0, mysql_core_1.date)("end_date", { mode: 'string' }),
    leaveType: (0, mysql_core_1.varchar)("leave_type", { length: 50 }),
    daysCount: (0, mysql_core_1.decimal)("days_count", { precision: 5, scale: 1 }),
    isWithPay: (0, mysql_core_1.boolean)("is_with_pay").default(true),
    remarks: (0, mysql_core_1.text)("remarks"),
    referenceId: (0, mysql_core_1.int)("reference_id"),
    referenceType: (0, mysql_core_1.varchar)("reference_type", { length: 50 }),
    processedBy: (0, mysql_core_1.varchar)("processed_by", { length: 50 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
}, function (table) { return [
    (0, mysql_core_1.index)("idx_employee").on(table.employeeId),
    (0, mysql_core_1.index)("idx_event_type").on(table.eventType),
    (0, mysql_core_1.index)("idx_event_date").on(table.eventDate),
    (0, mysql_core_1.primaryKey)({ columns: [table.id], name: "service_records_id" }),
]; });
