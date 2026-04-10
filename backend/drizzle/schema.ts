import { mysqlTable, primaryKey, unique, int, decimal, varchar, text, mysqlEnum, timestamp, date, time, datetime, index, foreignKey, json, bigint, longtext, mysqlView, boolean } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const accrualRules = mysqlTable("accrual_rules", {
	id: int().autoincrement().notNull(),
	daysPresent: decimal("days_present", { precision: 10, scale: 3 }).notNull(),
	earnedCredits: decimal("earned_credits", { precision: 10, scale: 3 }).notNull(),
	ruleType: varchar("rule_type", { length: 50 }).default('CSC_STANDARD'),
},
(table) => [
	primaryKey({ columns: [table.id], name: "accrual_rules_id"}),
	unique("unique_rule").on(table.daysPresent, table.ruleType),
]);

export const addressRefBarangays = mysqlTable("address_ref_barangays", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	zipCode: varchar("zip_code", { length: 10 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "address_ref_barangays_id"}),
	unique("unique_barangay_name").on(table.name),
]);

export const announcements = mysqlTable("announcements", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	priority: mysqlEnum(['normal','high','urgent']).default('normal'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	startTime: time("start_time"),
	endTime: time("end_time"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "announcements_id"}),
]);

export const attendanceLogs = mysqlTable("attendance_logs", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	scanTime: datetime("scan_time", { mode: 'string'}).notNull(),
	type: mysqlEnum(['IN','OUT']).notNull(),
	source: varchar({ length: 50 }).default('BIOMETRIC'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "attendance_logs_id"}),
]);

export const auditLogs = mysqlTable("audit_logs", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").references(() => authentication.id, { onDelete: "set null" } ),
	module: varchar({ length: 50 }).notNull(),
	action: varchar({ length: 50 }).notNull(),
	details: text(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("idx_created_at").on(table.createdAt),
	index("idx_module").on(table.module),
	index("idx_user_id").on(table.userId),
	primaryKey({ columns: [table.id], name: "audit_logs_id"}),
]);

