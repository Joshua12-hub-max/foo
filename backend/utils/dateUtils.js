"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatToMysqlDateTime = exports.currentManilaDateTime = exports.formatToManilaDateTime = void 0;
var formatToManilaDateTime = function (date) {
    var d = typeof date === 'string' ? new Date(date) : date;
    var formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    var parts = formatter.formatToParts(d);
    var getPart = function (type) { var _a; return ((_a = parts.find(function (p) { return p.type === type; })) === null || _a === void 0 ? void 0 : _a.value) || ''; };
    return "".concat(getPart('year'), "-").concat(getPart('month'), "-").concat(getPart('day'), " ").concat(getPart('hour'), ":").concat(getPart('minute'), ":").concat(getPart('second'));
};
exports.formatToManilaDateTime = formatToManilaDateTime;
var currentManilaDateTime = function () {
    return (0, exports.formatToManilaDateTime)(new Date());
};
exports.currentManilaDateTime = currentManilaDateTime;
/**
 * Format date for MySQL DATETIME column (YYYY-MM-DD HH:mm:ss)
 * Uses UTC by default as toISOString() does.
 */
var formatToMysqlDateTime = function (date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
};
exports.formatToMysqlDateTime = formatToMysqlDateTime;
