import { relations } from "drizzle-orm";
import { authentication, googleCalendarTokens, socialConnections } from "./tables/auth.js";
import { departments, nepotismRelationships } from "./tables/hr.js";
import { plantillaPositions, qualificationStandards, positionPublications } from "./tables/plantilla.js";
import { chatConversations, chatMessages, recruitmentApplicants, recruitmentJobs } from "./tables/recruitment.js";
import { pdsEducation, pdsEligibility, pdsFamily, pdsLearningDevelopment, pdsOtherInfo, pdsReferences, pdsVoluntaryWork, pdsWorkExperience, employeeCustomFields, employeeDocuments, employeeEducation, employeeEmergencyContacts, employeeEmploymentHistory, employeeMemos, employeeNotes, employeeSkills } from "./tables/pds.js";
import { performanceReviews, performanceAuditLog, performanceGoals, performanceReviewCycles, performanceImprovementPlans, performanceCriteria, performanceReviewItems } from "./tables/performance.js";
import { stepIncrementTracker } from "./tables/payroll.js";
import { events, syncedEvents } from "./tables/common.js";
import { schedules, bioEnrolledUsers, bioAttendanceLogs } from "./tables/attendance.js";

export const authenticationRelations = relations(authentication, ({one, many}) => ({
	department: one(departments, {
		fields: [authentication.departmentId],
		references: [departments.id]
	}),
	plantillaPosition: one(plantillaPositions, {
		fields: [authentication.positionId],
		references: [plantillaPositions.id],
		relationName: "authentication_positionId_plantillaPositions_id"
	}),
	authentication: one(authentication, {
		fields: [authentication.managerId],
		references: [authentication.id],
		relationName: "authentication_managerId_authentication_id"
	}),
	authentications: many(authentication, {
		relationName: "authentication_managerId_authentication_id"
	}),
	employeeCustomFields: many(employeeCustomFields),
	employeeDocumentsEmployeeId: many(employeeDocuments, {
		relationName: "employeeDocuments_employeeId_authentication_id"
	}),
	employeeDocumentsUploadedBy: many(employeeDocuments, {
		relationName: "employeeDocuments_uploadedBy_authentication_id"
	}),
	employeeEducations: many(employeeEducation),
	employeeEmergencyContacts: many(employeeEmergencyContacts),
	employeeEmploymentHistories: many(employeeEmploymentHistory),
	employeeMemosEmployeeId: many(employeeMemos, {
		relationName: "employeeMemos_employeeId_authentication_id"
	}),
	employeeMemosAuthorId: many(employeeMemos, {
		relationName: "employeeMemos_authorId_authentication_id"
	}),
	employeeNotesEmployeeId: many(employeeNotes, {
		relationName: "employeeNotes_employeeId_authentication_id"
	}),
	employeeNotesAuthorId: many(employeeNotes, {
		relationName: "employeeNotes_authorId_authentication_id"
	}),
	employeeSkills: many(employeeSkills),
	googleCalendarTokens: many(googleCalendarTokens),
	nepotismRelationshipsEmployeeId1: many(nepotismRelationships, {
		relationName: "nepotismRelationships_employeeId1_authentication_id"
	}),
	nepotismRelationshipsEmployeeId2: many(nepotismRelationships, {
		relationName: "nepotismRelationships_employeeId2_authentication_id"
	}),
	nepotismRelationshipsVerifiedBy: many(nepotismRelationships, {
		relationName: "nepotismRelationships_verifiedBy_authentication_id"
	}),
	pdsEducations: many(pdsEducation),
	pdsEligibilities: many(pdsEligibility),
	pdsFamilies: many(pdsFamily),
	pdsLearningDevelopments: many(pdsLearningDevelopment),
	pdsOtherInfos: many(pdsOtherInfo),
	pdsReferences: many(pdsReferences),
	pdsVoluntaryWorks: many(pdsVoluntaryWork),
	pdsWorkExperiences: many(pdsWorkExperience),
	performanceAuditLogs: many(performanceAuditLog),
	performanceGoals: many(performanceGoals),
	performanceImprovementPlansEmployeeId: many(performanceImprovementPlans, {
		relationName: "performanceImprovementPlans_employeeId_authentication_id"
	}),
	performanceImprovementPlansReviewerId: many(performanceImprovementPlans, {
		relationName: "performanceImprovementPlans_reviewerId_authentication_id"
	}),
	performanceReviewCycles: many(performanceReviewCycles),
	performanceReviewsEmployeeId: many(performanceReviews, {
		relationName: "performanceReviews_employeeId_authentication_id"
	}),
	performanceReviewsReviewerId: many(performanceReviews, {
		relationName: "performanceReviews_reviewerId_authentication_id"
	}),
	plantillaPositions: many(plantillaPositions, {
		relationName: "plantillaPositions_incumbentId_authentication_id"
	}),
	positionPublications: many(positionPublications),
	recruitmentApplicants: many(recruitmentApplicants),
	socialConnections: many(socialConnections),
	stepIncrementTrackersEmployeeId: many(stepIncrementTracker, {
		relationName: "stepIncrementTracker_employeeId_authentication_id"
	}),
	stepIncrementTrackersProcessedBy: many(stepIncrementTracker, {
		relationName: "stepIncrementTracker_processedBy_authentication_id"
	}),
	schedules: many(schedules),
}));

