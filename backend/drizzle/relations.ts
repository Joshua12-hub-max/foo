import { relations } from "drizzle-orm/relations";
import { authentication, auditLogs, departments, plantillaPositions, chatConversations, chatMessages, employeeCustomFields, employeeDocuments, employeeEducation, employeeEmergencyContacts, employeeEmploymentHistory, employeeMemos, employeeNotes, employeeSkills, googleCalendarTokens, pdsDeclarations, pdsEducation, pdsEligibility, pdsFamily, pdsHrDetails, pdsLearningDevelopment, pdsOtherInfo, pdsPersonalInformation, pdsReferences, pdsVoluntaryWork, pdsWorkExperience, performanceAuditLog, performanceReviews, performanceReviewCycles, performanceGoals, performanceImprovementPlans, performanceCriteria, performanceReviewItems, qualificationStandards, recruitmentApplicants, recruitmentJobs, socialConnections, stepIncrementTracker, events, syncedEvents } from "./schema.js";

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	authentication: one(authentication, {
		fields: [auditLogs.userId],
		references: [authentication.id]
	}),
}));

export const authenticationRelations = relations(authentication, ({one, many}) => ({
	auditLogs: many(auditLogs),
	department: one(departments, {
		fields: [authentication.departmentId],
		references: [departments.id]
	}),
	plantillaPosition: one(plantillaPositions, {
		fields: [authentication.positionId],
		references: [plantillaPositions.id]
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
	employeeDocuments_employeeId: many(employeeDocuments, {
		relationName: "employeeDocuments_employeeId_authentication_id"
	}),
	employeeDocuments_uploadedBy: many(employeeDocuments, {
		relationName: "employeeDocuments_uploadedBy_authentication_id"
	}),
	employeeEducations: many(employeeEducation),
	employeeEmergencyContacts: many(employeeEmergencyContacts),
	employeeEmploymentHistories: many(employeeEmploymentHistory),
	employeeMemos_authorId: many(employeeMemos, {
		relationName: "employeeMemos_authorId_authentication_id"
	}),
	employeeMemos_employeeId: many(employeeMemos, {
		relationName: "employeeMemos_employeeId_authentication_id"
	}),
	employeeNotes_authorId: many(employeeNotes, {
		relationName: "employeeNotes_authorId_authentication_id"
	}),
	employeeNotes_employeeId: many(employeeNotes, {
		relationName: "employeeNotes_employeeId_authentication_id"
	}),
	employeeSkills: many(employeeSkills),
	googleCalendarTokens: many(googleCalendarTokens),
	pdsDeclarations: many(pdsDeclarations),
	pdsEducations: many(pdsEducation),
	pdsEligibilities: many(pdsEligibility),
	pdsFamilies: many(pdsFamily),
	pdsHrDetails_employeeId: many(pdsHrDetails, {
		relationName: "pdsHrDetails_employeeId_authentication_id"
	}),
	pdsHrDetails_managerId: many(pdsHrDetails, {
		relationName: "pdsHrDetails_managerId_authentication_id"
	}),
	pdsLearningDevelopments: many(pdsLearningDevelopment),
	pdsOtherInfos: many(pdsOtherInfo),
	pdsPersonalInformations: many(pdsPersonalInformation),
	pdsReferences: many(pdsReferences),
	pdsVoluntaryWorks: many(pdsVoluntaryWork),
	pdsWorkExperiences: many(pdsWorkExperience),
	performanceAuditLogs: many(performanceAuditLog),
	performanceGoals: many(performanceGoals),
	performanceImprovementPlans_employeeId: many(performanceImprovementPlans, {
		relationName: "performanceImprovementPlans_employeeId_authentication_id"
	}),
	performanceImprovementPlans_reviewerId: many(performanceImprovementPlans, {
		relationName: "performanceImprovementPlans_reviewerId_authentication_id"
	}),
	performanceReviewCycles: many(performanceReviewCycles),
	performanceReviews_employeeId: many(performanceReviews, {
		relationName: "performanceReviews_employeeId_authentication_id"
	}),
	performanceReviews_reviewerId: many(performanceReviews, {
		relationName: "performanceReviews_reviewerId_authentication_id"
	}),
	recruitmentApplicants: many(recruitmentApplicants),
	socialConnections: many(socialConnections),
	stepIncrementTrackers_employeeId: many(stepIncrementTracker, {
		relationName: "stepIncrementTracker_employeeId_authentication_id"
	}),
	stepIncrementTrackers_processedBy: many(stepIncrementTracker, {
		relationName: "stepIncrementTracker_processedBy_authentication_id"
	}),
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
	pdsHrDetails: many(pdsHrDetails),
	plantillaPositions: many(plantillaPositions),
}));

export const plantillaPositionsRelations = relations(plantillaPositions, ({one, many}) => ({
	authentications: many(authentication),
	pdsHrDetails: many(pdsHrDetails),
	qualificationStandard: one(qualificationStandards, {
		fields: [plantillaPositions.qualificationStandardsId],
		references: [qualificationStandards.id]
	}),
	department: one(departments, {
		fields: [plantillaPositions.departmentId],
		references: [departments.id]
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
	authentication_employeeId: one(authentication, {
		fields: [employeeDocuments.employeeId],
		references: [authentication.id],
		relationName: "employeeDocuments_employeeId_authentication_id"
	}),
	authentication_uploadedBy: one(authentication, {
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
	authentication_authorId: one(authentication, {
		fields: [employeeMemos.authorId],
		references: [authentication.id],
		relationName: "employeeMemos_authorId_authentication_id"
	}),
	authentication_employeeId: one(authentication, {
		fields: [employeeMemos.employeeId],
		references: [authentication.id],
		relationName: "employeeMemos_employeeId_authentication_id"
	}),
}));

export const employeeNotesRelations = relations(employeeNotes, ({one}) => ({
	authentication_authorId: one(authentication, {
		fields: [employeeNotes.authorId],
		references: [authentication.id],
		relationName: "employeeNotes_authorId_authentication_id"
	}),
	authentication_employeeId: one(authentication, {
		fields: [employeeNotes.employeeId],
		references: [authentication.id],
		relationName: "employeeNotes_employeeId_authentication_id"
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

export const pdsDeclarationsRelations = relations(pdsDeclarations, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsDeclarations.employeeId],
		references: [authentication.id]
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

export const pdsHrDetailsRelations = relations(pdsHrDetails, ({one}) => ({
	department: one(departments, {
		fields: [pdsHrDetails.departmentId],
		references: [departments.id]
	}),
	authentication_employeeId: one(authentication, {
		fields: [pdsHrDetails.employeeId],
		references: [authentication.id],
		relationName: "pdsHrDetails_employeeId_authentication_id"
	}),
	authentication_managerId: one(authentication, {
		fields: [pdsHrDetails.managerId],
		references: [authentication.id],
		relationName: "pdsHrDetails_managerId_authentication_id"
	}),
	plantillaPosition: one(plantillaPositions, {
		fields: [pdsHrDetails.positionId],
		references: [plantillaPositions.id]
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

export const pdsPersonalInformationRelations = relations(pdsPersonalInformation, ({one}) => ({
	authentication: one(authentication, {
		fields: [pdsPersonalInformation.employeeId],
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
	authentication: one(authentication, {
		fields: [performanceAuditLog.actorId],
		references: [authentication.id]
	}),
	performanceReview: one(performanceReviews, {
		fields: [performanceAuditLog.reviewId],
		references: [performanceReviews.id]
	}),
}));

export const performanceReviewsRelations = relations(performanceReviews, ({one, many}) => ({
	performanceAuditLogs: many(performanceAuditLog),
	performanceReviewItems: many(performanceReviewItems),
	authentication_employeeId: one(authentication, {
		fields: [performanceReviews.employeeId],
		references: [authentication.id],
		relationName: "performanceReviews_employeeId_authentication_id"
	}),
	authentication_reviewerId: one(authentication, {
		fields: [performanceReviews.reviewerId],
		references: [authentication.id],
		relationName: "performanceReviews_reviewerId_authentication_id"
	}),
}));

export const performanceGoalsRelations = relations(performanceGoals, ({one}) => ({
	performanceReviewCycle: one(performanceReviewCycles, {
		fields: [performanceGoals.reviewCycleId],
		references: [performanceReviewCycles.id]
	}),
	authentication: one(authentication, {
		fields: [performanceGoals.employeeId],
		references: [authentication.id]
	}),
}));

export const performanceReviewCyclesRelations = relations(performanceReviewCycles, ({one, many}) => ({
	performanceGoals: many(performanceGoals),
	authentication: one(authentication, {
		fields: [performanceReviewCycles.createdBy],
		references: [authentication.id]
	}),
}));

export const performanceImprovementPlansRelations = relations(performanceImprovementPlans, ({one}) => ({
	authentication_employeeId: one(authentication, {
		fields: [performanceImprovementPlans.employeeId],
		references: [authentication.id],
		relationName: "performanceImprovementPlans_employeeId_authentication_id"
	}),
	authentication_reviewerId: one(authentication, {
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
	authentication_employeeId: one(authentication, {
		fields: [stepIncrementTracker.employeeId],
		references: [authentication.id],
		relationName: "stepIncrementTracker_employeeId_authentication_id"
	}),
	authentication_processedBy: one(authentication, {
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
