"use strict";
// =============================================================================
// KHA-BOOM! Express App
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
exports.MathigonStudioApp = void 0;
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const body_parser_1 = __importDefault(require("body-parser"));
const lusca_1 = __importDefault(require("lusca"));
const express_session_1 = __importDefault(require("express-session"));
const path_1 = __importDefault(require("path"));
const express_flash_1 = __importDefault(require("express-flash"));
const core_1 = require("@mathigon/core");
const search_1 = require("./search");
const accounts_1 = __importDefault(require("./accounts"));
const mongodb_1 = require("./utilities/mongodb");
const oauth_1 = require("./utilities/oauth");
const utilities_1 = require("./utilities/utilities");
const i18n_1 = require("./utilities/i18n");
const user_1 = require("./models/user");
const analytics_1 = require("./models/analytics");
const progress_1 = require("./models/progress");
// Import parseSimple for glossary processing
const { parseSimple } = require('../build/markdown/parser');
// Helper function to parse glossary data like course does
function parseGlossaryData(rawData) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsed = {};
        for (const [key, value] of Object.entries(rawData)) {
            try {
                // Parse the text field with markdown/LaTeX support
                const parsedText = yield parseSimple(value.text || '');
                parsed[key] = {
                    title: value.title,
                    text: parsedText
                };
            }
            catch (error) {
                console.warn(`Failed to parse glossary entry ${key}:`, error);
                // Fallback to original text if parsing fails
                parsed[key] = value;
            }
        }
        return parsed;
    });
}
const STATUS_CODES = {
    401: 'You don’t have access to this page,',
    404: 'This page doesn’t exist.',
    default: 'Something went wrong.'
};
const SESSION_COOKIE = {
    domain: utilities_1.IS_PROD ? utilities_1.CONFIG.domain : undefined,
    maxAge: 1000 * 60 * 60 * 24 * 60 // Two months, in ms
};
// -----------------------------------------------------------------------------
// Express App Setup
class MathigonStudioApp {
    constructor() {
        const app = this.app = (0, express_1.default)();
        app.set('env', utilities_1.ENV);
        app.set('trust_proxy', true);
        app.set('views', [utilities_1.PROJECT_DIR + '/server/templates', __dirname + '/templates']);
        app.set('view engine', 'pug');
        if (utilities_1.ENV === 'development')
            app.set('json spaces', 2);
        app.disable('x-powered-by');
    }
    use(fn) {
        this.app.use(fn);
        return this;
    }
    get(url, handler) {
        this.app.get(url, (0, utilities_1.promisify)(handler));
        return this;
    }
    post(url, handler) {
        this.app.post(url, (0, utilities_1.promisify)(handler));
        return this;
    }
    listen(port) {
        port = (+process.env.PORT) || port || 8080;
        this.app.set('port', port);
        this.app.listen(port, () => console.log(`Running on port ${port} in ${utilities_1.ENV} mode.`));
    }
    // Get the Express app instance for extending with custom routes
    getApp() {
        return this.app;
    }
    // ---------------------------------------------------------------------------
    // Server Configuration
    /**
     * Sets up the express body and cookie parser, as well as security headers.
     * This should happen *after* binding static assets repositories.
     * @param options {ServerOptions}
     * @return {MathigonStudioApp}
     */
    setup(options) {
        this.app.use((0, cookie_parser_1.default)(options.sessionSecret));
        this.app.use((0, express_flash_1.default)());
        const limit = (options === null || options === void 0 ? void 0 : options.maxBodySize) || '400kb';
        this.app.use(body_parser_1.default.json({ limit }));
        this.app.use(body_parser_1.default.urlencoded({ extended: false, limit }));
        this.app.use((0, express_session_1.default)({
            name: 'session',
            secret: options.sessionSecret,
            cookie: SESSION_COOKIE,
            resave: false, // Don't save session if unmodified
            saveUninitialized: false, // Don't create session until something stored
            store: utilities_1.CONFIG.accounts.enabled ? (0, mongodb_1.getMongoStore)() : undefined
        }));
        this.app.use((0, lusca_1.default)({
            csrf: { blocklist: options === null || options === void 0 ? void 0 : options.csrfBlocklist }, // Cross Site Request Forgery
            hsts: { maxAge: 31536000 }, // Strict-Transport-Security
            nosniff: true, // X-Content-Type-Options
            xssProtection: true // X-XSS-Protection
        }));
        this.app.use((req, res, next) => {
            req.url = (0, utilities_1.removeCacheBust)(req.url);
            req.country = (0, i18n_1.getCountry)(req);
            req.locale = (0, i18n_1.getLocale)(req);
            req.__ = (str, ...args) => (0, i18n_1.translate)(req.locale.id, str, args);
            // These keys are required by the error page, so they need to be added
            // before any static files routing (which might throw an error).
            const showCookieConsent = !req.cookies.cookie_consent && (0, i18n_1.isInEU)(req.country);
            Object.assign(res.locals, {
                country: req.country, locale: req.locale, __: req.__, env: utilities_1.ENV, req,
                availableLocales: i18n_1.AVAILABLE_LOCALES, config: utilities_1.CONFIG, include: utilities_1.include,
                href: utilities_1.href.bind(undefined, req), basedir: __dirname + '/templates',
                search: { docs: search_1.SEARCH_DOCS }, showCookieConsent, getCourse: utilities_1.getCourse,
                cacheBust: (file) => (0, utilities_1.cacheBust)(file, req.locale),
                oAuthProviders: oauth_1.OAUTHPROVIDERS
            });
            next();
        });
        // Static asset directories
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.static(utilities_1.PROJECT_DIR + '/frontend/assets', { maxAge: utilities_1.ONE_YEAR }));
        this.app.use(express_1.default.static(path_1.default.join(__dirname, '../frontend/assets'), { maxAge: utilities_1.ONE_YEAR }));
        this.app.use(express_1.default.static(utilities_1.OUT_DIR, { maxAge: utilities_1.ONE_YEAR }));
        this.app.use('/content', express_1.default.static(utilities_1.CONTENT_DIR, { maxAge: utilities_1.ONE_YEAR }));
        // Search Endpoint
        if (utilities_1.CONFIG.search.enabled) {
            this.get('/api/search', (req, res) => {
                res.locals.search.results = (0, search_1.search)((req.query.q || '').toString());
                res.render('search');
            });
        }
        return this;
    }
    secure() {
        this.app.use((req, res, next) => {
            // See https://cloud.google.com/appengine/docs/flexible/nodejs/reference/request-headers
            if (req.hostname !== 'localhost' && req.get('X-Forwarded-Proto') === 'http') {
                return res.redirect(`https://${req.hostname}${req.url}`);
            }
            next();
        });
        return this;
    }
    // ---------------------------------------------------------------------------
    // Helper Functions
    /**
     * Create redirect handlers for a map of URLs. It is possible to use and
     * reference URL parameters, e.g. {"/:name": "/course/$name"}.
     * @param data {Record<string, string>}
     * @return {MathigonStudioApp}
     */
    redirects(data) {
        for (const from of Object.keys(data)) {
            this.app.get(from, (req, res) => {
                let url = data[from];
                for (const [key, value] of Object.entries(req.params)) {
                    url = url.replace('$' + key, value);
                }
                res.redirect(url);
            });
        }
        return this;
    }
    /**
     * Bind Express error handlers. This should be called after all other
     * request handlers have been set up.
     * @return {MathigonStudioApp}
     */
    errors() {
        const render = (req, res, error) => {
            res.render('error', {
                code: res.statusCode, error,
                message: STATUS_CODES[res.statusCode] || STATUS_CODES.default,
                url: req.url
            });
        };
        this.app.use((req, res) => {
            res.status(404);
            if (req.accepts('html')) {
                render(req, res);
            }
            else if (req.accepts('json')) {
                res.send({ error: 'Not found' });
            }
            else {
                res.type('txt').send('Not found');
            }
        });
        this.app.use((error, req, res, _next) => {
            if (error.name === 'URIError') {
                // This handles requests with invalid query parameters that can't be parsed by Express.
                res.status(400);
            }
            else if (res.statusCode === 200) {
                res.status(500);
            }
            render(req, res, error);
        });
        return this;
    }
    // ---------------------------------------------------------------------------
    // Setup Authentication and Dashboard Routes
    accounts() {
        this.app.use((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!req.session.auth)
                req.session.auth = {};
            if (req.session.auth.user) {
                req.user = (yield user_1.User.findById(req.session.auth.user)) || undefined;
            }
            else if (req.cookies.tmp_user) {
                req.tmpUser = req.cookies.tmp_user;
            }
            else {
                req.tmpUser = crypto_1.default.randomBytes(16).toString('hex');
                res.cookie('tmp_user', req.tmpUser, SESSION_COOKIE);
            }
            if (req.user)
                yield analytics_1.LoginAnalytics.ping(req.user);
            res.locals.user = req.user;
            next();
        }));
        (0, accounts_1.default)(this);
        this.get('/dashboard', (req, res) => __awaiter(this, void 0, void 0, function* () {
            // Temporarily allow access without login for testing
            if (!req.user) {
                // Create a dummy user for testing
                const dummyProgress = null;
                const dummyStats = { streak: 0, points: 0, hours: 0 };
                const recent = [];
                const recommended = [];
                const leaderboard = [];
                // Load glossary data from shared glossary.yaml
                let glossaryData = {};
                try {
                    const glossaryPath = path_1.default.join(utilities_1.CONTENT_DIR, 'shared', 'glossary.yaml');
                    console.log('Loading glossary from path:', glossaryPath);
                    const sharedGlossary = (yield (0, utilities_1.loadYAML)(glossaryPath)) || {};
                    console.log('Raw glossary loaded:', Object.keys(sharedGlossary).length, 'keys');
                    // For dashboard, include ALL glossary terms from shared
                    const rawGlossaryData = sharedGlossary;
                    // Add dashboard-specific terms
                    rawGlossaryData.dashboard = { title: 'Dashboard', text: 'Your personal learning dashboard where you can track progress, view statistics, and interact with the AI learning guide.' };
                    rawGlossaryData.learning = { title: 'Learning', text: 'The process of acquiring knowledge, skills, or understanding through study, experience, or teaching.' };
                    rawGlossaryData.progress = { title: 'Progress', text: 'Forward movement toward a goal or destination. In education, it refers to advancement through course material.' };
                    rawGlossaryData.ai = { title: 'AI', text: 'Artificial Intelligence - computer systems that can perform tasks typically requiring human intelligence.' };
                    rawGlossaryData.mentor = { title: 'Mentor', text: 'An experienced and trusted advisor who provides guidance and support in learning and development.' };
                    // Parse markdown/LaTeX in glossary text like course does
                    glossaryData = yield parseGlossaryData(rawGlossaryData);
                    console.log('Sample terms:', Object.keys(glossaryData).slice(0, 5));
                }
                catch (error) {
                    console.warn('Could not load glossary data:', error);
                    // Fallback glossary data
                    glossaryData = {
                        dashboard: { title: 'Dashboard', text: 'Your personal learning dashboard where you can track progress, view statistics, and interact with the AI learning guide.' },
                        learning: { title: 'Learning', text: 'The process of acquiring knowledge, skills, or understanding through study, experience, or teaching.' },
                        progress: { title: 'Progress', text: 'Forward movement toward a goal or destination. In education, it refers to advancement through course material.' },
                        ai: { title: 'AI', text: 'Artificial Intelligence - computer systems that can perform tasks typically requiring human intelligence.' },
                        mentor: { title: 'Mentor', text: 'An experienced and trusted advisor who provides guidance and support in learning and development.' }
                    };
                }
                return res.render('dashboard', { progress: dummyProgress, recent, recommended, stats: dummyStats, leaderboard, glossaryData });
            }
            const progress = yield progress_1.Progress.getUserData(req.user.id);
            const stats = yield analytics_1.CourseAnalytics.getLastWeekStats(req.user.id);
            // Get recent course IDs and map them to course objects with progress
            const recentIds = (yield progress_1.Progress.getRecentCourses(req.user.id)).slice(0, 12);
            const recent = recentIds.map(id => {
                const course = (0, utilities_1.getCourse)(id, req.locale.id);
                if (!course)
                    return null;
                const courseProgress = progress.get(id);
                const progressValue = courseProgress ? courseProgress.progress : 0;
                return {
                    id,
                    name: course.title,
                    hero: course.hero || course.icon || '/images/placeholder.jpg',
                    icon: course.icon,
                    url: course.sections[0].url,
                    progress: progressValue,
                    description: course.description || `Discover the exciting world of ${course.title.toLowerCase()}`,
                    color: course.color,
                    // Add flag to indicate if this is a newly accessed course
                    isNewlyAccessed: progressValue === 0 && courseProgress
                };
            }).filter(Boolean);
            // Show more recommended courses if user has few recent courses
            const items = Math.max(4, 12 - recent.length);
            const recommended = utilities_1.COURSES.filter(x => {
                const courseProgress = progress.get(x);
                // Show course if no progress record OR progress is 0% (clicked but not started)
                return !courseProgress || courseProgress.progress === 0;
            }).slice(0, items).map(id => {
                const course = (0, utilities_1.getCourse)(id, req.locale.id);
                if (!course)
                    return null;
                return {
                    id,
                    name: course.title,
                    hero: course.hero || course.icon || '/images/placeholder.jpg',
                    icon: course.icon,
                    url: course.sections[0].url,
                    description: course.description || `Discover the exciting world of ${course.title.toLowerCase()}`,
                    color: course.color
                };
            }).filter(Boolean);
            // Fetch leaderboard data - top 10 users by points
            const leaderboard = yield analytics_1.CourseAnalytics.getLeaderboard();
            // Load glossary data from shared glossary.yaml
            let glossaryData = {};
            try {
                const glossaryPath = path_1.default.join(utilities_1.CONTENT_DIR, 'shared', 'glossary.yaml');
                const sharedGlossary = (yield (0, utilities_1.loadYAML)(glossaryPath)) || {};
                // For dashboard, include ALL glossary terms from shared
                const rawGlossaryData = sharedGlossary;
                // Add dashboard-specific terms
                rawGlossaryData.dashboard = { title: 'Dashboard', text: 'Your personal learning dashboard where you can track progress, view statistics, and interact with the AI learning guide.' };
                rawGlossaryData.learning = { title: 'Learning', text: 'The process of acquiring knowledge, skills, or understanding through study, experience, or teaching.' };
                rawGlossaryData.progress = { title: 'Progress', text: 'Forward movement toward a goal or destination. In education, it refers to advancement through course material.' };
                rawGlossaryData.ai = { title: 'AI', text: 'Artificial Intelligence - computer systems that can perform tasks typically requiring human intelligence.' };
                rawGlossaryData.mentor = { title: 'Mentor', text: 'An experienced and trusted advisor who provides guidance and support in learning and development.' };
                // Parse markdown/LaTeX in glossary text like course does
                glossaryData = yield parseGlossaryData(rawGlossaryData);
            }
            catch (error) {
                console.warn('Could not load glossary data:', error);
                // Fallback glossary data
                glossaryData = {
                    dashboard: { title: 'Dashboard', text: 'Your personal learning dashboard where you can track progress, view statistics, and interact with the AI learning guide.' },
                    learning: { title: 'Learning', text: 'The process of acquiring knowledge, skills, or understanding through study, experience, or teaching.' },
                    progress: { title: 'Progress', text: 'Forward movement toward a goal or destination. In education, it refers to advancement through course material.' },
                    ai: { title: 'AI', text: 'Artificial Intelligence - computer systems that can perform tasks typically requiring human intelligence.' },
                    mentor: { title: 'Mentor', text: 'An experienced and trusted advisor who provides guidance and support in learning and development.' }
                };
            }
            res.render('dashboard', { progress, recent, recommended, stats, leaderboard, glossaryData });
        }));
        return this;
    }
    // ---------------------------------------------------------------------------
    // Setup Course Routes
    /**
     * Bind request handlers for all course pages, including getters and POST
     * requests for saving progress, sending feedback and asking tutor queries.
     * @param options {CourseRequestOptions}
     */
    course(options = {}) {
        // Middleware to check authentication for course access
        const requireAuth = (handler) => {
            return (req, res, next) => {
                if (!req.user && utilities_1.CONFIG.accounts.enabled) {
                    // Store the intended URL in session for redirect after login
                    req.session.redirectTo = req.originalUrl;
                    return res.redirect('/');
                }
                handler(req, res, next);
            };
        };
        this.get('/course/:course', requireAuth((req, res, next) => {
            const course = (0, utilities_1.getCourse)(req.params.course, req.locale.id);
            return course ? res.redirect(course.sections[0].url) : next();
        }));
        this.get('/course/:course/:section', requireAuth((req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const course = (0, utilities_1.getCourse)(req.params.course, req.locale.id);
            const section = course === null || course === void 0 ? void 0 : course.sections.find(s => s.id === req.params.section);
            if (!course || !section)
                return next();
            const progressData = yield progress_1.Progress.lookup(req, course.id);
            const nextSection = (0, utilities_1.findNextSection)(course, section);
            const prevSection = (0, utilities_1.findNextSection)(course, section, -1);
            if (req.user)
                analytics_1.CourseAnalytics.track(req.user.id); // async
            res.locals.availableLocales = course.availableLocales.map(l => i18n_1.LOCALES[l]);
            // Note: nextUp is provided as a legacy fallback for previous versions.
            res.render('course', { course, section, lighten: utilities_1.lighten, progressData, nextSection, prevSection, nextUp: nextSection });
        })));
        this.post('/course/:course/:section', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (!utilities_1.CONFIG.accounts.enabled)
                return res.status(200).send('ok');
            const course = (0, utilities_1.getCourse)(req.params.course, req.locale.id);
            const section = course === null || course === void 0 ? void 0 : course.sections.find(s => s.id === req.params.section);
            if (!course || !section)
                return next();
            const changes = (0, core_1.safeToJSON)(req.body.data, {});
            if (!changes)
                return res.status(400).send(STATUS_CODES[400]);
            const progress = (yield progress_1.Progress.lookup(req, course.id, true));
            const newScoreCount = progress.updateData(section.id, changes);
            yield progress.save();
            if (req.user)
                analytics_1.CourseAnalytics.track(req.user.id, newScoreCount); // async
            res.status(200).send('ok');
        }));
        this.post('/course/:course/reset', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            const course = (0, utilities_1.getCourse)(req.params.course, req.locale.id);
            if (!course)
                return next();
            try {
                // Delete the progress data
                if (utilities_1.CONFIG.accounts.enabled) {
                    yield progress_1.Progress.delete(req, course.id);
                }
                // Redirect to the first section of the course with success parameter
                res.redirect(`/course/${req.params.course}/${course.sections[0].id}?reset=success`);
            }
            catch (error) {
                console.error('Error resetting progress:', error);
                res.redirect(`/course/${req.params.course}`);
            }
        }));
        this.post('/course/:course/feedback', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!utilities_1.CONFIG.courses.feedback)
                return next();
            const course = (0, utilities_1.getCourse)(req.params.course, req.locale.id);
            if (!course)
                return next();
            const response = yield ((_a = options.sendFeedback) === null || _a === void 0 ? void 0 : _a.call(options, req, course));
            res.status((response === null || response === void 0 ? void 0 : response.status) || 200).end();
        }));
        this.post('/course/:course/ask', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const course = (0, utilities_1.getCourse)(req.params.course, req.locale.id);
            if (!course)
                return next();
            const response = yield ((_a = options.askTutor) === null || _a === void 0 ? void 0 : _a.call(options, req, course));
            res.status((response === null || response === void 0 ? void 0 : response.status) || 200).json((response === null || response === void 0 ? void 0 : response.data) || {}).end();
        }));
        return this;
    }
}
exports.MathigonStudioApp = MathigonStudioApp;