export const departmentsRelations = relations(departments, ({one, many}) => ({
	authentications: many(authentication),
	department: one(departments, {
		fields: [departments.parentDepartmentId],
		references: [departments.id],
		relationName: "departments_parentDepartmentId_departments_id"
	}),
	departments: many(departments, {
		relationName: "departments_parentDepartmentId_departments_id"
	}),
	plantillaPositions: many(plantillaPositions),
}));

export const plantillaPositionsRelations = relations(plantillaPositions, ({one, many}) => ({
	authentications: many(authentication, {
		relationName: "authentication_positionId_plantillaPositions_id"
	}),
	department: one(departments, {
		fields: [plantillaPositions.departmentId],
		references: [departments.id]
	}),
	authentication: one(authentication, {
		fields: [plantillaPositions.incumbentId],
		references: [authentication.id],
		relationName: "plantillaPositions_incumbentId_authentication_id"
	}),
	qualificationStandard: one(qualificationStandards, {
		fields: [plantillaPositions.qualificationStandardsId],
		references: [qualificationStandards.id]
	}),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatConversation: one(chatConversations, {
		fields: [chatMessages.conversationId],
		references: [chatConversations.id]
	}),
}));

export const chatConversationsRelations = relations(chatConversations, ({many}) => ({
	chatMessages: many(chatMessages),
}));

