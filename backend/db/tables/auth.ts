import { mysqlTable, varchar, int, timestamp, text, mysqlEnum, datetime, unique, boolean, primaryKey, json } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const authentication = mysqlTable("authentication", {
	id: int("id").autoincrement().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	middleName: varchar("middle_name", { length: 100 }),
	suffix: varchar("suffix", { length: 20 }),
	email: varchar("email", { length: 255 }).notNull(),
	role: varchar("role", { length: 50 }).notNull(),
	employeeId: varchar("employee_id", { length: 50 }),
	rfidCardUid: varchar("rfid_card_uid", { length: 50 }),
	passwordHash: varchar("password_hash", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isVerified: boolean("is_verified").default(false),
	verificationToken: varchar("verification_token", { length: 255 }),
	resetPasswordToken: varchar("reset_password_token", { length: 255 }),
	resetPasswordExpires: datetime("reset_password_expires", { mode: 'string'}),
	googleId: varchar("google_id", { length: 255 }),
	avatarUrl: varchar("avatar_url", { length: 500 }),
	loginAttempts: int("login_attempts").default(0),
	lockUntil: datetime("lock_until", { mode: 'string'}),
	refreshToken: text("refresh_token"),
	twoFactorEnabled: boolean("two_factor_enabled").default(false),
	twoFactorOtp: varchar("two_factor_otp", { length: 6 }),
	twoFactorOtpExpires: datetime("two_factor_otp_expires", { mode: 'string'}),
},
(table) => [
	primaryKey({ columns: [table.id], name: "authentication_id"}),
	unique("email").on(table.email),
	unique("employee_id").on(table.employeeId),
	unique("google_id").on(table.googleId),
]);

export const googleCalendarTokens = mysqlTable("google_calendar_tokens", {
	userId: int("user_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	tokenExpiry: datetime("token_expiry", { mode: 'string'}).notNull(),
	syncEnabled: boolean("sync_enabled").default(true),
	calendarId: varchar("calendar_id", { length: 255 }).default('primary'),
	lastSync: datetime("last_sync", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.userId], name: "google_calendar_tokens_user_id"}),
]);

export const socialConnections = mysqlTable("social_connections", {
	id: int("id").autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => authentication.id, { onDelete: "cascade" } ),
	provider: mysqlEnum("provider", ['facebook','jobstreet']).notNull(),
	providerUserId: varchar("provider_user_id", { length: 100 }).notNull(),
	providerUserName: varchar("provider_user_name", { length: 255 }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	expiresAt: datetime("expires_at", { mode: 'string'}),
	metadata: json("metadata"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "social_connections_id"}),
	unique("unique_user_provider").on(table.userId, table.provider),
]);
