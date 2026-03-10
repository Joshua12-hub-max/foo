"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = exports.waitForDatabase = exports.db = void 0;
var promise_1 = require("mysql2/promise");
var mysql2_1 = require("drizzle-orm/mysql2");
var dotenv_1 = require("dotenv");
var schema = require("./schema.js");
var relations = require("./relations.js");
var migrator_1 = require("drizzle-orm/mysql2/migrator");
var path_1 = require("path");
var url_1 = require("url");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var combinedSchema = __assign(__assign({}, schema), relations);
dotenv_1.default.config();
var poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    charset: 'utf8mb4'
};
var pool = promise_1.default.createPool(poolConfig);
// Initialize Drizzle
exports.db = (0, mysql2_1.drizzle)(pool, { schema: combinedSchema, mode: 'default' });
/**
 * Retries database connection until successful or max attempts reached.
 */
var waitForDatabase = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (maxAttempts, delayMs) {
        var attempt, connection, error_1, err;
        if (maxAttempts === void 0) { maxAttempts = 10; }
        if (delayMs === void 0) { delayMs = 3000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= maxAttempts)) return [3 /*break*/, 8];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 7]);
                    return [4 /*yield*/, pool.getConnection()];
                case 3:
                    connection = _a.sent();
                    console.warn('Database connected successfully');
                    connection.release();
                    return [2 /*return*/, true];
                case 4:
                    error_1 = _a.sent();
                    err = error_1;
                    console.error("Database connection attempt ".concat(attempt, "/").concat(maxAttempts, " failed: ").concat(err.message));
                    if (!(attempt < maxAttempts)) return [3 /*break*/, 6];
                    console.warn("Retrying in ".concat(delayMs / 1000, "s..."));
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delayMs); })];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [3 /*break*/, 7];
                case 7:
                    attempt++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, false];
            }
        });
    });
};
exports.waitForDatabase = waitForDatabase;
// Initial connection check
(0, exports.waitForDatabase)(1); // Non-blocking initial check for logs
/**
 * Runs pending migrations to ensure database schema is up-to-date.
 */
var runMigrations = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2, err, errorString, sqlMessage, errorCode;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.warn('Running migrations...');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, migrator_1.migrate)(exports.db, {
                        migrationsFolder: path_1.default.join(__dirname, '../drizzle'),
                    })];
            case 2:
                _a.sent();
                console.warn('Migrations completed successfully');
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                err = error_2;
                // Check if the error is "Table already exists" (MySQL error code 1050 / sqlState 42S01)
                if (err.sqlState === '42S01' ||
                    err.code === 'ER_TABLE_EXISTS_ERROR' ||
                    err.code === 'ER_DUP_FIELDNAME' ||
                    err.message.includes("already exists") ||
                    (err.sqlMessage && err.sqlMessage.includes("already exists")) ||
                    err.toString().includes("already exists")) {
                    console.warn('Database schema is already partially or fully initialized. Skipping creation steps.');
                    return [2 /*return*/];
                }
                errorString = err.toString().toLowerCase();
                sqlMessage = (err.sqlMessage || err.message || '').toLowerCase();
                errorCode = String(err.code || '');
                if (errorString.includes("already exists") ||
                    errorString.includes("duplicate column") ||
                    sqlMessage.includes("already exists") ||
                    sqlMessage.includes("duplicate column") ||
                    errorCode === '1050' || // ER_TABLE_EXISTS_ERROR
                    errorCode === '1060' || // ER_DUP_FIELDNAME
                    err.sqlState === '42S01' || // Table already exists
                    err.sqlState === '42S21' // Duplicate column name
                ) {
                    console.warn('Database schema conflict detected (already existing). Skipping.');
                    return [2 /*return*/];
                }
                console.error('Migration failed!');
                console.error('Error Details:', {
                    code: err.code,
                    errno: err.errno,
                    sqlState: err.sqlState,
                    message: err.message,
                    sqlMessage: err.sqlMessage
                });
                if (err.sql)
                    console.error('Failed SQL:', err.sql);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.runMigrations = runMigrations;
exports.default = pool;
