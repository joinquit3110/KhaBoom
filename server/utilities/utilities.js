"use strict";
// =============================================================================
// Utility Functions
// (c) Kha-Boom!
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COURSES = exports.CONTENT_DIR = exports.CONFIG = exports.include = exports.getCourse = exports.loadData = exports.loadJSON = exports.loadYAML = exports.ONE_YEAR = exports.IS_PROD = exports.ENV = exports.OUT_DIR = exports.PROJECT_DIR = exports.STUDIO_DIR = void 0;
exports.loadCombinedYAML = loadCombinedYAML;
exports.promisify = promisify;
exports.href = href;
exports.lighten = lighten;
exports.findNextSection = findNextSection;
exports.findLastIndex = findLastIndex;
exports.age = age;
exports.dateString = dateString;
exports.pastDate = pastDate;
exports.q = q;
exports.hash = hash;
exports.cacheBust = cacheBust;
exports.removeCacheBust = removeCacheBust;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const core_1 = require("@mathigon/core");
exports.STUDIO_DIR = path_1.default.join(__dirname, '../../');
exports.PROJECT_DIR = process.cwd();
exports.OUT_DIR = exports.PROJECT_DIR + '/public';
exports.ENV = process.env.NODE_ENV || 'development';
exports.IS_PROD = exports.ENV === 'production';
exports.ONE_YEAR = 1000 * 60 * 60 * 24 * 365;
// -----------------------------------------------------------------------------
// File Loading
function cacheIfProd(fn) {
    return exports.IS_PROD ? (0, core_1.cache)(fn) : fn;
}
exports.loadYAML = cacheIfProd((file) => {
    // TODO Support both .yaml and .yml extensions
    if (!fs_1.default.existsSync(file))
        return undefined;
    return js_yaml_1.default.load(fs_1.default.readFileSync(file, 'utf8'));
});
exports.loadJSON = cacheIfProd((file) => {
    // TODO Maybe should use require() instead?
    if (!fs_1.default.existsSync(file))
        return undefined;
    return JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
});
const loadData = (file) => {
    return (0, exports.loadYAML)(path_1.default.join(__dirname, `../data/${file}.yaml`));
};
exports.loadData = loadData;
exports.getCourse = cacheIfProd((courseId, locale = 'en') => {
    const course = (0, exports.loadJSON)(exports.OUT_DIR + `/content/${courseId}/data_${locale}.json`);
    if (!course && locale !== 'en')
        return (0, exports.getCourse)(courseId); // Return English fallback
    if (!course)
        return undefined;
    return course;
});
function resolve(file, base = 'frontend/assets') {
    const p1 = path_1.default.join(exports.PROJECT_DIR, base, file);
    if (fs_1.default.existsSync(p1))
        return fs_1.default.readFileSync(p1, 'utf-8');
    const p2 = path_1.default.join(exports.STUDIO_DIR, base, file);
    if (fs_1.default.existsSync(p2))
        return fs_1.default.readFileSync(p2, 'utf-8');
}
/**
 * On its own, PUG doesn't allow dynamic includes (e.g. for file paths provided
 * in a configuration file). Here, we manually load and insert an external file.
 */
exports.include = (0, core_1.cache)((file, base = 'frontend/assets') => {
    const content = resolve(file, base);
    if (!content)
        throw new Error(`Can't find file "${file}" in "${base}".`);
    return content;
});
/** Merge two YAML files from the studio directory and the project directory. */
function loadCombinedYAML(file, deep = false) {
    const studio = (0, exports.loadYAML)(path_1.default.join(exports.STUDIO_DIR, file)) || {};
    const project = (0, exports.loadYAML)(path_1.default.join(exports.PROJECT_DIR, file)) || {};
    deep ? (0, core_1.deepExtend)(studio, project, (a, b) => b) : Object.assign(studio, project);
    return studio;
}
// Configuration files
exports.CONFIG = loadCombinedYAML('config.yaml', true);
// Ensure CONFIG has required properties with fallbacks
if (!exports.CONFIG.siteName)
    exports.CONFIG.siteName = 'Kha-Boom!';
if (!exports.CONFIG.domain)
    exports.CONFIG.domain = 'kha-boom.zeabur.app';
if (!exports.CONFIG.accounts)
    exports.CONFIG.accounts = {};
