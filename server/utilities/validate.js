"use strict";
// =============================================================================
// User Input Validation
// (c) Kha-Boom!
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeString = sanitizeString;
exports.checkBirthday = checkBirthday;
exports.normalizeEmail = normalizeEmail;
const fermat_1 = require("@mathigon/fermat");
const validator_1 = __importDefault(require("validator"));
const utilities_1 = require("./utilities");
function sanitizeString(str, maxLength = 40) {
    return validator_1.default.escape(validator_1.default.stripLow(str || '')).trim()
        .replace(/\s+/, ' ').slice(0, maxLength);
}
function checkBirthday(birthdayString) {
    const date = birthdayString ? validator_1.default.toDate(birthdayString) : undefined;
    if (!date)
        return;
    const now = Date.now();
    if (!(0, fermat_1.isBetween)(+date, now - 120 * utilities_1.ONE_YEAR, now - utilities_1.ONE_YEAR))
        return;
    return date;
}
function normalizeEmail(str) {
    if (!str || !validator_1.default.isEmail(str))
        return;
    return validator_1.default.normalizeEmail(str) || undefined;
}
