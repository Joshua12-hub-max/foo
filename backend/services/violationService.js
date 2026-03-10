"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPolicyViolations = void 0;
var index_js_1 = require("../db/index.js");
var schema_js_1 = require("../db/schema.js");
var drizzle_orm_1 = require("drizzle-orm");
var crypto_1 = require("crypto");
/**
 * Generates a unique memo number (Internal helper)
 */
var generateInternalMemoNumber = function (tx) { return __awaiter(void 0, void 0, void 0, function () {
    var year, existing, nextNumber;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                year = new Date().getFullYear();
                return [4 /*yield*/, tx.select().from(schema_js_1.memoSequences).where((0, drizzle_orm_1.eq)(schema_js_1.memoSequences.year, year))];
            case 1:
                existing = _a.sent();
                if (!(existing.length === 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, tx.insert(schema_js_1.memoSequences).values({ year: year, lastNumber: 1 })];
            case 2:
                _a.sent();
                nextNumber = 1;
                return [3 /*break*/, 5];
            case 3:
                nextNumber = existing[0].lastNumber + 1;
                return [4 /*yield*/, tx.update(schema_js_1.memoSequences).set({ lastNumber: nextNumber }).where((0, drizzle_orm_1.eq)(schema_js_1.memoSequences.year, year))];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [2 /*return*/, "MEMO-".concat(year, "-").concat(String(nextNumber).padStart(4, '0'))];
        }
    });
}); };
var getOrdinalSuffix = function (i) {
    var j = i % 10, k = i % 100;
    if (j == 1 && k != 11)
        return "st";
    if (j == 2 && k != 12)
        return "nd";
    if (j == 3 && k != 13)
        return "rd";
    return "th";
};
var CSCViolationTracker = /** @class */ (function () {
    function CSCViolationTracker() {
    }
    CSCViolationTracker.prototype.identifyOffenses = function (employeeId) {
        return __awaiter(this, void 0, void 0, function () {
            var summaries, monthlyData, offenses, tardyMonths, absenteeMonths, undertimeMonths, classification;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, index_js_1.db.select({
                            year: schema_js_1.tardinessSummary.year,
                            month: schema_js_1.tardinessSummary.month,
                            lateCount: schema_js_1.tardinessSummary.totalLateCount,
                            undertimeCount: schema_js_1.tardinessSummary.totalUndertimeCount,
                            absenceCount: schema_js_1.tardinessSummary.totalAbsenceCount
                        }).from(schema_js_1.tardinessSummary)
                            .where((0, drizzle_orm_1.eq)(schema_js_1.tardinessSummary.employeeId, employeeId))
                            .orderBy((0, drizzle_orm_1.asc)(schema_js_1.tardinessSummary.year), (0, drizzle_orm_1.asc)(schema_js_1.tardinessSummary.month))];
                    case 1:
                        summaries = _a.sent();
                        monthlyData = summaries.map(function (s) { return ({
                            yearMonth: "".concat(s.year, "-").concat(String(s.month).padStart(2, '0')),
                            lateCount: s.lateCount || 0,
                            unauthorizedAbsences: s.absenceCount || 0,
                            undertimeCount: s.undertimeCount || 0,
                            semester: s.month <= 6 ? 1 : 2
                        }); });
                        offenses = [];
                        tardyMonths = monthlyData.filter(function (m) { return m.lateCount >= 10; });
                        offenses.push.apply(offenses, this.buildOffenseSequence(tardyMonths, {
                            violationType: 'habitualTardiness',
                            minMonthsPerOffense: 2,
                            pattern: 'consecutiveOrSemester'
                        }));
                        absenteeMonths = monthlyData.filter(function (m) { return m.unauthorizedAbsences > 2.5; });
                        offenses.push.apply(offenses, this.buildOffenseSequence(absenteeMonths, {
                            violationType: 'absence',
                            minMonthsPerOffense: 3,
                            pattern: 'consecutiveOrSemester'
                        }));
                        undertimeMonths = monthlyData.filter(function (m) { return m.undertimeCount >= 10; });
                        classification = 'Simple Misconduct';
                        offenses.push.apply(offenses, this.buildOffenseSequence(undertimeMonths, {
                            violationType: 'habitualUndertime',
                            classification: classification,
                            minMonthsPerOffense: 2,
                            pattern: 'consecutiveOrSemester'
                        }));
                        return [2 /*return*/, offenses];
                }
            });
        });
    };
    CSCViolationTracker.prototype.isConsecutiveMonth = function (prevYM, currYM) {
        var _a = prevYM.split('-').map(Number), y1 = _a[0], m1 = _a[1];
        var _b = currYM.split('-').map(Number), y2 = _b[0], m2 = _b[1];
        if (y1 === y2)
            return m2 - m1 === 1;
        if (y2 - y1 === 1)
            return m1 === 12 && m2 === 1;
        return false;
    };
    CSCViolationTracker.prototype.buildOffenseSequence = function (violatingMonths, config) {
        if (violatingMonths.length < config.minMonthsPerOffense)
            return [];
        var offenses = [];
        var currentOffense = [];
        var offenseCounter = 1;
        for (var i = 0; i < violatingMonths.length; i++) {
            var current = violatingMonths[i];
            var prev = currentOffense[currentOffense.length - 1];
            var isConsecutive = prev && this.isConsecutiveMonth(prev.yearMonth, current.yearMonth);
            var prevYear = prev ? prev.yearMonth.substring(0, 4) : null;
            var currYear = current.yearMonth.substring(0, 4);
            var isSameSemester = prev && prevYear === currYear && prev.semester === current.semester;
            if (!prev || isConsecutive || (config.pattern === 'consecutiveOrSemester' && isSameSemester)) {
                currentOffense.push(current);
            }
            else {
                if (currentOffense.length >= config.minMonthsPerOffense) {
                    offenses.push(this.createOffenseRecord(currentOffense, offenseCounter++, config));
                }
                currentOffense = [current];
            }
            if (currentOffense.length === config.minMonthsPerOffense) {
                offenses.push(this.createOffenseRecord(currentOffense, offenseCounter++, config));
                currentOffense = [];
            }
        }
        return offenses;
    };
    CSCViolationTracker.prototype.createOffenseRecord = function (months, offenseNumber, config) {
        var triggeredMonths = months.map(function (m) { return m.yearMonth; });
        var fingerprint = crypto_1.default
            .createHash('sha256')
            .update("".concat(config.violationType, "-").concat(triggeredMonths.sort().join(','), "-").concat(offenseNumber))
            .digest('hex');
        return {
            offenseNumber: Math.min(offenseNumber, 3),
            violationType: config.violationType,
            classification: config.classification,
            triggeredMonths: triggeredMonths,
            totalIncidents: months.reduce(function (sum, m) { return sum + (config.violationType === 'habitualTardiness' ? m.lateCount : (config.violationType === 'absence' ? m.unauthorizedAbsences : m.undertimeCount)); }, 0),
            fingerprint: fingerprint
        };
    };
    return CSCViolationTracker;
}());
var penaltyMatrix = {
    'habitualTardiness': {
        regular: [
            { penalty: 'Reprimand (Stern Warning)', memoType: 'Reprimand', severity: 'minor' },
            { penalty: 'Suspension of one (1) to thirty (30) days', memoType: 'Suspension Notice', severity: 'major' },
            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
        ],
        joCos: [
            { penalty: 'Warning', memoType: 'Written Warning', severity: 'minor' },
            { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
        ]
    },
    'absence': {
        regular: [
            { penalty: 'Suspension of six (6) months and one (1) day', memoType: 'Suspension Notice', severity: 'grave' },
            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' },
            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
        ],
        joCos: [
            { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' },
            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
        ]
    },
    'habitual_undertime-Simple Misconduct': {
        regular: [
            { penalty: 'Reprimand (Stern Warning)', memoType: 'Reprimand', severity: 'minor' },
            { penalty: 'Suspension of one (1) to thirty (30) days', memoType: 'Suspension Notice', severity: 'major' },
            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
        ],
        joCos: [{ penalty: 'Warning', memoType: 'Written Warning', severity: 'minor' },
            { penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
        ]
    },
    'habitual_undertime-Prejudicial to Service': {
        regular: [
            { penalty: 'Suspension of six (6) months and one (1) day to one (1) year', memoType: 'Suspension Notice', severity: 'grave' },
            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' },
            { penalty: 'Dismissal from the Service', memoType: 'Termination Notice', severity: 'terminal' }
        ],
        joCos: [{ penalty: 'Reprimand', memoType: 'Reprimand', severity: 'moderate' },
            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' },
            { penalty: 'Termination of Contract', memoType: 'Termination Notice', severity: 'terminal' }
        ]
    }
};
var generateMemoContent = function (offense, penalty, employeeTypeStr, employeeIdStr) {
    var monthsList = offense.triggeredMonths.join(', ');
    var displayLabel = offense.violationType === 'habitualTardiness' ? 'Habitual Tardiness' : (offense.violationType === 'absence' ? 'Habitual Absenteeism' : 'Habitual Undertime');
    return "MEMORANDUM\n\nTO: ".concat(employeeIdStr, "\nFROM: City Human Resource Management Officer\nSUBJECT: ").concat(displayLabel, " - ").concat(offense.offenseNumber).concat(getOrdinalSuffix(offense.offenseNumber), " Offense\n\nThis is to inform you that you have been found guilty of ").concat(displayLabel, " based on the following periods: ").concat(monthsList, ".\n\nAs ").concat(employeeTypeStr, ", you are hereby issued a ").concat(penalty.penalty, ".\n\nThis memo serves as your official notice. Please acknowledge receipt within 24 hours.").trim();
};
/**
 * Checks for policy violations based on CSC rules.
 * Rule: Habitual Tardiness/Undertime if 10x per month for 2 months in a semester.
 */
var checkPolicyViolations = function (employeeId, _year, _month) { return __awaiter(void 0, void 0, void 0, function () {
    var tracker, offenses, empRecord_1, adminRecord, authorIdValue_1, joCosTypes, appointmentType, isRegular, employeeTypeStr_1, _loop_1, _i, offenses_1, offense, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                tracker = new CSCViolationTracker();
                return [4 /*yield*/, tracker.identifyOffenses(employeeId)];
            case 1:
                offenses = _a.sent();
                if (offenses.length === 0)
                    return [2 /*return*/];
                return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.authentication.id, dutyType: schema_js_1.authentication.dutyType, appointmentType: schema_js_1.authentication.appointmentType }).from(schema_js_1.authentication).where((0, drizzle_orm_1.eq)(schema_js_1.authentication.employeeId, employeeId)).limit(1)];
            case 2:
                empRecord_1 = _a.sent();
                return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.authentication.id }).from(schema_js_1.authentication).where((0, drizzle_orm_1.eq)(schema_js_1.authentication.role, 'Administrator')).limit(1)];
            case 3:
                adminRecord = _a.sent();
                if (empRecord_1.length === 0)
                    return [2 /*return*/];
                authorIdValue_1 = adminRecord.length > 0 ? adminRecord[0].id : empRecord_1[0].id;
                joCosTypes = ['Job Order', 'JO', 'Contract of Service', 'COS'];
                appointmentType = empRecord_1[0].appointmentType || 'Permanent';
                isRegular = !joCosTypes.includes(appointmentType);
                employeeTypeStr_1 = isRegular ? 'Regular Personnel' : 'Job Order/Contract of Service Personnel';
                _loop_1 = function (offense) {
                    var existing, matrixKey, penalties, penaltyIndex, penalty, displayLabel, subject;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, index_js_1.db.select({ id: schema_js_1.policyViolations.id })
                                    .from(schema_js_1.policyViolations)
                                    .where((0, drizzle_orm_1.eq)(schema_js_1.policyViolations.fingerprint, offense.fingerprint))
                                    .limit(1)];
                            case 1:
                                existing = _b.sent();
                                if (existing.length > 0) {
                                    return [2 /*return*/, "continue"];
                                }
                                matrixKey = offense.violationType === 'habitualUndertime'
                                    ? "habitualUndertime-".concat(offense.classification || 'Simple Misconduct')
                                    : offense.violationType;
                                penalties = isRegular ? penaltyMatrix[matrixKey].regular : penaltyMatrix[matrixKey].joCos;
                                penaltyIndex = Math.min(offense.offenseNumber - 1, penalties.length - 1);
                                penalty = penalties[penaltyIndex];
                                displayLabel = offense.violationType === 'habitualTardiness' ? 'Habitual Tardiness' : (offense.violationType === 'absence' ? 'Habitual Absenteeism' : 'Habitual Undertime');
                                subject = "".concat(displayLabel, " - ").concat(offense.offenseNumber).concat(getOrdinalSuffix(offense.offenseNumber), " Offense");
                                return [4 /*yield*/, index_js_1.db.transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                                        var memoNumber, lastMonth, _a, yyyy, mm, lastDay, effectiveDateStr, createdAtStr, memo;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0: return [4 /*yield*/, generateInternalMemoNumber(tx)];
                                                case 1:
                                                    memoNumber = _b.sent();
                                                    lastMonth = offense.triggeredMonths[offense.triggeredMonths.length - 1];
                                                    _a = lastMonth.split('-').map(Number), yyyy = _a[0], mm = _a[1];
                                                    lastDay = new Date(yyyy, mm, 0).getDate();
                                                    effectiveDateStr = "".concat(yyyy, "-").concat(String(mm).padStart(2, '0'), "-").concat(String(lastDay).padStart(2, '0'));
                                                    createdAtStr = "".concat(effectiveDateStr, " 17:00:00");
                                                    return [4 /*yield*/, tx.insert(schema_js_1.employeeMemos).values({
                                                            memoNumber: memoNumber,
                                                            employeeId: empRecord_1[0].id,
                                                            authorId: authorIdValue_1,
                                                            memoType: penalty.memoType,
                                                            subject: subject,
                                                            content: generateMemoContent(offense, penalty, employeeTypeStr_1, employeeId),
                                                            status: 'Draft',
                                                            priority: 'High',
                                                            severity: penalty.severity,
                                                            effectiveDate: effectiveDateStr,
                                                            createdAt: createdAtStr
                                                        })];
                                                case 2:
                                                    memo = (_b.sent())[0];
                                                    return [4 /*yield*/, tx.insert(schema_js_1.policyViolations).values({
                                                            employeeId: employeeId,
                                                            type: (offense.violationType === 'habitualTardiness' ? 'habitual_tardiness' :
                                                                offense.violationType === 'habitualUndertime' ? 'habitual_undertime' :
                                                                    offense.violationType),
                                                            violationSubtype: offense.classification,
                                                            offenseNumber: offense.offenseNumber,
                                                            offenseLevel: offense.offenseNumber,
                                                            triggeredMonths: JSON.stringify(offense.triggeredMonths),
                                                            fingerprint: offense.fingerprint,
                                                            memoId: memo.insertId,
                                                            details: JSON.stringify({
                                                                penaltyIssued: penalty.penalty,
                                                                employeeType: employeeTypeStr_1,
                                                                severity: penalty.severity,
                                                                rule: "CSC MC No. 1, s. 2017 & CGM Matrix",
                                                                totalIncidents: offense.totalIncidents
                                                            }),
                                                            status: 'pending'
                                                        })];
                                                case 3:
                                                    _b.sent();
                                                    console.warn("[POLICY] ".concat(offense.violationType, " logged for ").concat(employeeId, " (Fingerprint: ").concat(offense.fingerprint, ")"));
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); })];
                            case 2:
                                _b.sent();
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, offenses_1 = offenses;
                _a.label = 4;
            case 4:
                if (!(_i < offenses_1.length)) return [3 /*break*/, 7];
                offense = offenses_1[_i];
                return [5 /*yield**/, _loop_1(offense)];
            case 5:
                _a.sent();
                _a.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 4];
            case 7: return [3 /*break*/, 9];
            case 8:
                error_1 = _a.sent();
                console.error('Error checking policy violations:', error_1);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.checkPolicyViolations = checkPolicyViolations;
