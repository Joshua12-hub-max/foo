"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.updateTardinessSummary = void 0;
var index_js_1 = require("../db/index.js");
var schema_js_1 = require("../db/schema.js");
var drizzle_orm_1 = require("drizzle-orm");
var dateUtils_js_1 = require("./dateUtils.js");
var updateTardinessSummary = function (employeeId, dateStr) { return __awaiter(void 0, void 0, void 0, function () {
    var date, year, month, records, totalLateMinutes, totalUndertimeMinutes, totalLateCount, totalUndertimeCount, totalAbsenceCount, _i, records_1, r, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                date = new Date(dateStr);
                year = date.getFullYear();
                month = date.getMonth() + 1;
                return [4 /*yield*/, index_js_1.db.select().from(schema_js_1.dailyTimeRecords).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_js_1.dailyTimeRecords.employeeId, employeeId), (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["YEAR(", ") = ", ""], ["YEAR(", ") = ", ""])), schema_js_1.dailyTimeRecords.date, year), (0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["MONTH(", ") = ", ""], ["MONTH(", ") = ", ""])), schema_js_1.dailyTimeRecords.date, month)))];
            case 1:
                records = _a.sent();
                totalLateMinutes = 0;
                totalUndertimeMinutes = 0;
                totalLateCount = 0;
                totalUndertimeCount = 0;
                totalAbsenceCount = 0;
                for (_i = 0, records_1 = records; _i < records_1.length; _i++) {
                    r = records_1[_i];
                    if (r.lateMinutes && r.lateMinutes > 0) {
                        totalLateMinutes += r.lateMinutes;
                        totalLateCount++;
                    }
                    if (r.undertimeMinutes && r.undertimeMinutes > 0) {
                        totalUndertimeMinutes += r.undertimeMinutes;
                        totalUndertimeCount++;
                    }
                    if (r.status === 'Absent' || r.status === 'No Logs') {
                        totalAbsenceCount++;
                    }
                }
                // 3. Compute Days Equivalent
                // const totalMinutes = totalLateMinutes + totalUndertimeMinutes;
                // const daysEquivalent = (totalMinutes / (dailyTargetHours * 60)).toFixed(3);
                // 4. Upsert into tardiness_summary
                return [4 /*yield*/, index_js_1.db.insert(schema_js_1.tardinessSummary).values({
                        employeeId: employeeId,
                        year: year,
                        month: month,
                        totalLateMinutes: totalLateMinutes,
                        totalUndertimeMinutes: totalUndertimeMinutes,
                        totalLateCount: totalLateCount,
                        totalUndertimeCount: totalUndertimeCount,
                        totalAbsenceCount: totalAbsenceCount,
                        // daysEquivalent is generated, do not insert
                        processedAt: (0, dateUtils_js_1.currentManilaDateTime)()
                    }).onDuplicateKeyUpdate({
                        set: {
                            totalLateMinutes: totalLateMinutes,
                            totalUndertimeMinutes: totalUndertimeMinutes,
                            totalLateCount: totalLateCount,
                            totalUndertimeCount: totalUndertimeCount,
                            totalAbsenceCount: totalAbsenceCount,
                            // daysEquivalent is generated, do not update
                            processedAt: (0, dateUtils_js_1.currentManilaDateTime)()
                        }
                    })];
            case 2:
                // 3. Compute Days Equivalent
                // const totalMinutes = totalLateMinutes + totalUndertimeMinutes;
                // const daysEquivalent = (totalMinutes / (dailyTargetHours * 60)).toFixed(3);
                // 4. Upsert into tardiness_summary
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error('[TARDINESS] Error updating summary:', error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateTardinessSummary = updateTardinessSummary;
var templateObject_1, templateObject_2;
