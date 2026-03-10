"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bioAttendanceLogsRelations = exports.bioEnrolledUsersRelations = exports.schedulesRelations = exports.eventsRelations = exports.syncedEventsRelations = exports.stepIncrementTrackerRelations = exports.socialConnectionsRelations = exports.recruitmentJobsRelations = exports.recruitmentApplicantsRelations = exports.positionPublicationsRelations = exports.qualificationStandardsRelations = exports.performanceCriteriaRelations = exports.performanceReviewItemsRelations = exports.performanceImprovementPlansRelations = exports.performanceReviewCyclesRelations = exports.performanceGoalsRelations = exports.performanceReviewsRelations = exports.performanceAuditLogRelations = exports.pdsWorkExperienceRelations = exports.pdsVoluntaryWorkRelations = exports.pdsReferencesRelations = exports.pdsOtherInfoRelations = exports.pdsLearningDevelopmentRelations = exports.pdsFamilyRelations = exports.pdsEligibilityRelations = exports.pdsEducationRelations = exports.nepotismRelationshipsRelations = exports.googleCalendarTokensRelations = exports.employeeSkillsRelations = exports.employeeNotesRelations = exports.employeeMemosRelations = exports.employeeEmploymentHistoryRelations = exports.employeeEmergencyContactsRelations = exports.employeeEducationRelations = exports.employeeDocumentsRelations = exports.employeeCustomFieldsRelations = exports.chatConversationsRelations = exports.chatMessagesRelations = exports.plantillaPositionsRelations = exports.departmentsRelations = exports.authenticationRelations = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var auth_js_1 = require("./tables/auth.js");
var hr_js_1 = require("./tables/hr.js");
var plantilla_js_1 = require("./tables/plantilla.js");
var recruitment_js_1 = require("./tables/recruitment.js");
var pds_js_1 = require("./tables/pds.js");
var performance_js_1 = require("./tables/performance.js");
var payroll_js_1 = require("./tables/payroll.js");
var common_js_1 = require("./tables/common.js");
var attendance_js_1 = require("./tables/attendance.js");
exports.authenticationRelations = (0, drizzle_orm_1.relations)(auth_js_1.authentication, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        department: one(hr_js_1.departments, {
            fields: [auth_js_1.authentication.departmentId],
            references: [hr_js_1.departments.id]
        }),
        plantillaPosition: one(plantilla_js_1.plantillaPositions, {
            fields: [auth_js_1.authentication.positionId],
            references: [plantilla_js_1.plantillaPositions.id],
            relationName: "authentication_positionId_plantillaPositions_id"
        }),
        authentication: one(auth_js_1.authentication, {
            fields: [auth_js_1.authentication.managerId],
            references: [auth_js_1.authentication.id],
            relationName: "authentication_managerId_authentication_id"
        }),
        authentications: many(auth_js_1.authentication, {
            relationName: "authentication_managerId_authentication_id"
        }),
        employeeCustomFields: many(pds_js_1.employeeCustomFields),
        employeeDocumentsEmployeeId: many(pds_js_1.employeeDocuments, {
            relationName: "employeeDocuments_employeeId_authentication_id"
        }),
        employeeDocumentsUploadedBy: many(pds_js_1.employeeDocuments, {
            relationName: "employeeDocuments_uploadedBy_authentication_id"
        }),
        employeeEducations: many(pds_js_1.employeeEducation),
        employeeEmergencyContacts: many(pds_js_1.employeeEmergencyContacts),
        employeeEmploymentHistories: many(pds_js_1.employeeEmploymentHistory),
        employeeMemosEmployeeId: many(pds_js_1.employeeMemos, {
            relationName: "employeeMemos_employeeId_authentication_id"
        }),
        employeeMemosAuthorId: many(pds_js_1.employeeMemos, {
            relationName: "employeeMemos_authorId_authentication_id"
        }),
        employeeNotesEmployeeId: many(pds_js_1.employeeNotes, {
            relationName: "employeeNotes_employeeId_authentication_id"
        }),
        employeeNotesAuthorId: many(pds_js_1.employeeNotes, {
            relationName: "employeeNotes_authorId_authentication_id"
        }),
        employeeSkills: many(pds_js_1.employeeSkills),
        googleCalendarTokens: many(auth_js_1.googleCalendarTokens),
        nepotismRelationshipsEmployeeId1: many(hr_js_1.nepotismRelationships, {
            relationName: "nepotismRelationships_employeeId1_authentication_id"
        }),
        nepotismRelationshipsEmployeeId2: many(hr_js_1.nepotismRelationships, {
            relationName: "nepotismRelationships_employeeId2_authentication_id"
        }),
        nepotismRelationshipsVerifiedBy: many(hr_js_1.nepotismRelationships, {
            relationName: "nepotismRelationships_verifiedBy_authentication_id"
        }),
        pdsEducations: many(pds_js_1.pdsEducation),
        pdsEligibilities: many(pds_js_1.pdsEligibility),
        pdsFamilies: many(pds_js_1.pdsFamily),
        pdsLearningDevelopments: many(pds_js_1.pdsLearningDevelopment),
        pdsOtherInfos: many(pds_js_1.pdsOtherInfo),
        pdsReferences: many(pds_js_1.pdsReferences),
        pdsVoluntaryWorks: many(pds_js_1.pdsVoluntaryWork),
        pdsWorkExperiences: many(pds_js_1.pdsWorkExperience),
        performanceAuditLogs: many(performance_js_1.performanceAuditLog),
        performanceGoals: many(performance_js_1.performanceGoals),
        performanceImprovementPlansEmployeeId: many(performance_js_1.performanceImprovementPlans, {
            relationName: "performanceImprovementPlans_employeeId_authentication_id"
        }),
        performanceImprovementPlansReviewerId: many(performance_js_1.performanceImprovementPlans, {
            relationName: "performanceImprovementPlans_reviewerId_authentication_id"
        }),
        performanceReviewCycles: many(performance_js_1.performanceReviewCycles),
        performanceReviewsEmployeeId: many(performance_js_1.performanceReviews, {
            relationName: "performanceReviews_employeeId_authentication_id"
        }),
        performanceReviewsReviewerId: many(performance_js_1.performanceReviews, {
            relationName: "performanceReviews_reviewerId_authentication_id"
        }),
        plantillaPositions: many(plantilla_js_1.plantillaPositions, {
            relationName: "plantillaPositions_incumbentId_authentication_id"
        }),
        positionPublications: many(plantilla_js_1.positionPublications),
        recruitmentApplicants: many(recruitment_js_1.recruitmentApplicants),
        socialConnections: many(auth_js_1.socialConnections),
        stepIncrementTrackersEmployeeId: many(payroll_js_1.stepIncrementTracker, {
            relationName: "stepIncrementTracker_employeeId_authentication_id"
        }),
        stepIncrementTrackersProcessedBy: many(payroll_js_1.stepIncrementTracker, {
            relationName: "stepIncrementTracker_processedBy_authentication_id"
        }),
        schedules: many(attendance_js_1.schedules),
    });
});
exports.departmentsRelations = (0, drizzle_orm_1.relations)(hr_js_1.departments, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        authentications: many(auth_js_1.authentication),
        department: one(hr_js_1.departments, {
            fields: [hr_js_1.departments.parentDepartmentId],
            references: [hr_js_1.departments.id],
            relationName: "departments_parentDepartmentId_departments_id"
        }),
        departments: many(hr_js_1.departments, {
            relationName: "departments_parentDepartmentId_departments_id"
        }),
        plantillaPositions: many(plantilla_js_1.plantillaPositions),
    });
});
exports.plantillaPositionsRelations = (0, drizzle_orm_1.relations)(plantilla_js_1.plantillaPositions, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        authentications: many(auth_js_1.authentication, {
            relationName: "authentication_positionId_plantillaPositions_id"
        }),
        department: one(hr_js_1.departments, {
            fields: [plantilla_js_1.plantillaPositions.departmentId],
            references: [hr_js_1.departments.id]
        }),
        authentication: one(auth_js_1.authentication, {
            fields: [plantilla_js_1.plantillaPositions.incumbentId],
            references: [auth_js_1.authentication.id],
            relationName: "plantillaPositions_incumbentId_authentication_id"
        }),
        qualificationStandard: one(plantilla_js_1.qualificationStandards, {
            fields: [plantilla_js_1.plantillaPositions.qualificationStandardsId],
            references: [plantilla_js_1.qualificationStandards.id]
        }),
    });
});
exports.chatMessagesRelations = (0, drizzle_orm_1.relations)(recruitment_js_1.chatMessages, function (_a) {
    var one = _a.one;
    return ({
        chatConversation: one(recruitment_js_1.chatConversations, {
            fields: [recruitment_js_1.chatMessages.conversationId],
            references: [recruitment_js_1.chatConversations.id]
        }),
    });
});
exports.chatConversationsRelations = (0, drizzle_orm_1.relations)(recruitment_js_1.chatConversations, function (_a) {
    var many = _a.many;
    return ({
        chatMessages: many(recruitment_js_1.chatMessages),
    });
});
exports.employeeCustomFieldsRelations = (0, drizzle_orm_1.relations)(pds_js_1.employeeCustomFields, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeCustomFields.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.employeeDocumentsRelations = (0, drizzle_orm_1.relations)(pds_js_1.employeeDocuments, function (_a) {
    var one = _a.one;
    return ({
        authenticationEmployeeId: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeDocuments.employeeId],
            references: [auth_js_1.authentication.id],
            relationName: "employeeDocuments_employeeId_authentication_id"
        }),
        authenticationUploadedBy: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeDocuments.uploadedBy],
            references: [auth_js_1.authentication.id],
            relationName: "employeeDocuments_uploadedBy_authentication_id"
        }),
    });
});
exports.employeeEducationRelations = (0, drizzle_orm_1.relations)(pds_js_1.employeeEducation, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeEducation.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.employeeEmergencyContactsRelations = (0, drizzle_orm_1.relations)(pds_js_1.employeeEmergencyContacts, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeEmergencyContacts.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.employeeEmploymentHistoryRelations = (0, drizzle_orm_1.relations)(pds_js_1.employeeEmploymentHistory, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeEmploymentHistory.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.employeeMemosRelations = (0, drizzle_orm_1.relations)(pds_js_1.employeeMemos, function (_a) {
    var one = _a.one;
    return ({
        authenticationEmployeeId: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeMemos.employeeId],
            references: [auth_js_1.authentication.id],
            relationName: "employeeMemos_employeeId_authentication_id"
        }),
        authenticationAuthorId: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeMemos.authorId],
            references: [auth_js_1.authentication.id],
            relationName: "employeeMemos_authorId_authentication_id"
        }),
    });
});
exports.employeeNotesRelations = (0, drizzle_orm_1.relations)(pds_js_1.employeeNotes, function (_a) {
    var one = _a.one;
    return ({
        authenticationEmployeeId: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeNotes.employeeId],
            references: [auth_js_1.authentication.id],
            relationName: "employeeNotes_employeeId_authentication_id"
        }),
        authenticationAuthorId: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeNotes.authorId],
            references: [auth_js_1.authentication.id],
            relationName: "employeeNotes_authorId_authentication_id"
        }),
    });
});
exports.employeeSkillsRelations = (0, drizzle_orm_1.relations)(pds_js_1.employeeSkills, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.employeeSkills.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.googleCalendarTokensRelations = (0, drizzle_orm_1.relations)(auth_js_1.googleCalendarTokens, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [auth_js_1.googleCalendarTokens.userId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.nepotismRelationshipsRelations = (0, drizzle_orm_1.relations)(hr_js_1.nepotismRelationships, function (_a) {
    var one = _a.one;
    return ({
        authenticationEmployeeId1: one(auth_js_1.authentication, {
            fields: [hr_js_1.nepotismRelationships.employeeId1],
            references: [auth_js_1.authentication.id],
            relationName: "nepotismRelationships_employeeId1_authentication_id"
        }),
        authenticationEmployeeId2: one(auth_js_1.authentication, {
            fields: [hr_js_1.nepotismRelationships.employeeId2],
            references: [auth_js_1.authentication.id],
            relationName: "nepotismRelationships_employeeId2_authentication_id"
        }),
        authenticationVerifiedBy: one(auth_js_1.authentication, {
            fields: [hr_js_1.nepotismRelationships.verifiedBy],
            references: [auth_js_1.authentication.id],
            relationName: "nepotismRelationships_verifiedBy_authentication_id"
        }),
    });
});
exports.pdsEducationRelations = (0, drizzle_orm_1.relations)(pds_js_1.pdsEducation, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.pdsEducation.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.pdsEligibilityRelations = (0, drizzle_orm_1.relations)(pds_js_1.pdsEligibility, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.pdsEligibility.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.pdsFamilyRelations = (0, drizzle_orm_1.relations)(pds_js_1.pdsFamily, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.pdsFamily.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.pdsLearningDevelopmentRelations = (0, drizzle_orm_1.relations)(pds_js_1.pdsLearningDevelopment, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.pdsLearningDevelopment.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.pdsOtherInfoRelations = (0, drizzle_orm_1.relations)(pds_js_1.pdsOtherInfo, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.pdsOtherInfo.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.pdsReferencesRelations = (0, drizzle_orm_1.relations)(pds_js_1.pdsReferences, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.pdsReferences.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.pdsVoluntaryWorkRelations = (0, drizzle_orm_1.relations)(pds_js_1.pdsVoluntaryWork, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.pdsVoluntaryWork.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.pdsWorkExperienceRelations = (0, drizzle_orm_1.relations)(pds_js_1.pdsWorkExperience, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [pds_js_1.pdsWorkExperience.employeeId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.performanceAuditLogRelations = (0, drizzle_orm_1.relations)(performance_js_1.performanceAuditLog, function (_a) {
    var one = _a.one;
    return ({
        performanceReview: one(performance_js_1.performanceReviews, {
            fields: [performance_js_1.performanceAuditLog.reviewId],
            references: [performance_js_1.performanceReviews.id]
        }),
        authentication: one(auth_js_1.authentication, {
            fields: [performance_js_1.performanceAuditLog.actorId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.performanceReviewsRelations = (0, drizzle_orm_1.relations)(performance_js_1.performanceReviews, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        performanceAuditLogs: many(performance_js_1.performanceAuditLog),
        performanceReviewItems: many(performance_js_1.performanceReviewItems),
        performanceReviewCycle: one(performance_js_1.performanceReviewCycles, {
            fields: [performance_js_1.performanceReviews.reviewCycleId],
            references: [performance_js_1.performanceReviewCycles.id]
        }),
        authenticationEmployeeId: one(auth_js_1.authentication, {
            fields: [performance_js_1.performanceReviews.employeeId],
            references: [auth_js_1.authentication.id],
            relationName: "performanceReviews_employeeId_authentication_id"
        }),
        authenticationReviewerId: one(auth_js_1.authentication, {
            fields: [performance_js_1.performanceReviews.reviewerId],
            references: [auth_js_1.authentication.id],
            relationName: "performanceReviews_reviewerId_authentication_id"
        }),
    });
});
exports.performanceGoalsRelations = (0, drizzle_orm_1.relations)(performance_js_1.performanceGoals, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [performance_js_1.performanceGoals.employeeId],
            references: [auth_js_1.authentication.id]
        }),
        performanceReviewCycle: one(performance_js_1.performanceReviewCycles, {
            fields: [performance_js_1.performanceGoals.reviewCycleId],
            references: [performance_js_1.performanceReviewCycles.id]
        }),
    });
});
exports.performanceReviewCyclesRelations = (0, drizzle_orm_1.relations)(performance_js_1.performanceReviewCycles, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        performanceGoals: many(performance_js_1.performanceGoals),
        authentication: one(auth_js_1.authentication, {
            fields: [performance_js_1.performanceReviewCycles.createdBy],
            references: [auth_js_1.authentication.id]
        }),
        performanceReviews: many(performance_js_1.performanceReviews),
    });
});
exports.performanceImprovementPlansRelations = (0, drizzle_orm_1.relations)(performance_js_1.performanceImprovementPlans, function (_a) {
    var one = _a.one;
    return ({
        authenticationEmployeeId: one(auth_js_1.authentication, {
            fields: [performance_js_1.performanceImprovementPlans.employeeId],
            references: [auth_js_1.authentication.id],
            relationName: "performanceImprovementPlans_employeeId_authentication_id"
        }),
        authenticationReviewerId: one(auth_js_1.authentication, {
            fields: [performance_js_1.performanceImprovementPlans.reviewerId],
            references: [auth_js_1.authentication.id],
            relationName: "performanceImprovementPlans_reviewerId_authentication_id"
        }),
    });
});
exports.performanceReviewItemsRelations = (0, drizzle_orm_1.relations)(performance_js_1.performanceReviewItems, function (_a) {
    var one = _a.one;
    return ({
        performanceCriterion: one(performance_js_1.performanceCriteria, {
            fields: [performance_js_1.performanceReviewItems.criteriaId],
            references: [performance_js_1.performanceCriteria.id]
        }),
        performanceReview: one(performance_js_1.performanceReviews, {
            fields: [performance_js_1.performanceReviewItems.reviewId],
            references: [performance_js_1.performanceReviews.id]
        }),
    });
});
exports.performanceCriteriaRelations = (0, drizzle_orm_1.relations)(performance_js_1.performanceCriteria, function (_a) {
    var many = _a.many;
    return ({
        performanceReviewItems: many(performance_js_1.performanceReviewItems),
    });
});
exports.qualificationStandardsRelations = (0, drizzle_orm_1.relations)(plantilla_js_1.qualificationStandards, function (_a) {
    var many = _a.many;
    return ({
        plantillaPositions: many(plantilla_js_1.plantillaPositions),
    });
});
exports.positionPublicationsRelations = (0, drizzle_orm_1.relations)(plantilla_js_1.positionPublications, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [plantilla_js_1.positionPublications.createdBy],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.recruitmentApplicantsRelations = (0, drizzle_orm_1.relations)(recruitment_js_1.recruitmentApplicants, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [recruitment_js_1.recruitmentApplicants.interviewerId],
            references: [auth_js_1.authentication.id]
        }),
        recruitmentJob: one(recruitment_js_1.recruitmentJobs, {
            fields: [recruitment_js_1.recruitmentApplicants.jobId],
            references: [recruitment_js_1.recruitmentJobs.id]
        }),
    });
});
exports.recruitmentJobsRelations = (0, drizzle_orm_1.relations)(recruitment_js_1.recruitmentJobs, function (_a) {
    var many = _a.many;
    return ({
        recruitmentApplicants: many(recruitment_js_1.recruitmentApplicants),
    });
});
exports.socialConnectionsRelations = (0, drizzle_orm_1.relations)(auth_js_1.socialConnections, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [auth_js_1.socialConnections.userId],
            references: [auth_js_1.authentication.id]
        }),
    });
});
exports.stepIncrementTrackerRelations = (0, drizzle_orm_1.relations)(payroll_js_1.stepIncrementTracker, function (_a) {
    var one = _a.one;
    return ({
        authenticationEmployeeId: one(auth_js_1.authentication, {
            fields: [payroll_js_1.stepIncrementTracker.employeeId],
            references: [auth_js_1.authentication.id],
            relationName: "stepIncrementTracker_employeeId_authentication_id"
        }),
        authenticationProcessedBy: one(auth_js_1.authentication, {
            fields: [payroll_js_1.stepIncrementTracker.processedBy],
            references: [auth_js_1.authentication.id],
            relationName: "stepIncrementTracker_processedBy_authentication_id"
        }),
    });
});
exports.syncedEventsRelations = (0, drizzle_orm_1.relations)(common_js_1.syncedEvents, function (_a) {
    var one = _a.one;
    return ({
        event: one(common_js_1.events, {
            fields: [common_js_1.syncedEvents.localEventId],
            references: [common_js_1.events.id]
        }),
    });
});
exports.eventsRelations = (0, drizzle_orm_1.relations)(common_js_1.events, function (_a) {
    var many = _a.many;
    return ({
        syncedEvents: many(common_js_1.syncedEvents),
    });
});
exports.schedulesRelations = (0, drizzle_orm_1.relations)(attendance_js_1.schedules, function (_a) {
    var one = _a.one;
    return ({
        authentication: one(auth_js_1.authentication, {
            fields: [attendance_js_1.schedules.employeeId],
            references: [auth_js_1.authentication.employeeId]
        }),
    });
});
// C# Biometric Tables Relations
exports.bioEnrolledUsersRelations = (0, drizzle_orm_1.relations)(attendance_js_1.bioEnrolledUsers, function (_a) {
    var many = _a.many;
    return ({
        bioAttendanceLogs: many(attendance_js_1.bioAttendanceLogs),
    });
});
exports.bioAttendanceLogsRelations = (0, drizzle_orm_1.relations)(attendance_js_1.bioAttendanceLogs, function (_a) {
    var one = _a.one;
    return ({
        bioEnrolledUser: one(attendance_js_1.bioEnrolledUsers, {
            fields: [attendance_js_1.bioAttendanceLogs.employeeId],
            references: [attendance_js_1.bioEnrolledUsers.employeeId]
        }),
    });
});
