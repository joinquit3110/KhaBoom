"use strict";
// =============================================================================
// Email Helper Functions
// (c) Kha-Boom!
// =============================================================================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendPasswordChangedEmail = sendPasswordChangedEmail;
exports.sendChangeEmailConfirmation = sendChangeEmailConfirmation;
const path_1 = __importDefault(require("path"));
const pug_1 = require("pug");
const mail_1 = __importDefault(require("@sendgrid/mail"));
const utilities_1 = require("./utilities");
if (utilities_1.CONFIG.accounts.sendgridKey)
    mail_1.default.setApiKey(utilities_1.CONFIG.accounts.sendgridKey);
function loadEmailTemplate(name) {
    const prefix = path_1.default.join(__dirname, '../templates/emails/');
    const html = (0, pug_1.compileFile)(`${prefix}/${name}.pug`);
    const text = (0, pug_1.compileFile)(`${prefix}/${name}-simple.pug`);
    return [html, text];
}
function sendEmail(options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!utilities_1.CONFIG.accounts.sendgridKey) {
            console.warn('SendGrid API key not configured. Email not sent to:', options.to || ((_a = options.user) === null || _a === void 0 ? void 0 : _a.email));
            return;
        }
        // Use verified sender email from environment or default
        if (!options.from) {
            options.from = process.env.SENDER_EMAIL || 'nghung.star@gmail.com';
        }
        if (options.user && !options.to)
            options.to = `${options.user.fullName} <${options.user.email}>`;
        try {
            return yield mail_1.default.send(options);
        }
        catch (error) {
            console.error(`Failed to send email to`, options.to, error);
        }
    });
}
// -----------------------------------------------------------------------------
const WELCOME = loadEmailTemplate('welcome');
function sendWelcomeEmail(user) {
    return sendEmail({
        subject: 'Welcome to Kha-Boom!',
        html: WELCOME[0]({ user, config: utilities_1.CONFIG }),
        text: WELCOME[1]({ user, config: utilities_1.CONFIG }),
        user
    });
}
const RESET = loadEmailTemplate('reset');
function sendPasswordResetEmail(user, token) {
    return sendEmail({
        subject: 'Kha-Boom! Password Reset',
        html: RESET[0]({ user, token, config: utilities_1.CONFIG }),
        text: RESET[1]({ user, token, config: utilities_1.CONFIG }),
        user
    });
}
const PASSWORD = loadEmailTemplate('password');
function sendPasswordChangedEmail(user) {
    return sendEmail({
        subject: 'Kha-Boom! Password Change Notification',
        html: PASSWORD[0]({ user, config: utilities_1.CONFIG }),
        text: PASSWORD[1]({ user, config: utilities_1.CONFIG }),
        user
    });
}
const CHANGE_EMAIL = loadEmailTemplate('change-email');
function sendChangeEmailConfirmation(user) {
    return sendEmail({
        subject: 'Confirm your new email address for Kha-Boom!',
        html: CHANGE_EMAIL[0]({ user, config: utilities_1.CONFIG }),
        text: CHANGE_EMAIL[1]({ user, config: utilities_1.CONFIG }),
        user
    });
}