export const employeeCustomFieldsRelations = relations(employeeCustomFields, ({one}) => ({
	authentication: one(authentication, {
		fields: [employeeCustomFields.employeeId],
		references: [authentication.id]
	}),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({one}) => ({
	authenticationEmployeeId: one(authentication, {
		fields: [employeeDocuments.employeeId],
		references: [authentication.id],
		relationName: "employeeDocuments_employeeId_authentication_id"
	}),
	authenticationUploadedBy: one(authentication, {
		fields: [employeeDocuments.uploadedBy],
		references: [authentication.id],
		relationName: "employeeDocuments_uploadedBy_authentication_id"
	}),
}));

export const employeeEducationRelations = relations(employeeEducation, ({one}) => ({
	authentication: one(authentication, {
		fields: [employeeEducation.employeeId],
		references: [authentication.id]
	}),
}));

export const employeeEmergencyContactsRelations = relations(employeeEmergencyContacts, ({one}) => ({
	authentication: one(authentication, {
		fields: [employeeEmergencyContacts.employeeId],
		references: [authentication.id]
	}),
}));

export const employeeEmploymentHistoryRelations = relations(employeeEmploymentHistory, ({one}) => ({
	authentication: one(authentication, {
		fields: [employeeEmploymentHistory.employeeId],
		references: [authentication.id]
	}),
}));

export const employeeMemosRelations = relations(employeeMemos, ({one}) => ({
	authenticationEmployeeId: one(authentication, {
		fields: [employeeMemos.employeeId],
		references: [authentication.id],
		relationName: "employeeMemos_employeeId_authentication_id"
	}),
	authenticationAuthorId: one(authentication, {
		fields: [employeeMemos.authorId],
		references: [authentication.id],
		relationName: "employeeMemos_authorId_authentication_id"
	}),
}));

export const employeeNotesRelations = relations(employeeNotes, ({one}) => ({
	authenticationEmployeeId: one(authentication, {
		fields: [employeeNotes.employeeId],
		references: [authentication.id],
		relationName: "employeeNotes_employeeId_authentication_id"
	}),
	authenticationAuthorId: one(authentication, {
		fields: [employeeNotes.authorId],
		references: [authentication.id],
		relationName: "employeeNotes_authorId_authentication_id"
	}),
}));

export const employeeSkillsRelations = relations(employeeSkills, ({one}) => ({
	authentication: one(authentication, {
		fields: [employeeSkills.employeeId],
		references: [authentication.id]
	}),
}));

export const googleCalendarTokensRelations = relations(googleCalendarTokens, ({one}) => ({
	authentication: one(authentication, {
		fields: [googleCalendarTokens.userId],
		references: [authentication.id]
	}),
}));

export const nepotismRelationshipsRelations = relations(nepotismRelationships, ({one}) => ({
	authenticationEmployeeId1: one(authentication, {
		fields: [nepotismRelationships.employeeId1],
		references: [authentication.id],
		relationName: "nepotismRelationships_employeeId1_authentication_id"
	}),
	authenticationEmployeeId2: one(authentication, {
		fields: [nepotismRelationships.employeeId2],
		references: [authentication.id],
		relationName: "nepotismRelationships_employeeId2_authentication_id"
	}),
	authenticationVerifiedBy: one(authentication, {
		fields: [nepotismRelationships.verifiedBy],
		references: [authentication.id],
		relationName: "nepotismRelationships_verifiedBy_authentication_id"
	}),
}));

export const pdsEducationRelations = relations(pdsEducation, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsEducation.employeeId],
		references: [authentication.id]
	}),
}));

export const pdsEligibilityRelations = relations(pdsEligibility, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsEligibility.employeeId],
		references: [authentication.id]
	}),
}));

export const pdsFamilyRelations = relations(pdsFamily, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsFamily.employeeId],
		references: [authentication.id]
	}),
}));

export const pdsLearningDevelopmentRelations = relations(pdsLearningDevelopment, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsLearningDevelopment.employeeId],
		references: [authentication.id]
	}),
}));

export const pdsOtherInfoRelations = relations(pdsOtherInfo, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsOtherInfo.employeeId],
		references: [authentication.id]
	}),
}));

export const pdsReferencesRelations = relations(pdsReferences, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsReferences.employeeId],
		references: [authentication.id]
	}),
}));

export const pdsVoluntaryWorkRelations = relations(pdsVoluntaryWork, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsVoluntaryWork.employeeId],
		references: [authentication.id]
	}),
}));

export const pdsWorkExperienceRelations = relations(pdsWorkExperience, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsWorkExperience.employeeId],
		references: [authentication.id]
	}),
}));

export const performanceAuditLogRelations = relations(performanceAuditLog, ({one}) => ({
	performanceReview: one(performanceReviews, {
		fields: [performanceAuditLog.reviewId],
		references: [performanceReviews.id]
	}),
	authentication: one(authentication, {
		fields: [performanceAuditLog.actorId],
		references: [authentication.id]
	}),
}));

export const performanceReviewsRelations = relations(performanceReviews, ({one, many}) => ({
	performanceAuditLogs: many(performanceAuditLog),
	performanceReviewItems: many(performanceReviewItems),
	performanceReviewCycle: one(performanceReviewCycles, {
		fields: [performanceReviews.reviewCycleId],
		references: [performanceReviewCycles.id]
	}),
	authenticationEmployeeId: one(authentication, {
		fields: [performanceReviews.employeeId],
		references: [authentication.id],
		relationName: "performanceReviews_employeeId_authentication_id"
	}),
	authenticationReviewerId: one(authentication, {
		fields: [performanceReviews.reviewerId],
		references: [authentication.id],
		relationName: "performanceReviews_reviewerId_authentication_id"
	}),
}));

