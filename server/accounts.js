"use strict";
// =============================================================================
// Accounts and Authentication
// (c) Kha-Boom!
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setupAuthEndpoints;
const crypto = require('crypto');
const user_1 = require("./models/user");
const progress_1 = require("./models/progress");
const utilities_1 = require("./utilities/utilities");
const emails_1 = require("./utilities/emails");
const validate_1 = require("./utilities/validate");
const oauth_1 = require("./utilities/oauth");
const MESSAGES = (0, utilities_1.loadData)('messages');
const COUNTRIES = (0, utilities_1.loadData)('countries');
const COUNTRY_CODES = Object.keys(COUNTRIES);
const COUNTRY_LIST = COUNTRY_CODES.map(k => ({ id: k, name: COUNTRIES[k] })).sort((a, b) => (a.name < b.name ? -1 : 1));
// -----------------------------------------------------------------------------
// Signup
async function signup(req) {
    const email = (0, validate_1.normalizeEmail)(req.body.email);
    if (!email)
        return { error: 'invalidEmail' };
    const birthday = (0, validate_1.checkBirthday)(req.body.birthday);
    if (!birthday)
        return { error: 'invalidBirthday' };
    const password = req.body.password;
    if (password.length < 4)
        return { error: 'passwordLength' };
    if (!req.body.policies)
        return { error: 'acceptPolicies' };
    const existingUser = await user_1.User.lookup(email);
    if (existingUser)
        return { error: 'accountExists', redirect: '/login' };
    const user = new user_1.User({ type: 'student', email, birthday, password, acceptedPolicies: true, oAuthTokens: [] });
    user.firstName = (0, validate_1.sanitizeString)(req.body.first);
    user.lastName = (0, validate_1.sanitizeString)(req.body.last);
    user.country = COUNTRY_CODES.includes(req.body.country) ? req.body.country : req.country;
    user.emailVerificationToken = crypto.randomBytes(16).toString('hex');
    if (!user.firstName || !user.lastName)
        return { error: 'invalidName' };
    await user.save();
    // Copy course data from temporary user to new user account.
    if (req.tmpUser)
        await progress_1.Progress.updateMany({ userId: req.tmpUser }, { userId: user.id }).exec();
    (0, emails_1.sendWelcomeEmail)(user); // async
    return { user, success: 'welcome' };
}
// ----------------------------------------------------------------------------
// Login and Verification
async function login(req) {
    if (!req.body.email || !req.body.password)
        return { error: 'missingParameters' };
    const user = await user_1.User.lookup(req.body.email);
    if (!user || !user.checkPassword(req.body.password.trim()))
        return { error: 'invalidLogin' };
    return { user };
}
async function confirmEmail(req) {
    if (!req.params.token)
        return { error: 'missingParameters' };
    const user = await user_1.User.findById(req.params.id);
    if (user && !user.emailVerificationToken)
        return {};
    if (!user || user.emailVerificationToken !== req.params.token)
        return { error: 'verifyError' };
    user.emailVerificationToken = undefined;
    await user.save();
    return { success: 'verifySuccess' };
}
async function resendVerificationEmail(req) {
    if (!req.user)
        return { error: 'unauthenticated', errorCode: 401 };
    if (req.user.email && req.user.emailVerificationToken) {
        await (0, emails_1.sendWelcomeEmail)(req.user);
        return { success: 'verificationEmailSent' };
    }
    return { error: 'unknown' };
}
// ----------------------------------------------------------------------------
// User Profile
async function acceptPolicies(req) {
    if (!req.user)
        return;
    req.user.acceptedPolicies = true;
    await req.user.save();
}
async function updateProfile(req) {
    if (!req.user)
        return { error: 'unauthenticated', errorCode: 401, redirect: '/login' };
    req.user.firstName = (0, validate_1.sanitizeString)(req.body.first);
    req.user.lastName = (0, validate_1.sanitizeString)(req.body.last);
    if (!req.user.firstName || !req.user.lastName)
        return { error: 'invalidName' };
    if (req.body.country && COUNTRY_CODES.includes(req.body.country))
        req.user.country = req.body.country;
    if (req.body.email && req.body.email !== req.user.email) {
        if (!req.user.password)
            return { error: 'cantChangeEmail' };
        const email = (0, validate_1.normalizeEmail)(req.body.email);
        if (!email)
            return { error: 'invalidEmail' };
        if (await user_1.User.lookup(email))
            return { error: 'accountExists' };
        req.user.previousEmails.push(req.user.email);
        req.user.email = email;
        req.user.emailVerificationToken = crypto.randomBytes(16).toString('hex');
        (0, emails_1.sendChangeEmailConfirmation)(req.user); // async
    }
    await req.user.save();
    return { success: 'profileUpdated' };
}
async function updatePassword(req) {
    if (!req.user)
        return { error: 'unauthenticated', errorCode: 401, redirect: '/login' };
    if (req.user.emailVerificationToken)
        return { error: 'passwordUnverifiedEmail' };
    if (!req.user.checkPassword(req.body.oldpassword))
        return { error: 'wrongPassword' };
    const newPassword = req.body.password;
    if (newPassword.length < 4)
        return { error: 'passwordLength' };
    req.user.password = newPassword;
    await req.user.save();
    return { success: 'passwordChanged' };
}
async function deleteAccount(req, toDelete = true) {
    if (!req.user)
        return { error: 'unauthenticated', errorCode: 401, redirect: '/login' };
    req.user.deletionRequested = toDelete ? Date.now() : undefined;
    await req.user.save();
    return { success: toDelete ? 'markedForDeleted' : 'unmarkedForDeletion' };
}
// ----------------------------------------------------------------------------
// Password Reset
async function requestPasswordResetEmail(req) {
    const user = await user_1.User.lookup(req.body.email);
    if (!user)
        return { error: 'accountNotFound' };
    if (user.emailVerificationToken)
        return { error: 'passwordUnverifiedEmail' };
    const buffer = await crypto.randomBytes(16);
    user.passwordResetToken = buffer.toString('hex');
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    await (0, emails_1.sendPasswordResetEmail)(user, user.passwordResetToken);
    return { success: 'emailSent', params: [user.email] };
}
async function checkResetToken(req) {
    if (!req.params.token)
        return { error: 'invalidParameters' };
    const user = await user_1.User.findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now()).exec();
    return user ? { user } : { error: 'invalidToken' };
}
async function resetPassword(req) {
    if (!req.body.password || req.body.password.length < 4) {
        return { error: 'passwordLength' };
    }
    const user = await user_1.User.findOne({ passwordResetToken: req.params.token })
        .where('passwordResetExpires').gt(Date.now()).exec();
    if (!user)
        return { error: 'invalidToken' };
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await (0, emails_1.sendPasswordChangedEmail)(user);
    return { success: 'passwordChanged', redirect: '/login' };
}
// -----------------------------------------------------------------------------
// Export User Data
const undef = (arr) => (Array.isArray(arr) && !arr.length) ? undefined : arr;
const EXPORT_KEYS = ['email', 'previousEmails', 'type', 'country', 'birthday', 'school', 'picture', 'lastOnline'];
async function exportData(user) {
    var _a;
    const data = { name: user.fullName };
    for (const t of EXPORT_KEYS)
        data[t] = undef(user[t]);
    const courses = await progress_1.Progress.find({ _user: user._id }).exec();
    data.courses = {};
    for (const c of courses) {
        data.courses[c.courseId] = {
            progress: c.progress || 0,
            steps: undef(Array.from(c.steps.entries()).map(c => ({ id: c[0], scores: c[1].scores, data: c[1].data }))),
            messages: undef((_a = c.messages) === null || _a === void 0 ? void 0 : _a.map(m => ({ content: m.content, kind: m.kind })))
        };
    }
    return data;
}
// -----------------------------------------------------------------------------
// CRON Jobs to automatically delete users
async function cleanupUsers() {
    const requested = await user_1.User.find({ deletionRequested: { $lt: +(0, utilities_1.pastDate)(7) } }).exec();
    const outdated = await user_1.User.find({ lastOnline: { $lt: (0, utilities_1.pastDate)(4 * 365) } }).exec();
    for (const user of [...outdated, ...requested]) {
        await user_1.User.deleteOne({ _id: user._id });
    }
    const total = requested.length + outdated.length;
    if (!total || !utilities_1.CONFIG.accounts.cronNotificationsEmail)
        return;
    let text = `Mathigon cron job results from ${new Date().toISOString()}:\n`;
    text += `  * Deleted ${requested} users who requested account deletion 7 days ago.`;
    text += `  * Deleted ${outdated} users who have not used Mathigon within 5 years.`;
    await (0, emails_1.sendEmail)({
        subject: `Mathigon Cron Results: ${total} users deleted`,
        text,
        to: utilities_1.CONFIG.accounts.cronNotificationsEmail
    });
}
function redirect(req, res, data, url, errorUrl) {
    const params = data.params || [];
    if (data.error)
        req.flash('errors', req.__(MESSAGES[data.error], ...params));
    if (data.success)
        req.flash('success', req.__(MESSAGES[data.success], ...params));
    // TODO re-fill form fields
    if (data.errorCode)
        res.status(data.errorCode);
    if (errorUrl && (data.error || data.errorCode))
        url = errorUrl;
    return req.session.save(() => res.redirect(data.redirect || url));
}
function setupAuthEndpoints(app) {
    app.get('/login', (req, res) => {
        if (req.user)
            return res.redirect('/dashboard');
        res.render('accounts/login');
    });
    app.post('/login', async (req, res) => {
        const response = await login(req);
        if (response.user) {
            req.session.auth.user = response.user.id;
            // Check if there's a stored redirect URL from attempted course access
            const redirectTo = req.session.redirectTo || '/dashboard';
            delete req.session.redirectTo;
            redirect(req, res, response, redirectTo, '/login');
        }
        else {
            redirect(req, res, response, '/dashboard', '/login');
        }
    });
    app.get('/logout', (req, res) => {
        delete req.session.auth.user;
        req.session.save(() => res.redirect('back'));
    });
    app.get('/signup', (req, res) => {
        if (req.user)
            return res.redirect('/dashboard');
        res.render('accounts/signup', { countries: COUNTRY_LIST });
    });
    app.post('/signup', async (req, res) => {
        const response = await signup(req);
        if (response.user) {
            req.session.auth.user = response.user.id;
            // Check if there's a stored redirect URL from attempted course access
            const redirectTo = req.session.redirectTo || '/dashboard';
            delete req.session.redirectTo;
            redirect(req, res, response, redirectTo, '/signup');
        }
        else {
            redirect(req, res, response, '/dashboard', '/signup');
        }
    });
    app.get('/confirm/:id/:token', async (req, res) => {
        const response = await confirmEmail(req);
        redirect(req, res, response, '/dashboard', '/login');
    });
    app.get('/forgot', (req, res) => {
        if (req.user)
            return res.redirect('/dashboard');
        res.render('accounts/forgot');
    });
    app.post('/forgot', async (req, res) => {
        const response = await requestPasswordResetEmail(req);
        redirect(req, res, response, '/login', '/forgot');
    });
    app.get('/reset/:token', async (req, res) => {
        const response = await checkResetToken(req);
        if (response.error)
            return redirect(req, res, response, '/forgot');
        res.render('accounts/reset');
    });
    app.post('/reset/:token', async (req, res) => {
        const response = await resetPassword(req);
        redirect(req, res, response, '/login', '/reset');
    });
    app.get('/profile', (req, res) => {
        if (!req.user)
            return res.redirect('/login');
        res.render('accounts/profile', { countries: COUNTRY_LIST });
    });
    app.post('/profile/details', async (req, res) => {
        const response = await updateProfile(req);
        redirect(req, res, response, '/profile');
    });
    app.post('/profile/password', async (req, res) => {
        const response = await updatePassword(req);
        redirect(req, res, response, '/profile');
    });
    app.get('/profile/delete', async (req, res) => {
        const response = await deleteAccount(req, true);
        redirect(req, res, response, '/profile', '/profile');
    });
    app.get('/profile/undelete', async (req, res) => {
        const response = await deleteAccount(req, false);
        redirect(req, res, response, '/profile', '/profile');
    });
    app.get('/profile/resend', async (req, res) => {
        const response = await resendVerificationEmail(req);
        redirect(req, res, response, req.user ? '/profile' : '/login');
    });
    app.post('/profile/accept-policies', async (req, res) => {
        await acceptPolicies(req);
        res.send('ok');
    });
    app.get('/profile/data.json', async (req, res) => {
        if (!req.user)
            return res.redirect('/login');
        res.json(await exportData(req.user));
    });
    app.get('/auth/:provider', async (req, res, next) => {
        const response = await (0, oauth_1.oAuthLogin)(req);
        if (!response)
            return next();
        redirect(req, res, response, '/signup');
    });
    app.get('/auth/:provider/callback', async (req, res, next) => {
        const response = await (0, oauth_1.oAuthCallback)(req);
        if (!response)
            return next();
        if (response.user)
            req.session.auth.user = response.user.id;
        redirect(req, res, response, '/dashboard', '/signup');
    });
    app.get('/cron/cleanup', async (req, res, next) => {
        // This endpoint is called automatically by Google Cloud Cron Jobs
        if (req.get('X-Appengine-Cron') !== 'true')
            return next();
        await cleanupUsers();
        res.send('ok');
    });
}
