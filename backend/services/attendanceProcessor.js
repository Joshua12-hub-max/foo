"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.processDailyAttendance = void 0;
var index_js_1 = require("../db/index.js");
var schema_js_1 = require("../db/schema.js");
var drizzle_orm_1 = require("drizzle-orm");
var tardinessUtils_js_1 = require("../utils/tardinessUtils.js");
var dateUtils_js_1 = require("../utils/dateUtils.js");
var violationService_js_1 = require("./violationService.js");
var DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/**
 * Parse time string "HH:MM:SS" into components
 */
var parseTimeString = function (timeStr) {
    var parts = timeStr.split(':').map(Number);
    return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};
/**
 * Core logic to process attendance logs into a Daily Time Record.
 * Calculates Late, Undertime, and updates the status.
 * Handles split shifts (multiple blocks) and defaults to 8 AM - 5 PM.
 */
var processDailyAttendance = function (employeeId, dateStr) { return __awaiter(void 0, void 0, void 0, function () {
    var logs, employees, approvedLeaves, isOnLeave, leaveType, dutyType, dailyTargetHours, dailyTargetMinutes, LUNCH_BREAK_MINUTES, dateParts, dateObj, dayName, scheduleBlocks, useTargetHoursMode, isWeekend, activeBlocks, gracePeriod, policyRows, policyRow, content, e_1, totalLateMinutes, totalUndertimeMinutes, totalOvertimeMinutes, timeIn, timeOut, _loop_1, _i, activeBlocks_1, block, inLogs, outLogs, grossRenderedMinutes, lunchDeduction, netRenderedMinutes, inLogs, outLogs, status_1, hasScheduleOrTarget, isLate, isUndertime, dateParts_1, error_1;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 14, , 15]);
                return [4 /*yield*/, index_js_1.db.select({
                        scanTime: schema_js_1.attendanceLogs.scanTime,
                        type: schema_js_1.attendanceLogs.type
                    })
                        .from(schema_js_1.attendanceLogs)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.attendanceLogs.employeeId, employeeId), (0, drizzle_orm_1.eq)((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["DATE(", ")"], ["DATE(", ")"])), schema_js_1.attendanceLogs.scanTime), dateStr)))
                        .orderBy((0, drizzle_orm_1.asc)(schema_js_1.attendanceLogs.scanTime))];
            case 1:
                logs = _c.sent();
                return [4 /*yield*/, index_js_1.db.select({
                        dutyType: schema_js_1.authentication.dutyType,
                        dailyTargetHours: schema_js_1.authentication.dailyTargetHours
                    })
                        .from(schema_js_1.authentication)
                        .where((0, drizzle_orm_1.eq)(schema_js_1.authentication.employeeId, employeeId))
                        .limit(1)];
            case 2:
                employees = _c.sent();
                return [4 /*yield*/, index_js_1.db.select({
                        leaveType: schema_js_1.leaveApplications.leaveType
                    })
                        .from(schema_js_1.leaveApplications)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.leaveApplications.employeeId, employeeId), (0, drizzle_orm_1.eq)(schema_js_1.leaveApplications.status, 'Approved'), (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["DATE(", ") <= ", ""], ["DATE(", ") <= ", ""])), schema_js_1.leaveApplications.startDate, dateStr), (0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["DATE(", ") >= ", ""], ["DATE(", ") >= ", ""])), schema_js_1.leaveApplications.endDate, dateStr)))
                        .limit(1)];
            case 3:
                approvedLeaves = _c.sent();
                isOnLeave = approvedLeaves.length > 0;
                leaveType = isOnLeave ? approvedLeaves[0].leaveType : null;
                dutyType = ((_a = employees[0]) === null || _a === void 0 ? void 0 : _a.dutyType) || 'Standard';
                dailyTargetHours = Number((_b = employees[0]) === null || _b === void 0 ? void 0 : _b.dailyTargetHours) || 8;
                dailyTargetMinutes = dailyTargetHours * 60;
                LUNCH_BREAK_MINUTES = 60;
                dateParts = dateStr.split('-').map(Number);
                dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                dayName = DAYS_OF_WEEK[dateObj.getDay()];
                return [4 /*yield*/, index_js_1.db.select({
                        startTime: schema_js_1.schedules.startTime,
                        endTime: schema_js_1.schedules.endTime
                    })
                        .from(schema_js_1.schedules)
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.schedules.employeeId, employeeId), (0, drizzle_orm_1.eq)(schema_js_1.schedules.dayOfWeek, dayName)))
                        .orderBy((0, drizzle_orm_1.asc)(schema_js_1.schedules.startTime))];
            case 4:
                scheduleBlocks = _c.sent();
                useTargetHoursMode = false;
                // Fallback logic based on Duty Type
                if (scheduleBlocks.length === 0) {
                    if (dutyType === 'Standard') {
                        isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
                        if (!isWeekend) {
                            scheduleBlocks = [{
                                    startTime: '08:00:00',
                                    endTime: '17:00:00'
                                }];
                        }
                    }
                    else {
                        // Irregular: No fixed start/end time. Use dailyTargetHours to calculate undertime.
                        // Late is NOT applicable (no fixed arrival time).
                        // Undertime = dailyTargetMinutes - renderedMinutes (if renderedMinutes < target).
                        useTargetHoursMode = true;
                    }
                }
                activeBlocks = scheduleBlocks.map(function (b) { return (__assign(__assign({}, b), { isRestDay: 0 })); });
                gracePeriod = 0;
                _c.label = 5;
            case 5:
                _c.trys.push([5, 7, , 8]);
                return [4 /*yield*/, index_js_1.db.select().from(schema_js_1.internalPolicies).where((0, drizzle_orm_1.eq)(schema_js_1.internalPolicies.category, 'tardiness')).limit(1)];
            case 6:
                policyRows = _c.sent();
                policyRow = policyRows[0];
                if (policyRow === null || policyRow === void 0 ? void 0 : policyRow.content) {
                    content = (typeof policyRow.content === 'string' ? JSON.parse(policyRow.content) : policyRow.content);
                    gracePeriod = Number(content.gracePeriod) || 0;
                }
                return [3 /*break*/, 8];
            case 7:
                e_1 = _c.sent();
                console.warn('[ATTENDANCE] Error fetching tardiness policy (defaulting to 0):', e_1);
                return [3 /*break*/, 8];
            case 8:
                totalLateMinutes = 0;
                totalUndertimeMinutes = 0;
                totalOvertimeMinutes = 0;
                timeIn = null;
                timeOut = null;
                if (activeBlocks.length > 0) {
                    _loop_1 = function (block) {
                        var blockStart = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                        var _d = parseTimeString(block.startTime), sH = _d[0], sM = _d[1], sS = _d[2];
                        blockStart.setHours(sH, sM, sS);
                        var blockEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                        var _e = parseTimeString(block.endTime), eH = _e[0], eM = _e[1], eS = _e[2];
                        blockEnd.setHours(eH, eM, eS);
                        // Find applicable logs for this block
                        // Threshold: Look for logs within 4 hours of the block start/end
                        var thresholdMs = 4 * 60 * 60 * 1000;
                        var blockInLogs = logs.filter(function (l) {
                            return l.type === 'IN' &&
                                Math.abs(new Date(l.scanTime).getTime() - blockStart.getTime()) <= thresholdMs;
                        });
                        var blockOutLogs = logs.filter(function (l) {
                            return l.type === 'OUT' &&
                                Math.abs(new Date(l.scanTime).getTime() - blockEnd.getTime()) <= thresholdMs;
                        });
                        if (blockInLogs.length > 0) {
                            var firstIn = new Date(blockInLogs[0].scanTime);
                            if (!timeIn || firstIn < timeIn)
                                timeIn = firstIn;
                            if (firstIn > blockStart) {
                                var minutesLate = Math.floor((firstIn.getTime() - blockStart.getTime()) / 60000);
                                // Apply Grace Period Rule
                                if (minutesLate > gracePeriod) {
                                    totalLateMinutes += minutesLate;
                                }
                            }
                        }
                        if (blockOutLogs.length > 0) {
                            var lastOut = new Date(blockOutLogs[blockOutLogs.length - 1].scanTime);
                            if (!timeOut || lastOut > timeOut)
                                timeOut = lastOut;
                            if (lastOut < blockEnd) {
                                totalUndertimeMinutes += Math.floor((blockEnd.getTime() - lastOut.getTime()) / 60000);
                            }
                            else if (lastOut > blockEnd) {
                                totalOvertimeMinutes += Math.floor((lastOut.getTime() - blockEnd.getTime()) / 60000);
                            }
                        }
                    };
                    // ── SCHEDULE-BASED MODE (Standard or Irregular with explicit schedule) ──
                    // Map logs to blocks
                    // For each block, find the best IN (closest to startTime) and OUT (closest to endTime)
                    for (_i = 0, activeBlocks_1 = activeBlocks; _i < activeBlocks_1.length; _i++) {
                        block = activeBlocks_1[_i];
                        _loop_1(block);
                    }
                }
                else if (useTargetHoursMode && logs.length > 0) {
                    inLogs = logs.filter(function (l) { return l.type === 'IN'; });
                    outLogs = logs.filter(function (l) { return l.type === 'OUT'; });
                    if (inLogs.length > 0)
                        timeIn = new Date(inLogs[0].scanTime);
                    if (outLogs.length > 0)
                        timeOut = new Date(outLogs[outLogs.length - 1].scanTime);
                    if (timeIn && timeOut) {
                        grossRenderedMinutes = Math.floor((timeOut.getTime() - timeIn.getTime()) / 60000);
                        lunchDeduction = grossRenderedMinutes > 300 ? LUNCH_BREAK_MINUTES : 0;
                        netRenderedMinutes = grossRenderedMinutes - lunchDeduction;
                        if (netRenderedMinutes < dailyTargetMinutes) {
                            totalUndertimeMinutes = dailyTargetMinutes - netRenderedMinutes;
                        }
                        else if (netRenderedMinutes > dailyTargetMinutes) {
                            totalOvertimeMinutes = netRenderedMinutes - dailyTargetMinutes;
                        }
                        // Late is NOT applicable in target-hours mode (no fixed start time)
                    }
                }
                else {
                    inLogs = logs.filter(function (l) { return l.type === 'IN'; });
                    outLogs = logs.filter(function (l) { return l.type === 'OUT'; });
                    if (inLogs.length > 0)
                        timeIn = new Date(inLogs[0].scanTime);
                    if (outLogs.length > 0)
                        timeOut = new Date(outLogs[outLogs.length - 1].scanTime);
                }
                status_1 = 'Present';
                hasScheduleOrTarget = activeBlocks.length > 0 || useTargetHoursMode;
                if (hasScheduleOrTarget) {
                    if (!timeIn && logs.length === 0) {
                        // No logs at all for a working day
                        status_1 = isOnLeave ? (leaveType || 'Leave') : (useTargetHoursMode ? 'No Logs' : 'Absent');
                    }
                    else if (!timeIn) {
                        status_1 = isOnLeave ? (leaveType || 'Leave') : 'Absent';
                    }
                    else {
                        isLate = totalLateMinutes > 0;
                        isUndertime = totalUndertimeMinutes > 0;
                        if (isLate && isUndertime) {
                            status_1 = 'Late/Undertime';
                        }
                        else if (isLate) {
                            status_1 = 'Late';
                        }
                        else if (isUndertime) {
                            status_1 = 'Undertime';
                        }
                        else {
                            status_1 = 'Present';
                        }
                    }
                }
                if (!(logs.length > 0 || isOnLeave)) return [3 /*break*/, 10];
                return [4 /*yield*/, index_js_1.db.insert(schema_js_1.dailyTimeRecords).values({
                        employeeId: employeeId,
                        date: dateStr,
                        timeIn: timeIn ? (0, dateUtils_js_1.formatToManilaDateTime)(timeIn) : null,
                        timeOut: timeOut ? (0, dateUtils_js_1.formatToManilaDateTime)(timeOut) : null,
                        lateMinutes: totalLateMinutes,
                        undertimeMinutes: totalUndertimeMinutes,
                        overtimeMinutes: totalOvertimeMinutes,
                        status: status_1,
                        updatedAt: (0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))
                    }).onDuplicateKeyUpdate({
                        set: {
                            timeIn: timeIn ? (0, dateUtils_js_1.formatToManilaDateTime)(timeIn) : null,
                            timeOut: timeOut ? (0, dateUtils_js_1.formatToManilaDateTime)(timeOut) : null,
                            lateMinutes: totalLateMinutes,
                            undertimeMinutes: totalUndertimeMinutes,
                            overtimeMinutes: totalOvertimeMinutes,
                            status: status_1,
                            updatedAt: (0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["CURRENT_TIMESTAMP"], ["CURRENT_TIMESTAMP"])))
                        }
                    })];
            case 9:
                _c.sent();
                _c.label = 10;
            case 10: 
            // 5. AUTO-UPDATE SUMMARY & CHECK VIOLATIONS
            // This makes the system "Real-Time"
            return [4 /*yield*/, (0, tardinessUtils_js_1.updateTardinessSummary)(employeeId, dateStr)];
            case 11:
                // 5. AUTO-UPDATE SUMMARY & CHECK VIOLATIONS
                // This makes the system "Real-Time"
                _c.sent();
                if (!(totalLateMinutes > 0 || totalUndertimeMinutes > 0 || status_1 === 'Absent')) return [3 /*break*/, 13];
                dateParts_1 = dateStr.split('-').map(Number);
                return [4 /*yield*/, (0, violationService_js_1.checkPolicyViolations)(employeeId, dateParts_1[0], dateParts_1[1])];
            case 12:
                _c.sent();
                _c.label = 13;
            case 13: return [3 /*break*/, 15];
            case 14:
                error_1 = _c.sent();
                console.error('Error processing daily attendance:', error_1);
                throw error_1;
            case 15: return [2 /*return*/];
        }
    });
}); };
exports.processDailyAttendance = processDailyAttendance;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5;