export const performanceGoalsRelations = relations(performanceGoals, ({one}) => ({
	authentication: one(authentication, {
		fields: [performanceGoals.employeeId],
		references: [authentication.id]
	}),
	performanceReviewCycle: one(performanceReviewCycles, {
		fields: [performanceGoals.reviewCycleId],
		references: [performanceReviewCycles.id]
	}),
}));

export const performanceReviewCyclesRelations = relations(performanceReviewCycles, ({one, many}) => ({
	performanceGoals: many(performanceGoals),
	authentication: one(authentication, {
		fields: [performanceReviewCycles.createdBy],
		references: [authentication.id]
	}),
	performanceReviews: many(performanceReviews),
}));

export const performanceImprovementPlansRelations = relations(performanceImprovementPlans, ({one}) => ({
	authenticationEmployeeId: one(authentication, {
		fields: [performanceImprovementPlans.employeeId],
		references: [authentication.id],
		relationName: "performanceImprovementPlans_employeeId_authentication_id"
	}),
	authenticationReviewerId: one(authentication, {
		fields: [performanceImprovementPlans.reviewerId],
		references: [authentication.id],
		relationName: "performanceImprovementPlans_reviewerId_authentication_id"
	}),
}));

export const performanceReviewItemsRelations = relations(performanceReviewItems, ({one}) => ({
	performanceCriterion: one(performanceCriteria, {
		fields: [performanceReviewItems.criteriaId],
		references: [performanceCriteria.id]
	}),
	performanceReview: one(performanceReviews, {
		fields: [performanceReviewItems.reviewId],
		references: [performanceReviews.id]
	}),
}));

export const performanceCriteriaRelations = relations(performanceCriteria, ({many}) => ({
	performanceReviewItems: many(performanceReviewItems),
}));

export const qualificationStandardsRelations = relations(qualificationStandards, ({many}) => ({
	plantillaPositions: many(plantillaPositions),
}));

export const positionPublicationsRelations = relations(positionPublications, ({one}) => ({
	authentication: one(authentication, {
		fields: [positionPublications.createdBy],
		references: [authentication.id]
	}),
}));

export const recruitmentApplicantsRelations = relations(recruitmentApplicants, ({one}) => ({
	authentication: one(authentication, {
		fields: [recruitmentApplicants.interviewerId],
		references: [authentication.id]
	}),
	recruitmentJob: one(recruitmentJobs, {
		fields: [recruitmentApplicants.jobId],
		references: [recruitmentJobs.id]
	}),
}));

export const recruitmentJobsRelations = relations(recruitmentJobs, ({many}) => ({
	recruitmentApplicants: many(recruitmentApplicants),
}));

export const socialConnectionsRelations = relations(socialConnections, ({one}) => ({
	authentication: one(authentication, {
		fields: [socialConnections.userId],
		references: [authentication.id]
	}),
}));

export const stepIncrementTrackerRelations = relations(stepIncrementTracker, ({one}) => ({
	authenticationEmployeeId: one(authentication, {
		fields: [stepIncrementTracker.employeeId],
		references: [authentication.id],
		relationName: "stepIncrementTracker_employeeId_authentication_id"
	}),
	authenticationProcessedBy: one(authentication, {
		fields: [stepIncrementTracker.processedBy],
		references: [authentication.id],
		relationName: "stepIncrementTracker_processedBy_authentication_id"
	}),
}));

export const syncedEventsRelations = relations(syncedEvents, ({one}) => ({
	event: one(events, {
		fields: [syncedEvents.localEventId],
		references: [events.id]
	}),
}));

export const eventsRelations = relations(events, ({many}) => ({
	syncedEvents: many(syncedEvents),
}));

export const schedulesRelations = relations(schedules, ({one}) => ({
	authentication: one(authentication, {
		fields: [schedules.employeeId],
		references: [authentication.employeeId]
	}),
}));

// C# Biometric Tables Relations
export const bioEnrolledUsersRelations = relations(bioEnrolledUsers, ({many}) => ({
	bioAttendanceLogs: many(bioAttendanceLogs),
}));

export const bioAttendanceLogsRelations = relations(bioAttendanceLogs, ({one}) => ({
	bioEnrolledUser: one(bioEnrolledUsers, {
		fields: [bioAttendanceLogs.employeeId],
		references: [bioEnrolledUsers.employeeId]
	}),
}));