export const authentication = mysqlTable("authentication", {
	id: int().autoincrement().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	suffix: varchar({ length: 20 }),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	department: varchar({ length: 100 }),
	departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" } ),
	employeeId: varchar("employee_id", { length: 50 }),
	rfidCardUid: varchar("rfid_card_uid", { length: 50 }),
	passwordHash: varchar("password_hash", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	isVerified: boolean("is_verified").default(false),
	verificationToken: varchar("verification_token", { length: 255 }),
	resetPasswordToken: varchar("reset_password_token", { length: 255 }),
	resetPasswordExpires: datetime("reset_password_expires", { mode: 'string'}),
	googleId: varchar("google_id", { length: 255 }),
	avatarUrl: varchar("avatar_url", { length: 500 }),
	jobTitle: varchar("job_title", { length: 100 }),
	employmentStatus: mysqlEnum("employment_status", ['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']).default('Active'),
	employmentType: varchar("employment_type", { length: 50 }).default('Probationary'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateHired: date("date_hired", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	contractEndDate: date("contract_end_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	regularizationDate: date("regularization_date", { mode: 'string' }),
	isRegular: boolean("is_regular").default(false),
	managerId: int("manager_id"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	birthDate: date("birth_date", { mode: 'string' }),
	gender: mysqlEnum(['Male','Female']),
	civilStatus: mysqlEnum("civil_status", ['Single','Married','Widowed','Separated','Annulled']),
	nationality: varchar({ length: 50 }).default('Filipino'),
	bloodType: varchar("blood_type", { length: 5 }),
	heightCm: decimal("height_cm", { precision: 5, scale: 2 }),
	weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
	phoneNumber: varchar("phone_number", { length: 20 }),
	address: text(),
	permanentAddress: text("permanent_address"),
	emergencyContact: varchar("emergency_contact", { length: 100 }),
	emergencyContactNumber: varchar("emergency_contact_number", { length: 20 }),
	umidNo: varchar("umid_no", { length: 50 }),
	philhealthNumber: varchar("philhealth_number", { length: 50 }),
	pagibigNumber: varchar("pagibig_number", { length: 50 }),
	tinNumber: varchar("tin_number", { length: 50 }),
	gsisNumber: varchar("gsis_number", { length: 50 }),
	salaryGrade: varchar("salary_grade", { length: 10 }),
	stepIncrement: int("step_increment").default(1),
	appointmentType: mysqlEnum("appointment_type", ['Permanent','Contractual','Casual','Job Order','Coterminous','Temporary','Contract of Service','JO','COS']),
	officeAddress: text("office_address"),
	station: varchar({ length: 100 }),
	positionTitle: varchar("position_title", { length: 100 }),
	itemNumber: varchar("item_number", { length: 50 }),
	positionId: int("position_id").references(() => plantillaPositions.id, { onDelete: "set null" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	firstDayOfService: date("first_day_of_service", { mode: 'string' }),
	refreshToken: text("refresh_token"),
	twoFactorEnabled: boolean("two_factor_enabled").default(false),
	twoFactorOtp: varchar("two_factor_otp", { length: 6 }),
	twoFactorOtpExpires: datetime("two_factor_otp_expires", { mode: 'string'}),
	eligibilityType: varchar("eligibility_type", { length: 255 }),
	eligibilityNumber: varchar("eligibility_number", { length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	eligibilityDate: date("eligibility_date", { mode: 'string' }),
	educationalBackground: text("educational_background"),
	schoolName: varchar("school_name", { length: 255 }),
	course: varchar({ length: 255 }),
	yearGraduated: varchar("year_graduated", { length: 10 }),
	yearsOfExperience: varchar("years_of_experience", { length: 50 }),
	experience: text(),
	skills: text(),
	placeOfBirth: varchar("place_of_birth", { length: 255 }),
	heightM: decimal("height_m", { precision: 4, scale: 2 }),
	philsysId: varchar("philsys_id", { length: 50 }),
	agencyEmployeeNo: varchar("agency_employee_no", { length: 50 }),
	residentialAddress: text("residential_address"),
	residentialZipCode: varchar("residential_zip_code", { length: 50 }),
	permanentZipCode: varchar("permanent_zip_code", { length: 50 }),
	telephoneNo: varchar("telephone_no", { length: 50 }),
	mobileNo: varchar("mobile_no", { length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	originalAppointmentDate: date("original_appointment_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastPromotionDate: date("last_promotion_date", { mode: 'string' }),
	middleName: varchar("middle_name", { length: 100 }),
	facebookUrl: varchar("facebook_url", { length: 255 }),
	linkedinUrl: varchar("linkedin_url", { length: 255 }),
	twitterHandle: varchar("twitter_handle", { length: 100 }),
	dutyType: mysqlEnum("duty_type", ['Standard','Irregular']).default('Standard'),
	dailyTargetHours: decimal("daily_target_hours", { precision: 4, scale: 2 }).default('8.00'),
	salaryBasis: mysqlEnum("salary_basis", ['Daily','Hourly']).default('Daily'),
	loginAttempts: int("login_attempts").default(0),
	lockUntil: datetime("lock_until", { mode: 'string'}),
	religion: varchar({ length: 100 }),
	citizenship: varchar({ length: 50 }).default('Filipino'),
	citizenshipType: varchar("citizenship_type", { length: 50 }),
	barangay: varchar({ length: 100 }),
	resHouseBlockLot: varchar("res_house_block_lot", { length: 150 }),
	resStreet: varchar("res_street", { length: 150 }),
	resSubdivision: varchar("res_subdivision", { length: 150 }),
	resBarangay: varchar("res_barangay", { length: 150 }),
	resCity: varchar("res_city", { length: 150 }),
	resProvince: varchar("res_province", { length: 150 }),
	permHouseBlockLot: varchar("perm_house_block_lot", { length: 150 }),
	permStreet: varchar("perm_street", { length: 150 }),
	permSubdivision: varchar("perm_subdivision", { length: 150 }),
	permBarangay: varchar("perm_barangay", { length: 150 }),
	permCity: varchar("perm_city", { length: 150 }),
	permProvince: varchar("perm_province", { length: 150 }),
	profileStatus: mysqlEnum("profile_status", ['Initial','Pending','Complete']).default('Initial'),
	resRegion: varchar("res_region", { length: 150 }),
	permRegion: varchar("perm_region", { length: 150 }),
	isOldEmployee: boolean("is_old_employee").default(false),
	motherMaidenName: varchar("mother_maiden_name", { length: 255 }),
	spouseName: varchar("spouse_name", { length: 255 }),
	fatherName: varchar("father_name", { length: 255 }),
	startTime: varchar("start_time", { length: 50 }),
	endTime: varchar("end_time", { length: 50 }),
	relatedThirdDegree: varchar("related_third_degree", { length: 10 }).default('No'),
	relatedThirdDetails: text("related_third_details"),
	relatedFourthDegree: varchar("related_fourth_degree", { length: 10 }).default('No'),
	relatedFourthDetails: text("related_fourth_details"),
	foundGuiltyAdmin: varchar("found_guilty_admin", { length: 10 }).default('No'),
	foundGuiltyDetails: text("found_guilty_details"),
	criminallyCharged: varchar("criminally_charged", { length: 10 }).default('No'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateFiled: date("date_filed", { mode: 'string' }),
	statusOfCase: text("status_of_case"),
	convictedCrime: varchar("convicted_crime", { length: 10 }).default('No'),
	convictedDetails: text("convicted_details"),
	separatedFromService: varchar("separated_from_service", { length: 10 }).default('No'),
	separatedDetails: text("separated_details"),
	electionCandidate: varchar("election_candidate", { length: 10 }).default('No'),
	electionDetails: text("election_details"),
	resignedToPromote: varchar("resigned_to_promote", { length: 10 }).default('No'),
	resignedDetails: text("resigned_details"),
	immigrantStatus: varchar("immigrant_status", { length: 10 }).default('No'),
	immigrantDetails: text("immigrant_details"),
	indigenousMember: varchar("indigenous_member", { length: 10 }).default('No'),
	indigenousDetails: text("indigenous_details"),
	personWithDisability: varchar("person_with_disability", { length: 10 }).default('No'),
	disabilityIdNo: varchar("disability_id_no", { length: 100 }),
	soloParent: varchar("solo_parent", { length: 10 }).default('No'),
	soloParentIdNo: varchar("solo_parent_id_no", { length: 100 }),
	dualCountry: varchar("dual_country", { length: 100 }),
	govtIdType: varchar("govt_id_type", { length: 100 }),
	govtIdNo: varchar("govt_id_no", { length: 100 }),
	govtIdIssuance: varchar("govt_id_issuance", { length: 255 }),
	isMeycauayan: boolean("is_meycauayan").default(false),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateAccomplished: date("date_accomplished", { mode: 'string' }),
	pdsQuestions: json("pds_questions"),
},
(table) => [
	foreignKey({
			columns: [table.managerId],
			foreignColumns: [table.id],
			name: "fk_manager"
		}).onDelete("set null"),
	primaryKey({ columns: [table.id], name: "authentication_id"}),
	unique("email").on(table.email),
	unique("employee_id").on(table.employeeId),
	unique("google_id").on(table.googleId),
	unique("philsys_id_unique").on(table.philsysId),
	unique("umid_no_unique").on(table.umidNo),
]);

export const bioAttendanceLogs = mysqlTable("bio_attendance_logs", {
	id: bigint({ mode: "number" }).autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	cardType: mysqlEnum("card_type", ['IN','OUT']).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	logDate: date("log_date", { mode: 'string' }).notNull(),
	logTime: time("log_time").notNull(),
	createdAt: datetime("created_at", { mode: 'string'}).default(sql`(now())`),
},
(table) => [
	index("idx_date_time").on(table.logDate, table.logTime),
	index("idx_emp_date").on(table.employeeId, table.logDate),
	primaryKey({ columns: [table.id], name: "bio_attendance_logs_id"}),
]);

export const bioEnrolledUsers = mysqlTable("bio_enrolled_users", {
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	fullName: varchar("full_name", { length: 150 }).notNull(),
	department: varchar({ length: 100 }),
	userStatus: mysqlEnum("user_status", ['active','inactive']).default('active').notNull(),
	enrolledAt: datetime("enrolled_at", { mode: 'string'}).default(sql`(now())`),
	updatedAt: datetime("updated_at", { mode: 'string'}).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.employeeId], name: "bio_enrolled_users_employee_id"}),
]);

export const budgetAllocation = mysqlTable("budget_allocation", {
	id: int().autoincrement().notNull(),
	year: int().notNull(),
	department: varchar({ length: 255 }).notNull(),
	totalBudget: decimal("total_budget", { precision: 15, scale: 2 }).notNull(),
	utilizedBudget: decimal("utilized_budget", { precision: 15, scale: 2 }).default('0.00'),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	remainingBudget: decimal("remaining_budget", { precision: 15, scale: 2 }).generatedAlwaysAs(sql`(\`total_budget\` - \`utilized_budget\`)`, { mode: "stored" }),
	utilizationRate: decimal("utilization_rate", { precision: 5, scale: 2 }).generatedAlwaysAs(sql`((\`utilized_budget\` / nullif(\`total_budget\`,0)) * 100)`, { mode: "stored" }),
},
(table) => [
	index("idx_department").on(table.department),
	index("idx_year").on(table.year),
	primaryKey({ columns: [table.id], name: "budget_allocation_id"}),
	unique("unique_year_dept").on(table.year, table.department),
]);

export const chatConversations = mysqlTable("chat_conversations", {
	id: int().autoincrement().notNull(),
	applicantName: varchar("applicant_name", { length: 100 }).notNull(),
	applicantEmail: varchar("applicant_email", { length: 255 }).notNull(),
	status: mysqlEnum(['Active','Closed','Archived']).default('Active'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_applicant_email").on(table.applicantEmail),
	index("idx_status").on(table.status),
	primaryKey({ columns: [table.id], name: "chat_conversations_id"}),
]);

export const chatMessages = mysqlTable("chat_messages", {
	id: int().autoincrement().notNull(),
	conversationId: int("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" } ),
	senderType: mysqlEnum("sender_type", ['Applicant','Administrator']).notNull(),
	senderId: int("sender_id"),
	message: text().notNull(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	isEdited: boolean("is_edited").default(false),
	isDeletedForEveryone: boolean("is_deleted_for_everyone").default(false),
	deletedByApplicant: boolean("deleted_by_applicant").default(false),
	deletedByAdministrator: boolean("deleted_by_administrator").default(false),
},
(table) => [
	index("idx_conversation").on(table.conversationId),
	index("idx_is_read").on(table.isRead),
	primaryKey({ columns: [table.id], name: "chat_messages_id"}),
]);

export const contactInquiries = mysqlTable("contact_inquiries", {
	id: int().autoincrement().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	status: mysqlEnum(['Pending','Read','Replied','Archived']).default('Pending'),
	adminNotes: text("admin_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_created_at").on(table.createdAt),
	index("idx_email").on(table.email),
	index("idx_status").on(table.status),
	primaryKey({ columns: [table.id], name: "contact_inquiries_id"}),
]);

export const dailyTimeRecords = mysqlTable("daily_time_records", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	timeIn: datetime("time_in", { mode: 'string'}),
	timeOut: datetime("time_out", { mode: 'string'}),
	lateMinutes: int("late_minutes").default(0),
	undertimeMinutes: int("undertime_minutes").default(0),
	overtimeMinutes: int("overtime_minutes").default(0),
	status: varchar({ length: 50 }).default('Present'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	amIn: datetime("am_in", { mode: 'string'}),
	amOut: datetime("am_out", { mode: 'string'}),
	pmIn: datetime("pm_in", { mode: 'string'}),
	pmOut: datetime("pm_out", { mode: 'string'}),
},
(table) => [
	primaryKey({ columns: [table.id], name: "daily_time_records_id"}),
	unique("unique_dtr").on(table.employeeId, table.date),
]);

export const departments = mysqlTable("departments", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	headOfDepartment: varchar("head_of_department", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
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

export const dtrCorrections = mysqlTable("dtr_corrections", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateTime: date("date_time", { mode: 'string' }).notNull(),
	originalTimeIn: datetime("original_time_in", { mode: 'string'}),
	originalTimeOut: datetime("original_time_out", { mode: 'string'}),
	correctedTimeIn: datetime("corrected_time_in", { mode: 'string'}),
	correctedTimeOut: datetime("corrected_time_out", { mode: 'string'}),
	reason: text(),
	status: mysqlEnum(['Pending','Approved','Rejected']).default('Pending'),
	rejectionReason: text("rejection_reason"),
	approvedBy: varchar("approved_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "dtr_corrections_id"}),
]);

export const employeeCustomFields = mysqlTable("employee_custom_fields", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	section: varchar({ length: 255 }).notNull(),
	fieldName: varchar("field_name", { length: 255 }).notNull(),
	fieldValue: text("field_value"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_custom_fields_id"}),
]);

export const employeeDocuments = mysqlTable("employee_documents", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	documentName: varchar("document_name", { length: 255 }).notNull(),
	documentType: varchar("document_type", { length: 50 }),
	filePath: varchar("file_path", { length: 255 }).notNull(),
	fileSize: int("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	uploadedBy: int("uploaded_by").references(() => authentication.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("uploaded_by").on(table.uploadedBy),
	primaryKey({ columns: [table.id], name: "employee_documents_id"}),
]);

export const employeeEducation = mysqlTable("employee_education", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	institution: varchar({ length: 255 }).notNull(),
	degree: varchar({ length: 255 }),
	fieldOfStudy: varchar("field_of_study", { length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	isCurrent: boolean("is_current").default(false),
	description: text(),
	type: mysqlEnum(['Education','Certification','Training']).default('Education'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expiryDate: date("expiry_date", { mode: 'string' }),
	credentialUrl: varchar("credential_url", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_education_id"}),
]);

export const employeeEmergencyContacts = mysqlTable("employee_emergency_contacts", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	name: varchar({ length: 100 }).notNull(),
	relationship: varchar({ length: 50 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	email: varchar({ length: 100 }),
	address: text(),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_emergency_contacts_id"}),
]);

export const employeeEmploymentHistory = mysqlTable("employee_employment_history", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	jobTitle: varchar("job_title", { length: 100 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	isCurrent: boolean("is_current").default(false),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_employment_history_id"}),
]);

export const employeeMemos = mysqlTable("employee_memos", {
	id: int().autoincrement().notNull(),
	memoNumber: varchar("memo_number", { length: 50 }).notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	authorId: int("author_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	memoType: mysqlEnum("memo_type", ['Verbal Warning','Written Warning','Reprimand','Suspension Notice','Termination Notice','Show Cause']).default('Written Warning').notNull(),
	subject: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	priority: mysqlEnum(['Low','Normal','High','Urgent']).default('Normal').notNull(),
	severity: mysqlEnum(['minor','moderate','major','grave','terminal']).default('minor').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	effectiveDate: date("effective_date", { mode: 'string' }),
	acknowledgmentRequired: boolean("acknowledgment_required").default(false),
	acknowledgedAt: datetime("acknowledged_at", { mode: 'string'}),
	status: mysqlEnum(['Draft','Sent','Acknowledged','Archived']).default('Draft').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("author_id").on(table.authorId),
	index("idx_memo_employee").on(table.employeeId),
	index("idx_memo_status").on(table.status),
	index("idx_memo_type").on(table.memoType),
	primaryKey({ columns: [table.id], name: "employee_memos_id"}),
	unique("memo_number").on(table.memoNumber),
]);

export const employeeNotes = mysqlTable("employee_notes", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	authorId: int("author_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	noteContent: text("note_content").notNull(),
	category: varchar({ length: 50 }).default('General'),
	isPrivate: boolean("is_private").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("author_id").on(table.authorId),
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_notes_id"}),
]);

export const employeeSkills = mysqlTable("employee_skills", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	skillName: varchar("skill_name", { length: 100 }).notNull(),
	category: varchar({ length: 50 }).default('Technical'),
	proficiencyLevel: mysqlEnum("proficiency_level", ['Beginner','Intermediate','Advanced','Expert']).default('Intermediate'),
	yearsExperience: decimal("years_experience", { precision: 4, scale: 1 }),
	endorsements: int().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "employee_skills_id"}),
]);

export const events = mysqlTable("events", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	department: varchar({ length: 100 }),
	time: int().default(9),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	recurringPattern: varchar("recurring_pattern", { length: 50 }).default('none'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	recurringEndDate: date("recurring_end_date", { mode: 'string' }),
	description: text(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "events_id"}),
]);

export const fingerprints = mysqlTable("fingerprints", {
	fingerprintId: int("fingerprint_id").notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	template: longtext(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.fingerprintId], name: "fingerprints_fingerprint_id"}),
	unique("employee_id").on(table.employeeId),
]);

export const googleCalendarTokens = mysqlTable("google_calendar_tokens", {
	userId: int("user_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	accessToken: text("access_token").notNull(),
	tokenExpiry: datetime("token_expiry", { mode: 'string'}).notNull(),
	syncEnabled: boolean("sync_enabled").default(true),
	calendarId: varchar("calendar_id", { length: 255 }).default('primary'),
	lastSync: datetime("last_sync", { mode: 'string'}).default(sql`(now())`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	refreshToken: text("refresh_token").notNull(),
},
(table) => [
	primaryKey({ columns: [table.userId], name: "google_calendar_tokens_user_id"}),
]);

export const holidays = mysqlTable("holidays", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	type: mysqlEnum(['Regular','Special Non-Working','Special Working']).notNull(),
	year: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "holidays_id"}),
	unique("unique_holiday").on(table.date),
]);

export const internalPolicies = mysqlTable("internal_policies", {
	id: int().autoincrement().notNull(),
	category: mysqlEnum(['hours','tardiness','penalties','csc','leave','plantilla']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	versionLabel: varchar("version_label", { length: 50 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "internal_policies_id"}),
]);

export const leaveApplications = mysqlTable("leave_applications", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	leaveType: varchar("leave_type", { length: 100 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	workingDays: decimal("working_days", { precision: 10, scale: 3 }).notNull(),
	isWithPay: boolean("is_with_pay").default(true).notNull(),
	actualPaymentStatus: mysqlEnum("actual_payment_status", ['WITH_PAY','WITHOUT_PAY','PARTIAL']).default('WITH_PAY').notNull(),
	daysWithPay: decimal("days_with_pay", { precision: 10, scale: 3 }).default('0.000'),
	daysWithoutPay: decimal("days_without_pay", { precision: 10, scale: 3 }).default('0.000'),
	crossChargedFrom: varchar("cross_charged_from", { length: 50 }),
	reason: text().notNull(),
	status: mysqlEnum(['Pending','Processing','Finalizing','Approved','Rejected','Cancelled']).default('Pending'),
	rejectionReason: text("rejection_reason"),
	rejectedBy: varchar("rejected_by", { length: 50 }),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	approvedBy: varchar("approved_by", { length: 50 }),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	attachmentPath: varchar("attachment_path", { length: 500 }),
	adminFormPath: varchar("admin_form_path", { length: 500 }),
	finalAttachmentPath: varchar("final_attachment_path", { length: 500 }),
},
(table) => [
	index("idx_dates").on(table.startDate, table.endDate),
	index("idx_employee_status").on(table.employeeId, table.status),
	index("idx_leave_type").on(table.leaveType),
	primaryKey({ columns: [table.id], name: "leave_applications_id"}),
]);

export const leaveBalances = mysqlTable("leave_balances", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	creditType: varchar("credit_type", { length: 100 }).notNull(),
	balance: decimal({ precision: 10, scale: 3 }).default('0.000').notNull(),
	year: int().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "leave_balances_id"}),
	unique("unique_balance").on(table.employeeId, table.creditType, table.year),
]);

export const leaveCredits = mysqlTable("leave_credits", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 255 }).notNull(),
	creditType: varchar("credit_type", { length: 50 }).notNull(),
	balance: decimal({ precision: 10, scale: 2 }).default('0.00'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "leave_credits_id"}),
	unique("unique_credit").on(table.employeeId, table.creditType),
]);

export const leaveLedger = mysqlTable("leave_ledger", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	creditType: varchar("credit_type", { length: 100 }).notNull(),
	transactionType: mysqlEnum("transaction_type", ['ACCRUAL','DEDUCTION','ADJUSTMENT','MONETIZATION','FORFEITURE','UNDERTIME_DEDUCTION','TARDINESS_DEDUCTION']).notNull(),
	amount: decimal({ precision: 10, scale: 3 }).notNull(),
	balanceAfter: decimal("balance_after", { precision: 10, scale: 3 }).notNull(),
	referenceId: int("reference_id"),
	referenceType: mysqlEnum("reference_type", ['leave_application','monetization','dtr','manual']),
	remarks: text(),
	createdBy: varchar("created_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("idx_created").on(table.createdAt),
	index("idx_employee_credit").on(table.employeeId, table.creditType),
	index("idx_reference").on(table.referenceId, table.referenceType),
	primaryKey({ columns: [table.id], name: "leave_ledger_id"}),
]);

export const leaveMonetizationRequests = mysqlTable("leave_monetization_requests", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	creditType: varchar("credit_type", { length: 100 }).notNull(),
	requestedDays: decimal("requested_days", { precision: 10, scale: 3 }).notNull(),
	dailyRate: decimal("daily_rate", { precision: 12, scale: 2 }).notNull(),
	totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
	purpose: mysqlEnum(['Health','Medical','Financial Emergency']).notNull(),
	status: mysqlEnum(['Pending','Approved','Rejected']).default('Pending'),
	approvedBy: varchar("approved_by", { length: 50 }),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	index("idx_status").on(table.status),
	primaryKey({ columns: [table.id], name: "leave_monetization_requests_id"}),
]);

export const leaveRequests = mysqlTable("leave_requests", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	leaveType: varchar("leave_type", { length: 50 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	reason: text(),
	status: mysqlEnum(['Pending','Processing','Finalizing','Approved','Rejected']).default('Pending'),
	rejectionReason: text("rejection_reason"),
	approvedBy: varchar("approved_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	withPay: boolean("with_pay").default(false),
},
(table) => [
	primaryKey({ columns: [table.id], name: "leave_requests_id"}),
]);

export const lwopSummary = mysqlTable("lwop_summary", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	year: int().notNull(),
	totalLwopDays: decimal("total_lwop_days", { precision: 10, scale: 3 }).default('0.000'),
	salaryDeduction: decimal("salary_deduction", { precision: 12, scale: 2 }).default('0.00'),
	cumulativeLwopDays: decimal("cumulative_lwop_days", { precision: 10, scale: 3 }).default('0.000'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "lwop_summary_id"}),
	unique("unique_lwop").on(table.employeeId, table.year),
]);

export const memoSequences = mysqlTable("memo_sequences", {
	id: int().autoincrement().notNull(),
	year: int().notNull(),
	lastNumber: int("last_number").default(0).notNull(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "memo_sequences_id"}),
	unique("unique_year").on(table.year),
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
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("idx_degree").on(table.degree),
	index("idx_employee_1").on(table.employeeId1),
	index("idx_employee_2").on(table.employeeId2),
	index("verified_by").on(table.verifiedBy),
	primaryKey({ columns: [table.id], name: "nepotism_relationships_id"}),
]);

export const notifications = mysqlTable("notifications", {
	notificationId: int("notification_id").autoincrement().notNull(),
	recipientId: varchar("recipient_id", { length: 50 }).notNull(),
	senderId: varchar("sender_id", { length: 50 }),
	title: varchar({ length: 255 }),
	message: text(),
	type: varchar({ length: 50 }),
	referenceId: int("reference_id"),
	status: mysqlEnum(['read','unread']).default('unread'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.notificationId], name: "notifications_notification_id"}),
]);

export const pdsDeclarations = mysqlTable("pds_declarations", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	relatedThirdDegree: varchar("related_third_degree", { length: 10 }),
	relatedThirdDetails: text("related_third_details"),
	relatedFourthDegree: varchar("related_fourth_degree", { length: 10 }),
	relatedFourthDetails: text("related_fourth_details"),
	foundGuiltyAdmin: varchar("found_guilty_admin", { length: 10 }),
	foundGuiltyDetails: text("found_guilty_details"),
	criminallyCharged: varchar("criminally_charged", { length: 10 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateFiled: date("date_filed", { mode: 'string' }),
	statusOfCase: varchar("status_of_case", { length: 255 }),
	convictedCrime: varchar("convicted_crime", { length: 10 }),
	convictedDetails: text("convicted_details"),
	separatedFromService: varchar("separated_from_service", { length: 10 }),
	separatedDetails: text("separated_details"),
	electionCandidate: varchar("election_candidate", { length: 10 }),
	electionDetails: text("election_details"),
	resignedToPromote: varchar("resigned_to_promote", { length: 10 }),
	resignedDetails: text("resigned_details"),
	immigrantStatus: varchar("immigrant_status", { length: 10 }),
	immigrantDetails: text("immigrant_details"),
	indigenousMember: varchar("indigenous_member", { length: 10 }),
	indigenousDetails: text("indigenous_details"),
	personWithDisability: varchar("person_with_disability", { length: 10 }),
	disabilityIdNo: varchar("disability_id_no", { length: 100 }),
	soloParent: varchar("solo_parent", { length: 10 }),
	soloParentIdNo: varchar("solo_parent_id_no", { length: 100 }),
	govtIdType: varchar("govt_id_type", { length: 100 }),
	govtIdNo: varchar("govt_id_no", { length: 100 }),
	govtIdIssuance: varchar("govt_id_issuance", { length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateAccomplished: date("date_accomplished", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_declarations_id"}),
]);

export const pdsEducation = mysqlTable("pds_education", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	level: mysqlEnum(['Elementary','Secondary','Vocational','College','Graduate Studies']).notNull(),
	schoolName: varchar("school_name", { length: 255 }).notNull(),
	degreeCourse: varchar("degree_course", { length: 255 }),
	yearGraduated: int("year_graduated"),
	unitsEarned: varchar("units_earned", { length: 50 }),
	dateFrom: int("date_from"),
	dateTo: int("date_to"),
	honors: varchar({ length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_education_id"}),
]);

export const pdsEligibility = mysqlTable("pds_eligibility", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	eligibilityName: varchar("eligibility_name", { length: 255 }).notNull(),
	rating: decimal({ precision: 5, scale: 2 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	examDate: date("exam_date", { mode: 'string' }),
	examPlace: varchar("exam_place", { length: 255 }),
	licenseNumber: varchar("license_number", { length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	validityDate: date("validity_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_eligibility_id"}),
]);

export const pdsFamily = mysqlTable("pds_family", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	relationType: mysqlEnum("relation_type", ['Spouse','Father','Mother','Child']).notNull(),
	lastName: varchar("last_name", { length: 100 }),
	firstName: varchar("first_name", { length: 100 }),
	middleName: varchar("middle_name", { length: 100 }),
	nameExtension: varchar("name_extension", { length: 10 }),
	occupation: varchar({ length: 100 }),
	employer: varchar({ length: 100 }),
	businessAddress: varchar("business_address", { length: 255 }),
	telephoneNo: varchar("telephone_no", { length: 50 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateOfBirth: date("date_of_birth", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("idx_emp").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_family_id"}),
]);

export const pdsHrDetails = mysqlTable("pds_hr_details", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	employmentStatus: mysqlEnum("employment_status", ['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']).default('Active'),
	employmentType: varchar("employment_type", { length: 50 }).default('Probationary'),
	appointmentType: mysqlEnum("appointment_type", ['Permanent','Contractual','Casual','Job Order','Coterminous','Temporary','Contract of Service','JO','COS']),
	jobTitle: varchar("job_title", { length: 100 }),
	positionTitle: varchar("position_title", { length: 100 }),
	itemNumber: varchar("item_number", { length: 50 }),
	station: varchar({ length: 100 }),
	officeAddress: text("office_address"),
	salaryGrade: varchar("salary_grade", { length: 10 }),
	stepIncrement: int("step_increment").default(1),
	salaryBasis: mysqlEnum("salary_basis", ['Daily','Hourly']).default('Daily'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateHired: date("date_hired", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	contractEndDate: date("contract_end_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	regularizationDate: date("regularization_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	firstDayOfService: date("first_day_of_service", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	originalAppointmentDate: date("original_appointment_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastPromotionDate: date("last_promotion_date", { mode: 'string' }),
	dutyType: mysqlEnum("duty_type", ['Standard','Irregular']).default('Standard'),
	dailyTargetHours: decimal("daily_target_hours", { precision: 4, scale: 2 }).default('8.00'),
	startTime: varchar("start_time", { length: 50 }),
	endTime: varchar("end_time", { length: 50 }),
	isRegular: boolean("is_regular").default(false),
	isOldEmployee: boolean("is_old_employee").default(false),
	isMeycauayan: boolean("is_meycauayan").default(false),
	profileStatus: mysqlEnum("profile_status", ['Initial','Complete']).default('Initial'),
	religion: varchar({ length: 100 }),
	barangay: varchar({ length: 100 }),
	facebookUrl: varchar("facebook_url", { length: 255 }),
	linkedinUrl: varchar("linkedin_url", { length: 255 }),
	twitterHandle: varchar("twitter_handle", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
	departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" } ),
	positionId: int("position_id").references(() => plantillaPositions.id, { onDelete: "set null" } ),
	managerId: int("manager_id").references(() => authentication.id, { onDelete: "set null" } ),
},
(table) => [
	index("idx_hr_employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_hr_details_id"}),
]);

export const pdsLearningDevelopment = mysqlTable("pds_learning_development", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateFrom: date("date_from", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateTo: date("date_to", { mode: 'string' }),
	hoursNumber: int("hours_number"),
	typeOfLd: varchar("type_of_ld", { length: 50 }),
	conductedBy: varchar("conducted_by", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_learning_development_id"}),
]);

export const pdsOtherInfo = mysqlTable("pds_other_info", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	type: mysqlEnum(['Skill','Recognition','Membership']).notNull(),
	description: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_other_info_id"}),
]);

export const pdsPersonalInformation = mysqlTable("pds_personal_information", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	birthDate: date("birth_date", { mode: 'string' }),
	placeOfBirth: varchar("place_of_birth", { length: 255 }),
	gender: mysqlEnum(['Male','Female']),
	civilStatus: mysqlEnum("civil_status", ['Single','Married','Widowed','Separated','Annulled']),
	heightM: decimal("height_m", { precision: 4, scale: 2 }),
	weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
	bloodType: varchar("blood_type", { length: 5 }),
	citizenship: varchar({ length: 50 }).default('Filipino'),
	citizenshipType: varchar("citizenship_type", { length: 50 }),
	dualCountry: varchar("dual_country", { length: 100 }),
	residentialAddress: text("residential_address"),
	residentialZipCode: varchar("residential_zip_code", { length: 50 }),
	permanentAddress: text("permanent_address"),
	permanentZipCode: varchar("permanent_zip_code", { length: 50 }),
	telephoneNo: varchar("telephone_no", { length: 50 }),
	mobileNo: varchar("mobile_no", { length: 50 }),
	email: varchar({ length: 255 }),
	umidNo: varchar("umid_no", { length: 50 }),
	philsysId: varchar("philsys_id", { length: 50 }),
	philhealthNumber: varchar("philhealth_number", { length: 50 }),
	pagibigNumber: varchar("pagibig_number", { length: 50 }),
	tinNumber: varchar("tin_number", { length: 50 }),
	gsisNumber: varchar("gsis_number", { length: 50 }),
	agencyEmployeeNo: varchar("agency_employee_no", { length: 50 }),
	resHouseBlockLot: varchar("res_house_block_lot", { length: 150 }),
	resStreet: varchar("res_street", { length: 150 }),
	resSubdivision: varchar("res_subdivision", { length: 150 }),
	resBarangay: varchar("res_barangay", { length: 150 }),
	resCity: varchar("res_city", { length: 150 }),
	resProvince: varchar("res_province", { length: 150 }),
	resRegion: varchar("res_region", { length: 150 }),
	permHouseBlockLot: varchar("perm_house_block_lot", { length: 150 }),
	permStreet: varchar("perm_street", { length: 150 }),
	permSubdivision: varchar("perm_subdivision", { length: 150 }),
	permBarangay: varchar("perm_barangay", { length: 150 }),
	permCity: varchar("perm_city", { length: 150 }),
	permProvince: varchar("perm_province", { length: 150 }),
	permRegion: varchar("perm_region", { length: 150 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_personal_information_id"}),
]);

export const pdsReferences = mysqlTable("pds_references", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	address: varchar({ length: 255 }),
	telNo: varchar("tel_no", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_references_id"}),
]);

export const pdsVoluntaryWork = mysqlTable("pds_voluntary_work", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	organizationName: varchar("organization_name", { length: 255 }).notNull(),
	address: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateFrom: date("date_from", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateTo: date("date_to", { mode: 'string' }),
	hoursNumber: int("hours_number"),
	position: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_voluntary_work_id"}),
]);

export const pdsWorkExperience = mysqlTable("pds_work_experience", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateFrom: date("date_from", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateTo: date("date_to", { mode: 'string' }),
	positionTitle: varchar("position_title", { length: 255 }).notNull(),
	companyName: varchar("company_name", { length: 255 }).notNull(),
	monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }),
	salaryGrade: varchar("salary_grade", { length: 20 }),
	appointmentStatus: varchar("appointment_status", { length: 50 }),
	isGovernment: boolean("is_government").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "pds_work_experience_id"}),
]);

export const performanceAuditLog = mysqlTable("performance_audit_log", {
	id: int().autoincrement().notNull(),
	reviewId: int("review_id").references(() => performanceReviews.id, { onDelete: "cascade" } ),
	action: varchar({ length: 50 }).notNull(),
	actorId: int("actor_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	details: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("actor_id").on(table.actorId),
	index("review_id").on(table.reviewId),
	primaryKey({ columns: [table.id], name: "performance_audit_log_id"}),
]);

export const performanceCriteria = mysqlTable("performance_criteria", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).default('General'),
	criteriaType: mysqlEnum("criteria_type", ['core_function','support_function','core_competency','organizational_competency']).default('core_function'),
	weight: decimal({ precision: 5, scale: 2 }).default('1.00'),
	maxScore: int("max_score").default(5),
	ratingDefinition5: text("rating_definition_5"),
	ratingDefinition4: text("rating_definition_4"),
	ratingDefinition3: text("rating_definition_3"),
	ratingDefinition2: text("rating_definition_2"),
	ratingDefinition1: text("rating_definition_1"),
	evidenceRequirements: text("evidence_requirements"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	isActive: boolean("is_active").default(true),
},
(table) => [
	primaryKey({ columns: [table.id], name: "performance_criteria_id"}),
]);

export const performanceGoals = mysqlTable("performance_goals", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	reviewCycleId: int("review_cycle_id").references(() => performanceReviewCycles.id, { onDelete: "set null" } ),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	metric: varchar({ length: 255 }),
	targetValue: decimal("target_value", { precision: 10, scale: 2 }),
	currentValue: decimal("current_value", { precision: 10, scale: 2 }).default('0.00'),
	weight: decimal({ precision: 5, scale: 2 }).default('1.00'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dueDate: date("due_date", { mode: 'string' }),
	status: mysqlEnum(['Not Started','In Progress','Completed','Cancelled']).default('Not Started'),
	progress: int().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("review_cycle_id").on(table.reviewCycleId),
	primaryKey({ columns: [table.id], name: "performance_goals_id"}),
]);

export const performanceImprovementPlans = mysqlTable("performance_improvement_plans", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	areasOfConcern: text("areas_of_concern").notNull(),
	actionPlan: text("action_plan").notNull(),
	status: mysqlEnum(['Active','Completed','Failed','Terminated']).default('Active'),
	outcomeNotes: text("outcome_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	reviewerId: int("reviewer_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("reviewer_id").on(table.reviewerId),
	primaryKey({ columns: [table.id], name: "performance_improvement_plans_id"}),
]);

export const performanceReviewCycles = mysqlTable("performance_review_cycles", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }).notNull(),
	status: mysqlEnum(['Draft','Active','Completed','Archived']).default('Draft'),
	createdBy: int("created_by").references(() => authentication.id, { onDelete: "set null" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	ratingPeriod: mysqlEnum("rating_period", ['1st_sem','2nd_sem','annual']).default('annual'),
	isActive: boolean("is_active").default(true),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("created_by").on(table.createdBy),
	primaryKey({ columns: [table.id], name: "performance_review_cycles_id"}),
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
	evidenceFilePath: text("evidence_file_path"),
	evidenceDescription: text("evidence_description"),
},
(table) => [
	index("review_id").on(table.reviewId),
	primaryKey({ columns: [table.id], name: "performance_review_items_id"}),
]);

export const performanceReviews = mysqlTable("performance_reviews", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id),
	reviewerId: int("reviewer_id").notNull().references(() => authentication.id),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	reviewPeriodStart: date("review_period_start", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	reviewPeriodEnd: date("review_period_end", { mode: 'string' }).notNull(),
	status: mysqlEnum(['Draft','Self-Rated','Submitted','Acknowledged','Approved','Finalized']).default('Draft'),
	totalScore: decimal("total_score", { precision: 5, scale: 2 }),
	selfRatingScore: decimal("self_rating_score", { precision: 3, scale: 2 }),
	finalRatingScore: decimal("final_rating_score", { precision: 3, scale: 2 }),
	selfRatingStatus: mysqlEnum("self_rating_status", ['pending','submitted']).default('pending'),
	overallFeedback: text("overall_feedback"),
	employeeRemarks: text("employee_remarks"),
	headRemarks: text("head_remarks"),
	disagreeRemarks: text("disagree_remarks"),
	approvedBy: int("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	disagreed: boolean().default(false),
	ratingPeriod: mysqlEnum("rating_period", ['1st_sem','2nd_sem','annual']).default('annual'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	reviewCycleId: int("review_cycle_id"),
	isSelfAssessment: boolean("is_self_assessment").default(false),
	cycleId: int("cycle_id"),
	evaluationMode: mysqlEnum("evaluation_mode", ['CSC','IPCR','Senior']).default('CSC'),
	reviewerRatingScore: decimal("reviewer_rating_score", { precision: 3, scale: 2 }),
	reviewerRemarks: text("reviewer_remarks"),
},
(table) => [
	index("employee_id").on(table.employeeId),
	index("reviewer_id").on(table.reviewerId),
	primaryKey({ columns: [table.id], name: "performance_reviews_id"}),
]);

export const performanceTemplates = mysqlTable("performance_templates", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	sections: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "performance_templates_id"}),
]);

export const plantillaAuditLog = mysqlTable("plantilla_audit_log", {
	id: int().autoincrement().notNull(),
	positionId: int("position_id").notNull(),
	action: varchar({ length: 50 }).notNull(),
	actorId: int("actor_id").notNull(),
	oldValues: json("old_values"),
	newValues: json("new_values"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("idx_action").on(table.action),
	index("idx_actor_id").on(table.actorId),
	index("idx_position_id").on(table.positionId),
	primaryKey({ columns: [table.id], name: "plantilla_audit_log_id"}),
]);

export const plantillaPositionHistory = mysqlTable("plantilla_position_history", {
	id: int().autoincrement().notNull(),
	positionId: int("position_id").notNull(),
	employeeId: int("employee_id").notNull(),
	employeeName: varchar("employee_name", { length: 255 }),
	positionTitle: varchar("position_title", { length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	reason: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("idx_employee_id").on(table.employeeId),
	index("idx_position_id").on(table.positionId),
	primaryKey({ columns: [table.id], name: "plantilla_position_history_id"}),
]);

export const plantillaPositions = mysqlTable("plantilla_positions", {
	id: int().autoincrement().notNull(),
	itemNumber: varchar("item_number", { length: 50 }).notNull(),
	positionTitle: varchar("position_title", { length: 100 }).notNull(),
	salaryGrade: int("salary_grade").notNull(),
	stepIncrement: int("step_increment").default(1),
	department: varchar({ length: 100 }),
	departmentId: int("department_id").references(() => departments.id, { onDelete: "set null" } ),
	isVacant: boolean("is_vacant").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	incumbentId: int("incumbent_id"),
	monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	filledDate: date("filled_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	vacatedDate: date("vacated_date", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	ordinanceNumber: varchar("ordinance_number", { length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	ordinanceDate: date("ordinance_date", { mode: 'string' }),
	abolishmentOrdinance: varchar("abolishment_ordinance", { length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	abolishmentDate: date("abolishment_date", { mode: 'string' }),
	qualificationStandardsId: int("qualification_standards_id").references(() => qualificationStandards.id, { onDelete: "set null" } ),
	budgetSource: varchar("budget_source", { length: 100 }).default('Regular'),
	isCoterminous: boolean("is_coterminous").default(false),
	status: mysqlEnum(['Active','Abolished','Frozen']).default('Active'),
	areaCode: varchar("area_code", { length: 50 }),
	areaType: mysqlEnum("area_type", ['R','P','D','M','F','B']),
	areaLevel: mysqlEnum("area_level", ['K','T','S','A']),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastPromotionDate: date("last_promotion_date", { mode: 'string' }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "plantilla_positions_id"}),
	unique("item_number").on(table.itemNumber),
]);

export const policyViolations = mysqlTable("policy_violations", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	type: mysqlEnum(['habitual_tardiness','habitual_undertime','consecutive_lateness','loafing','absence','misconduct','others']).notNull(),
	violationSubtype: varchar("violation_subtype", { length: 50 }),
	offenseLevel: int("offense_level").default(1),
	offenseNumber: int("offense_number").default(1).notNull(),
	triggeredMonths: text("triggered_months"),
	fingerprint: varchar({ length: 255 }),
	details: text().notNull(),
	status: mysqlEnum(['pending','notified','resolved','cancelled']).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	memoId: int("memo_id"),
},
(table) => [
	index("idx_employee_violation").on(table.employeeId, table.type, table.memoId),
	primaryKey({ columns: [table.id], name: "policy_violations_id"}),
	unique("unique_fingerprint_violation").on(table.fingerprint),
]);

export const positionPublications = mysqlTable("position_publications", {
	id: int().autoincrement().notNull(),
	positionId: int("position_id").notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	publicationDate: date("publication_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	closingDate: date("closing_date", { mode: 'string' }).notNull(),
	publicationMedium: varchar("publication_medium", { length: 255 }).default('CSC Bulletin, LGU Website'),
	form9Path: varchar("form_9_path", { length: 500 }),
	status: mysqlEnum(['Draft','Published','Closed','Filled']).default('Draft'),
	applicantsCount: int("applicants_count").default(0),
	notes: text(),
	createdBy: int("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("created_by").on(table.createdBy),
	index("idx_position").on(table.positionId),
	index("idx_publication_date").on(table.publicationDate),
	index("idx_status").on(table.status),
	primaryKey({ columns: [table.id], name: "position_publications_id"}),
]);

export const qualificationStandards = mysqlTable("qualification_standards", {
	id: int().autoincrement().notNull(),
	positionTitle: varchar("position_title", { length: 255 }).notNull(),
	salaryGrade: int("salary_grade").notNull(),
	educationRequirement: text("education_requirement").notNull(),
	experienceYears: int("experience_years").default(0),
	trainingHours: int("training_hours").default(0),
	eligibilityRequired: varchar("eligibility_required", { length: 255 }).notNull(),
	competencyRequirements: text("competency_requirements"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_position_title").on(table.positionTitle),
	index("idx_salary_grade").on(table.salaryGrade),
	primaryKey({ columns: [table.id], name: "qualification_standards_id"}),
	unique("unique_position_sg").on(table.positionTitle, table.salaryGrade),
]);

export const recruitmentApplicants = mysqlTable("recruitment_applicants", {
	id: int().autoincrement().notNull(),
	jobId: int("job_id").references(() => recruitmentJobs.id, { onDelete: "set null" } ),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 100 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }),
	resumePath: varchar("resume_path", { length: 255 }),
	photoPath: varchar("photo_path", { length: 255 }),
	status: mysqlEnum(['Applied','Screening','Interview','Offer','Hired','Rejected']).default('Applied'),
	source: mysqlEnum(['web','email']).default('web'),
	emailSubject: varchar("email_subject", { length: 255 }),
	emailReceivedAt: datetime("email_received_at", { mode: 'string'}),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	stage: mysqlEnum(['Applied','Screening','Initial Interview','Final Interview','Offer','Hired','Rejected']).default('Applied'),
	interviewDate: datetime("interview_date", { mode: 'string'}),
	interviewLink: varchar("interview_link", { length: 500 }),
	interviewPlatform: mysqlEnum("interview_platform", ['Jitsi Meet','Google Meet','Zoom','Other']).default('Google Meet'),
	interviewNotes: text("interview_notes"),
	interviewerId: int("interviewer_id").references(() => authentication.id, { onDelete: "set null" } ),
	middleName: varchar("middle_name", { length: 100 }),
	suffix: varchar({ length: 10 }),
	zipCode: varchar("zip_code", { length: 10 }),
	birthDate: datetime("birth_date", { mode: 'string'}),
	birthPlace: varchar("birth_place", { length: 255 }),
	sex: mysqlEnum(['Male','Female']),
	civilStatus: mysqlEnum("civil_status", ['Single','Married','Widowed','Separated','Annulled']),
	height: varchar({ length: 20 }),
	weight: varchar({ length: 20 }),
	bloodType: varchar("blood_type", { length: 10 }),
	gsisNo: varchar("gsis_no", { length: 50 }),
	pagibigNo: varchar("pagibig_no", { length: 50 }),
	philhealthNo: varchar("philhealth_no", { length: 50 }),
	umidNo: varchar("umid_no", { length: 50 }),
	philsysId: varchar("philsys_id", { length: 50 }),
	tinNo: varchar("tin_no", { length: 50 }),
	eligibility: text(),
	eligibilityType: varchar("eligibility_type", { length: 100 }),
	eligibilityDate: datetime("eligibility_date", { mode: 'string'}),
	eligibilityRating: varchar("eligibility_rating", { length: 50 }),
	eligibilityPlace: varchar("eligibility_place", { length: 255 }),
	licenseNo: varchar("license_no", { length: 50 }),
	eligibilityPath: varchar("eligibility_path", { length: 255 }),
	totalExperienceYears: int("total_experience_years"),
	address: text(),
	permanentAddress: text("permanent_address"),
	permanentZipCode: varchar("permanent_zip_code", { length: 10 }),
	educationalBackground: text("educational_background"),
	schoolName: varchar("school_name", { length: 255 }),
	course: varchar({ length: 255 }),
	yearGraduated: varchar("year_graduated", { length: 10 }),
	experience: text(),
	skills: text(),
	hiredDate: datetime("hired_date", { mode: 'string'}),
	isMeycauayanResident: boolean("is_meycauayan_resident").default(false),
	emergencyContact: varchar("emergency_contact", { length: 255 }),
	emergencyContactNumber: varchar("emergency_contact_number", { length: 20 }),
	photo1X1Path: varchar("photo1x1_path", { length: 255 }),
	resHouseBlockLot: varchar("res_house_block_lot", { length: 100 }),
	resStreet: varchar("res_street", { length: 100 }),
	resSubdivision: varchar("res_subdivision", { length: 100 }),
	resBarangay: varchar("res_barangay", { length: 100 }),
	resCity: varchar("res_city", { length: 100 }),
	resProvince: varchar("res_province", { length: 100 }),
	resRegion: varchar("res_region", { length: 100 }),
	permHouseBlockLot: varchar("perm_house_block_lot", { length: 100 }),
	permStreet: varchar("perm_street", { length: 100 }),
	permSubdivision: varchar("perm_subdivision", { length: 100 }),
	permBarangay: varchar("perm_barangay", { length: 100 }),
	permCity: varchar("perm_city", { length: 100 }),
	permProvince: varchar("perm_province", { length: 100 }),
	permRegion: varchar("perm_region", { length: 100 }),
	startDate: datetime("start_date", { mode: 'string'}),
	isConfirmed: boolean("is_confirmed").default(false),
	isRegistered: boolean("is_registered").default(false),
	registeredEmployeeId: varchar("registered_employee_id", { length: 50 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	isEmailVerified: boolean("is_email_verified").default(false),
	verificationToken: varchar("verification_token", { length: 6 }),
	voluntaryWork: text("voluntary_work"),
	training: text(),
	telephoneNumber: varchar("telephone_number", { length: 20 }),
	facebookUrl: varchar("facebook_url", { length: 255 }),
	linkedinUrl: varchar("linkedin_url", { length: 255 }),
	twitterHandle: varchar("twitter_handle", { length: 255 }),
	agencyEmployeeNo: varchar("agency_employee_no", { length: 50 }),
	nationality: varchar({ length: 100 }).default('Filipino'),
	citizenshipType: varchar("citizenship_type", { length: 50 }),
	dualCountry: varchar("dual_country", { length: 100 }),
},
(table) => [
	index("job_id").on(table.jobId),
	primaryKey({ columns: [table.id], name: "recruitment_applicants_id"}),
	unique("email_unique").on(table.email),
	unique("gsis_no_unique").on(table.gsisNo),
	unique("pagibig_no_unique").on(table.pagibigNo),
	unique("philhealth_no_unique").on(table.philhealthNo),
	unique("philsys_id_unique").on(table.philsysId),
	unique("tin_no_unique").on(table.tinNo),
	unique("umid_no_unique").on(table.umidNo),
]);

export const recruitmentEmailTemplates = mysqlTable("recruitment_email_templates", {
	id: int().autoincrement().notNull(),
	stageName: varchar("stage_name", { length: 50 }).notNull(),
	subjectTemplate: varchar("subject_template", { length: 255 }).notNull(),
	bodyTemplate: text("body_template").notNull(),
	availableVariables: text("available_variables"),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "recruitment_email_templates_id"}),
	unique("stage_name").on(table.stageName),
]);

export const recruitmentJobs = mysqlTable("recruitment_jobs", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	department: varchar({ length: 100 }).notNull(),
	jobDescription: text("job_description").notNull(),
	requirements: text(),
	location: varchar({ length: 100 }).default('Main Office'),
	employmentType: mysqlEnum("employment_type", ['Full-time','Part-time','Contractual','Job Order','Coterminous','Temporary','Probationary','Casual','Permanent','Contract of Service','JO','COS']).default('Full-time'),
	dutyType: mysqlEnum("duty_type", ['Standard','Irregular']).default('Standard'),
	status: mysqlEnum(['Open','Closed','On Hold']).default('Open'),
	applicationEmail: varchar("application_email", { length: 255 }),
	postedBy: int("posted_by"),
	postedAt: datetime("posted_at", { mode: 'string'}),
	fbPostId: varchar("fb_post_id", { length: 100 }),
	linkedinPostId: varchar("linkedin_post_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	attachmentPath: varchar("attachment_path", { length: 255 }),
	requireCivilService: boolean("require_civil_service").default(false),
	requireGovernmentIds: boolean("require_government_ids").default(false),
	requireEducationExperience: boolean("require_education_experience").default(false),
	education: text(),
	experience: text(),
	training: text(),
	eligibility: text(),
	otherQualifications: text("other_qualifications"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "recruitment_jobs_id"}),
]);

export const recruitmentSecurityLogs = mysqlTable("recruitment_security_logs", {
	id: int().autoincrement().notNull(),
	jobId: int("job_id"),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	email: varchar({ length: 255 }),
	violationType: varchar("violation_type", { length: 100 }),
	details: text(),
	ipAddress: varchar("ip_address", { length: 45 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	index("idx_violation").on(table.violationType),
	primaryKey({ columns: [table.id], name: "recruitment_security_logs_id"}),
]);

export const salarySchedule = mysqlTable("salary_schedule", {
	id: int().autoincrement().notNull(),
	salaryGrade: int("salary_grade").notNull(),
	step: int().notNull(),
	monthlySalary: decimal("monthly_salary", { precision: 12, scale: 2 }).notNull(),
	tranche: int().default(2).notNull(),
},
(table) => [
	index("idx_grade").on(table.salaryGrade),
	index("idx_salary_schedule_tranche").on(table.tranche),
	primaryKey({ columns: [table.id], name: "salary_schedule_id"}),
	unique("unique_grade_step_tranche").on(table.salaryGrade, table.step, table.tranche),
]);

export const salaryTranches = mysqlTable("salary_tranches", {
	id: int().autoincrement().notNull(),
	trancheNumber: int("tranche_number").notNull(),
	name: varchar({ length: 100 }).notNull(),
	circularNumber: varchar("circular_number", { length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	effectiveDate: date("effective_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	dateIssued: date("date_issued", { mode: 'string' }),
	applicableTo: varchar("applicable_to", { length: 255 }),
	isActive: boolean("is_active").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "salary_tranches_id"}),
	unique("tranche_number").on(table.trancheNumber),
]);

export const schedules = mysqlTable("schedules", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	scheduleTitle: varchar("schedule_title", { length: 255 }).default('Regular Schedule'),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date("start_date", { mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	dayOfWeek: varchar("day_of_week", { length: 20 }).notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	repeatPattern: varchar("repeat_pattern", { length: 50 }).default('Weekly'),
	isRestDay: boolean("is_rest_day").default(false),
	isSpecial: boolean("is_special").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_employee_day").on(table.employeeId, table.dayOfWeek),
	primaryKey({ columns: [table.id], name: "schedules_id"}),
]);

export const serviceRecords = mysqlTable("service_records", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	eventType: mysqlEnum("event_type", ['Appointment','Promotion','Leave','LWOP','Return from Leave','Transfer','Suspension','Resignation','Retirement','Other']).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	eventDate: date("event_date", { mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date("end_date", { mode: 'string' }),
	leaveType: varchar("leave_type", { length: 50 }),
	daysCount: decimal("days_count", { precision: 5, scale: 1 }),
	isWithPay: boolean("is_with_pay").default(true),
	remarks: text(),
	referenceId: int("reference_id"),
	referenceType: varchar("reference_type", { length: 50 }),
	processedBy: varchar("processed_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	index("idx_event_date").on(table.eventDate),
	index("idx_event_type").on(table.eventType),
	primaryKey({ columns: [table.id], name: "service_records_id"}),
]);

export const shiftTemplates = mysqlTable("shift_templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	departmentId: int("department_id"),
	employeeId: varchar("employee_id", { length: 50 }),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	isDefault: boolean("is_default").default(false),
	workingDays: text("working_days"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "shift_templates_id"}),
	unique("name").on(table.name),
]);

export const socialConnections = mysqlTable("social_connections", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	provider: mysqlEnum(['facebook','jobstreet']).notNull(),
	providerUserId: varchar("provider_user_id", { length: 100 }).notNull(),
	providerUserName: varchar("provider_user_name", { length: 255 }),
	accessToken: text("access_token"),
	expiresAt: datetime("expires_at", { mode: 'string'}),
	metadata: json(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	refreshToken: text("refresh_token"),
},
(table) => [
	primaryKey({ columns: [table.id], name: "social_connections_id"}),
	unique("unique_user_provider").on(table.userId, table.provider),
]);

export const stepIncrementTracker = mysqlTable("step_increment_tracker", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	positionId: int("position_id").notNull(),
	currentStep: int("current_step").notNull(),
	previousStep: int("previous_step"),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	eligibleDate: date("eligible_date", { mode: 'string' }).notNull(),
	status: mysqlEnum(['Pending','Approved','Denied','Processed']).default('Pending'),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	processedBy: int("processed_by").references(() => authentication.id, { onDelete: "set null" } ),
	remarks: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_eligible_date").on(table.eligibleDate),
	index("idx_employee").on(table.employeeId),
	index("idx_status").on(table.status),
	index("processed_by").on(table.processedBy),
	primaryKey({ columns: [table.id], name: "step_increment_tracker_id"}),
]);

export const syncedEvents = mysqlTable("synced_events", {
	id: int().autoincrement().notNull(),
	localEventId: int("local_event_id").notNull().references(() => events.id, { onDelete: "cascade" } ),
	googleEventId: varchar("google_event_id", { length: 255 }).notNull(),
	lastSynced: datetime("last_synced", { mode: 'string'}).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "synced_events_id"}),
	unique("local_event_id").on(table.localEventId),
]);

export const systemSettings = mysqlTable("system_settings", {
	settingKey: varchar("setting_key", { length: 255 }).notNull(),
	settingValue: text("setting_value"),
	description: varchar({ length: 255 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.settingKey], name: "system_settings_setting_key"}),
]);

export const tardinessSummary = mysqlTable("tardiness_summary", {
	id: int().autoincrement().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	year: int().notNull(),
	month: int().notNull(),
	totalLateMinutes: int("total_late_minutes").default(0),
	totalUndertimeMinutes: int("total_undertime_minutes").default(0),
	totalLateCount: int("total_late_count").default(0),
	totalUndertimeCount: int("total_undertime_count").default(0),
	totalAbsenceCount: int("total_absence_count").default(0),
	totalMinutes: int("total_minutes").generatedAlwaysAs(sql`(\`total_late_minutes\` + \`total_undertime_minutes\`)`, { mode: "stored" }),
	daysEquivalent: decimal("days_equivalent", { precision: 5, scale: 3 }).default('0.000'),
	deductedFromVl: decimal("deducted_from_vl", { precision: 5, scale: 3 }).default('0.000'),
	chargedAsLwop: decimal("charged_as_lwop", { precision: 5, scale: 3 }).default('0.000'),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	processedBy: varchar("processed_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	index("idx_employee").on(table.employeeId),
	primaryKey({ columns: [table.id], name: "tardiness_summary_id"}),
	unique("unique_tardiness").on(table.employeeId, table.year, table.month),
]);
export const employeeDirectory = mysqlView("employee_directory", {
	id: int().default(0).notNull(),
	employeeId: varchar("employee_id", { length: 50 }),
	rfidCardUid: varchar("rfid_card_uid", { length: 50 }),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	fullName: varchar("full_name", { length: 201 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	jobTitle: varchar("job_title", { length: 100 }),
	employmentStatus: mysqlEnum("employment_status", ['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']).default('Active'),
	avatarUrl: varchar("avatar_url", { length: 500 }),
	departmentId: int("department_id").default(0),
	departmentName: varchar("department_name", { length: 100 }),
	departmentLocation: varchar("department_location", { length: 255 }),
	phoneNumber: varchar("phone_number", { length: 20 }),
	positionTitle: varchar("position_title", { length: 100 }),
}).algorithm("undefined").sqlSecurity("definer").as(sql`select \`a\`.\`id\` AS \`id\`,\`a\`.\`employee_id\` AS \`employee_id\`,\`a\`.\`rfid_card_uid\` AS \`rfid_card_uid\`,\`a\`.\`first_name\` AS \`first_name\`,\`a\`.\`last_name\` AS \`last_name\`,concat(\`a\`.\`last_name\`,', ',\`a\`.\`first_name\`) AS \`full_name\`,\`a\`.\`email\` AS \`email\`,\`a\`.\`role\` AS \`role\`,\`a\`.\`job_title\` AS \`job_title\`,\`a\`.\`employment_status\` AS \`employment_status\`,\`a\`.\`avatar_url\` AS \`avatar_url\`,\`d\`.\`id\` AS \`department_id\`,\`d\`.\`name\` AS \`department_name\`,\`d\`.\`location\` AS \`department_location\`,\`a\`.\`phone_number\` AS \`phone_number\`,\`a\`.\`position_title\` AS \`position_title\` from (\`chrmo_db\`.\`authentication\` \`a\` left join \`chrmo_db\`.\`departments\` \`d\` on((\`a\`.\`department_id\` = \`d\`.\`id\`))) where (\`a\`.\`employment_status\` <> 'Terminated')`);