// Override domain from environment variable if present
if (process.env.DOMAIN) {
    exports.CONFIG.domain = process.env.DOMAIN;
}
// Override SendGrid key from environment variable if present
if (process.env.SENDGRID_API_KEY) {
    exports.CONFIG.accounts.sendgridKey = process.env.SENDGRID_API_KEY;
}
// Override MongoDB URI from environment variable if present
if (process.env.MONGODB_URI) {
    exports.CONFIG.accounts.mongoServer = process.env.MONGODB_URI;
}
exports.CONTENT_DIR = path_1.default.join(exports.PROJECT_DIR, exports.CONFIG.contentDir || 'content');
// List of all courses - with fallback if directory doesn't exist
exports.COURSES = (() => {
    try {
        if (fs_1.default.existsSync(exports.CONTENT_DIR)) {
            return fs_1.default.readdirSync(exports.CONTENT_DIR)
                .filter(id => id !== 'shared' && !id.includes('.') && !id.startsWith('_'));
        }
        return [];
    }
    catch (error) {
        console.warn('Could not read courses directory:', error);
        return [];
    }
})();
// -----------------------------------------------------------------------------
// Utility Functions
/**
 * Wrap Express request handlers to always add a .catch() to asynchronous
 * handlers. This should be done natively in Express 5.0.0, so that we can
 * remove this.
 * @param fn
 */
function promisify(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
function href(req, locale) {
    var _a;
    // Use locale from req if available, otherwise default to 'en'
    const localeId = locale || ((_a = req.locale) === null || _a === void 0 ? void 0 : _a.id) || 'en';
    const path = req.path.endsWith('/') ? req.path.slice(0, req.path.length - 1) : req.path;
    const subdomain = (localeId !== 'en') ? localeId + '.' : '';
    return `https://${subdomain}${exports.CONFIG.domain}${path}`;
}
function lighten(c, amount) {
    const hsl = core_1.Color.from(c).hsl;
    hsl[1] = Math.min(100, hsl[1] * (1 + amount));
    hsl[2] = Math.min(100, hsl[2] * (1 + amount));
    return core_1.Color.fromHsl(...hsl).hex;
}
/**
 * Determine which section or course to link to at the end of this one. Returns
 * the next course if shift = 1, or the previous course if shift = -1.
 */
function findNextSection(course, section, shift = 1) {
    // TODO Personalise this, based on users' previous work
    const nextSection = course.sections[course.sections.indexOf(section) + shift];
    if (nextSection)
        return { section: nextSection };
    const nextCourse = (0, exports.getCourse)(shift > 0 ? course.nextCourse : course.prevCourse, course.locale);
    if (!nextCourse)
        return { section: shift > 0 ? course.sections[0] : (0, core_1.last)(course.sections) };
    return { course: nextCourse, section: shift > 0 ? nextCourse.sections[0] : (0, core_1.last)(nextCourse.sections) };
}
/** Returns the last value in an arry for which a callback returns true. */
function findLastIndex(array, callback) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (callback(array[i], i))
            return i;
    }
    return -1;
}
function age(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age = age - 1;
    }
    return age;
}
function dateString(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return [year, month, day].join('-');
}
/** Returns the date a given (integer) number of days ago. */
function pastDate(daysBack) {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    return date;
}
/** Better handling for string query parameters. */
function q(req, name) {
    var _a, _b;
    return ((_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a[name]) === null || _b === void 0 ? void 0 : _b.toString()) || '';
}
function hash(str, n) {
    return (0, core_1.total)(str.split('').map(c => c.charCodeAt(0))) % n;
}
// -----------------------------------------------------------------------------
// Static File Caching
const FILE_NAME_CACHE = new Map();
function cacheBust(file, locale) {
    if (file.startsWith('http'))
        return file;
    // We only cache the result in production, to allow real-time updating.
    const key = file + locale.id;
    if (exports.IS_PROD && FILE_NAME_CACHE.has(key))
        return FILE_NAME_CACHE.get(key);
    // Handle localised JS and CSS files
    if (file.endsWith('.css')) {
        const file1 = file.replace('.css', '.rtl.css');
        if ((locale === null || locale === void 0 ? void 0 : locale.dir) === 'rtl' && fs_1.default.existsSync(exports.OUT_DIR + file1))
            file = file1;
    }
    else if (file.endsWith('.js')) {
        const file1 = file.replace('.js', `.${locale === null || locale === void 0 ? void 0 : locale.id}.js`);
        if ((locale === null || locale === void 0 ? void 0 : locale.id) !== 'en' && fs_1.default.existsSync(exports.OUT_DIR + file1))
            file = file1;
    }
    // Hash the files for cache busting
    if (fs_1.default.existsSync(exports.OUT_DIR + file)) {
        const content = fs_1.default.readFileSync(exports.OUT_DIR + file, 'utf-8');
        const token = crypto_1.default.createHash('md5').update(content).digest('hex').slice(0, 8);
        file = file.replace(/\.(\w+)$/g, `.${token}.$1`);
    }
    FILE_NAME_CACHE.set(key, file);
    return file;
}
function removeCacheBust(file) {
    return file.replace(/\.([a-z0-9]{4,})\.(js|css|svg|mp3)/, (_1, _2, ext) => `.${ext}`);
}
